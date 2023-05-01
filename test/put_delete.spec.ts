import { beforeAll, describe, expect, it } from "vitest";

import { getTableSize, initTable, testClient } from "./table";

describe("crud", () => {
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

    it("should delete doc", async () => {
      expect(await getTableSize(tableName)).to.equal(1);
      await table.delete().one(["id", 1]);
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

    const obj = {
      id: 1,
      range: "invoice:12345",
      name: "Test",
    };

    it("should create item", async () => {
      expect(await getTableSize(tableName)).to.equal(0);
      await table.put().one(obj);
      expect(await getTableSize(tableName)).to.equal(1);
    });

    it("should delete doc", async () => {
      expect(await getTableSize(tableName)).to.equal(1);
      await table.delete().one(["id", 1], ["range", "invoice:12345"]);
      expect(await getTableSize(tableName)).to.equal(0);
    });
  });
});
