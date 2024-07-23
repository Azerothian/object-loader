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
})
