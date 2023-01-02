import { beforeAll, describe, expect, it } from "vitest";

import { getTableSize, initTable, tunisia } from "./table";

// eslint-disable-next-line max-lines-per-function
describe("scan", () => {
  describe("builder", () => {
    const tableName = "TestTable";

    it("should return correct query params", () => {
      const params = tunisia.scan(tableName).eq("id", 5).project(["id", "name"]).params();

      expect(params.TableName).to.equal(tableName);
      expect(params.ExpressionAttributeNames?.["#id"]).to.equal("id");
      expect(params.ExpressionAttributeNames?.["#name"]).to.equal("name");
      expect(params.ExpressionAttributeValues?.[":value0"]).to.equal(5);
      expect(params.ProjectionExpression).to.equal("#id,#name");
    });

    it("should return correct query params 2", () => {
      const params = tunisia.scan(tableName).eq("id", 5).pick("  names  ").params();

      expect(params.TableName).to.equal(tableName);
      expect(params.ExpressionAttributeNames?.["#id"]).to.equal("id");
      expect(params.ExpressionAttributeNames?.["#names"]).to.equal("names");
      expect(params.ExpressionAttributeValues?.[":value0"]).to.equal(5);
      expect(params.ProjectionExpression).to.equal("#names");
    });

    it("should return correct query params 3", () => {
      const params = tunisia.scan(tableName).index("indexName").neq("filterProp", false).params();

      expect(params.TableName).to.equal(tableName);
      expect(params.ExpressionAttributeNames?.["#filterProp"]).to.equal("filterProp");
      expect(params.FilterExpression).to.equal("#filterProp <> :value0");
    });
  });

  // eslint-disable-next-line max-lines-per-function
  describe("get", () => {
    const tableName = "TunisiaTest_Scan";

    beforeAll(
      initTable(
        tableName,
        [
          {
            AttributeName: "index",
            AttributeType: "N",
          },
        ],
        undefined,
        [
          {
            IndexName: "index",
            KeySchema: [
              {
                AttributeName: "index",
                KeyType: "HASH",
              },
            ],
            Projection: {
              ProjectionType: "ALL",
            },
            ProvisionedThroughput: {
              ReadCapacityUnits: 1,
              WriteCapacityUnits: 1,
            },
          },
        ],
      ),
    );

    it("should create test items", async () => {
      expect(await getTableSize(tableName)).to.equal(0);
      await tunisia.put(tableName).one({
        id: 1,
        name: "Test",
        index: 0,
      });
      await tunisia.put(tableName).one({
        id: 2,
        name: "Test",
        index: 1,
      });
      expect(await getTableSize(tableName)).to.equal(2);
    });

    it("should get page", async () => {
      const items = await tunisia.scan(tableName).get();
      expect(items.length).to.equal(2);
    });

    it("should get all", async () => {
      const items = await tunisia.scan(tableName).all();
      expect(items.length).to.equal(2);
    });

    it("Should get filtered item", async () => {
      const items = await tunisia.scan(tableName).eq("index", 1).all<{ index: number }>();
      expect(items.length).to.equal(1);
      expect(items[0]).to.deep.equal({
        id: 2,
        name: "Test",
        index: 1,
      });
    });

    it("should get 2 pages, 1 item each", async () => {
      let numPages = 0;

      for await (const { items } of tunisia.scan(tableName).limit(1).iterate()) {
        expect(items.length).to.equal(1);
        numPages++;
      }

      expect(numPages).to.equal(2);
    });
  });
});
