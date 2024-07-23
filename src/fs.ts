




import fs from 'fs/promises';
// import path from 'path';
import yaml from 'yaml';

export async function exists(path: string): Promise<boolean> {
    try {
      await fs.access(path, fs.constants.R_OK);
      return true;
    } catch (err) {
      return false;
    }
  }

export async function readYAMLFile<T>(path: string): Promise<T | null> {
  try {
    const file = await fs.readFile(path, 'utf8');
    return yaml.parse(file);
  }
  catch (err) {
    console.error(err);
  }
  return null;
}

export async function readJSONFile<T>(path: string): Promise<T | null> {
  try {
    const file = await fs.readFile(path, 'utf8');
    return JSON.parse(file);
  } catch (err) {
    console.error(err);
  }
  return null;
}
