import { vol } from "memfs";
import fs from "fs/promises";
import importData from "../src";
// mock `fs` if you use either `fs` or `fs-extra`
jest.mock("fs");
// mock `fs/promises` if you use it either in code or tests
jest.mock("fs/promises");


describe("merge", () => {
  beforeEach(() => {
    vol.reset();
  });
  test("merging two objects together", async () => {
    await fs.writeFile("/test.json", `{"test2": {"mergeRef": "./test2.json", "key1": "key1" }}`);
    await fs.writeFile("/test2.json",  `{ "name": "howdy" }`);
    const data = await importData("/test.json");
    expect(data).toEqual({
      test2: {
        name: "howdy",
        key1: "key1",
      },
    });
  });
  test("merging two arrays together", async () => {
    await fs.writeFile("/test.yaml", `
 - mergeArrayRef: ./test2.yaml
 - key1: key1`);
    await fs.writeFile("/test2.yaml",  `
 - key2: key2`);
    const data = await importData("/test.yaml");
    expect(data).toEqual([
      {key2: "key2"},
      {key1: "key1"},
    ]);
  });
  
})
