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

process.env.DEBUG = "tunisia:*";

export const db = new aws.DynamoDB(config);
export const dynamoClient = new aws.DynamoDB.DocumentClient(config);
export const tunisia = new Tunisia(config);

export async function getTableSize(name: string) {
  const items = await tunisia.scan(name).all();
  return items.length;
}

export function initTable(
  name: string,
  attributes?: aws.DynamoDB.AttributeDefinitions,
  schema?: aws.DynamoDB.KeySchema,
  indices?: aws.DynamoDB.GlobalSecondaryIndexList
) {
  return async function (...args: any[]) {
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
