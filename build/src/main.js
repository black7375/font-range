"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fontRange = exports.getUnicodeRanges = exports.targets = void 0;
const tslib_1 = require("tslib");
const path_1 = require("path");
const fs_1 = require("fs");
const promises_1 = require("fs/promises");
const node_fetch_1 = tslib_1.__importStar(require("node-fetch"));
const css_tree_1 = require("css-tree");
const child_process_1 = require("child_process");
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
function getDefaultOptions() {
    return {
        format: "woff2",
        nameFormat: "{NAME}_{INDEX}{EXT}",
        defaultArgs: "--layout-features='*' \
                  --glyph-names \
                  --symbol-cmap \
                  --legacy-cmap \
                  --notdef-glyph \
                  --notdef-outline \
                  --recommended-glyphs \
                  --name-legacy \
                  --drop-tables= \
                  --name-IDs='*' \
                  --name-languages='*'",
        etcArgs: ""
    };
}
function getOption(options, key, alterValue) {
    return Object.prototype.hasOwnProperty.call(options, key)
        ? options[key]
        : alterValue;
}
function getName(nameFormat, fontName, index, fontExt) {
    return nameFormat
        .replace("{NAME}", fontName)
        .replace("{INDEX}", index.toString())
        .replace("{EXT}", fontExt);
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
    return "--flavor='" + ((format === "woff-zopfli")
        ? formatName + "' --with-zopfli "
        : formatName + "' ");
}
function fontRange(url = exports.targets.korean, fontPath = "", fontRangeOption) {
    const options = Object.assign(getDefaultOptions(), typeof (fontRangeOption) === 'string'
        ? { savePath: fontRangeOption }
        : fontRangeOption);
    const format = options.format;
    const pathInfo = (0, path_1.parse)(fontPath);
    const fontDir = pathInfo.dir;
    const fontName = pathInfo.name;
    const fontExt = formatOption(format);
    const dirPath = getOption(options, 'savePath', fontDir);
    const ranges = getUnicodeRanges(dirPath, url);
    const convertOption = formatOption(format, false);
    const defaultOption = options.defaultArgs;
    const etcOption = options.etcArgs;
    const nameFormat = options.nameFormat;
    return ranges.then(eachRanges => eachRanges.map((unicodes, i) => {
        const saveOption = "--output-file='" +
            (0, path_1.join)(dirPath, getName(nameFormat, fontName, i, fontExt)) + "' ";
        const unicodeRanges = unicodes.split(', ').join(',');
        const unicodeOption = "--unicodes='" + unicodeRanges + "' ";
        const options = " '" + fontPath + "' " + saveOption + unicodeOption
            + convertOption + defaultOption + etcOption;
        return (0, child_process_1.execSync)("pyftsubset" + options);
    }));
}
exports.fontRange = fontRange;
//# sourceMappingURL=main.js.map