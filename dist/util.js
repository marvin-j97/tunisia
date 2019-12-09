"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function resolveExpressionNames(str) {
    return str
        .split(".")
        .filter(s => s.length)
        .map(s => `#${s}`)
        .join(".");
}
exports.resolveExpressionNames = resolveExpressionNames;
