# tunisia

Super simple, typesafe DynamoDB query builder.

[![TS ready](https://img.shields.io/static/v1?label=&message=TS+ready&color=000000&logo=typescript)]()
[![ESM ready](https://img.shields.io/static/v1?label=&message=ESM+ready&color=%23000000&logo=javascript)]()
[![npm version](https://badge.fury.io/js/%40tunisia.svg)](https://badge.fury.io/js/%40tunisia)
[![codecov](https://codecov.io/gh/marvin-j97/tunisia/branch/main/graph/badge.svg?token=OTGE5ASU1O)](https://codecov.io/gh/marvin-j97/tunisia)

## Install

```
pnpm install tunisia
yarn add tunisia
npm install tunisia
```

```typescript
import { Client } from "tunisia";

const client = new Client({
  region: "us-east-1",
  credentials: {
    accessKeyId: "fakeId",
    secretAccessKey: "fakeSecret",
  },
});

type Person = {
  id: string;
  firstName: string;
  age: number;
};

const personTable = client.defineTable<Person>("tunisia_persons");
```

## Examples

### Insert item

```typescript
const item = {
  id: "ab7bc4d5-45a8-4de2-b1da-0f274a0f6c0a",
  firstName: "Jess",
  age: 32,
};
await personTable.put().one(item);
```

### Get by ID

```typescript
const item = await personTable.query(({ eq }) => eq("id", "abc")).first();
```

### Update property

```typescript
await personTable.update().set("name", "Updated").one("id", "abc");
```

### Delete item

```typescript
await personTable.delete().one("id", "abc");
```

<!-- ### Transaction write

```typescript
await personTable.transactWrite().run([
  tunisia.insert(tableName).transaction({
    id: "abc",
    name: "Transaction write test",
  }),
  tunisia.delete(tableName).transaction("id", "another_id"),
]);
``` -->

### Iterate through index

```typescript
const iterator = tunisia
  .query(({ eq }) => eq("id", "abc"))
  .index("secondary-index")
  .iter();

for await (const { items } of iterator) {
  console.log(items);
}
```

### Count

```typescript
const count = tunisia
  .query(({ eq }) => eq("id", "abc"))
  .index("secondary-index")
  .count();
```
