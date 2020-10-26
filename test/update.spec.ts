import ava, { before } from "ava";
import { getTableSize, initTable, tunisia } from "./table";

const tableName = "TunisiaTest_Update";
before(initTable(tableName));

ava.serial("Create item", async (t) => {
  t.is(await getTableSize(tableName), 0);
  await tunisia.put(tableName).one({
    id: 1,
    name: "Test",
  });
  t.is(await getTableSize(tableName), 1);

  const doc = await tunisia.query(tableName).eq("id", 1).first();
  t.is(doc.id, 1);
  t.is(doc.name, "Test");
  t.assert(!doc.index);
});

ava.serial("Should update document", async (t) => {
  await tunisia
    .update(tableName)
    .key("id", 1)
    .set("index", 5)
    .set("name", "Changed Name")
    .run();

  const doc = await tunisia.query(tableName).eq("id", 1).first();
  t.assert(doc);
  t.is(doc.id, 1);
  t.is(doc.name, "Changed Name");
  t.is(doc.index, 5);
});

ava.serial("Should add to document field", async (t) => {
  await tunisia.update(tableName).key("id", 1).add("index", 1).run();

  const doc = await tunisia.query(tableName).eq("id", 1).first();
  t.assert(doc);
  t.is(doc.id, 1);
  t.is(doc.name, "Changed Name");
  t.is(doc.index, 6);
});

ava.serial("Should remove document field", async (t) => {
  await tunisia.update(tableName).key("id", 1).remove("index").exec();

  const doc = await tunisia.query(tableName).eq("id", 1).first();
  t.assert(doc);
  t.is(doc.id, 1);
  t.is(doc.name, "Changed Name");
  t.assert(!doc.index);
});
