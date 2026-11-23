import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const userScriptPath = path.join(rootDir, 'antigravity-zh-cn.user.js');
const metaPath = path.join(rootDir, 'antigravity-zh-cn.meta.js');

const syncMode = process.argv.includes('--sync');

const rawUserJs = fs.readFileSync(userScriptPath, 'utf8');
const userJs = rawUserJs.replace(/\r\n/g, '\n');

const headerMatch = userJs.match(/^\/\/ ==UserScript==\n[\s\S]*?\n\/\/ ==\/UserScript==\n/);
assert.ok(headerMatch, 'Userscript metadata header not found in antigravity-zh-cn.user.js');
const headerBlock = headerMatch[0];

if (syncMode) {
  fs.writeFileSync(metaPath, headerBlock, 'utf8');
}

const versionMatch = headerBlock.match(/^\/\/ @version\s+(\S+)\s*$/m);
const updateUrlMatch = headerBlock.match(/^\/\/ @updateURL\s+(\S+)\s*$/m);
const downloadUrlMatch = headerBlock.match(/^\/\/ @downloadURL\s+(\S+)\s*$/m);

assert.ok(versionMatch, 'Missing @version in header');
assert.equal(
  updateUrlMatch?.[1],
  'https://raw.githubusercontent.com/Timk-ztls/antigravity-zh-cn/main/antigravity-zh-cn.meta.js',
  'Unexpected @updateURL'
);
assert.equal(
  downloadUrlMatch?.[1],
  'https://raw.githubusercontent.com/Timk-ztls/antigravity-zh-cn/main/antigravity-zh-cn.user.js',
  'Unexpected @downloadURL'
);
assert.ok(!/^\/\/ @noframes\b/m.test(headerBlock), '@noframes must NOT be present');

assert.ok(fs.existsSync(metaPath), 'antigravity-zh-cn.meta.js is missing; run with --sync');
const metaText = fs.readFileSync(metaPath, 'utf8').replace(/\r\n/g, '\n');
assert.equal(metaText, headerBlock, 'antigravity-zh-cn.meta.js is out of sync with antigravity-zh-cn.user.js');

const mapMatch = userJs.match(/const EXACT_MAP = \{([\s\S]*?)\n  \};/);
assert.ok(mapMatch, 'EXACT_MAP block not found');
const mapSrc = mapMatch[1];

const seenKeys = new Set();
const duplicateKeys = [];
const lowercaseLigatures = [];
let i = 0;
let expectKey = true;

while (i < mapSrc.length) {
  const ch = mapSrc[i];
  if (ch === ' ' || ch === '\t' || ch === '\r' || ch === '\n') {
    i++;
    continue;
  }
  if (ch === '/' && mapSrc[i + 1] === '/') {
    while (i < mapSrc.length && mapSrc[i] !== '\n') i++;
    continue;
  }
  if (ch === "'" || ch === '"') {
    const quote = ch;
    let j = i + 1;
    while (j < mapSrc.length) {
      if (mapSrc[j] === '\\') {
        j += 2;
        continue;
      }
      if (mapSrc[j] === quote) {
        j++;
        break;
      }
      j++;
    }
    const token = mapSrc.slice(i, j);
    const val = vm.runInNewContext(token);
    if (expectKey) {
      if (seenKeys.has(val)) duplicateKeys.push(val);
      seenKeys.add(val);
      if (/^[a-z][a-z0-9_]*$/.test(val) && !/\s/.test(val)) {
        lowercaseLigatures.push(val);
      }
      expectKey = false;
    }
    i = j;
    continue;
  }
  if (ch === ',') {
    expectKey = true;
  }
  i++;
}

assert.deepEqual(duplicateKeys, [], `Duplicate keys in EXACT_MAP: ${duplicateKeys.join(', ')}`);
assert.deepEqual(lowercaseLigatures, [], `Lowercase icon ligature keys in EXACT_MAP: ${lowercaseLigatures.join(', ')}`);

const regexMatch = userJs.match(/const REGEX_RULES = \[([\s\S]*?)\n  \];/);
assert.ok(regexMatch, 'REGEX_RULES block not found');
const regexRules = vm.runInNewContext(
  'const translateDuration = s => s; const translateInlineValue = s => s; [' + regexMatch[1] + ']'
);

console.log(`version=${versionMatch[1]}`);
console.log(`exactCount=${seenKeys.size}`);
console.log(`regexCount=${regexRules.length}`);
console.log('verify-and-sync OK');
