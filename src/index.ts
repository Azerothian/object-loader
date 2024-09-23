import { objVisitAsync, OKind } from "@vostro/object-visit";
import path from "path";
import { exists, readJSONFile, readYAMLFile } from "./fs";
import fs from 'fs/promises';
import waterfall from "./waterfall";


export const IGNORE: unknown = Object.freeze({});

async function processNode(node: any, cwd: string, options: FileMapOptions) {
  const refField = node?.[options.fieldKey ?? "$ref"] || node?.[options.mergeArrayKey ?? "$mergeArrayRef"];
  const mergeRefField = node?.[options.mergeKey ?? "$mergeRef"];

  if (refField && typeof refField === "string") {//TODO: extra checks?
    const result = await processObject(refField, cwd, options, node);
    if (!result) {
      return node;
    }
    return result;
  }
  if (mergeRefField && typeof mergeRefField === "string") {//TODO: extra checks?
    const result = await processObject(mergeRefField, cwd, options, node);
    if (!result) {
      return node;
    }
    const mergedObj = {
      ...node,
      ...result,
    };
    delete mergedObj[options.mergeKey ?? "$mergeRef"];
    return mergedObj;
  }
  if (options?.customKeys) {
    const keys = Object.keys(options.customKeys).filter((key) => node[key]);
    if (keys.length > 0) {
      for(const key of keys) {
        const result = await options.customKeys[key](node, cwd, options, key);
        if (result === IGNORE) {
          return node;
        }
        return result;
      }
    }
  }
  return node;
}

async function processObject(target: string, cwd: string,  options: FileMapOptions, node?: any) {
  const data = await importFile(target, cwd, options, node);
  if (!data) {
    return null;
  }
  const newCwd = path.resolve(cwd, path.dirname(target));

  return objVisitAsync(data, {
    [OKind.OBJECT]: {
      enter: async( node, key, parent, objPath, ancestors) : Promise<any> => {
        return processNode(node, newCwd, options);
      },
    },
    [OKind.ARRAY]: {
      enter: async( node, key, parent, objPath, ancestors) : Promise<any> => {
        return waterfall(node, async (el: any, arr: any[]) => {
          const result = await processNode(el, newCwd, options);
          if(Array.isArray(result) && el[options.mergeArrayKey ?? "$mergeArrayRef"]) {
            return arr.concat(result);
          } else {
            arr.push(result);
          }
          return arr;
        }, []);
      },
    },
  });
}
export async function importFile<T>(
  targetPath: string,
  cwd: string,
  options: FileMapOptions,
  node: any,
): Promise<T | null | Buffer> {

  const filePath = path.resolve(cwd, targetPath);
  const fileExists = await exists(filePath);
  if(!fileExists) {
    return null;
  }
  // let file: any;
  const ext = path.extname(filePath);
  if(options?.resolver?.[ext]) {
    return options?.resolver[ext](filePath, options, cwd, node);
  }
  return fs.readFile(filePath, node[options?.encodingKey ?? "$encoding"] ?? undefined);
}


export type FileMapOptions = {
  fieldKey?: string | undefined;
  mergeKey?: string | undefined;
  mergeArrayKey?: string | undefined;
  argsKey?: string | undefined;
  exportKey?: string | undefined;
  encodingKey?: string | undefined;
  resolver?: {
    [extension: string]: (filePath: string, options: FileMapOptions | undefined, cwd: string, node: any ) => Promise<any>;
  }
  customKeys?: {
    [key: string]: ((node: any, cwd?: string, options?: FileMapOptions, keyName?: string) => Promise<any>) |
      ((node: any, cwd?: string, options?: FileMapOptions, keyName?: string) => any);
  }
};


async function importJSTSFile(filePath: string, options: FileMapOptions | undefined, cwd: string, node: any) {
  const file = await import(filePath);
  let result: any = file;
  if (file && node?.[options?.exportKey ?? "$export"]) {
    if(file[node[options?.exportKey ?? "$export"]]) {
      return file[node[options?.exportKey ?? "$export"]];
    }
  }


  if (typeof file === "function") {
    if (node?.[options?.argsKey ?? "$args"]) {
      return await file.apply(undefined, [...node[options?.argsKey ?? "$args"], cwd, options]);
    } else {
      return await file(cwd, options);
    }
  }
  if (file?.default && typeof file.default === "function") {
    if (node?.[options?.argsKey ?? "$args"]) {
      return await file.default.apply(undefined, [...node[options?.argsKey ?? "$args"], cwd, options]);
    } else {
      return await file.default(options);
    }
  }
  if (file?.default && typeof file.default === "object") {
    return file.default;
  }
  return result;
}

export async function objectLoader<T>(target: string, cwd = process.cwd(), options?: FileMapOptions): Promise<T> {
  
  const opts: FileMapOptions = {
    fieldKey: '$ref',
    mergeKey: "$mergeRef",
    mergeArrayKey: "$mergeArrayRef",
    argsKey: "$args",
    ...options || {},
    resolver: {
      '.yaml': readYAMLFile,
      '.json': readJSONFile,
      '.js': importJSTSFile,
      '.ts': importJSTSFile,
      ...options?.resolver || {} ,
    },
  };
  return processObject(target, cwd, opts) as Promise<T>;
  
}

export default objectLoader;