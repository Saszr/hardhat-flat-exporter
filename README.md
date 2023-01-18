[![npm version](https://badge.fury.io/js/hardhat-flat-exporter.svg)](https://badge.fury.io/js/hardhat-flat-exporter)
[![Build Status](https://travis-ci.org/cgewecke/hardhat-flat-exporter.svg?branch=master)](https://travis-ci.org/cgewecke/hardhat-flat-exporter)
[![buidler](https://hardhat.org/buidler-plugin-badge.svg?1)](https://github.com/cgewecke/hardhat-flat-exporter)

# hardhat-flat-exporter

Export flat contract on compilation via Hardhat.

> 👾 Additional supplement to the official **flatten** command

## Installation

```bash
npm install --save-dev hardhat-flat-exporter
# or
yarn add --dev hardhat-flat-exporter
```

And add the following to your `hardhat.config.js`:

```js
require("hardhat-flat-exporter");
```

Or, if you are using TypeScript, add this to your hardhat.config.ts:

```ts
import "hardhat-flat-exporter";
```

## Configuration

Configuration is optional.

```js
module.exports = {
  flattenExporter: {
    src: "./contracts",
    path: "./flat",
    clear: true,
  },
};
```

### Options

| option  | description                                                    | default         |
| ------- | -------------------------------------------------------------- | --------------- |
| `src`   | folder path of the target contracts (relative to Hardhat root) | `'./contracts'` |
| `path`  | path to flat sol export directory (relative to Hardhat root)   | `'./flat'`      |
| `clear` | whether to delete old flat sol files in `path` on compilation  | `true`          |

## Usage

The included Hardhat tasks may be run manually:

```bash
npx hardhat export-flat
# or
yarn run hardhat export-flat
```
