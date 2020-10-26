import { getTableSize, tableName, tunisia } from "./table";
import ava from "ava";

ava.serial("Create item", async (t) => {
  const initSize = await getTableSize();
  await tunisia.put(tableName).one({
    id: 1,
    name: "Test",
  });
  t.is(await getTableSize(), initSize + 1);
});

ava.serial("Should get doc", async (t) => {
  const doc = await tunisia.query(tableName).eq("id", 1).first();
  t.assert(doc);
});

ava.serial("Should delete 1 document", async (t) => {
  const initSize = await getTableSize();
  await tunisia.delete(tableName).one("id", 1);
  t.is(await getTableSize(), initSize - 1);
});

ava.serial("Should not get deleted doc", async (t) => {
  const doc = await tunisia.query(tableName).eq("id", 1).first();
  t.assert(!doc);
});

ava.serial("Should create 75 documents", async (t) => {
  const initSize = await getTableSize();

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

  await tunisia.put(tableName).many(docs);

  const numItems = maxCounter - initCounter;
  t.is(await getTableSize(), initSize + numItems);
});

ava.serial("Should delete 75 items", async (t) => {
  const initSize = await getTableSize();

  const ids: number[] = [];
  const initCounter = 100;
  const maxCounter = 175;
  let counter = initCounter;

  while (counter < maxCounter) {
    ids.push(counter);
    counter++;
  }

  await tunisia.delete(tableName).many("id", ids);

  const numItems = maxCounter - initCounter;
  t.is(await getTableSize(), initSize - numItems);
});
