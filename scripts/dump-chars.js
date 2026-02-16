import fs from 'fs';
const s = fs.readFileSync('tests/data/DataFrame.test.js', 'utf8');
console.log('length', s.length);
for (let i = 0; i < Math.min(s.length, 1000); i++) {
  const ch = s[i];
  const code = ch.charCodeAt(0);
  if (code < 32 && ch !== '\n' && ch !== '\r' && ch !== '\t') {
    console.log(i, 'CONTROL', code);
  }
  if (code > 127) {
    console.log(i, 'NON-ASCII', code, ch);
  }
  if (i < 300) process.stdout.write(ch);
}
console.log('\n--- end preview ---');
