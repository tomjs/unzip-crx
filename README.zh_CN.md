# @tomjs/unzip-crx

[![npm](https://img.shields.io/npm/v/@tomjs/unzip-crx)](https://www.npmjs.com/package/@tomjs/unzip-crx) ![node-current (scoped)](https://img.shields.io/node/v/@tomjs/unzip-crx) ![NPM](https://img.shields.io/npm/l/@tomjs/unzip-crx) [![jsDocs.io](https://img.shields.io/badge/jsDocs.io-reference-blue)](https://www.jsdocs.io/package/@tomjs/unzip-crx)

[English](./README.md) | **中文**

> 解压 Chrome 插件文件

如果你想解压 [Chrome扩展文件](https://developer.chrome.com/extensions) (\*.crx)，你可能会遇到你的解压库声称文件头格式错误的问题。这是由于Chrome为识别crx文件 [添加了一些额外的信息](https://developer.chrome.com/extensions/crx)。`unzip-crx` 处理这些额外的标头，并像往常一样解压缩。

本库是基于 [Peerigon](https://github.com/peerigon) 的 [unzip-crx](https://github.com/peerigon/unzip-crx) 做了简单的修改，增加了 `esm` 和 `cjs` 支持。

而这个 [unzip-crx](https://github.com/peerigon/unzip-crx) 深受 [abarreir](https://github.com/abarreir) 的 [crx2ff](https://github.com/abarreir/crx2ff) 和 [Rob Wu](https://github.com/Rob--W) 的[crxviewer](https://github.com/Rob--W/crxviewer) 的启发，谢谢！

## 安装

```bash
# pnpm
pnpm add @tomjs/unzip-crx

# yarn
yarn add @tomjs/unzip-crx

# npm
npm add @tomjs/unzip-crx
```

## 示例

- `esm`

```js
import unzip from 'unzip-crx';

const crxFile = './this-chrome-extension.crx';

unzip(crxFile).then(() => {
  console.log('Successfully unzipped your crx file..');
});
```

- `cjs`

```js
const unzip = require('unzip-crx');

const crxFile = './this-chrome-extension.crx';

unzip(crxFile).then(() => {
  console.log('Successfully unzipped your crx file..');
});
```

## 文档

- [jsdocs.io](https://www.jsdocs.io) 提供的 [API 文档](https://www.jsdocs.io/package/@tomjs/unzip-crx).
- [unpkg.com](https://www.unpkg.com/) 提供的 [index.d.ts](https://www.unpkg.com/browse/@tomjs/unzip-crx/dist/index.d.ts).

## API

### unzip(file[, destination])

- file: string,指向要解压的文件路径
- destination: string,指向目标文件夹的路径（可选）

如果文件成功解压缩，则解析Promise；否则抛出异常（使用.catch()）。
