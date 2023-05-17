import { beforeAll, describe, expect, it } from "vitest";

import { getTableSize, initTable, testClient } from "./table";

// eslint-disable-next-line max-lines-per-function
describe("crud", () => {
  describe("empty string", () => {
    const tableName = "TunisiaTest_PutDelete_EmptyString";

    const table = testClient.defineTable<{
      id: number;
      name: string;
    }>(tableName);

    beforeAll(initTable(tableName));

    const obj = {
      id: 1,
      name: "Test",
    };

    it("should create item", async () => {
      expect(await getTableSize(tableName)).to.equal(0);
      await table.put().one(obj);
      expect(await getTableSize(tableName)).to.equal(1);
    });

    it("should get item", async () => {
      const item = await table.scan().first();
      expect(item).to.deep.equal(obj);
    });
  });

  describe("partition", () => {
    const tableName = "TunisiaTest_PutDelete_Partition";

    const table = testClient.defineTable<{
      id: number;
      name: string;
    }>(tableName);

    beforeAll(initTable(tableName));

    const obj = {
      id: 1,
      name: "Test",
    };

    it("should create item", async () => {
      expect(await getTableSize(tableName)).to.equal(0);
      await table.put().one(obj);
      expect(await getTableSize(tableName)).to.equal(1);
    });

    it("should delete item", async () => {
      expect(await getTableSize(tableName)).to.equal(1);
      await table.delete().one({ id: 1 });
      expect(await getTableSize(tableName)).to.equal(0);
    });
  });

  describe("compound", () => {
    const tableName = "TunisiaTest_PutDelete_Compound";

    const table = testClient.defineTable<{
      id: number;
      range: string;
      name: string;
    }>(tableName);

    beforeAll(
      initTable(
        tableName,
        [
          {
            AttributeName: "range",
            AttributeType: "S",
          },
        ],
        [
          {
            AttributeName: "range",
            KeyType: "RANGE",
          },
        ],
      ),
    );

    const obj0 = {
      id: 1,
      range: "invoice:12345",
      name: "Test",
    };
    const obj1 = {
      id: 1,
      range: "invoice:54321",
      name: "Test 2",
    };

    it("should create items", async () => {
      expect(await getTableSize(tableName)).to.equal(0);
      await table.put().one(obj0);
      await table.put().one(obj1);
      expect(await getTableSize(tableName)).to.equal(2);
    });

    it("should delete items", async () => {
      expect(await getTableSize(tableName)).to.equal(2);
      await table.delete().one({ id: 1, range: "invoice:12345" });
      expect(await getTableSize(tableName)).to.equal(1);
      await table.delete().one({ id: 1, range: "invoice:54321" });
      expect(await getTableSize(tableName)).to.equal(0);
    });

    it("should create items again", async () => {
      expect(await getTableSize(tableName)).to.equal(2);
      await table.delete().many([
        { id: 1, range: "invoice:12345" },
        { id: 1, range: "invoice:54321" },
      ]);
      expect(await getTableSize(tableName)).to.equal(0);
    });
  });
});
