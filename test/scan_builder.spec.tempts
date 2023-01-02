import ava, { before } from "ava";

import { getTableSize, initTable, tunisia } from "./table";

const tableName = "TunisiaTest_Scan";
before(initTable(tableName));

ava.serial("Should return correct scan params", (t) => {
  const params = tunisia.scan("TestTable").eq("id", 5).project(["id", "name"]).params();

  if (params.ExpressionAttributeNames && params.ExpressionAttributeValues) {
    t.is(params.TableName, "TestTable");
    t.is(params.ExpressionAttributeNames["#id"], "id");
    t.is(params.ExpressionAttributeNames["#name"], "name");
    t.is(params.ExpressionAttributeValues[":value0"], <any>5);
    t.is(params.ProjectionExpression, "#id,#name");
  } else {
    t.fail();
  }
});

ava.serial("Should return correct scan params 2", (t) => {
  const params = tunisia.scan("TestTable").eq("id", 5).pick("  names  ").params();

  if (params.ExpressionAttributeNames && params.ExpressionAttributeValues) {
    t.is(params.TableName, "TestTable");
    t.is(params.ExpressionAttributeNames["#id"], "id");
    t.is(params.ExpressionAttributeNames["#names"], "names");
    t.is(params.ExpressionAttributeValues[":value0"], <any>5);
    t.is(params.ProjectionExpression, "#names");
  } else {
    t.fail();
  }
});

ava.serial("Should return correct scan params 3", (t) => {
  const params = tunisia.scan("TestTable").index("indexName").neq("filterProp", false).params();

  if (params.ExpressionAttributeNames && params.ExpressionAttributeValues) {
    t.is(params.TableName, "TestTable");
    t.is(params.IndexName, "indexName");
    t.is(params.ExpressionAttributeNames["#filterProp"], "filterProp");
    t.is(params.FilterExpression, "#filterProp <> :value0");
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

ava.serial("Should get items", async (t) => {
  const items = await tunisia.scan(tableName).get();
  t.is(items.length, 2);
});

ava.serial("Should get all items", async (t) => {
  const items = await tunisia.scan(tableName).all();
  t.is(items.length, 2);
});

ava.serial("Should get filtered item", async (t) => {
  const items = await tunisia.scan(tableName).eq("index", 1).all<{ index: number }>();
  t.is(items.length, 1);
  t.is(items[0].index, 1);
});

ava.serial("Should get 2 pages, 1 item each", async (t) => {
  let numPages = 0;
  for await (const { items } of tunisia.scan(tableName).limit(1).iterate()) {
    t.is(items.length, 1);
    numPages++;
  }
  t.is(numPages, 2);
});
