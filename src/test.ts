import { Client } from "client";

type Person = {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  bongo: boolean;
  meta: {
    deleted: boolean;
  };
};

const client = new Client();
const personTable = client.defineTable<Person>("tunisia_persons");

(async () => {
  const scanner = personTable.scan().where(({ contains }) => contains("firstName", "Peter"));

  for await (const page of scanner.iter()) {
    console.log("page!", page.items);
  }

  console.log("found", await scanner.count());
})();
