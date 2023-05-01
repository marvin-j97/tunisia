import {
  AttributeDefinition,
  CreateTableCommand,
  DeleteTableCommand,
  DescribeTableCommand,
  DescribeTableOutput,
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
 * Gets table or null
 */
async function getTable(name: string): Promise<DescribeTableOutput | null> {
  try {
    return await testClient._ddbClient.send(new DescribeTableCommand({ TableName: name }));
  } catch (error) {
    if (error.name === "ResourceNotFoundException") {
      return null;
    }
    throw error;
  }
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

    const describe = await getTable(name);

    if (describe?.Table) {
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
