# wikirefs

[![A WikiBonsai Project](https://img.shields.io/badge/%F0%9F%8E%8B-A%20WikiBonsai%20Project-brightgreen)](https://github.com/wikibonsai/wikibonsai)
[![NPM package](https://img.shields.io/npm/v/wikirefs)](https://npmjs.org/package/wikirefs)

<p align="center">
  <img src="./wikirefs.svg" width="300" height="300"/>
</p>

A collection of utilities to parse, process, and edit `[[wikirefs]]`.

🕸 Weave a semantic web in your [🎋 WikiBonsai](https://github.com/wikibonsai/wikibonsai) digital garden.

## Install

Install with [npm](https://docs.npmjs.com/cli/v9/commands/npm-install):

```
npm install wikirefs
```

## Use

```js
import * as wikirefs from 'wikirefs';

let res = wikirefs.scan('[[wikilink]]');
```

## Syntax

See [`./spec`](https://github.com/wikibonsai/wikirefs/tree/main/spec) for syntax spec (esp. the `README.md`).

## Function API

Function utilities for editting `[[wikirefs]]`.

See [`./src/lib/func`](https://github.com/wikibonsai/wikirefs/tree/main/src/lib/func/) for more on functions.

### `mkdnToWiki(content: string, opts?: ConvertOpts): string`

In the given `content` string, convert `[markdown](links)` to `[[wikirefs]]` and `![markdown](img-embeds)` to `![[wikiembed-images]]`. File extensions are preserved for media.

Options:

`opts.kind: 'wikiref' | 'wikilink' | 'wikiembed'`: target specific wikiref constructs for conversion (`attr`s are implicitly included in `link`s).

`opts.format: 'filename' | 'relative' | 'absolute'`: how to format markdown link uris based on wikiref filenames: use a slugified filename, relative path, or absolute path of the file (paths rely on `uriToFnameHash` option to be provided).

`opts.uriToFnameHash: Record<string, string>`: a hash table explicitly defining what uri maps to what filename.

### `renameFileName(oldFileName: string, newFileName: string, content: string): string`

For all references in a given `content` string which point to an `oldFileName` and rename them to the `newFileName`; ignores escaped instances.

#### Parameters

##### `oldFileName: string`

The old filename string to be removed.

##### `newFileName: string`

The new filename string to be added.

##### `content: string`

The content string to make the file rename.

### `retypeRefType(oldRefType: string, newRefType: string, content: string): string`

For all reference types in a given `content` string which match the given `oldRefType`, rename them to `newRefType`; ignores escaped instances.

Since 'reftypes' contain 'attrtypes' (wikiattr) and 'linktypes' (wikilink), this function will preform the operations of both `retypeAttrType()` and `retypeLinkType()` below.

#### Parameters

##### `oldRefType: string`

The old reftype string to be removed.

##### `newRefType: string`

The new reftype string to be added.

##### `content: string`

The content string to make the retype (rename).

### `retypeAttrType(oldAttrType: string, newAttrType: string, content: string): string`

For all attribute types in a given `content` string which match the given `oldAttrType`, rename them to `newAttrType`; ignores escaped instances.

#### Parameters

##### `oldAttrType: string`

The old attrtype string to be removed.

##### `newAttrType: string`

The new attrtype string to be added.

##### `content: string`

The content string to make the retype (rename).

### `retypeLinkType(oldLinkType: string, newLinkType: string, content: string): string`

For all link types in a given `content` string which match the given `oldLinkType`, rename them to be `newLinkType`; ignores escaped instances.

#### Parameters

##### `oldLinkType: string`

The old linktype string to be removed.

##### `newLinkType: string`

The new linktype string to be added.

##### `content: string`

The content string to make the retype (rename).

### `scan(content: string, opts?: ScanOpts): (WikiAttrResult | WikiLinkResult | WikiEmbedResult)[]`

Scan a given `content` string and return an array of descriptions of all valid wikiref constructs. Result formats are listed below and are sorted by order of appearance in the content string based on theri `start` position.

Result formats:

```js
ScanResult {
  kind: string;  // kind of wikiref
  text: string;  // match text
  start: number; // match start position in content string
}
WikiAttrResult extends ScanResult {
  type: [string, number] | [];
  filenames: [string, number][];
  listFormat: string;
}
WikiLinkResult extends ScanResult {
  type: [string, number] | [];
  filename: [string, number];
  label: [string, number] | [];
}
WikiEmbedResult extends ScanResult {
  filename: [string, number];
  media: string;
}
```

Options:

`opts.filename: string`: a specific filename to be targetted -- non-target-filename wiki constructs will be ignored.

`opts.kind: string`: specific kinds of wiki constructs may be targetted; valid options are `'wikiattr'`, `'wikilink'`, and `'wikiembed'`.

`opts.skipEsc: boolean`: whether or not to skip escaped wiki construct instances; set to `true` by default.

### `wikiToMkdn(content: string, opts?: ConvertOpts): string`

Convert `[[wikirefs]]` to `[markdown](links)` in a given `content` string.

In the given `content` string, convert `[[wikirefs]]` to `[markdown](links)` and `![[wikiembed-images]]` to `![markdown](img-embeds)`. File extensions are preserved for media and may be optionally removed or left in-place for markdown files.

Options:

`opts.kind: 'wikiref' | 'wikilink' | 'wikiembed'`: target specific wikiref constructs for conversion (`attr`s are implicitly included in `link`s).

`opts.format: 'filename' | 'relative' | 'absolute'`: how to format markdown link uris based on wikiref filenames: use a slugified filename, relative path, or absolute path of the file.

`opts.ext: boolean`: whether or not to include file extension in uri.

`opts.fnameToUriHash: Record<string, string>`: a hash table explicitly defining what filename maps to what uri.

### Regex API

Regex utilities for extracting wiki constructs from strings. All regexes are case insensitive and the `g` option may be added to find all instances of a wiki construct.

See [`regex.ts`](https://github.com/wikibonsai/wikirefs/blob/main/src/lib/var/regex.ts) for more regex utilities.

### `RGX.WIKI.ATTR`

Note: Since javascript/typescript regex does not support the [`\G` anchor](https://ruby-doc.org/core-2.5.1/Regexp.html#class-Regexp-label-Anchors), filenames should be extracted from list items in the full match string. `wikirefs.RGX.WIKI.BASE` is a convenience regex for this purpose.

```js
// mkdn + comma separated formats both supported
import * as wikirefs from 'wikirefs';

////
// single / comma-list...

const match = wikirefs.RGX.WIKI.ATTR.exec(`
:attrtype::[[wikilink1]],[[wikilink2]]
`);

const matchText    : string = match[0]; // ':attrtype::[[wikilink1]],[[wikilink2]]\n'
const attrTypeText : string = match[1]; // 'attrtype'

// no '\G' so extract filenames manually
let fnameMatch: RegExpExecArray;
let filenames: string[] = [];           // ['wikilink1', 'wikilink2']
const fnameRegex = new RegExp(wikirefs.RGX.WIKI.BASE, 'g');
do {
  fnameMatch = fnameRegex.exec(matchText);
  if (fnameMatch) {
    filenames.push(fnameMatch[1]);
  }
} while (fnameMatch);

console.log(attrTypeText, filenames) // prints: 'attrtype', ['wikilink1', 'wikilink2']

////
// mkdn-list...

const match = wikirefs.RGX.WIKI.ATTR.exec(
`:attrtype::
- [[wikilink1]]
- [[wikilink2]]
`);

const matchText    : string = match[0]; // ':attrtype::\n- [[wikilink1]]\n- [[wikilink2]]\n'
const attrTypeText : string = match[1]; // 'attrtype'

// no '\G' so extract filenames manually
let fnameMatch: RegExpExecArray;
let filenames: string[] = [];           // ['wikilink1', 'wikilink2']
const fnameRegex = new RegExp(wikirefs.RGX.WIKI.BASE, 'g');
do {
  fnameMatch = fnameRegex.exec(matchText);
  if (fnameMatch) {
    filenames.push(fnameMatch[1]);
  }
} while (fnameMatch);

console.log(attrTypeText, filenames) // prints: 'attrtype', ['wikilink1', 'wikilink2']

```

### `RGX.WIKI.LINK`

Note: The wikilink regex results will include single wikiattr constructs that match successfully. To see if the result is actually a wikiattr, check that the match is followed by a newline.

```js
import * as wikirefs from 'wikirefs';

const match = wikirefs.RGX.WIKI.LINK.exec(':linktype::[[wikilink|label]]');

const matchText    : string = match[0]; // ':linktype::[[wikilink|label]]'
const linkTypeText : string = match[1]; // 'linktype'
const fileNameText : string = match[2]; // 'wikilink'
const labelText    : string = match[3]; // 'label'
```

### `RGX.WIKI.EMBED`

```js
import * as wikirefs from 'wikirefs';

const match = wikirefs.RGX.WIKI.EMBED.exec('![[wikiembed]]');

const matchText    : string = match[0]; // '![[wikiembed]]'
const fileNameText : string = match[1]; // 'wikiembed'
```

## A Note On Terminology

```
'wikitext'  : refers to the characters in a wikilink
              that describe the link.
'wikistring': refers to all characters in a wikilink,
              which includes the wikitext and the 
              special characters of the wikilink.

 'wikitext'
      👇
  • <--> •
[[wikilink]]
• <------> •
      👆
'wikistring'


      'wikitext'
    👇          👇
 • <-> •    • <--> •
:reftype::[[wikilink]]
• <----------------> •
          👆
      'wikistring'
```