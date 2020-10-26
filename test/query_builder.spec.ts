import ava, { before } from "ava";
import { getTableSize, initTable, tunisia } from "./table";

const tableName = "TunisiaTest_Query";
before(
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
    ]
  )
);

ava.serial("Should return correct query params", (t) => {
  const params = tunisia
    .query("TestTable")
    .key()
    .eq("id", 5)
    .project(["id", "name"])
    .params();

  if (params.ExpressionAttributeNames && params.ExpressionAttributeValues) {
    t.is(params.TableName, "TestTable");
    t.is(params.KeyConditionExpression, "#id = :value0");
    t.is(params.ExpressionAttributeNames["#id"], "id");
    t.is(params.ExpressionAttributeNames["#name"], "name");
    t.is(params.ExpressionAttributeValues[":value0"], <any>5);
    t.is(params.ProjectionExpression, "#id,#name");
  } else {
    t.fail();
  }
});

ava.serial("Should return correct query params 2", (t) => {
  const params = tunisia
    .query("TestTable")
    .eq("id", 5)
    .pick("  names  ")
    .params();

  if (params.ExpressionAttributeNames && params.ExpressionAttributeValues) {
    t.is(params.TableName, "TestTable");
    t.is(params.KeyConditionExpression, "#id = :value0");
    t.is(params.ExpressionAttributeNames["#id"], "id");
    t.is(params.ExpressionAttributeNames["#names"], "names");
    t.is(params.ExpressionAttributeValues[":value0"], <any>5);
    t.is(params.ProjectionExpression, "#names");
  } else {
    t.fail();
  }
});

ava.serial("Should return correct query params 3", (t) => {
  const params = tunisia
    .query("TestTable")
    .index("indexName")
    .key()
    .eq("indexKey", 5)
    .and()
    .between("age", 0, 18)
    .filter()
    .neq("filterProp", false)
    .params();

  if (params.ExpressionAttributeNames && params.ExpressionAttributeValues) {
    t.is(params.TableName, "TestTable");
    t.is(params.IndexName, "indexName");
    t.is(params.ExpressionAttributeNames["#indexKey"], "indexKey");
    t.is(params.ExpressionAttributeNames["#age"], "age");
    t.is(params.ExpressionAttributeNames["#filterProp"], "filterProp");
    t.is(params.FilterExpression, "#filterProp <> :value3");
  } else {
    t.fail();
  }
});

ava.serial("Create item", async (t) => {
  t.is(await getTableSize(tableName), 0);
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
  t.is(await getTableSize(tableName), 2);
});

ava.serial("Should get item with index = 1", async (t) => {
  const items = await tunisia
    .query(tableName)
    .index("index")
    .eq("index", 1)
    .all<{ index: number }>();
  t.is(items.length, 1);
  t.is(items[0].index, 1);
});

ava.serial("Pick only id", async (t) => {
  const items = await tunisia
    .query(tableName)
    .index("index")
    .eq("index", 1)
    .pick("id")
    .all<{ index: number }>();
  t.is(items.length, 1);
  t.deepEqual(Object.keys(items[0]), ["id"]);
});

ava.serial("Should get 2 pages, 1 item each", async (t) => {
  await tunisia.put(tableName).one({
    id: 3,
    name: "Test",
    index: 1,
  });
  t.is(await getTableSize(tableName), 3);

  let numPages = 0;
  await tunisia
    .query(tableName)
    .index("index")
    .eq("index", 1)
    .limit(1)
    .recurse(async (page) => {
      t.is(page.length, 1);
      numPages++;
    });
  t.is(numPages, 2);
});

ava.serial("Should get 2 pages, 1 item each with iterate", async (t) => {
  const querier = tunisia
    .query(tableName)
    .index("index")
    .eq("index", 1)
    .limit(1);

  let numPages = 0;
  for await (const { items } of querier.iterate()) {
    t.is(items.length, 1);
    numPages++;
  }

  t.is(numPages, 2);
});
