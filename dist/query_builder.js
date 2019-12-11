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
const index_1 = require("./index");
const util_1 = require("./util");
var ExpressionTarget;
(function (ExpressionTarget) {
    ExpressionTarget[ExpressionTarget["KEY_CONDITION"] = 0] = "KEY_CONDITION";
    ExpressionTarget[ExpressionTarget["FILTER_EXPRESSION"] = 1] = "FILTER_EXPRESSION";
})(ExpressionTarget || (ExpressionTarget = {}));
var SortDirection;
(function (SortDirection) {
    SortDirection["ASC"] = "asc";
    SortDirection["DESC"] = "desc";
})(SortDirection || (SortDirection = {}));
class QueryBuilder {
    constructor(tableName, root) {
        this.keyConditionExpression = [];
        this.filterExpression = [];
        this.expressionAttributeNames = {};
        this.expressionAttributeValues = {};
        this.projections = [];
        this.expressionValueNameCounter = 0;
        this.expressionTarget = ExpressionTarget.KEY_CONDITION;
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
    key() {
        this.expressionTarget = ExpressionTarget.KEY_CONDITION;
        return this;
    }
    filter() {
        this.expressionTarget = ExpressionTarget.FILTER_EXPRESSION;
        return this;
    }
    comparison(name, val, operator) {
        const expressionNames = util_1.resolveExpressionNames(name);
        const expressionValueName = `value${this.expressionValueNameCounter++}`;
        const expr = `${expressionNames} ${operator} :${expressionValueName}`;
        if (this.expressionTarget == ExpressionTarget.KEY_CONDITION) {
            this.keyConditionExpression.push(expr);
        }
        else {
            this.filterExpression.push(expr);
        }
        for (const expressionName of expressionNames.split(".")) {
            this.expressionAttributeNames[expressionName] = expressionName.replace("#", "");
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
    beginsWith(name, substr) {
        return this.startsWith(name, substr);
    }
    startsWith(name, substr) {
        const expressionNames = util_1.resolveExpressionNames(name);
        for (const expressionName of expressionNames.split(".")) {
            this.expressionAttributeNames[expressionName] = expressionName.replace("#", "");
        }
        const valueName = `value${this.expressionValueNameCounter++}`;
        this.expressionAttributeValues[`:${valueName}`] = substr;
        const expr = `begins_with(${expressionNames}, :${valueName})`;
        if (this.expressionTarget == ExpressionTarget.KEY_CONDITION) {
            this.keyConditionExpression.push(expr);
        }
        else {
            this.filterExpression.push(expr);
        }
        return this;
    }
    between(name, valA, valB) {
        const expressionNames = util_1.resolveExpressionNames(name);
        for (const expressionName of expressionNames.split(".")) {
            this.expressionAttributeNames[expressionName] = expressionName.replace("#", "");
        }
        const valAName = `value${this.expressionValueNameCounter++}`;
        const valBName = `value${this.expressionValueNameCounter++}`;
        this.expressionAttributeValues[`:${valAName}`] = valA;
        this.expressionAttributeValues[`:${valBName}`] = valB;
        const expr = `${expressionNames} BETWEEN :${valAName} AND :${valBName}`;
        if (this.expressionTarget == ExpressionTarget.KEY_CONDITION) {
            this.keyConditionExpression.push(expr);
        }
        else {
            this.filterExpression.push(expr);
        }
        return this;
    }
    and() {
        if (this.expressionTarget == ExpressionTarget.KEY_CONDITION) {
            this.keyConditionExpression.push(`and`);
        }
        else {
            this.filterExpression.push(`and`);
        }
        return this;
    }
    or() {
        if (this.expressionTarget == ExpressionTarget.KEY_CONDITION) {
            this.keyConditionExpression.push(`or`);
        }
        else {
            this.filterExpression.push(`or`);
        }
        return this;
    }
    asc() {
        this.scanIndexForward = true;
        return this;
    }
    desc() {
        this.scanIndexForward = false;
        return this;
    }
    sort(dir) {
        if (dir == SortDirection.ASC)
            this.asc();
        else
            this.desc();
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
            KeyConditionExpression: this.keyConditionExpression.join(" "),
            FilterExpression: this.filterExpression.join(" ") || undefined,
            ExpressionAttributeNames: this.expressionAttributeNames,
            ExpressionAttributeValues: this.expressionAttributeValues,
            ExclusiveStartKey: this.startKey,
            Limit: this.limitItems,
            ScanIndexForward: this.scanIndexForward,
            ProjectionExpression: this.projections.join(",") || undefined
        };
    }
    exec() {
        return this.run();
    }
    run() {
        return this.$tunisia
            .getClient()
            .query(this.params())
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
                items = slice;
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
                    const queryResult = yield this.$tunisia
                        .getClient()
                        .query(params)
                        .promise();
                    const result = yield onItems(queryResult.Items || [], queryResult.LastEvaluatedKey);
                    if (result === index_1.STOP)
                        return;
                    if (queryResult.LastEvaluatedKey) {
                        params.ExclusiveStartKey = queryResult.LastEvaluatedKey;
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
                const item = (yield this.get())[0];
                return item;
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
exports.QueryBuilder = QueryBuilder;
