import Tunisia from "./index";
import { StringMap, AnyMap, resolveExpressionNames } from "./util";
import { STOP } from "./index";

export class ScanBuilder {
  private $tunisia: Tunisia;

  private tableName: string;
  private indexName?: string;
  private filterExpression: string[] = [];
  private expressionAttributeNames: StringMap = {};
  private expressionAttributeValues: AnyMap = {};
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
        .map(s => resolveExpressionNames(s.trim()));
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
      ProjectionExpression: this.projections.join(",") || undefined
    };
  }

  exec() {
    return this.run();
  }

  run(): Promise<AWS.DynamoDB.ScanOutput> {
    return this.$tunisia
      .getClient()
      .scan(this.params())
      .promise();
  }

  async all() {
    const items = [] as AnyMap[];

    await this.recurse(async slice => {
      items.push(...slice);
    });

    return items;
  }

  async page(size?: number) {
    let items = [] as AnyMap[];
    let returnKey = undefined;

    await this.recurse(async (slice, key) => {
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

  async recurse(
    onItems: (items: any[], key?: AWS.DynamoDB.Key) => Promise<any>
  ) {
    const inner = async (params: AWS.DynamoDB.DocumentClient.ScanInput) => {
      try {
        const scanResult = await this.$tunisia
          .getClient()
          .scan(params)
          .promise();

        const result = await onItems(
          scanResult.Items || [],
          scanResult.LastEvaluatedKey
        );
        if (result === STOP) return;

        if (scanResult.LastEvaluatedKey) {
          params.ExclusiveStartKey = scanResult.LastEvaluatedKey;
          await inner(params);
        }
      } catch (err) {
        throw err;
      }
    };

    await inner(this.params());
  }

  async first(): Promise<AnyMap | undefined> {
    try {
      return (await this.get())[0];
    } catch (err) {
      throw err;
    }
  }

  async get(): Promise<AnyMap[]> {
    try {
      const result = await this.run();
      if (result.Items) return result.Items;
      return [];
    } catch (err) {
      throw err;
    }
  }
}
