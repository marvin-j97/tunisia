import { describe, expect, it } from "vitest";

import { resolveExpressionNames } from "../src/util";

const tests = [
  ["", ""],
  ["test", "#test"],
  ["test.nested", "#test.#nested"],
] as [string, string][];

describe("util", () => {
  describe("resolveExpressionNames", () => {
    tests.forEach(([input, expected], i) => {
      it(`should correctly slice array ${i}`, () => {
        expect(resolveExpressionNames(input)).to.equal(expected);
      });
    });
  });
});
