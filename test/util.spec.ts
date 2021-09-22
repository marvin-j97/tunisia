import ava from "ava";

import { resolveExpressionNames } from "../src/util";

const tests = [
  ["", ""],
  ["test", "#test"],
  ["test.nested", "#test.#nested"],
] as [string, string][];

tests.forEach((test, i) => {
  ava.serial(`Resolve expression names ${i}`, (t) => {
    t.is(resolveExpressionNames(test[0]), test[1]);
  });
});
