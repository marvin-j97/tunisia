import { getTableSize, initTable, tunisia } from "./table";
import ava, { before } from "ava";

const tableName = "TunisiaTest_BatchGet";
before(initTable(tableName));

let addedItems = [] as { id: number; name: string }[];

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
  addedItems = docs.sort((a, b) => a.id - b.id);

  await tunisia.create(tableName).many(docs);

  const numItems = maxCounter - initCounter;
  t.is(await getTableSize(tableName), numItems);
});

ava.serial("Should get the 75 added documents again", async (t) => {
  const ids: number[] = [];
  const initCounter = 100;
  const maxCounter = 175;

  let counter = initCounter;
  while (counter < maxCounter) {
    ids.push(counter);
    counter++;
  }
  const items = await tunisia
    .get(tableName)
    .many<{ id: number; name: string }>("id", ids);
  items.sort((a, b) => a.id - b.id);
  t.is(items.length, 75);
  t.deepEqual(addedItems, items);
});
