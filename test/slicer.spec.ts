import ava from "ava";

import { sliceGenerator } from "../src/slicer";

export function sliceAggregator<T>(size: number) {
  return function (arr: T[]): T[][] {
    return Array.from(sliceGenerator(arr, size));
  };
}

ava.serial(`Should correctly slice array 1`, (t) => {
  const arr = [1, 2, 3, 4, 5];
  t.deepEqual(
    sliceAggregator(1)(arr),
    arr.map((x) => [x]),
  );
});

ava.serial(`Should correctly slice array 2`, (t) => {
  const arr = [1, 2, 3, 4, 5];
  t.deepEqual(sliceAggregator(2)(arr), [[1, 2], [3, 4], [5]]);
});
