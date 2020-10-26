import ava from "ava";
import { tunisia } from "./table";

ava.serial("Should return correct scan params", (t) => {
  const params = tunisia
    .scan("TestTable")
    .eq("id", 5)
    .project(["id", "name"])
    .params();

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
  const params = tunisia
    .scan("TestTable")
    .eq("id", 5)
    .pick("  names  ")
    .params();

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
  const params = tunisia
    .scan("TestTable")
    .index("indexName")
    .neq("filterProp", false)
    .params();

  if (params.ExpressionAttributeNames && params.ExpressionAttributeValues) {
    t.is(params.TableName, "TestTable");
    t.is(params.IndexName, "indexName");
    t.is(params.ExpressionAttributeNames["#filterProp"], "filterProp");
    t.is(params.FilterExpression, "#filterProp <> :value0");
  } else {
    t.fail();
  }
});
