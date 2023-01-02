import { describe, expect, it } from "vitest";

import { sliceGenerator } from "../src/slicer";

/**
 * Aggregates slices into Array
 */
export function sliceAggregator<T>(size: number) {
  return function (arr: T[]): T[][] {
    return Array.from(sliceGenerator(arr, size));
  };
}

describe("slicer", () => {
  it("should correctly slice array 1", () => {
    const arr = [1, 2, 3, 4, 5];
    expect(sliceAggregator(1)(arr)).to.deep.equal(arr.map((x) => [x]));
  });

  it("should correctly slice array 2", () => {
    const arr = [1, 2, 3, 4, 5];
    expect(sliceAggregator(2)(arr)).to.deep.equal([[1, 2], [3, 4], [5]]);
  });
});
