// scripts/fix_test_newlines.js
// Replace literal "\\n" sequences that are outside string literals with real newlines
// This fixes test files corrupted by escaped-newline injection.

const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, '..', 'tests', 'data', 'DataFrame.test.js');
let s = fs.readFileSync(p, 'utf8');
let out = '';
let inString = null;
for (let i = 0; i < s.length; i++) {
  const ch = s[i];
  if (inString) {
    out += ch;
    if (ch === '\\') {
      // escape: copy next char as-is and skip
      if (i + 1 < s.length) {
        out += s[++i];
      }
      continue;
    }
    if ((inString === '"' && ch === '"') || (inString === "'" && ch === "'") || (inString === '`' && ch === '`')) {
      inString = null;
    }
  } else {
    if (ch === '"' || ch === "'" || ch === '`') {
      inString = ch;
      out += ch;
    } else if (ch === '\\' && s[i + 1] === 'n') {
      // Replace literal backslash+n with an actual newline
      out += '\n';
      i++; // skip the 'n'
    } else {
      out += ch;
    }
  }
}
fs.writeFileSync(p, out, 'utf8');
console.log('fixed escaped-newlines in', p);