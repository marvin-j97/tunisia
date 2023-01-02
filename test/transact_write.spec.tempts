import ava, { before } from "ava";

import { getTableSize, initTable, tunisia } from "./table";

const tableName = "TunisiaTest_TransactWrite";
before(initTable(tableName));

function getById(id: number) {
  return tunisia.get(tableName).one<{ id: number; name: string; value: number }>("id", id);
}

ava.serial("Create item", async (t) => {
  t.is(await getTableSize(tableName), 0);

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
  t.is(await getTableSize(tableName), 2);
});

ava.serial("Should get doc 1", async (t) => {
  const doc = await getById(1);
  t.assert(doc);
});

ava.serial("Should get doc 2", async (t) => {
  const doc = await getById(2);
  t.assert(doc);
});

ava.serial("Should run transaction", async (t) => {
  await t.notThrowsAsync(() =>
    tunisia.transactWrite().run([
      tunisia.insert(tableName).transaction({
        id: 3,
        name: "Test 3",
      }),
      tunisia.delete(tableName).transaction("id", 1),
      tunisia.update(tableName).key("id", 2).set("name", "Updated").add("value", 1).transaction(),
    ]),
  );
  t.is(await getTableSize(tableName), 2);
});

ava.serial("Should not get deleted doc", async (t) => {
  const doc = await getById(1);
  t.assert(!doc);
});

ava.serial("Should get updated doc", async (t) => {
  const doc = await getById(2);
  t.assert(doc);
  t.is(doc?.name, "Updated");
  t.is(doc?.value, 1);
});

ava.serial("Should get doc 3", async (t) => {
  const doc = await getById(3);
  t.assert(doc);
});
