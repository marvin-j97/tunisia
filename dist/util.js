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
function resolveExpressionNames(str) {
    return str
        .split(".")
        .filter(s => s.length)
        .map(s => `#${s}`)
        .join(".");
}
exports.resolveExpressionNames = resolveExpressionNames;
function mapAsync(array, callbackfn) {
    return Promise.all(array.map(callbackfn));
}
exports.mapAsync = mapAsync;
function filterAsync(array, callbackfn) {
    return __awaiter(this, void 0, void 0, function* () {
        const filterMap = yield mapAsync(array, callbackfn);
        return array.filter((_, index) => filterMap[index]);
    });
}
exports.filterAsync = filterAsync;
