import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import crypto from 'node:crypto';
export function loadRoute(file, dependencies, env = {}, globals = {}) {
  const exports = {};
  const code = ts.transpileModule(readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  vm.runInNewContext(code, { exports, Request, Response, File, Buffer, AbortSignal, URL, Date,
    ...globals, process: { env }, console: { log() {}, error() {}, warn() {} },
    require(name) {
      if (name === 'node:crypto') return crypto;
      if (name === 'next/server') return { NextResponse: { json: (body, init) => Response.json(body, init) } };
      if (name in dependencies) return dependencies[name];
      throw new Error(`Unmocked dependency ${name}`);
    },
  });
  return exports;
}
export function fakeDatabase(tables) {
  const calls = [];
  return { calls, from(table) {
    const filters = []; let operation = 'select'; let updates;
    const query = {
      select() { return query; }, order() { return query; }, limit() { return query; },
      eq(key, value) { filters.push([key, value]); return query; },
      or(expression) { filters.push(["or", expression]); return query; },
      in(key, values) { filters.push([key, values]); return query; },
      update(value) { operation = 'update'; updates = value; return query; },
      delete() { operation = 'delete'; return query; },
      insert(value) { operation = 'insert'; updates = value; return query; },
      upsert(value, options) { operation = 'upsert'; updates = { value, options }; return query; },
      single() { return query; }, maybeSingle() { return query; },
      then(resolve) {
        calls.push({ table, operation, filters, updates });
        const data = typeof tables[table] === 'function' ? tables[table]({ filters, operation, updates }) : tables[table];
        return Promise.resolve(data?.__error ? { data:null,error:data.__error } : { data, error: null }).then(resolve);
      },
    };
    return query;
  } };
}
