import { expect } from "chai";
import { resolveExpressionNames } from "../src/util";

describe("Resolve expression names", () => {
  const tests = [
    ["", ""],
    ["test", "#test"],
    ["test.nested", "#test.#nested"]
  ] as [string, string][];

  for (const test of tests) {
    it(`Should equal '${test[1]}'`, () => {
      expect(resolveExpressionNames(test[0])).to.equal(test[1]);
    });
  }
});
