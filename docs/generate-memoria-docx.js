const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const docsDir = __dirname;
const sourcePath = path.join(docsDir, 'memoria-ceos-brand.md');
const outPath = path.join(docsDir, 'memoria-ceos-brand.docx');
const buildDir = path.join(docsDir, '.docx-build');

const markdown = fs.readFileSync(sourcePath, 'utf8');

function rmDir(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function escapeXml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function textRun(text, options = {}) {
  const props = [];
  if (options.bold) props.push('<w:b/>');
  if (options.italic) props.push('<w:i/>');
  if (options.size) props.push(`<w:sz w:val="${options.size}"/>`);
  if (options.color) props.push(`<w:color w:val="${options.color}"/>`);
  if (options.font) {
    props.push(`<w:rFonts w:ascii="${options.font}" w:hAnsi="${options.font}"/>`);
  }

  return `<w:r>${props.length ? `<w:rPr>${props.join('')}</w:rPr>` : ''}<w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r>`;
}

function paragraph(text, options = {}) {
  const pPr = [];
  if (options.style) pPr.push(`<w:pStyle w:val="${options.style}"/>`);
  if (options.align) pPr.push(`<w:jc w:val="${options.align}"/>`);
  if (options.spacing) {
    pPr.push(`<w:spacing w:before="${options.spacing.before ?? 0}" w:after="${options.spacing.after ?? 160}" w:line="${options.spacing.line ?? 276}" w:lineRule="auto"/>`);
  }
  if (options.indent) {
    pPr.push(`<w:ind w:left="${options.indent.left ?? 0}" w:hanging="${options.indent.hanging ?? 0}"/>`);
  }
  if (options.border) {
    pPr.push(`<w:pBdr><w:top w:val="single" w:sz="8" w:space="1" w:color="000000"/><w:left w:val="single" w:sz="8" w:space="1" w:color="000000"/><w:bottom w:val="single" w:sz="8" w:space="1" w:color="000000"/><w:right w:val="single" w:sz="8" w:space="1" w:color="000000"/></w:pBdr>`);
  }
  if (options.pageBreakBefore) {
    pPr.push('<w:pageBreakBefore/>');
  }

  return `<w:p>${pPr.length ? `<w:pPr>${pPr.join('')}</w:pPr>` : ''}${textRun(text, options.run ?? {})}</w:p>`;
}

function titleBox(text) {
  return `<w:tbl>
    <w:tblPr>
      <w:tblW w:w="6000" w:type="dxa"/>
      <w:jc w:val="center"/>
      <w:tblBorders>
        <w:top w:val="single" w:sz="8" w:space="0" w:color="000000"/>
        <w:left w:val="single" w:sz="8" w:space="0" w:color="000000"/>
        <w:bottom w:val="single" w:sz="8" w:space="0" w:color="000000"/>
        <w:right w:val="single" w:sz="8" w:space="0" w:color="000000"/>
        <w:insideH w:val="nil"/>
        <w:insideV w:val="nil"/>
      </w:tblBorders>
    </w:tblPr>
    <w:tblGrid><w:gridCol w:w="6000"/></w:tblGrid>
    <w:tr>
      <w:tc>
        <w:tcPr><w:tcW w:w="6000" w:type="dxa"/></w:tcPr>
        ${paragraph(text, {
          align: 'center',
          spacing: { before: 520, after: 520 },
          run: { font: 'Times New Roman', size: '30' },
        })}
      </w:tc>
    </w:tr>
  </w:tbl>`;
}

function emptyParagraph() {
  return '<w:p/>';
}

function pageBreak() {
  return '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
}

function parseInlineRuns(text, baseOptions = {}) {
  const runs = [];
  const regex = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      runs.push(textRun(text.slice(lastIndex, match.index), baseOptions));
    }

    const token = match[0];
    if (token.startsWith('**')) {
      runs.push(textRun(token.slice(2, -2), { ...baseOptions, bold: true }));
    } else if (token.startsWith('`')) {
      runs.push(textRun(token.slice(1, -1), { ...baseOptions, font: 'Consolas', color: '7A531D' }));
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    runs.push(textRun(text.slice(lastIndex), baseOptions));
  }

  return runs.join('');
}

function paragraphWithInline(text, options = {}) {
  const pPr = [];
  if (options.style) pPr.push(`<w:pStyle w:val="${options.style}"/>`);
  if (options.align) pPr.push(`<w:jc w:val="${options.align}"/>`);
  if (options.spacing) {
    pPr.push(`<w:spacing w:before="${options.spacing.before ?? 0}" w:after="${options.spacing.after ?? 160}" w:line="${options.spacing.line ?? 276}" w:lineRule="auto"/>`);
  }
  if (options.indent) {
    pPr.push(`<w:ind w:left="${options.indent.left ?? 0}" w:hanging="${options.indent.hanging ?? 0}"/>`);
  }
  return `<w:p>${pPr.length ? `<w:pPr>${pPr.join('')}</w:pPr>` : ''}${parseInlineRuns(text, options.run ?? {})}</w:p>`;
}

function codeBlock(text) {
  const lines = text.split('\n');
  return lines.map(line => paragraph(line, {
    style: 'Code',
    spacing: { before: 0, after: 0, line: 240 },
    run: { font: 'Consolas', size: '20', color: '333333' },
  })).join('');
}

function markdownToBody(md) {
  const lines = md.split(/\r?\n/);
  const body = [];
  let inCover = false;
  let coverDepth = 0;
  let inCode = false;
  let codeLines = [];

  body.push(paragraph('CICLO FORMATIVO DE GRADO SUPERIOR DESARROLLO DE APLICACIONES', {
    align: 'center',
    spacing: { before: 900, after: 80 },
    run: { font: 'Times New Roman', size: '22' },
  }));
  body.push(paragraph('MULTIPLATAFORMA', {
    align: 'center',
    spacing: { before: 0, after: 1600 },
    run: { font: 'Times New Roman', size: '22' },
  }));
  body.push(titleBox('CEOS BRAND'));
  body.push(paragraph('', {
    spacing: { before: 0, after: 2800 },
    run: { size: '22' },
  }));
  body.push(paragraph('Nombre del alumno/a o alumnos/as: Alvaro', {
    align: 'right',
    spacing: { before: 0, after: 40 },
    run: { size: '22' },
  }));
  body.push(paragraph('Nombre del tutor docente', {
    align: 'right',
    spacing: { before: 0, after: 40 },
    run: { size: '22' },
  }));
  body.push(paragraph('EE. SS. Mª Auxiliadora', {
    align: 'right',
    spacing: { before: 0, after: 40 },
    run: { size: '22', color: '0563C1' },
  }));
  body.push(paragraph('SEVILLA', {
    align: 'right',
    spacing: { before: 0, after: 40 },
    run: { size: '22', color: '0563C1' },
  }));
  body.push(paragraph('Curso 2025-2026', {
    align: 'right',
    spacing: { before: 0, after: 40 },
    run: { size: '22' },
  }));
  body.push(pageBreak());

  for (const line of lines) {
    if (line.trim().startsWith('<div class="cover">')) {
      inCover = true;
      coverDepth = 1;
      continue;
    }
    if (inCover) {
      if (line.includes('<div')) {
        coverDepth += (line.match(/<div/g) ?? []).length;
      }
      if (line.includes('</div>')) {
        coverDepth -= (line.match(/<\/div>/g) ?? []).length;
      }
      if (coverDepth === 0) {
        inCover = false;
      }
      continue;
    }

    if (line.startsWith('```')) {
      if (inCode) {
        body.push(codeBlock(codeLines.join('\n')));
        codeLines = [];
        inCode = false;
      } else {
        inCode = true;
      }
      continue;
    }

    if (inCode) {
      codeLines.push(line);
      continue;
    }

    if (!line.trim() || line === '---') {
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      const level = heading[1].length;
      const style = level === 1 ? 'Title' : level === 2 ? 'Heading1' : 'Heading2';
      body.push(paragraphWithInline(heading[2], { style }));
      continue;
    }

    const bullet = line.match(/^- (.*)$/);
    if (bullet) {
      body.push(paragraphWithInline(bullet[1], {
        style: 'ListParagraph',
        indent: { left: 720, hanging: 360 },
        run: { size: '22' },
      }));
      continue;
    }

    const numbered = line.match(/^\d+\.\s+(.*)$/);
    if (numbered) {
      body.push(paragraphWithInline(line, {
        style: 'ListParagraph',
        indent: { left: 720, hanging: 360 },
        run: { size: '22' },
      }));
      continue;
    }

    body.push(paragraphWithInline(line, {
      spacing: { before: 0, after: 140, line: 276 },
      run: { size: '22' },
    }));
  }

  return body.join('\n');
}

const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:w10="urn:schemas-microsoft-com:office:word" xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml" xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup" xmlns:wpi="http://schemas.microsoft.com/office/word/2010/wordprocessingInk" xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml" xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape" mc:Ignorable="w14 wp14">
  <w:body>
    ${markdownToBody(markdown)}
  <w:sectPr>
      <w:titlePg/>
      <w:headerReference w:type="default" r:id="rId2"/>
      <w:footerReference w:type="default" r:id="rId3"/>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1417" w:right="1417" w:bottom="1417" w:left="1417" w:header="708" w:footer="708" w:gutter="0"/>
      <w:cols w:space="708"/>
      <w:docGrid w:linePitch="360"/>
    </w:sectPr>
  </w:body>
</w:document>`;

const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:qFormat/>
    <w:pPr><w:spacing w:after="140" w:line="276" w:lineRule="auto"/></w:pPr>
    <w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="22"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Title">
    <w:name w:val="Title"/>
    <w:basedOn w:val="Normal"/>
    <w:qFormat/>
    <w:pPr><w:spacing w:before="0" w:after="360"/><w:jc w:val="center"/></w:pPr>
    <w:rPr><w:b/><w:color w:val="111113"/><w:sz w:val="38"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="heading 1"/>
    <w:basedOn w:val="Normal"/>
    <w:qFormat/>
    <w:pPr><w:spacing w:before="420" w:after="180"/><w:outlineLvl w:val="0"/></w:pPr>
    <w:rPr><w:b/><w:i/><w:u w:val="single"/><w:color w:val="000000"/><w:sz w:val="30"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading2">
    <w:name w:val="heading 2"/>
    <w:basedOn w:val="Normal"/>
    <w:qFormat/>
    <w:pPr><w:spacing w:before="260" w:after="120"/><w:outlineLvl w:val="1"/></w:pPr>
    <w:rPr><w:b/><w:color w:val="111113"/><w:sz w:val="25"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="ListParagraph">
    <w:name w:val="List Paragraph"/>
    <w:basedOn w:val="Normal"/>
    <w:pPr><w:spacing w:after="80"/></w:pPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Code">
    <w:name w:val="Code"/>
    <w:basedOn w:val="Normal"/>
    <w:pPr><w:spacing w:after="0"/></w:pPr>
    <w:rPr><w:rFonts w:ascii="Consolas" w:hAnsi="Consolas"/><w:sz w:val="20"/></w:rPr>
  </w:style>
</w:styles>`;

const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/>
  <Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>`;

const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`;

const documentRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header1.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/>
</Relationships>`;

const headerXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:hdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:p>
    <w:pPr>
      <w:pBdr>
        <w:top w:val="single" w:sz="8" w:space="1" w:color="000000"/>
        <w:left w:val="single" w:sz="8" w:space="1" w:color="000000"/>
        <w:bottom w:val="single" w:sz="8" w:space="1" w:color="000000"/>
        <w:right w:val="single" w:sz="8" w:space="1" w:color="000000"/>
      </w:pBdr>
      <w:spacing w:before="120" w:after="120"/>
    </w:pPr>
    ${textRun('C.F.G.S. Desarrollo de Aplicaciones Multiplataforma. CEOS BRAND', {
      italic: true,
      font: 'Calibri',
      size: '22',
    })}
  </w:p>
</w:hdr>`;

const footerXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:p>
    <w:pPr>
      <w:pBdr>
        <w:top w:val="single" w:sz="8" w:space="1" w:color="000000"/>
        <w:left w:val="single" w:sz="8" w:space="1" w:color="000000"/>
        <w:bottom w:val="single" w:sz="8" w:space="1" w:color="000000"/>
        <w:right w:val="single" w:sz="8" w:space="1" w:color="000000"/>
      </w:pBdr>
      <w:jc w:val="right"/>
      <w:spacing w:before="120" w:after="120"/>
    </w:pPr>
    ${textRun('Página ', { italic: true, font: 'Calibri', size: '22' })}
    <w:r><w:rPr><w:i/><w:sz w:val="22"/></w:rPr><w:fldChar w:fldCharType="begin"/></w:r>
    <w:r><w:instrText xml:space="preserve"> PAGE </w:instrText></w:r>
    <w:r><w:fldChar w:fldCharType="separate"/></w:r>
    <w:r><w:t>1</w:t></w:r>
    <w:r><w:fldChar w:fldCharType="end"/></w:r>
    ${textRun(' de ', { italic: true, font: 'Calibri', size: '22' })}
    <w:r><w:rPr><w:i/><w:sz w:val="22"/></w:rPr><w:fldChar w:fldCharType="begin"/></w:r>
    <w:r><w:instrText xml:space="preserve"> NUMPAGES </w:instrText></w:r>
    <w:r><w:fldChar w:fldCharType="separate"/></w:r>
    <w:r><w:t>1</w:t></w:r>
    <w:r><w:fldChar w:fldCharType="end"/></w:r>
  </w:p>
</w:ftr>`;

const coreXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>Memoria CEOS Brand</dc:title>
  <dc:creator>Alvaro</dc:creator>
  <cp:lastModifiedBy>Codex</cp:lastModifiedBy>
</cp:coreProperties>`;

const appXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>Microsoft Word</Application>
</Properties>`;

rmDir(buildDir);
ensureDir(path.join(buildDir, '_rels'));
ensureDir(path.join(buildDir, 'word', '_rels'));
ensureDir(path.join(buildDir, 'docProps'));

fs.writeFileSync(path.join(buildDir, '[Content_Types].xml'), contentTypesXml, 'utf8');
fs.writeFileSync(path.join(buildDir, '_rels', '.rels'), relsXml, 'utf8');
fs.writeFileSync(path.join(buildDir, 'word', 'document.xml'), documentXml, 'utf8');
fs.writeFileSync(path.join(buildDir, 'word', 'styles.xml'), stylesXml, 'utf8');
fs.writeFileSync(path.join(buildDir, 'word', 'header1.xml'), headerXml, 'utf8');
fs.writeFileSync(path.join(buildDir, 'word', 'footer1.xml'), footerXml, 'utf8');
fs.writeFileSync(path.join(buildDir, 'word', '_rels', 'document.xml.rels'), documentRelsXml, 'utf8');
fs.writeFileSync(path.join(buildDir, 'docProps', 'core.xml'), coreXml, 'utf8');
fs.writeFileSync(path.join(buildDir, 'docProps', 'app.xml'), appXml, 'utf8');

if (fs.existsSync(outPath)) {
  fs.rmSync(outPath, { force: true });
}

const tempZip = path.join(docsDir, 'memoria-ceos-brand.zip');
if (fs.existsSync(tempZip)) {
  fs.rmSync(tempZip, { force: true });
}

execFileSync('powershell.exe', [
  '-NoProfile',
  '-Command',
  `Compress-Archive -Path '${path.join(buildDir, '*').replace(/'/g, "''")}' -DestinationPath '${tempZip.replace(/'/g, "''")}' -Force`
], { stdio: 'inherit' });

fs.renameSync(tempZip, outPath);
rmDir(buildDir);

console.log(outPath);
