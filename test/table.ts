import {
  AttributeDefinition,
  CreateTableCommand,
  DeleteTableCommand,
  DescribeTableCommand,
  GlobalSecondaryIndex,
  KeySchemaElement,
} from "@aws-sdk/client-dynamodb";

import { Client } from "../src";

// java -Djava.library.path=./DynamoDBLocal_lib -jar DynamoDBLocal.jar -sharedDb -inMemory
const config = {
  endpoint: "http://localhost:8000",
  region: "us-east-1",
  credentials: {
    accessKeyId: "fakeId",
    secretAccessKey: "fakeSecret",
  },
};

export const testClient = new Client(config);

/**
 *
 * @param name
 * @returns
 */
export async function getTableSize(tableName: string): Promise<number> {
  return testClient.defineTable(tableName).scan().count();
}

/**
 * Creates test table
 */
export function initTable(
  name: string,
  attributes?: AttributeDefinition[],
  schema?: KeySchemaElement[],
  indices?: GlobalSecondaryIndex[],
) {
  return async (): Promise<void> => {
    console.error("Creating table", name);

    const { Table: table } = await testClient._ddbClient.send(
      new DescribeTableCommand({
        TableName: name,
      }),
    );

    if (table) {
      console.error(`Deleting table ${name}`);
      await testClient._ddbClient.send(new DeleteTableCommand({ TableName: name }));
    }

    console.error(`Creating table ${name}`);

    await testClient._ddbClient.send(
      new CreateTableCommand({
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
      }),
    );
  };
}
