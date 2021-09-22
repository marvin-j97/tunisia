# tunisia

Super simple, model-less DynamoDB wrapper

[![npm version](https://badge.fury.io/js/%40dotvirus%2Ftunisia.svg)](https://badge.fury.io/js/%40dotvirus%2Ftunisia)
[![codecov](https://codecov.io/gh/marvin-j97/tunisia/branch/dev/graph/badge.svg?token=OTGE5ASU1O)](https://codecov.io/gh/marvin-j97/tunisia)

## Install

```
npm i @dotvirus/tunisia aws-sdk@2
yarn add @dotvirus/tunisia aws-sdk@2
```

```typescript
import Tunisia from "@dotvirus/tunisia";

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
const item = tunisia
  .get(tableName)
  .one("id", "abc");
```

### Update property

```typescript
await tunisia
  .update(tableName)
  .key("id", "abc")
  .set("name", "Updated")
  .run();
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
const iterator = tunisia
  .query(tableName)
  .eq("userId", "abc")
  .iterate()

for await (const { items } of iterator) {
  console.log(items)
}
```
