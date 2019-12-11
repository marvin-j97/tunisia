import { expect } from "chai";
import { tunisia } from "./client";

describe("Update Builder", () => {
  it("Should update document", async () => {
    await tunisia
      .update("Debug")
      .key("id", "2")
      .set("index", 5)
      .set("name", "Changed Name")
      .run();

    const doc = await tunisia
      .query("Debug")
      .eq("id", "2")
      .first();

    expect(doc).to.not.be.undefined;

    if (doc) {
      expect(doc.name).to.equal("Changed Name");
      expect(doc.index).to.equal(5);
    }
  });
});
