// Execute selected production declarations without booting the UI, OCR engines or network.
// This intentionally fails if declarations stop using the current top-level layout.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '../..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const html = read('drive-dj-finder.html');
function declaration(name, source = html) {
  const lines = source.split(/\r?\n/);
  const start = lines.findIndex(line => new RegExp(`^(?:(?:async )?function ${name}\\(|(?:const|let) ${name}=)`).test(line));
  if (start < 0) throw new Error(`Missing production declaration: ${name}`);
  let code = lines[start];
  if (/^(?:async )?function /.test(code) && !code.trimEnd().endsWith('}')) {
    const end = lines.findIndex((line, index) => index > start && /^}$/.test(line));
    if (end < 0) throw new Error(`Missing closing brace: ${name}`);
    code = lines.slice(start, end + 1).join('\n');
  }
  new vm.Script(code, { filename: `production:${name}` });
  return code;
}
function context(names, globals = {}) {
  const ctx = vm.createContext(globals);
  vm.runInContext(names.map(name => declaration(name)).join('\n'), ctx);
  return ctx;
}
const plain = value => JSON.parse(JSON.stringify(value));
module.exports = { read, html, declaration, context, plain };
