import { beforeAll, describe, expect, it } from "vitest";

import { getTableSize, initTable, testClient } from "./table";

describe("crud", () => {
  describe("batch", () => {
    const tableName = "TunisiaTest_BatchCrud";

    beforeAll(initTable(tableName));

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

    const table = testClient.defineTable<{
      id: number;
      name: string;
    }>(tableName);

    it("should create 75 docs", async () => {
      expect(await getTableSize(tableName)).to.equal(0);
      await table.put().many(docs);
      expect(await getTableSize(tableName)).to.equal(docs.length);
    });

    it("should get the 75 created docs", async () => {
      const items = await table.get().many(ids.map((id) => ({ id })));
      items.sort((a, b) => a.id - b.id);
      expect(await getTableSize(tableName)).to.equal(docs.length);
      expect(items).to.deep.equal(addedItems);
    });

    it("should delete 75 docs", async () => {
      expect(await getTableSize(tableName)).to.equal(docs.length);
      await table.delete().many(ids.map((id) => ({ id })));
      expect(await getTableSize(tableName)).to.equal(0);
    });
  });
});
