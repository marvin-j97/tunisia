import { expect } from "chai";
import { tunisia } from "./client";

describe("Scan Builder", () => {
  it("Should return correct scan params", () => {
    const params = tunisia
      .scan("TestTable")
      .eq("id", 5)
      .project(["id", "name"])
      .params();

    expect(params.ExpressionAttributeNames).to.not.be.undefined;
    expect(params.ExpressionAttributeValues).to.not.be.undefined;

    if (params.ExpressionAttributeNames && params.ExpressionAttributeValues) {
      expect(params.TableName).to.equal("TestTable");
      expect(params.ExpressionAttributeNames["#id"]).to.equal("id");
      expect(params.ExpressionAttributeNames["#name"]).to.equal("name");
      expect(params.ExpressionAttributeValues[":value0"]).to.equal(5);
      expect(params.ProjectionExpression).to.equal("#id,#name");
    }
  });

  it("Should return correct scan params", () => {
    const params = tunisia
      .scan("TestTable")
      .eq("id", 5)
      .pick("  names  ")
      .params();

    expect(params.ExpressionAttributeNames).to.not.be.undefined;
    expect(params.ExpressionAttributeValues).to.not.be.undefined;

    if (params.ExpressionAttributeNames && params.ExpressionAttributeValues) {
      expect(params.TableName).to.equal("TestTable");
      expect(params.ExpressionAttributeNames["#id"]).to.equal("id");
      expect(params.ExpressionAttributeNames["#names"]).to.equal("names");
      expect(params.ExpressionAttributeValues[":value0"]).to.equal(5);
      expect(params.ProjectionExpression).to.equal("#names");
    }
  });

  it("Should return correct scan params", () => {
    const params = tunisia
      .scan("TestTable")
      .index("indexName")
      .neq("filterProp", false)
      .params();

    expect(params.ExpressionAttributeNames).to.not.be.undefined;
    expect(params.ExpressionAttributeValues).to.not.be.undefined;

    if (params.ExpressionAttributeNames && params.ExpressionAttributeValues) {
      expect(params.TableName).to.equal("TestTable");
      expect(params.IndexName).to.equal("indexName");
      expect(params.ExpressionAttributeNames["#filterProp"]).to.equal(
        "filterProp"
      );
      expect(params.FilterExpression).to.equal("#filterProp <> :value0");
    }
  });

  it("Should return created document", async () => {
    const doc = await tunisia
      .scan("Debug")
      .eq("index", 0)
      .first();

    expect(doc).to.not.be.undefined;

    if (doc) {
      expect(doc.name).to.equal("Test");
    }
  });

  it("Should return 1 page of 5 documents", async () => {
    const { items, key } = await tunisia
      .query("Debug")
      .index("index")
      .eq("index", 1)
      .limit(5)
      .page();

    expect(items.length).to.equal(5);
    expect(key).to.not.be.undefined;
  });

  it("Should return 75 documents", async () => {
    const items = [] as any[];

    await tunisia
      .scan("Debug")
      .eq("index", 1)
      .limit(5)
      .recurse(async slice => {
        items.push(...slice);
      });

    expect(items.length).to.equal(75);
  });
});
