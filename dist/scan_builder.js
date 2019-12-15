"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("./util");
const index_1 = require("./index");
class ScanBuilder {
    constructor(tableName, root) {
        this.filterExpression = [];
        this.expressionAttributeNames = {};
        this.expressionAttributeValues = {};
        this.projections = [];
        this.expressionValueNameCounter = 0;
        this.tableName = tableName;
        this.$tunisia = root;
    }
    pick(input) {
        return this.project(input);
    }
    project(input) {
        let expressionNames = [];
        if (Array.isArray(input)) {
            expressionNames = input.map(util_1.resolveExpressionNames);
        }
        else {
            expressionNames = input
                .split(",")
                .map(s => util_1.resolveExpressionNames(s.trim()));
        }
        this.projections.push(...expressionNames);
        for (const name of expressionNames) {
            for (const expressionName of name.split(".")) {
                this.expressionAttributeNames[expressionName] = expressionName.replace("#", "");
            }
        }
        return this;
    }
    index(indexName) {
        this.indexName = indexName;
        return this;
    }
    comparison(name, val, operator) {
        const expressionNames = util_1.resolveExpressionNames(name);
        const expressionValueName = `value${this.expressionValueNameCounter++}`;
        this.filterExpression.push(`${expressionNames} ${operator} :${expressionValueName}`);
        for (const expressionName of expressionNames.split(".")) {
            this.expressionAttributeNames[`${expressionName}`] = expressionName.replace("#", "");
        }
        this.expressionAttributeValues[`:${expressionValueName}`] = val;
        return this;
    }
    eq(name, val) {
        return this.comparison(name, val, "=");
    }
    neq(name, val) {
        return this.comparison(name, val, "<>");
    }
    gte(name, val) {
        return this.comparison(name, val, ">=");
    }
    lte(name, val) {
        return this.comparison(name, val, "<=");
    }
    lt(name, val) {
        return this.comparison(name, val, "<");
    }
    gt(name, val) {
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
    limit(limit) {
        this.limitItems = limit;
        return this;
    }
    startAt(startKey) {
        this.startKey = startKey;
        return this;
    }
    params() {
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
    run() {
        return this.$tunisia
            .getClient()
            .scan(this.params())
            .promise();
    }
    all() {
        return __awaiter(this, void 0, void 0, function* () {
            const items = [];
            yield this.recurse((slice) => __awaiter(this, void 0, void 0, function* () {
                items.push(...slice);
            }));
            return items;
        });
    }
    page(size) {
        return __awaiter(this, void 0, void 0, function* () {
            let items = [];
            let returnKey = undefined;
            yield this.recurse((slice, key) => __awaiter(this, void 0, void 0, function* () {
                items.push(...slice);
                returnKey = key;
                if (size) {
                    if (items.length >= size) {
                        return index_1.STOP;
                    }
                }
                else {
                    return index_1.STOP;
                }
            }));
            return { items, key: returnKey };
        });
    }
    recurse(onItems) {
        return __awaiter(this, void 0, void 0, function* () {
            const inner = (params) => __awaiter(this, void 0, void 0, function* () {
                try {
                    const scanResult = yield this.$tunisia
                        .getClient()
                        .scan(params)
                        .promise();
                    const result = yield onItems(scanResult.Items || [], scanResult.LastEvaluatedKey);
                    if (result === index_1.STOP)
                        return;
                    if (scanResult.LastEvaluatedKey) {
                        params.ExclusiveStartKey = scanResult.LastEvaluatedKey;
                        yield inner(params);
                    }
                }
                catch (err) {
                    throw err;
                }
            });
            yield inner(this.params());
        });
    }
    first() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return (yield this.get())[0];
            }
            catch (err) {
                throw err;
            }
        });
    }
    get() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.run();
                if (result.Items)
                    return result.Items;
                return [];
            }
            catch (err) {
                throw err;
            }
        });
    }
}
exports.ScanBuilder = ScanBuilder;
