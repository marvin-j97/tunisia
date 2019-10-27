import { expect } from "chai";
import { Tunisia } from "../src";

const tunisia = Tunisia.fromConfig({
  convertEmptyValues: true
});

describe("Query Builder", () => {
  it("Should return correct query params", () => {
    const params = tunisia
      .query("TestTable")
      .key()
      .eq("id", 5)
      .project(["id", "name"])
      .buildParams();

    expect(params.ExpressionAttributeNames).to.not.be.undefined;
    expect(params.ExpressionAttributeValues).to.not.be.undefined;

    if (params.ExpressionAttributeNames && params.ExpressionAttributeValues) {
      expect(params.TableName).to.equal("TestTable");
      expect(params.KeyConditionExpression).to.equal("#id = :value0");
      expect(params.ExpressionAttributeNames["#id"]).to.equal("id");
      expect(params.ExpressionAttributeNames["#name"]).to.equal("name");
      expect(params.ExpressionAttributeValues[":value0"]).to.equal(5);
      expect(params.ProjectionExpression).to.equal("#id,#name");
    }
  });

  it("Should return correct query params", () => {
    const params = tunisia
      .query("TestTable")
      .key()
      .eq("id", 5)
      .pick("  names  ")
      .buildParams();

    expect(params.ExpressionAttributeNames).to.not.be.undefined;
    expect(params.ExpressionAttributeValues).to.not.be.undefined;

    if (params.ExpressionAttributeNames && params.ExpressionAttributeValues) {
      expect(params.TableName).to.equal("TestTable");
      expect(params.KeyConditionExpression).to.equal("#id = :value0");
      expect(params.ExpressionAttributeNames["#id"]).to.equal("id");
      expect(params.ExpressionAttributeNames["#names"]).to.equal("names");
      expect(params.ExpressionAttributeValues[":value0"]).to.equal(5);
      expect(params.ProjectionExpression).to.equal("#names");
    }
  });

  it("Should return correct query params", () => {
    const params = tunisia
      .query("TestTable")
      .index("indexName")
      .key()
      .eq("indexKey", 5)
      .and()
      .between("age", 0, 18)
      .filter()
      .neq("filterProp", false)
      .buildParams();

    expect(params.ExpressionAttributeNames).to.not.be.undefined;
    expect(params.ExpressionAttributeValues).to.not.be.undefined;

    if (params.ExpressionAttributeNames && params.ExpressionAttributeValues) {
      expect(params.TableName).to.equal("TestTable");
      expect(params.ExpressionAttributeNames["#indexKey"]).to.equal("indexKey");
      expect(params.ExpressionAttributeNames["#age"]).to.equal("age");
      expect(params.ExpressionAttributeNames["#filterProp"]).to.equal(
        "filterProp"
      );
      expect(params.FilterExpression).to.equal("#filterProp <> :value3")
    }

    console.log(params);
  });
});
