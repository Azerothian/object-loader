import { vol } from "memfs";
import fs from "fs/promises";
import importData from "../src";
// mock `fs` if you use either `fs` or `fs-extra`
jest.mock("fs");
// mock `fs/promises` if you use it either in code or tests
jest.mock("fs/promises");


describe("basic", () => {
  beforeEach(() => {
    vol.reset();
  });
  test("basic ref loading - json", async () => {
    await fs.writeFile("/test.json", `{"test2": {"ref": "./test2.json"}}`);
    await fs.writeFile("/test2.json",  `{ "name": "howdy" }`);
    const data = await importData("/test.json");
    expect(data).toEqual({
      test2: {
        name: "howdy",
      },
    });
  });
  test("basic ref loading - yaml", async () => {
    await fs.writeFile("/test.yaml", `
test2:
  ref: "./test2.yaml"
`);    
    await fs.writeFile("/test2.yaml",  `
name: howdy
  `);
    const data = await importData("/test.yaml");
    expect(data).toEqual({
      test2: {
        name: "howdy",
      },
    });
  });
  test("basic ref loading - yaml - json", async () => {
    await fs.writeFile("/test.yaml", `
test2:
  ref: "./test2.json"
`);    
    await fs.writeFile("/test2.json",  `{ "name": "howdy" }`);
    const data = await importData("/test.yaml");
    expect(data).toEqual({
      test2: {
        name: "howdy",
      },
    });
  });
  test("relative path ref loading", async () => {
    await fs.mkdir("/folder/inner/", {recursive: true});
    await fs.writeFile("/root.yaml", `
ref: ./folder/inner/test.yaml`);
    await fs.writeFile("/folder/inner/test.yaml", `
test2:
  ref: "../test2.yaml"
`);    
    await fs.writeFile("/folder/test2.yaml",  `
name: howdy
  `);
    const data = await importData("/root.yaml");
    expect(data).toEqual({
      test2: {
        name: "howdy",
      },
    });
  });
  test("ref array in array", async () => {
    await fs.writeFile("/test.yaml", `
test2:
  - ref: "./test2.yaml"
`);    
    await fs.writeFile("/test2.yaml",  `
 - name: howdy`);
    const data = await importData("/test.yaml");
    expect(data).toEqual({
      test2: [[{
        name: "howdy",
      }]],
    });
  });
})
