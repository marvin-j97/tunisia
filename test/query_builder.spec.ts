import { beforeAll, describe, expect, it } from "vitest";

import { getTableSize, initTable, tunisia } from "./table";

// eslint-disable-next-line max-lines-per-function
describe("query", () => {
  describe("builder", () => {
    const tableName = "TestTable";

    it("should return correct query params", () => {
      const params = tunisia.query(tableName).key().eq("id", 5).project(["id", "name"]).params();

      expect(params.TableName).to.equal(tableName);
      expect(params.KeyConditionExpression).to.equal("#id = :value0");
      expect(params.ExpressionAttributeNames?.["#id"]).to.equal("id");
      expect(params.ExpressionAttributeNames?.["#name"]).to.equal("name");
      expect(params.ExpressionAttributeValues?.[":value0"]).to.equal(5);
      expect(params.ProjectionExpression).to.equal("#id,#name");
    });

    it("should return correct query params 2", () => {
      const params = tunisia.query(tableName).eq("id", 5).pick("  names  ").params();

      expect(params.TableName).to.equal(tableName);
      expect(params.KeyConditionExpression).to.equal("#id = :value0");
      expect(params.ExpressionAttributeNames?.["#id"]).to.equal("id");
      expect(params.ExpressionAttributeNames?.["#names"]).to.equal("names");
      expect(params.ExpressionAttributeValues?.[":value0"]).to.equal(5);
      expect(params.ProjectionExpression).to.equal("#names");
    });

    it("should return correct query params 3", () => {
      const params = tunisia
        .query(tableName)
        .index("indexName")
        .key()
        .eq("indexKey", 5)
        .and()
        .between("age", 0, 18)
        .filter()
        .neq("filterProp", false)
        .params();

      expect(params.TableName).to.equal(tableName);
      expect(params.IndexName).to.equal("indexName");
      expect(params.ExpressionAttributeNames?.["#indexKey"]).to.equal("indexKey");
      expect(params.ExpressionAttributeNames?.["#age"]).to.equal("age");
      expect(params.ExpressionAttributeNames?.["#filterProp"]).to.equal("filterProp");
      expect(params.FilterExpression).to.equal("#filterProp <> :value3");
    });
  });

  describe("get", () => {
    const tableName = "TunisiaTest_Query";

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

    it("should get items with index = 1", async () => {
      const items = await tunisia
        .query(tableName)
        .index("index")
        .eq("index", 1)
        .all<{ index: number }>();
      expect(items.length).to.equal(1);
      expect(items[0]).to.deep.equal({
        id: 2,
        name: "Test",
        index: 1,
      });
    });

    it("pick only ID", async () => {
      const items = await tunisia
        .query(tableName)
        .index("index")
        .eq("index", 1)
        .pick("id")
        .all<{ index: number }>();
      expect(items.length).to.equal(1);
      expect(items[0]).to.deep.equal({
        id: 2,
      });
    });
  });
});

/*
ava.serial("Should get 2 pages, 1 item each", async (t) => {
  await tunisia.put(tableName).one({
    id: 3,
    name: "Test",
    index: 1,
  });
  t.is(await getTableSize(tableName), 3);

  let numPages = 0;
  for await (const { items } of tunisia
    .query(tableName)
    .index("index")
    .eq("index", 1)
    .limit(1)
    .iterate()) {
    t.is(items.length, 1);
    numPages++;
  }

  t.is(numPages, 2);
});

ava.serial("Should get 2 pages, 1 item each with iterate", async (t) => {
  const querier = tunisia.query(tableName).index("index").eq("index", 1).limit(1);

  let numPages = 0;
  for await (const { items } of querier.iterate()) {
    t.is(items.length, 1);
    numPages++;
  }

  t.is(numPages, 2);
});

ava.serial("Query filter", async (t) => {
  const items = await tunisia
    .query(tableName)
    .index("index")
    .eq("index", 1)
    .filter()
    .eq("name", "nooo")
    .all();

  t.is(items.length, 0);
});
 */
