import { tunisia } from "./client";

describe("Put Builder", () => {
  it("Should create 1 document", async () => {
    await tunisia.put("Debug").one({
      id: "2",
      name: "Test",
      index: 0
    });
  });

  it("Should create 75 documents", async () => {
    const ids = [] as string[];
    let counter = 100;

    while (counter < 175) {
      ids.push(counter.toString());
      counter++;
    }

    const docs = ids.map(id => ({
      id,
      name: Math.random().toString(36),
      index: 1
    }));

    await tunisia.put("Debug").many(docs);
  });
});
