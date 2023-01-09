"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fontPipe = exports.fontSubset = exports.fontRange = exports.defaultArgs = exports.parseCSS = exports.targets = void 0;
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
                filename: (0, path_1.join)(__dirname, "../", "build", "worker.js")
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
        throw new Error("Not vaild URL or PATH: " + url);
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
        if (res.status !== 200) {
            throw new Error("Not vaild URL: " + url);
        }
        return new Promise((resolve, reject) => {
            const fileStream = (0, fs_1.createWriteStream)(path);
            res.body.pipe(fileStream);
            res.body.on("error", (err) => {
                console.log("File write Error.");
                reject(err);
            });
            res.body.on("close", () => {
                fileStream.close();
            });
            fileStream.on("close", () => {
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
        return (0, css_tree_1.parse)(css, parseOption);
    });
}
function setBlock(block, elem, property) {
    if (elem.property === property) {
        if (elem.value.type === "Raw") {
            block[property] = elem.value.value;
        }
    }
}
function parseCSS(dirPath = "src", url = exports.targets.korean) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const ast = yield loadAST(dirPath, url);
        const parsed = [];
        (0, css_tree_1.walk)(ast, { visit: "Atrule", enter(node) {
                if (node.name === "font-face") {
                    const block = {
                        src: "",
                        unicodes: ""
                    };
                    (0, css_tree_1.walk)(node, { visit: "Declaration", enter(elem) {
                            setBlock(block, elem, "src");
                            setBlock(block, elem, "unicode-range");
                        } });
                    if (block.src !== "" || block.unicodes !== "") {
                        parsed.push(block);
                    }
                }
            } });
        return parsed;
    });
}
exports.parseCSS = parseCSS;
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
    }
}
function formatOption(format) {
    const formatName = getFormat(format);
    if (format === "otf" || format === "ttf")
        return [""];
    return [
        "--flavor=" + formatName,
        (format === "woff-zopfli") ? "--with-zopfli" : ""
    ];
}
function getOptionInfos(fontPath = "", fontOption) {
    const options = Object.assign({ fromCSS: "default" }, getDefaultOptions(), typeof (fontOption) === "string"
        ? { saveDir: fontOption }
        : fontOption);
    const format = options.format;
    const pathInfo = (0, path_1.parse)(fontPath);
    const fontDir = pathInfo.dir;
    const fontBase = pathInfo.base;
    const fontName = pathInfo.name;
    const fontExt = "." + getFormat(format);
    const dirPath = Object.prototype.hasOwnProperty.call(options, "saveDir") ? options["saveDir"] : fontDir;
    const nameFormat = options.nameFormat;
    const logFormat = options.logFormat;
    const convertOption = formatOption(format);
    const defaultOption = options.defaultArgs;
    const etcOption = options.etcArgs;
    const baseOption = [
        ...convertOption,
        ...defaultOption,
        ...etcOption
    ].filter(option => option !== "");
    const worker = Worker.getInstance();
    return {
        fontBase,
        fontName,
        fontExt,
        dirPath,
        nameFormat,
        logFormat,
        baseOption,
        worker,
        fromCSS: options.fromCSS
    };
}
function fileNameInit(nameFormat, fontName, fontExt) {
    return nameFormat
        .replace("{NAME}", fontName)
        .replace("{EXT}", fontExt);
}
function getFileName(initName, index) {
    return initName
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
function getSaveOption(dirPath, initName, index) {
    const fileName = getFileName(initName, index);
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
function initWithLog(dirPath, fontBase, fontName, fontExt, nameFormat, logFormat, index) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const initName = fileNameInit(nameFormat, fontName, fontExt);
        if (!(0, fs_1.existsSync)(dirPath))
            yield (0, promises_1.mkdir)(dirPath);
        if (logFormat !== "") {
            const output = getFileName(initName, index);
            const log = getConsoleLog(logFormat, fontBase, output);
            console.log(log);
        }
        return initName;
    });
}
function getSrcInfo(src) {
    const first = src.split(",").find((str) => {
        return str.indexOf("url(") === 0;
    });
    if (typeof first === "undefined")
        return {
            base: "",
            index: 0
        };
    const reStr = "url\\(";
    const reMdl = "(.+?)";
    const reEnd = "\\)";
    const quote = "(\\\\?['\"])?";
    const regex = new RegExp(reStr + quote + reMdl + quote + reEnd);
    const urlContent = first.match(regex)[2];
    const parsedURL = (0, path_1.parse)(urlContent);
    return {
        base: parsedURL.base,
        index: parseInt(parsedURL.name.split(".").pop())
    };
}
function fontRange(fontPath = "", url = exports.targets.korean, fontRangeOption) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const { fontBase, fontName, fontExt, dirPath, nameFormat, logFormat, baseOption, worker, fromCSS } = getOptionInfos(fontPath, fontRangeOption);
        const initName = yield initWithLog(dirPath, fontBase, fontName, fontExt, nameFormat, logFormat, "n");
        const ranges = yield parseCSS(dirPath, url);
        const result = ranges.map(({ src, unicodes }, i) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            const srcInfo = getSrcInfo(src);
            const saveOption = getSaveOption(dirPath, (fromCSS === "srcName" && srcInfo.base !== "")
                ? srcInfo.base
                : initName, (fromCSS === "srcIndex" && srcInfo.base !== "")
                ? srcInfo.index
                : i);
            const unicodeRanges = unicodes.split(", ").join(",");
            const unicodeOption = "--unicodes=" + unicodeRanges;
            const options = [fontPath, saveOption, unicodeOption, ...baseOption];
            const result = yield worker.run(options);
            return result;
        }));
        return yield Promise.all(result);
    });
}
exports.fontRange = fontRange;
function fontSubset(fontPath = "", fontSubsetOption) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const { fontBase, fontName, fontExt, dirPath, nameFormat, logFormat, baseOption, worker } = getOptionInfos(fontPath, fontSubsetOption);
        const initName = yield initWithLog(dirPath, fontBase, fontName, fontExt, nameFormat, logFormat);
        const subsetOption = getSubsetOption(fontSubsetOption);
        const saveOption = getSaveOption(dirPath, initName);
        const options = [fontPath, saveOption, subsetOption, ...baseOption];
        const result = yield worker.run(options);
        return result;
    });
}
exports.fontSubset = fontSubset;
function fontPipeExec(subsetTarget) {
    const { fontPath, option } = subsetTarget;
    return ((typeof option !== "undefined") &&
        (typeof option.cssFile !== "undefined"))
        ? fontRange(fontPath, option.cssFile, option)
        : fontSubset(fontPath, option);
}
function shardNum(shardStr, content) {
    const num = Math.abs(parseInt(shardStr, 10));
    if (isNaN(num) || num <= 0) {
        throw new Error("<" + content + "> must be a positive number");
    }
    return num;
}
function getShardInfo(shardEnv) {
    const [indexStr, totalStr] = shardEnv.split("/");
    const index = shardNum(indexStr, "index");
    const total = shardNum(totalStr, "total");
    if (index > total) {
        throw new Error("<index> must be less then <total>");
    }
    return [index, total];
}
function fontPipe(subsetList, shard) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const shardEnv = (typeof shard === "object" && typeof shard.shard === "string")
            ? shard.shard
            : (typeof shard === "object" || typeof shard === "undefined")
                ? process.env.SHARD || "1/1"
                : shard;
        const shardFormat = (typeof shard === "object" && typeof shard.shardFormat === "string")
            ? shard.shardFormat
            : "== {START}/{END} ==========";
        const [index, total] = getShardInfo(shardEnv);
        const shardSize = Math.ceil(subsetList.length / total);
        const shardStart = shardSize * (index - 1);
        const shardEnd = shardSize * index;
        if (shardEnv !== "1/1") {
            const shardMsg = shardFormat
                .replace("{START}", index.toString())
                .replace("{END}", total.toString());
            console.log(shardMsg);
        }
        const result = subsetList
            .slice(shardStart, shardEnd)
            .map(fontPipeExec);
        return yield Promise.all(result);
    });
}
exports.fontPipe = fontPipe;
