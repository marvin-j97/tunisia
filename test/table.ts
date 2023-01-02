import aws from "aws-sdk";

import Tunisia from "../src";

// java -Djava.library.path=./DynamoDBLocal_lib -jar DynamoDBLocal.jar -sharedDb -inMemory
const config: aws.DynamoDB.ClientConfiguration = {
  endpoint: "http://localhost:8000",
  region: "us-east-1",
  credentials: {
    accessKeyId: "fakeId",
    secretAccessKey: "fakeSecret",
  },
};

export const db = new aws.DynamoDB(config);
export const dynamoClient = new aws.DynamoDB.DocumentClient({
  ...config,
  convertEmptyValues: true,
  logger: {
    log: (...msg) => console.log(...msg),
  },
});
export const tunisia = new Tunisia(config);

/**
 *
 * @param name
 * @returns
 */
export async function getTableSize(name: string): Promise<number> {
  const items = await tunisia.scan(name).all();
  return items.length;
}

/**
 * Creates test table
 */
export function initTable(
  name: string,
  attributes?: aws.DynamoDB.AttributeDefinitions,
  schema?: aws.DynamoDB.KeySchema,
  indices?: aws.DynamoDB.GlobalSecondaryIndexList,
) {
  return async (): Promise<void> => {
    const { TableNames } = await db.listTables().promise();
    if (TableNames && TableNames.includes(name)) {
      console.log(`Deleting table ${name}`);
      await db
        .deleteTable({
          TableName: name,
        })
        .promise();
    }

    console.log(`Creating table ${name}`);
    await db
      .createTable({
        TableName: name,
        AttributeDefinitions: [
          {
            AttributeName: "id",
            AttributeType: "N",
          },
          ...(attributes || []),
        ],
        KeySchema: [
          {
            AttributeName: "id",
            KeyType: "HASH",
          },
          ...(schema || []),
        ],
        GlobalSecondaryIndexes: indices,
        ProvisionedThroughput: {
          ReadCapacityUnits: 1,
          WriteCapacityUnits: 1,
        },
      })
      .promise();
  };
}
