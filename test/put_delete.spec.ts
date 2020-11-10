import { getTableSize, initTable, tunisia } from "./table";
import ava, { before } from "ava";

const tableName = "TunisiaTest_PutDelete";
before(initTable(tableName));

ava.serial("Create item", async (t) => {
  t.is(await getTableSize(tableName), 0);
  await tunisia.put(tableName).one({
    id: 1,
    name: "Test",
  });
  t.is(await getTableSize(tableName), 1);
});

ava.serial("Should get doc", async (t) => {
  const doc = await tunisia.query(tableName).eq("id", 1).first();
  t.assert(doc);
});

ava.serial("Should delete 1 document", async (t) => {
  t.is(await getTableSize(tableName), 1);
  await tunisia.delete(tableName).one("id", 1);
  t.is(await getTableSize(tableName), 0);
});

ava.serial("Should not get deleted doc", async (t) => {
  const doc = await tunisia.query(tableName).eq("id", 1).first();
  t.assert(!doc);
});

ava.serial("Should create 75 documents", async (t) => {
  t.is(await getTableSize(tableName), 0);

  const ids: number[] = [];
  const initCounter = 100;
  const maxCounter = 175;

  let counter = initCounter;
  while (counter < maxCounter) {
    ids.push(counter);
    counter++;
  }

  const docs = ids.map((id) => ({
    id,
    name: Math.random().toString(36),
  }));

  await tunisia.create(tableName).many(docs);

  const numItems = maxCounter - initCounter;
  t.is(await getTableSize(tableName), numItems);
});

ava.serial("Should delete 75 items", async (t) => {
  const initSize = await getTableSize(tableName);

  const ids: number[] = [];
  const initCounter = 100;
  const maxCounter = 175;
  let counter = initCounter;

  while (counter < maxCounter) {
    ids.push(counter);
    counter++;
  }

  await tunisia.remove(tableName).many("id", ids);

  const numItems = maxCounter - initCounter;
  t.is(await getTableSize(tableName), initSize - numItems);
});
