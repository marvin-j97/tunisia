import { describe, expect, it } from "vitest";

import { dejoinExpressionPath } from "../src/util";

const tests = [
  ["", []],
  ["test", ["test"]],
  ["test.nested", ["test", "nested"]],
] as [string, string[]][];

describe("util", () => {
  describe("resolveExpressionNames", () => {
    tests.forEach(([input, expected], i) => {
      it(`should correctly slice array ${i}`, () => {
        expect(dejoinExpressionPath(input)).to.deep.equal(expected);
      });
    });
  });
});
