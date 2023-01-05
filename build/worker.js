"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
function subset(options) {
    return (0, child_process_1.execSync)("pyftsubset" + options);
}
exports.default = subset;
