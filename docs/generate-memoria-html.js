const fs = require('fs');
const path = require('path');

const sourcePath = path.join(__dirname, 'memoria-ceos-brand.md');
const outputPath = path.join(__dirname, 'memoria-ceos-brand.html');
const markdown = fs.readFileSync(sourcePath, 'utf8');

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function inline(value) {
  return escapeHtml(value)
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');
}

const lines = markdown.split(/\r?\n/);
let html = '';
let inCode = false;
let inList = false;
let inRawHtml = false;
let rawHtmlLines = [];
let rawHtmlDepth = 0;
let codeLines = [];

function closeList() {
  if (inList) {
    html += '</ul>\n';
    inList = false;
  }
}

for (const line of lines) {
  if (line.trim().startsWith('<div class="cover">')) {
    closeList();
    inRawHtml = true;
    rawHtmlDepth = 1;
    rawHtmlLines = [line];
    continue;
  }

  if (inRawHtml) {
    rawHtmlLines.push(line);
    if (line.includes('<div')) {
      rawHtmlDepth += (line.match(/<div/g) ?? []).length;
    }
    if (line.includes('</div>')) {
      rawHtmlDepth -= (line.match(/<\/div>/g) ?? []).length;
    }
    if (rawHtmlDepth === 0) {
      html += `${rawHtmlLines.join('\n')}\n`;
      rawHtmlLines = [];
      inRawHtml = false;
    }
    continue;
  }

  if (line.startsWith('```')) {
    if (inCode) {
      html += `<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>\n`;
      codeLines = [];
      inCode = false;
    } else {
      closeList();
      inCode = true;
    }
    continue;
  }

  if (inCode) {
    codeLines.push(line);
    continue;
  }

  if (!line.trim()) {
    closeList();
    continue;
  }

  if (line === '---') {
    closeList();
    html += '<hr>\n';
    continue;
  }

  const heading = line.match(/^(#{1,6})\s+(.*)$/);
  if (heading) {
    closeList();
    const level = heading[1].length;
    html += `<h${level}>${inline(heading[2])}</h${level}>\n`;
    continue;
  }

  const bullet = line.match(/^- (.*)$/);
  if (bullet) {
    if (!inList) {
      html += '<ul>\n';
      inList = true;
    }
    html += `<li>${inline(bullet[1])}</li>\n`;
    continue;
  }

  closeList();
  html += `<p>${inline(line)}</p>\n`;
}

closeList();

const document = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Memoria CEOS Brand</title>
    <style>
      :root {
        --ink: #141416;
        --muted: #54545a;
        --gold: #9b7330;
        --line: #e4e4e4;
        --paper: #f7f7f7;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        background: var(--paper);
        color: var(--ink);
        font-family: Arial, Helvetica, sans-serif;
        line-height: 1.65;
      }

      main {
        width: min(100%, 920px);
        margin: 0 auto;
        padding: 52px 28px 80px;
        background: #fff;
        box-shadow: 0 20px 80px rgba(0, 0, 0, 0.08);
      }

      h1 {
        margin: 0 0 24px;
        padding-bottom: 18px;
        border-bottom: 4px solid var(--gold);
        font-size: 2.8rem;
        line-height: 1.05;
      }

      h2 {
        margin: 42px 0 14px;
        color: var(--gold);
        font-size: 1.8rem;
        line-height: 1.15;
      }

      h3 {
        margin: 28px 0 10px;
        font-size: 1.25rem;
      }

      p {
        margin: 0 0 12px;
        color: var(--muted);
      }

      ul {
        margin: 0 0 18px;
        padding-left: 22px;
        color: var(--muted);
      }

      li {
        margin: 5px 0;
      }

      code {
        padding: 2px 5px;
        border-radius: 4px;
        background: #f1eee9;
        color: #2a2520;
        font-family: Consolas, Monaco, monospace;
      }

      pre {
        overflow-x: auto;
        margin: 14px 0 20px;
        padding: 16px;
        border-radius: 8px;
        background: #111113;
        color: #f3ede6;
        line-height: 1.45;
      }

      pre code {
        padding: 0;
        background: transparent;
        color: inherit;
      }

      hr {
        margin: 34px 0;
        border: 0;
        border-top: 1px solid var(--line);
      }

      .cover {
        min-height: 1040px;
        position: relative;
        padding: 86px 64px 70px;
        background: #fff;
        color: #000;
        font-family: "Times New Roman", Times, serif;
        page-break-after: always;
      }

      .cover p {
        margin: 0;
        color: #000;
      }

      .cover-top {
        text-align: center;
        font-size: 14px;
        line-height: 1.7;
        text-transform: uppercase;
      }

      .cover-title {
        width: 430px;
        margin: 190px auto 0;
        padding: 34px 24px;
        border: 1.5px solid #000;
        text-align: center;
        font-size: 20px;
        line-height: 1.3;
        text-transform: uppercase;
      }

      .cover-data {
        position: absolute;
        right: 64px;
        bottom: 70px;
        text-align: right;
        font-family: Arial, Helvetica, sans-serif;
        font-size: 14px;
        line-height: 1.55;
      }

      .cover-data p:nth-child(3),
      .cover-data p:nth-child(4) {
        color: #0563c1;
      }

      @media print {
        body {
          background: #fff;
        }

        main {
          width: 100%;
          padding: 0;
          box-shadow: none;
        }

        h2 {
          page-break-after: avoid;
        }

        pre,
        ul {
          page-break-inside: avoid;
        }

        .cover {
          min-height: 100vh;
          padding: 70px 64px;
        }
      }
    </style>
  </head>
  <body>
    <main>
${html}
    </main>
  </body>
</html>
`;

fs.writeFileSync(outputPath, document, 'utf8');
console.log(outputPath);
