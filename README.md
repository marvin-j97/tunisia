# tunisia

Super simple, model-less DynamoDB wrapper

[![TS ready](https://img.shields.io/static/v1?label=&message=TS+ready&color=000000&logo=typescript)]()
[![ESM ready](https://img.shields.io/static/v1?label=&message=ESM+ready&color=%23000000&logo=javascript)]()
[![npm version](https://badge.fury.io/js/%40tunisia.svg)](https://badge.fury.io/js/%40tunisia)
[![codecov](https://codecov.io/gh/marvin-j97/tunisia/branch/main/graph/badge.svg?token=OTGE5ASU1O)](https://codecov.io/gh/marvin-j97/tunisia)

## Install

```
pnpm install tunisia aws-sdk@2
yarn add tunisia aws-sdk@2
npm install tunisia aws-sdk@2
```

```typescript
import Tunisia from "tunisia";

const tunisia = new Tunisia({
  region: "us-east-1",
  credentials: {
    accessKeyId: "fakeId",
    secretAccessKey: "fakeSecret",
  },
});
```

## Examples

### Insert item

```typescript
const item = {
  id: "abc",
  name: "Tunisia",
};
await tunisia.insert(tableName).one(item);
```

### Get by ID

```typescript
const item = tunisia.get(tableName).one("id", "abc");
```

### Update property

```typescript
await tunisia.update(tableName).key("id", "abc").set("name", "Updated").run();
```

### Delete item

```typescript
await tunisia.delete(tableName).one("id", "abc");
```

### Transaction write

```typescript
await tunisia.transactWrite().run([
  tunisia.insert(tableName).transaction({
    id: "abc",
    name: "Transaction write test",
  }),
  tunisia.delete(tableName).transaction("id", "another_id"),
]);
```

### Iterate through index

```typescript
const iterator = tunisia.query(tableName).eq("userId", "abc").iterate();

for await (const { items } of iterator) {
  console.log(items);
}
```
