 [![TypeScript version][ts-badge]][typescript-4-9]
[![Node.js version][nodejs-badge]][nodejs]
[![MIT][license-badge]][license]
[![Node.js CI][gha-badge]][gha-ci]
# Font Range

| ![NJ](https://raw.githubusercontent.com/black7375/font-range/master/resource/News_Japanese.gif) | ![NK](https://raw.githubusercontent.com/black7375/font-range/master/resource/News_Korean.gif) | ![NC](https://raw.githubusercontent.com/black7375/font-range/master/resource/News_Chinese.gif) |
|-------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|

Google Font provides a subset of [Korean](https://design.google/news/google-fonts-launches-korean-support-and-unveils-faster-delivery-system/), [Japanese](https://design.google/news/google-fonts-launches-japanese-supportand-makes-loading-large-fonts-even-faster/), and [Chinese](https://design.google/news/google-fonts-launches-chinese-support/) **Slicing Patterns** through machine learning.

**Font Range** helps you to subset using `unicode range` in Google Fonts.

| ![K0](https://raw.githubusercontent.com/black7375/font-range/master/resource/Korean_0.png) | ![K1](https://raw.githubusercontent.com/black7375/font-range/master/resource/Korean_1.png) |
|--------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------|

![Result](https://raw.githubusercontent.com/black7375/font-range/master/resource/Korean_Japanese.png)

## Usage
### Requires
It has dependencies on the following packages:

```sh
pip install fonttools[ufo,woff,unicode] zopfli brotli
```

### Basics
This project has three types.
- `fontRange()`: Subset based on `unicode-range` in the CSS file.
- `fontSubset()`: Subset based on text or text file.
- `fontPipe()`: Use `fontRange()` and `fontSubset()` to perform multiple subset operations.

```js
// fontRange
fontRange(font_path, css_url_or_path);
fontRange(font_path, css_url_or_path, save_dir);       // Option1
fontRange(font_path, css_url_or_path, { ...options }); // Option2

// fontSubset
fontRange(font_path);
fontRange(font_path, save_dir);       // Option1
fontRange(font_path, { ...options }); // Option2

// fontPipe
fontPipe([
  { font_path },                                      // As `fontSubset(font_path)`
  { font_path, option: { text: "abc" } },             // As `fontSubset(font_path, { text: "abc" })`
  { font_path, option: { textFile: file_path } },     // As `fontSubset(font_path, { textFile: file_path })`
  { font_path, option: { cssFile: css_url_or_path } } // As `fontRange(font_path, css_url_or_path)`
]);
fontPipe([{ font_path1 }, { font_path2 }], "<index>/<total>"); // Sharding option use like `1/2`
```

#### CSS URL?
The URL of [`Noto Sans`](https://www.google.com/get/noto/) is included in the package.

![Noto](https://raw.githubusercontent.com/black7375/font-range/master/resource/Noto_0.png)

```js
const targets = {
  weston:   "https://fonts.googleapis.com/css2?family=Noto+Sans&display=swap",
  korean:   "https://fonts.googleapis.com/css2?family=Noto+Sans+KR&display=swap",
  japanese: "https://fonts.googleapis.com/css2?family=Noto+Sans+JP&display=swap",
  chinese:  "https://fonts.googleapis.com/css2?family=Noto+Sans+SC&display=swap",
  chinese_traditional: "https://fonts.googleapis.com/css2?family=Noto+Sans+TC&display=swap",
};
```

### Default Options

List of options available for all function options.

```ts
type Format = "otf" | "ttf" | "woff2" | "woff" | "woff-zopfli";
interface FontDefaultOptionI {
  saveDir:     string;   // Directory to save the generated subset or downloaded CSS
  format:      Format;   // Subset type to create
  nameFormat:  string;   // File name format to create
  logFormat:   string;   // Log format to print
  defaultArgs: string[]; // `pyftsubset` option - default
  etcArgs:     string[]; // `pyftsubset` option - for users
}
```
- `save_dir`'s default: `<font_path>`
- `format`'s default: `"woff2"`
- `nameFormat`'s default: `"{NAME}_{INDEX}{EXT}"`
- `defaultArgs`'s default:
```js
[
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
]
```
- `etcArgs`'s default: `[]`

### Font Range

It is designed to be able to do a subset using `unicode-range` of CSS.

#### Option

The name of the generated file can be determined from the CSS.

```ts
interface FontRangeOptionI extends FontDefaultOptionI {
  fromCSS: "default" | "srcIndex" | "srcName";
}
```
- `default`: The `index` of the file name increases in the generated order
- `srcIndex`: The `index` of the file name uses [`src`](https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/src) in CSS [#9](https://github.com/black7375/font-range/issues/9)
  - Based on the first `url()`
- `srcName`: The file name uses [`src`](https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/src) in CSS
  - Based on the first `url()`

### Font Subset

It is designed to be able to do a general subset.

#### Option

By default, all letters are included, but you can set the letters to include:

```ts
interface FontSubsetOptionI extends FontDefaultOptionI {
  textFile: string; // From text file
  text:     string; // Letter like `abc`
}
```

### Font Pipe

It offers a simple API when doing a large amount of subsets.

Performance is optimized using worker poll and provides sharding for distributed environments.

#### Option

If `cssFile` has attributes, it is recognized as `fontRange()`.

```ts
interface FontPipeOptionI extends FontRangeOptionI, FontSubsetOptionI {
  cssFile: string;
}
```

#### Sharding

You can control sharing using `argument` or `environment variable`.  
If both values are used together, `argument` is applied first.

- Argument: Explicitly used through function.
```js
fontPipe([{ font_path1 }, { font_path2 }], "<index>/<total>");
```

- Environment Variable: Make it easy to use in CI, npm scripts, ..etc.
```sh
SHARD=<index>/total
node subset.js
```

## License

Licensed under the MIT. See the [LICENSE][license] file for details.

[ts-badge]: https://img.shields.io/badge/TypeScript-4.9-blue.svg
[typescript-4-9]: https://devblogs.microsoft.com/typescript/announcing-typescript-4-9/
[nodejs-badge]: https://img.shields.io/badge/Node.js->=%2016.16-blue.svg
[nodejs]: https://nodejs.org/dist/latest-v18.x/docs/api/
[license-badge]: https://img.shields.io/badge/license-MIT-blue
[license]: https://github.com/black7375/font-range/blob/master/LICENSE
[gha-badge]: https://github.com/black7375/font-range/actions/workflows/nodejs.yml/badge.svg?branch=master
[gha-ci]: https://github.com/black7375/font-range/actions/workflows/nodejs.yml
