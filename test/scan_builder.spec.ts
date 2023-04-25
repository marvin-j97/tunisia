import { beforeAll, describe, expect, it } from "vitest";

import { initTable, testClient } from "./table";

const tableName = "TunisiaTest_Scan";

const table = testClient.defineTable<{ id: number; filterProp: boolean; index: number }>(tableName);

// eslint-disable-next-line max-lines-per-function
describe("scan", () => {
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

  describe("compile", () => {
    it("should return correct query params", () => {
      const params = table
        .scan()
        .filter(({ eq }) => eq("id", 5))
        .compile();

      expect(params.TableName).to.equal(tableName);
      expect(params.ExpressionAttributeNames?.["#name0"]).to.equal("id");
      expect(params.ExpressionAttributeValues?.[":value0"]).to.equal(5);
    });

    it("should return correct query params 2", () => {
      const params = table
        .scan()
        .filter(({ neq }) => neq("filterProp", false))
        .compile();

      expect(params.TableName).to.equal(tableName);
      expect(params.ExpressionAttributeNames?.["#name0"]).to.equal("filterProp");
      expect(params.ExpressionAttributeValues?.["#value0"]).to.equal(false);
      expect(params.FilterExpression).to.equal("#name0 <> :value0");
    });

    // TODO: pick
  });

  describe("operations", () => {
    it("should create test items", async () => {
      expect(await table.scan().count()).to.equal(0);
      // TODO: put
      /*  await tunisia.put(tableName).one({
        id: 1,
        name: "Test",
        index: 0,
      });
      await tunisia.put(tableName).one({
        id: 2,
        name: "Test",
        index: 1,
      }); */
      expect(await table.scan().count()).to.equal(2);
    });

    it("should get page", async () => {
      const items = await table.scan().items();
      expect(items.length).to.equal(2);
    });

    it("should get all", async () => {
      const items = await table.scan().all();
      expect(items.length).to.equal(2);
    });

    it("Should get filtered item", async () => {
      const items = await table
        .scan()
        .filter(({ eq }) => eq("index", 1))
        .all();
      expect(items.length).to.equal(1);
      expect(items[0]).to.deep.equal({
        id: 2,
        name: "Test",
        index: 1,
      });
    });

    it("should get 2 pages, 1 item each", async () => {
      let numPages = 0;

      for await (const { items } of table.scan().limit(1).iter()) {
        expect(items.length).to.equal(1);
        numPages++;
      }

      expect(numPages).to.equal(2);
    });
  });
});
