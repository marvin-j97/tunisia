import { beforeAll, describe, expect, it } from "vitest";

import { getTableSize, initTable, tunisia } from "./table";

const tableName = "TunisiaTest_TransactWrite";

/**
 * Gets a single item by ID
 */
function getById(id: number) {
  return tunisia.get(tableName).one<{ id: number; name: string; value: number }>("id", id);
}

describe("transactWrite", () => {
  beforeAll(initTable(tableName));

  it("should create items", async () => {
    expect(await getTableSize(tableName)).to.equal(0);
    await tunisia.put(tableName).many([
      {
        id: 1,
        name: "Test",
        value: 0,
      },
      {
        id: 2,
        name: "Test 2",
        value: 0,
      },
    ]);
    expect(await getTableSize(tableName)).to.equal(2);
  });

  it("should run transaction", async () => {
    const result = await tunisia.transactWrite().run([
      tunisia.insert(tableName).transaction({
        id: 3,
        name: "Test 3",
      }),
      tunisia.delete(tableName).transaction("id", 1),
      tunisia.update(tableName).key("id", 2).set("name", "Updated").add("value", 1).transaction(),
    ]);
    expect(result).to.be.undefined;
  });

  it("should not get deleted doc", async () => {
    const doc = await getById(1);
    expect(doc).to.be.null;
  });

  it("should get updated doc", async () => {
    const doc = await getById(2);
    expect(doc).to.deep.equal({
      id: 2,
      name: "Updated",
      value: 1,
    });
  });

  it("should get created doc", async () => {
    const doc = await getById(3);
    expect(doc).to.deep.equal({
      id: 3,
      name: "Test 3",
    });
  });
});
