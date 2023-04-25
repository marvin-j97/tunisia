import { Client } from "client";

type Person = {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  bongo: boolean;
  meta: {
    createdAt: number;
    deleted: boolean;
    tags: string[];
    iid: string;
  };
  ttl: number | null;
};

const client = new Client();
const personTable = client.defineTable<Person>("tunisia_persons");

(async () => {
  const scanner = personTable.scan().where(({ eq }) => eq("firstName", "Peter"));

  console.log(scanner.compile());

  for await (const page of scanner.iter()) {
    console.log("page!", page.items);
  }

  console.log("found", await scanner.count());
})();
