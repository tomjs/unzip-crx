# @tomjs/unzip-crx

[![npm](https://img.shields.io/npm/v/@tomjs/unzip-crx)](https://www.npmjs.com/package/@tomjs/unzip-crx) ![node-current (scoped)](https://img.shields.io/node/v/@tomjs/unzip-crx) ![NPM](https://img.shields.io/npm/l/@tomjs/unzip-crx) [![Docs](https://www.paka.dev/badges/v0/cute.svg)](https://www.paka.dev/npm/@tomjs/unzip-crx)

> Unzip chrome extension files

If you want to unzip [Chrome extension files](https://developer.chrome.com/extensions) (\*.crx) you might have the problem that your unzip lib claims that the file header is malformed. This is due to that Chrome [adds some extra information](https://developer.chrome.com/extensions/crx) for identifying crx files. `unzip-crx` handles those additional headers and unzips as usual.

This library is based on [Peerigon](https://github.com/peerigon)'s [unzip-crx](https://github.com/peerigon/unzip-crx), which makes simple modifications and adds `esm` and `cjs` support.

And this [unzip-crx](https://github.com/peerigon/unzip-crx) is highly inspired by [crx2ff](https://github.com/abarreir/crx2ff) from [abarreir](https://github.com/abarreir) and [crxviewer](https://github.com/Rob--W/crxviewer) from [Rob Wu](https://github.com/Rob--W), thanks!

**English** | [中文](./README.zh_CN.md)

## Install

With `pnpm`

```bash
pnpm add @tomjs/unzip-crx
```

With `yarn`

```bash
yarn add @tomjs/unzip-crx
```

With `npm`

```bash
npm i @tomjs/unzip-crx
```

## Example

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

## Documentation

- [paka.dev](https://paka.dev) 提供的 [API文档](https://paka.dev/npm/@tomjs/unzip-crx).
- [unpkg.com](https://www.unpkg.com/) 提供的 [index.d.ts](https://www.unpkg.com/browse/@tomjs/unzip-crx/dist/index.d.ts).

## API

### unzip(file[, destination])

- `file`: string, the path to the file to unzip
- `destination`: string, the path to the destination folder (optional)

Resolves with a Promise if the file was unzipped successfully, throws otherwise (use `.catch()`).
