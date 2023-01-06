"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fontPipe = exports.fontSubset = exports.fontRange = exports.defaultArgs = exports.getUnicodeRanges = exports.targets = void 0;
const tslib_1 = require("tslib");
const path_1 = require("path");
const fs_1 = require("fs");
const promises_1 = require("fs/promises");
const piscina_1 = tslib_1.__importDefault(require("piscina"));
const node_fetch_1 = tslib_1.__importStar(require("@esm2cjs/node-fetch"));
const css_tree_1 = require("css-tree");
class Worker {
    constructor() { }
    static getInstance() {
        if (!Worker.instance) {
            Worker.instance = new piscina_1.default({
                filename: (0, path_1.join)(process.cwd(), "build", "worker.js")
            });
        }
        return Worker.instance;
    }
}
exports.targets = {
    weston: "https://fonts.googleapis.com/css2?family=Noto+Sans&display=swap",
    korean: "https://fonts.googleapis.com/css2?family=Noto+Sans+KR&display=swap",
    japanese: "https://fonts.googleapis.com/css2?family=Noto+Sans+JP&display=swap",
    chinese: "https://fonts.googleapis.com/css2?family=Noto+Sans+SC&display=swap",
    chinese_traditional: "https://fonts.googleapis.com/css2?family=Noto+Sans+TC&display=swap",
};
function getFontName(url) {
    const encodedURL = decodeURI(url);
    const urlObj = new URL(encodedURL);
    const urlParams = urlObj.searchParams;
    const fontName = urlParams.get("family");
    return fontName;
}
function validURL(str) {
    const pattern = new RegExp("^(https?:\\/\\/)?" +
        "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" +
        "((\\d{1,3}\\.){3}\\d{1,3}))" +
        "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" +
        "(\\?[;&a-z\\d%_.~+=-]*)?" +
        "(\\#[-a-z\\d_]*)?$", "i");
    return !!pattern.test(str);
}
function getCSSPath(dirPath, url) {
    if (validURL(url)) {
        const fontName = getFontName(url);
        const cssPath = (0, path_1.join)(dirPath, fontName + ".css");
        return cssPath;
    }
    if (!(0, fs_1.existsSync)(url)) {
        throw new Error(url + "Not vaild URL or PATH");
    }
    return url;
}
function saveCSS(path, url) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const version = "109.0";
        const headers = new node_fetch_1.Headers({
            "Accept": "text/html,application/xhtml+xml,application/xml;",
            "User-Agent": `Mozilla/5.0 (Windows NT 10.0; rv:${version}) Gecko/20100101 Firefox/${version}`
        });
        const res = yield (0, node_fetch_1.default)(url, {
            method: "GET",
            headers: headers
        });
        const fileStream = (0, fs_1.createWriteStream)(path);
        yield new Promise((resolve, reject) => {
            res.body.pipe(fileStream);
            res.body.on("error", (err) => {
                console.log("File write Error.");
                reject(err);
            });
            fileStream.on("finish", function () {
                resolve();
            });
        });
    });
}
function readCSS(path) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            const readData = [];
            (0, fs_1.createReadStream)(path)
                .on("data", (data) => {
                readData.push(data);
            })
                .on("end", () => {
                const css = readData.join("");
                resolve(css);
            })
                .on("error", reject);
        });
    });
}
const parseOptions = {
    parseAtrulePrelude: false,
    parseRulePrelude: false,
    parseValue: false
};
function loadAST(dirPath, url = exports.targets.korean, parseOption = parseOptions) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const cssPath = getCSSPath(dirPath, url);
        if (!(0, fs_1.existsSync)(dirPath)) {
            yield (0, promises_1.mkdir)(dirPath);
        }
        if (!(0, fs_1.existsSync)(cssPath)) {
            yield saveCSS(cssPath, url);
        }
        const css = yield readCSS(cssPath);
        const ast = (0, css_tree_1.parse)(css, parseOption);
        return ast;
    });
}
function getUnicodeRanges(dirPath = "src", url = exports.targets.korean) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const ast = yield loadAST(dirPath, url);
        const unicodeNodes = (0, css_tree_1.findAll)(ast, (node, _item, _list) => {
            return (node.type === "Declaration" &&
                node.property === "unicode-range");
        });
        const unicodeRanges = unicodeNodes.reduce((unicodeRanges, node) => {
            const nodeValue = node.value;
            if (nodeValue.type === "Raw") {
                unicodeRanges.push(nodeValue.value);
            }
            return unicodeRanges;
        }, []);
        return unicodeRanges;
    });
}
exports.getUnicodeRanges = getUnicodeRanges;
exports.defaultArgs = [
    "--layout-features=*",
    "--glyph-names",
    "--symbol-cmap",
    "--legacy-cmap",
    "--notdef-glyph",
    "--notdef-outline",
    "--recommended-glyphs",
    "--name-legacy",
    "--drop-tables=",
    "--name-IDs=*",
    "--name-languages=*"
];
function getDefaultOptions() {
    return {
        format: "woff2",
        nameFormat: "{NAME}_{INDEX}{EXT}",
        logFormat: "Convert {ORIGIN} -> {OUTPUT}",
        defaultArgs: exports.defaultArgs,
        etcArgs: []
    };
}
function getFormat(format) {
    switch (format) {
        case "otf": return "otf";
        case "ttf": return "ttf";
        case "woff2": return "woff2";
        case "woff": return "woff";
        case "woff-zopfli": return "woff";
        default: return "woff2";
    }
}
function formatOption(format, ext = true) {
    const formatName = getFormat(format);
    if (ext)
        return "." + formatName;
    if (format === "otf" || format === "ttf")
        return "";
    return "--flavor=" + ((format === "woff-zopfli")
        ? formatName + " --with-zopfli"
        : formatName);
}
function getOptionInfos(fontPath = "", fontOption) {
    const options = Object.assign(getDefaultOptions(), typeof (fontOption) === "string"
        ? { savePath: fontOption }
        : fontOption);
    const format = options.format;
    const pathInfo = (0, path_1.parse)(fontPath);
    const fontDir = pathInfo.dir;
    const fontBase = pathInfo.base;
    const fontName = pathInfo.name;
    const fontExt = formatOption(format);
    const dirPath = Object.prototype.hasOwnProperty.call(options, "savePath") ? options["savePath"] : fontDir;
    const nameFormat = options.nameFormat;
    const logFormat = options.logFormat;
    const convertOption = formatOption(format, false);
    const defaultOption = options.defaultArgs;
    const etcOption = options.etcArgs;
    const baseOption = [convertOption, ...defaultOption, ...etcOption];
    const worker = Worker.getInstance();
    return {
        fontBase,
        fontName,
        fontExt,
        dirPath,
        nameFormat,
        logFormat,
        baseOption,
        worker
    };
}
function getFileName(nameFormat, fontName, fontExt, index) {
    return nameFormat
        .replace("{NAME}", fontName)
        .replace("{EXT}", fontExt)
        .replace("{INDEX}", (typeof index === "number")
        ? index.toString()
        : (typeof index === "string")
            ? index
            : "");
}
function getConsoleLog(logFormat, origin, output) {
    return logFormat
        .replace("{ORIGIN}", origin)
        .replace("{OUTPUT}", output);
}
function getSaveOption(dirPath, nameFormat, fontName, fontExt, index) {
    const fileName = getFileName(nameFormat, fontName, fontExt, index);
    return ("--output-file=" + (0, path_1.join)(dirPath, fileName));
}
function getSubsetOption(fontSubsetOption) {
    if (typeof fontSubsetOption !== "undefined" &&
        typeof fontSubsetOption !== "string") {
        if ("textFile" in fontSubsetOption) {
            return ("--text-file=" + fontSubsetOption.textFile);
        }
        if ("text" in fontSubsetOption) {
            return ("--text=" + fontSubsetOption.text);
        }
    }
    return "--glyphs=*";
}
function consoleLog(fontBase, fontName, fontExt, nameFormat, logFormat, index) {
    if (logFormat !== "") {
        const output = getFileName(nameFormat, fontName, fontExt, index);
        const log = getConsoleLog(logFormat, fontBase, output);
        console.log(log);
    }
}
function fontRange(url = exports.targets.korean, fontPath = "", fontRangeOption) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const { fontBase, fontName, fontExt, dirPath, nameFormat, logFormat, baseOption, worker } = getOptionInfos(fontPath, fontRangeOption);
        consoleLog(fontBase, fontName, fontExt, nameFormat, logFormat, "n");
        const ranges = yield getUnicodeRanges(dirPath, url);
        const result = ranges.map((unicodes, i) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            const saveOption = getSaveOption(dirPath, nameFormat, fontName, fontExt, i);
            const unicodeRanges = unicodes.split(", ").join(",");
            const unicodeOption = "--unicodes=" + unicodeRanges;
            const options = [fontPath, saveOption, unicodeOption, ...baseOption];
            const result = yield worker.run(options);
            return result;
        }));
        return Promise.all(result);
    });
}
exports.fontRange = fontRange;
function fontSubset(fontPath = "", fontSubsetOption) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const { fontBase, fontName, fontExt, dirPath, nameFormat, logFormat, baseOption, worker } = getOptionInfos(fontPath, fontSubsetOption);
        consoleLog(fontBase, fontName, fontExt, nameFormat, logFormat);
        const subsetOption = getSubsetOption(fontSubsetOption);
        const saveOption = getSaveOption(dirPath, nameFormat, fontName, fontExt);
        const options = [fontPath, saveOption, subsetOption, ...baseOption];
        const result = yield worker.run(options);
        return result;
    });
}
exports.fontSubset = fontSubset;
function fontPipeExec(subsetTarget) {
    const { fontPath, fontPipeOption } = subsetTarget;
    return ((typeof fontPipeOption !== "undefined") &&
        (typeof fontPipeOption.cssFile !== "undefined"))
        ? fontRange(fontPipeOption.cssFile, fontPath, fontPipeOption)
        : fontSubset(fontPath, fontPipeOption);
}
function fontPipe(subsetList) {
    const result = subsetList.map(fontPipeExec);
    return Promise.all(result);
}
exports.fontPipe = fontPipe;
