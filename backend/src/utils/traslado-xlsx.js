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

export function buildTrasladoXlsxBuffer(traslado) {
  const items = Array.isArray(traslado.items) ? traslado.items : [];
  const total = items.reduce((sum, linea) => sum + Number(linea.cantidad_traslado || 0), 0);
  const dataStart = 4;
  const footerRow = dataStart + items.length;

  const rows = [
    `<row r="1">${inlineCell(1, 1, `Traslado de Inventario No. ${traslado.id}`, 1)}</row>`,
    `<row r="2">${inlineCell(1, 2, `Realizado por: ${traslado.realizado_por || ''}`, 1)}</row>`,
    `<row r="3">${[
      inlineCell(1, 3, 'Código', 2),
      inlineCell(2, 3, 'Producto', 2),
      inlineCell(3, 3, 'Bodega Origen', 2),
      inlineCell(4, 3, 'Cantidad Anterior', 2),
      inlineCell(5, 3, 'Bodega Destino', 2),
      inlineCell(6, 3, 'Cantidad Traslado', 2),
    ].join('')}</row>`,
    ...items.map((linea, index) => {
      const row = dataStart + index;
      return `<row r="${row}">${[
        inlineCell(1, row, linea.sku || '', 3),
        inlineCell(2, row, linea.producto, 3),
        inlineCell(3, row, traslado.bodega_origen, 3),
        numberCell(4, row, linea.cantidad_anterior, 4),
        inlineCell(5, row, traslado.bodega_destino, 3),
        numberCell(6, row, linea.cantidad_traslado, 4),
      ].join('')}</row>`;
    }),
    `<row r="${footerRow}">${inlineCell(5, footerRow, 'Total artículos trasladados', 5)}${numberCell(6, footerRow, total, 6)}</row>`,
  ].join('');

  const sheet = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <cols>
    <col min="1" max="1" width="18" customWidth="1"/>
    <col min="2" max="2" width="42" customWidth="1"/>
    <col min="3" max="3" width="36" customWidth="1"/>
    <col min="4" max="4" width="18" customWidth="1"/>
    <col min="5" max="5" width="36" customWidth="1"/>
    <col min="6" max="6" width="18" customWidth="1"/>
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
  <borders count="2">
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <border>
      <left style="medium" /><right style="medium"/><top style="medium"/><bottom style="medium"/><diagonal/>
    </border>
  </borders>
  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>
  <cellXfs count="7">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment horizontal="left" vertical="center"/></xf>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment horizontal="left" vertical="center"/></xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment horizontal="left" vertical="center"/></xf>
    <xf numFmtId="1" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>
    <xf numFmtId="1" fontId="1" fillId="0" borderId="1" xfId="0" applyFont="1" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>
  </cellXfs>
</styleSheet>`;

  const workbook = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
 xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="Traslado" sheetId="1" r:id="rId1"/>
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
