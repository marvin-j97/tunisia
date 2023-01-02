import { beforeAll, describe, expect, it } from "vitest";

import { getTableSize, initTable, tunisia } from "./table";

const tableName = "TunisiaTest_Crud";

describe("crud", () => {
  beforeAll(initTable(tableName));

  describe("single", () => {
    const obj = {
      id: 1,
      name: "Test",
    };

    it("should create item", async () => {
      expect(await getTableSize(tableName)).to.equal(0);
      await tunisia.put(tableName).one(obj);
      expect(await getTableSize(tableName)).to.equal(1);
    });

    it("should get created doc", async () => {
      const doc = await tunisia.query(tableName).eq("id", 1).first();
      expect(doc).to.deep.equal(obj);
    });

    it("should get delete doc", async () => {
      expect(await getTableSize(tableName)).to.equal(1);
      await tunisia.delete(tableName).one("id", 1);
      expect(await getTableSize(tableName)).to.equal(0);
    });

    it("should not get created doc", async () => {
      const doc = await tunisia.query(tableName).eq("id", 1).first();
      expect(doc).to.be.null;
    });
  });
});
