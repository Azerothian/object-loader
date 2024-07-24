import path from "path";
import importData from "../src";
describe("imports", () => {
  test("test basic import ts file", async () => {

    const data = await importData("./files/test1.ts", 
        __dirname
    );
    expect(data).toEqual({
      obj: 1,
    });
  });
  test("test import ts file with args", async () => {
    const data = await importData("./files/test2.yaml", 
        __dirname
    );
    expect(data).toEqual({
      "arg1": "Hi",
      "arg2": "Hello",
      "cwd": path.resolve(process.cwd(), "./__tests__/files"),
      "options": true,
    });
  });
})
