import { Client } from "client";

type Person = {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
};

const client = new Client();
const personTable = client.defineTable<Person>("tunisia_persons");

(async () => {
  const scanner = personTable
    .scan()
    .filter(({ _in, eq, or }) => or(_in("age", [18, 20]), eq("lastName", "Bongo")));

  for await (const page of scanner.iter()) {
    console.log("page!", page.items);
  }

  console.log("found", await scanner.count());
})();
