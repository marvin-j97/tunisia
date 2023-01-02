import { beforeAll, describe, expect, it } from "vitest";

import { getTableSize, initTable, tunisia } from "./table";

const tableName = "TunisiaTest_BatchCrud";

const ids: number[] = [];
const initCounter = 100;
const maxCounter = 175;

let counter = initCounter;
while (counter < maxCounter) {
  ids.push(counter);
  counter++;
}

const docs = ids.map((id) => ({
  id,
  name: Math.random().toString(36),
}));
const addedItems = docs.sort((a, b) => a.id - b.id);

describe("crud", () => {
  beforeAll(initTable(tableName));

  describe("batch", () => {
    it("should create 75 docs", async () => {
      expect(await getTableSize(tableName)).to.equal(0);
      await tunisia.create(tableName).many(docs);
      expect(await getTableSize(tableName)).to.equal(docs.length);
    });

    it("should get the 75 created docs", async () => {
      const items = await tunisia.get(tableName).many<{ id: number; name: string }>("id", ids);
      items.sort((a, b) => a.id - b.id);
      expect(await getTableSize(tableName)).to.equal(docs.length);
      expect(items).to.deep.equal(addedItems);
    });

    it("should delete 75 docs", async () => {
      expect(await getTableSize(tableName)).to.equal(docs.length);
      await tunisia.remove(tableName).many("id", ids);
      expect(await getTableSize(tableName)).to.equal(0);
    });
  });
});
