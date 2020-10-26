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

export const tableName = "Tunisia";

export async function getTableSize() {
  const items = await tunisia.scan(tableName).all();
  return items.length;
}

export async function initTable() {
  console.log("initTable");
  const { TableNames } = await db.listTables().promise();
  if (TableNames!.length) {
    console.log("Deleting table");
    await db
      .deleteTable({
        TableName: tableName,
      })
      .promise();
  }
  console.log("Creating table");
  return db
    .createTable({
      TableName: tableName,
      AttributeDefinitions: [
        {
          AttributeName: "id",
          AttributeType: "N",
        },
      ],
      KeySchema: [
        {
          AttributeName: "id",
          KeyType: "HASH",
        },
      ],
      ProvisionedThroughput: {
        ReadCapacityUnits: 1,
        WriteCapacityUnits: 1,
      },
    })
    .promise();
}
