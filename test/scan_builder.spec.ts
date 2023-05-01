import { beforeAll, describe, expect, it } from "vitest";

import { initTable, testClient } from "./table";

const tableName = "TunisiaTest_Scan";

const table = testClient.defineTable<{
  id: number;
  name: string;
  filterProp: boolean;
  index: number;
  meta?: { deleted: boolean };
}>(tableName);

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
        .where(({ eq }) => eq("id", 5))
        .compile();

      expect(params.TableName).to.equal(tableName);
      expect(params.ExpressionAttributeNames?.["#n0"]).to.equal("id");
      expect(params.ExpressionAttributeValues?.[":v0"]).to.equal(5);
    });

    it("should return correct query params 2", () => {
      const params = table
        .scan()
        .where(({ neq }) => neq("filterProp", false))
        .compile();

      expect(params.TableName).to.equal(tableName);
      expect(params.ExpressionAttributeNames?.["#n0"]).to.equal("filterProp");
      expect(params.ExpressionAttributeValues?.[":v0"]).to.equal(false);
      expect(params.FilterExpression).to.equal("#n0 <> :v0");
    });

    it("should return correct query params 2", () => {
      const params = table.scan().select(["id", "meta.deleted"]).compile();

      expect(params.TableName).to.equal(tableName);
      expect(params.ProjectionExpression).to.equal("#n0, #n1.#n2");
      expect(params.ExpressionAttributeNames?.["#n0"]).to.equal("id");
      expect(params.ExpressionAttributeNames?.["#n1"]).to.equal("meta");
      expect(params.ExpressionAttributeNames?.["#n2"]).to.equal("deleted");
    });
  });

  // eslint-disable-next-line max-lines-per-function
  describe("operations", () => {
    it("should create test items", async () => {
      expect(await table.scan().count()).to.equal(0);
      await table.put().one({
        id: 1,
        name: "Test",
        index: 0,
        filterProp: false,
      });
      await table.put().one({
        id: 2,
        name: "Test 123",
        index: 1,
        filterProp: false,
      });
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
        .where(({ eq }) => eq("index", 1))
        .all();
      expect(items.length).to.equal(1);
      expect(items[0]).to.deep.equal({
        id: 2,
        name: "Test",
        index: 1,
        filterProp: false,
      });
    });

    it("Should get filtered item 2", async () => {
      const items = await table
        .scan()
        .where(({ between }) => between("index", 0, 1))
        .all();
      expect(items.length).to.equal(1);
      expect(items[0]).to.deep.equal({
        id: 1,
        name: "Test",
        index: 1,
        filterProp: false,
      });
    });

    it("Should get filtered item 3", async () => {
      const items = await table
        .scan()
        .where(({ contains }) => contains("name", "123"))
        .all();
      expect(items.length).to.equal(1);
      expect(items[0]).to.deep.equal({
        id: 2,
        name: "Test 123",
        index: 1,
        filterProp: false,
      });
    });

    it("Should get filtered item 4", async () => {
      const items = await table
        .scan()
        .where(({ _in }) => _in("name", ["Test 123"]))
        .all();
      expect(items.length).to.equal(1);
      expect(items[0]).to.deep.equal({
        id: 2,
        name: "Test 123",
        index: 1,
        filterProp: false,
      });
    });

    it("Should get filtered item 5", async () => {
      const items = await table
        .scan()
        .where(({ eq, not }) => not(eq("id", 1)))
        .all();
      expect(items.length).to.equal(1);
      expect(items[0]).to.deep.equal({
        id: 2,
        name: "Test 123",
        index: 1,
        filterProp: false,
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

    // TODO: test .index() with sparse index
  });
});
