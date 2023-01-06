"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const execa_1 = require("@esm2cjs/execa");
function subset(options) {
    return (0, execa_1.execaSync)("pyftsubset", options);
}
exports.default = subset;
