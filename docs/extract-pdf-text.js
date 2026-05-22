const fs = require('fs');
const zlib = require('zlib');

const filePath = process.argv[2];

if (!filePath) {
  console.error('Usage: node extract-pdf-text.js <file.pdf>');
  process.exit(1);
}

const pdf = fs.readFileSync(filePath);
const latin = pdf.toString('latin1');
const streamRegex = /<<(.*?)>>\s*stream\r?\n([\s\S]*?)\r?\nendstream/g;
const chunks = [];

function decodePdfString(value) {
  return value
    .replace(/\\([nrtbf()\\])/g, (_, char) => {
      const map = { n: '\n', r: '\r', t: '\t', b: '\b', f: '\f', '(': '(', ')': ')', '\\': '\\' };
      return map[char] ?? char;
    })
    .replace(/\\([0-7]{1,3})/g, (_, octal) => String.fromCharCode(parseInt(octal, 8)));
}

function extractFromTextStream(text) {
  const lines = [];
  const stringRegex = /\((?:\\.|[^\\)])*\)\s*Tj|\[(.*?)\]\s*TJ/g;
  let match;

  while ((match = stringRegex.exec(text)) !== null) {
    const token = match[0];
    if (token.endsWith('Tj')) {
      const raw = token.slice(1, token.lastIndexOf(')'));
      lines.push(decodePdfString(raw));
      continue;
    }

    const arrayText = match[1] ?? '';
    const parts = [];
    const partRegex = /\((?:\\.|[^\\)])*\)/g;
    let part;
    while ((part = partRegex.exec(arrayText)) !== null) {
      parts.push(decodePdfString(part[0].slice(1, -1)));
    }
    if (parts.length) {
      lines.push(parts.join(''));
    }
  }

  return lines.join('\n');
}

let match;
while ((match = streamRegex.exec(latin)) !== null) {
  const dict = match[1];
  let stream = Buffer.from(match[2], 'latin1');

  if (/FlateDecode/.test(dict)) {
    try {
      stream = zlib.inflateSync(stream);
    } catch {
      continue;
    }
  }

  const extracted = extractFromTextStream(stream.toString('latin1'));
  if (extracted.trim()) {
    chunks.push(extracted);
  }
}

console.log(chunks.join('\n').replace(/\n{3,}/g, '\n\n'));
