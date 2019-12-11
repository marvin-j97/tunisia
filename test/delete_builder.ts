import { expect } from "chai";
import { tunisia } from "./client";

describe("Delete Builder", () => {
  it("Should create 1 document", async () => {
    await tunisia.delete("Debug").one("id", "2");

    const doc = await tunisia
      .query("Debug")
      .eq("id", "2")
      .first();

    expect(doc).to.be.undefined;
  });

  it("Should create 75 documents", async () => {
    const ids = [] as string[];
    let counter = 100;

    while (counter < 175) {
      ids.push(counter.toString());
      counter++;
    }

    await tunisia.delete("Debug").many("id", ids);

    await tunisia
      .query("Debug")
      .index("index")
      .eq("index", 1)
      .recurse(async slice => {
        expect(slice.length).to.equal(0);
      });
  });
});
