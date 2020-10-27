import Tunisia from "./index";
import { StringMap, HashMap, resolveExpressionNames } from "./util";
import { STOP } from "./index";

export class ScanBuilder {
  private $tunisia: Tunisia;

  private tableName: string;
  private indexName?: string;
  private filterExpression: string[] = [];
  private expressionAttributeNames: StringMap = {};
  private expressionAttributeValues: HashMap<any> = {};
  private startKey?: AWS.DynamoDB.Key;
  private limitItems?: number;
  private projections = [] as string[];

  private expressionValueNameCounter: number = 0;

  constructor(tableName: string, root: Tunisia) {
    this.tableName = tableName;
    this.$tunisia = root;
  }

  pick(input: string | string[]) {
    return this.project(input);
  }

  project(input: string | string[]) {
    let expressionNames = [] as string[];
    if (Array.isArray(input)) {
      expressionNames = input.map(resolveExpressionNames);
    } else {
      expressionNames = input
        .split(",")
        .map((s) => resolveExpressionNames(s.trim()));
    }

    this.projections.push(...expressionNames);

    for (const name of expressionNames) {
      for (const expressionName of name.split(".")) {
        this.expressionAttributeNames[expressionName] = expressionName.replace(
          "#",
          ""
        );
      }
    }

    return this;
  }

  index(indexName: string) {
    this.indexName = indexName;
    return this;
  }

  private comparison(name: string, val: any, operator: string) {
    const expressionNames = resolveExpressionNames(name);
    const expressionValueName = `value${this.expressionValueNameCounter++}`;

    this.filterExpression.push(
      `${expressionNames} ${operator} :${expressionValueName}`
    );

    for (const expressionName of expressionNames.split(".")) {
      this.expressionAttributeNames[
        `${expressionName}`
      ] = expressionName.replace("#", "");
    }

    this.expressionAttributeValues[`:${expressionValueName}`] = val;
    return this;
  }

  eq(name: string, val: any) {
    return this.comparison(name, val, "=");
  }

  neq(name: string, val: any) {
    return this.comparison(name, val, "<>");
  }

  gte(name: string, val: any) {
    return this.comparison(name, val, ">=");
  }

  lte(name: string, val: any) {
    return this.comparison(name, val, "<=");
  }

  lt(name: string, val: any) {
    return this.comparison(name, val, "<");
  }

  gt(name: string, val: any) {
    return this.comparison(name, val, ">");
  }

  and() {
    this.filterExpression.push(`and`);
    return this;
  }

  or() {
    this.filterExpression.push(`or`);
    return this;
  }

  limit(limit: number) {
    this.limitItems = limit;
    return this;
  }

  startAt(startKey?: AWS.DynamoDB.Key) {
    this.startKey = startKey;
    return this;
  }

  params(): AWS.DynamoDB.ScanInput {
    return {
      TableName: this.tableName,
      IndexName: this.indexName,
      FilterExpression: this.filterExpression.join(" ") || undefined,
      ExpressionAttributeNames: Object.keys(this.expressionAttributeNames)
        .length
        ? this.expressionAttributeNames
        : undefined,
      ExpressionAttributeValues: Object.keys(this.expressionAttributeValues)
        .length
        ? this.expressionAttributeValues
        : undefined,
      ExclusiveStartKey: this.startKey,
      Limit: this.limitItems,
      ProjectionExpression: this.projections.join(",") || undefined,
    };
  }

  exec() {
    return this.run();
  }

  run(): Promise<AWS.DynamoDB.ScanOutput> {
    return this.$tunisia.getClient().scan(this.params()).promise();
  }

  async all<T>() {
    const items = [] as T[];

    await this.recurse<T>(async (slice) => {
      items.push(...slice);
    });

    return items;
  }

  async page<T>(size?: number) {
    let items = [] as T[];
    let returnKey = undefined;

    await this.recurse<T>(async (slice, key) => {
      items.push(...slice);
      returnKey = key;
      if (size) {
        if (items.length >= size) {
          return STOP;
        }
      } else {
        return STOP;
      }
    });

    return { items, key: returnKey };
  }

  async recurse<T>(
    onItems: (items: T[], key?: AWS.DynamoDB.Key) => Promise<any>
  ) {
    const inner = async (params: AWS.DynamoDB.DocumentClient.ScanInput) => {
      const scanResult = await this.$tunisia.getClient().scan(params).promise();

      if (scanResult.Items && scanResult.Items.length) {
        const result = await onItems(
          <T[]>scanResult.Items || [],
          scanResult.LastEvaluatedKey
        );
        if (result === STOP) {
          return;
        }

        if (scanResult.LastEvaluatedKey) {
          params.ExclusiveStartKey = scanResult.LastEvaluatedKey;
          await inner(params);
        }
      }
    };

    await inner(this.params());
  }

  async first<T>(): Promise<T | undefined> {
    const items = await this.get<T>();
    return items[0];
  }

  async get<T>(): Promise<T[]> {
    const result = await this.run();
    if (result.Items) {
      return (result.Items as unknown) as T[];
    }
    return [];
  }
}
