import { describe, expect, it } from "vitest";

import { dejoinExpressionPath } from "../src/util";

const tests = [
  ["", []],
  ["test", ["test"]],
  ["test.nested", ["test", "nested"]],
] as [string, string[]][];

describe("util", () => {
  describe("dejoinExpressionPath", () => {
    tests.forEach(([input, expected], i) => {
      it(`should correctly dejoinExpressionPath ${i}`, () => {
        expect(dejoinExpressionPath(input)).to.deep.equal(expected);
      });
    });
  });
});
