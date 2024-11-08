import { minify } from "@swc/core";
import { readFile } from 'fs/promises';
import { promisify } from "util";
import { brotliCompress } from 'zlib';

const minified = await minify(await readFile("./dist/nanosignals.js", 'utf-8'), {
  compress: true,
  mangle: true,
  sourceMap: false,
  module: true,
});

const compress = promisify(brotliCompress);
console.log(minified.code.toString())
const buf = await compress(Buffer.from(minified.code));
console.log("minified + brotli:", buf.byteLength)