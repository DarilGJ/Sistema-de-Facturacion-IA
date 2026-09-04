import { zipDeflate } from './zip-deflate.js';

function xml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function colLetter(col) {
  let n = col;
  let label = '';
  while (n > 0) {
    const rem = (n - 1) % 26;
    label = String.fromCharCode(65 + rem) + label;
    n = Math.floor((n - 1) / 26);
  }
  return label;
}

function inlineCell(col, row, value, style) {
  return `<c r="${colLetter(col)}${row}" t="inlineStr" s="${style}"><is><t xml:space="preserve">${xml(value)}</t></is></c>`;
}

function numberCell(col, row, value, style) {
  return `<c r="${colLetter(col)}${row}" s="${style}"><v>${Number(value || 0)}</v></c>`;
}

export function buildAjusteXlsxBuffer(ajuste) {
  const descripcion = String(ajuste.descripcion || '').trim() || 'Ajuste';
  const items = Array.isArray(ajuste.items) ? ajuste.items : [];

  const rows = [
    `<row r="1">${inlineCell(1, 1, `Ajuste de Inventario No. ${ajuste.id}`, 1)}</row>`,
    `<row r="2">${inlineCell(1, 2, `Realizado por: ${ajuste.realizado_por || ''}`, 1)}</row>`,
    `<row r="3">${inlineCell(1, 3, `Descripción: ${descripcion}`, 1)}</row>`,
    `<row r="4">${[
      inlineCell(1, 4, 'Articulo', 2),
      inlineCell(2, 4, 'Codigo', 2),
      inlineCell(3, 4, 'Bodega', 2),
      inlineCell(4, 4, 'Cantidad Anterior', 2),
      inlineCell(5, 4, 'Cantidad Ajuste', 2),
      inlineCell(6, 4, '(+/-)', 2),
      inlineCell(7, 4, 'Total', 2),
    ].join('')}</row>`,
    ...items.map((linea, index) => {
      const row = index + 5;
      return `<row r="${row}">${[
        inlineCell(1, row, linea.producto, 3),
        inlineCell(2, row, linea.sku || '', 3),
        inlineCell(3, row, linea.bodega, 3),
        numberCell(4, row, linea.cantidad_anterior, 4),
        numberCell(5, row, linea.cantidad_ajuste, 4),
        inlineCell(6, row, linea.tipo === 'menos' ? '-' : '+', 5),
        numberCell(7, row, linea.cantidad_final, 4),
      ].join('')}</row>`;
    }),
  ].join('');

  const sheet = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <cols>
    <col min="1" max="1" width="38" customWidth="1"/>
    <col min="2" max="2" width="18" customWidth="1"/>
    <col min="3" max="3" width="36" customWidth="1"/>
    <col min="4" max="4" width="18" customWidth="1"/>
    <col min="5" max="5" width="18" customWidth="1"/>
    <col min="6" max="6" width="10" customWidth="1"/>
    <col min="7" max="7" width="12" customWidth="1"/>
  </cols>
  <sheetData>${rows}</sheetData>
</worksheet>`;

  const styles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="2">
    <font><sz val="11"/><color theme="1"/><name val="Calibri"/><family val="2"/></font>
    <font><b/><sz val="11"/><color theme="1"/><name val="Calibri"/><family val="2"/></font>
  </fonts>
  <fills count="3">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFBDD7EE"/><bgColor indexed="64"/></patternFill></fill>
  </fills>
  <borders count="1">
    <border><left/><right/><top/><bottom/><diagonal/></border>
  </borders>
  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>
  <cellXfs count="6">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment horizontal="left" vertical="center"/></xf>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment horizontal="left" vertical="center"/></xf>
    <xf numFmtId="1" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
  </cellXfs>
</styleSheet>`;

  const workbook = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
 xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="Ajuste" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`;

  return zipDeflate([
    {
      name: '[Content_Types].xml',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`,
    },
    {
      name: '_rels/.rels',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`,
    },
    { name: 'xl/workbook.xml', content: workbook },
    {
      name: 'xl/_rels/workbook.xml.rels',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`,
    },
    { name: 'xl/styles.xml', content: styles },
    { name: 'xl/worksheets/sheet1.xml', content: sheet },
  ]);
}
