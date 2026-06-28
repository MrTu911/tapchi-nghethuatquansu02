// Shared branding + layout helpers for the NTQS acceptance dossier (.docx)
// Tạp chí Nghệ thuật Quân sự Việt Nam — Học viện Quốc phòng
const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, ImageRun,
  Header, Footer, AlignmentType, LevelFormat, TableOfContents, HeadingLevel,
  BorderStyle, WidthType, ShadingType, VerticalAlign, PageNumber, PageBreak,
  TabStopType, TabStopPosition,
} = require("docx");

// ----- Brand constants -----
const GREEN = "1E3924";      // xanh quân sự đậm
const GOLD = "B8902A";       // vàng đồng (đậm hơn E5C86E để in rõ trên nền trắng)
const GOLD_LIGHT = "E5C86E";
const HEADER_FILL = GREEN;
const HEADER_TEXT = "FFFFFF";
const ZEBRA = "F1F4F1";      // nền xen kẽ nhạt
const BORDER = "B9C2BB";

const FONT = "Times New Roman";
const LOGO_PATH = "/home/kelinton/tapchi-nghethuatquansu02/nextjs_space/public/images/logo-hvqp.png";

const PAGE = {
  size: { width: 11906, height: 16838 }, // A4 (DXA) — chuẩn văn bản hành chính VN
  margin: { top: 1134, right: 1134, bottom: 1134, left: 1418 }, // ~2cm/2.5cm trái
};
const CONTENT_W = 11906 - PAGE.margin.left - PAGE.margin.right; // 9354 DXA

// ----- Styles -----
function styles() {
  return {
    default: { document: { run: { font: FONT, size: 26 } } }, // 13pt
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 30, bold: true, font: FONT, color: GREEN, allCaps: true },
        paragraph: { spacing: { before: 280, after: 160 }, outlineLevel: 0, keepNext: true } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 27, bold: true, font: FONT, color: GREEN },
        paragraph: { spacing: { before: 220, after: 120 }, outlineLevel: 1, keepNext: true } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 26, bold: true, italics: true, font: FONT, color: "30543B" },
        paragraph: { spacing: { before: 160, after: 100 }, outlineLevel: 2, keepNext: true } },
    ],
  };
}

const numbering = {
  config: [
    { reference: "bullets", levels: [
      { level: 0, format: LevelFormat.BULLET, text: "–", alignment: AlignmentType.LEFT,
        style: { run: { color: GREEN }, paragraph: { indent: { left: 600, hanging: 280 } } } },
      { level: 1, format: LevelFormat.BULLET, text: "·", alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 1000, hanging: 280 } } } },
    ] },
  ],
};

// ----- Inline helpers -----
function p(text, opts = {}) {
  const runs = Array.isArray(text) ? text : [new TextRun({ text: String(text), ...(opts.run || {}) })];
  return new Paragraph({
    alignment: opts.align || AlignmentType.JUSTIFIED,
    spacing: { line: 312, after: opts.after != null ? opts.after : 120 },
    indent: opts.indent,
    ...(opts.bookmark ? {} : {}),
    children: runs,
  });
}
function t(text, run = {}) { return new TextRun({ text: String(text), ...run }); }
function b(text, run = {}) { return new TextRun({ text: String(text), bold: true, ...run }); }

function h1(text) { return new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(text)] }); }
function h2(text) { return new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(text)] }); }
function h3(text) { return new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun(text)] }); }

function bullet(text, level = 0) {
  return new Paragraph({
    numbering: { reference: "bullets", level },
    alignment: AlignmentType.JUSTIFIED,
    spacing: { line: 300, after: 60 },
    children: Array.isArray(text) ? text : [new TextRun(String(text))],
  });
}
function bullets(items) { return items.map((it) => bullet(it)); }

function spacer(after = 120) { return new Paragraph({ spacing: { after }, children: [new TextRun("")] }); }
function pageBreak() { return new Paragraph({ children: [new PageBreak()] }); }

// ----- Table builder -----
const cellBorder = { style: BorderStyle.SINGLE, size: 4, color: BORDER };
const cellBorders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };

function cell(content, { width, fill, bold = false, color, align = AlignmentType.LEFT, vAlign = VerticalAlign.CENTER } = {}) {
  const paras = (Array.isArray(content) ? content : [content]).map((c) =>
    c instanceof Paragraph ? c : new Paragraph({
      alignment: align,
      spacing: { line: 276, after: 0 },
      children: [new TextRun({ text: String(c), bold, color, size: 25 })],
    }));
  return new TableCell({
    borders: cellBorders,
    width: { size: width, type: WidthType.DXA },
    shading: fill ? { fill, type: ShadingType.CLEAR } : undefined,
    margins: { top: 60, bottom: 60, left: 110, right: 110 },
    verticalAlign: vAlign,
    children: paras,
  });
}

// headers: array of strings; rows: array of array (string|Paragraph[]); widths sum to CONTENT_W
function table(headers, rows, widths, opts = {}) {
  const totalW = widths.reduce((a, c) => a + c, 0);
  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((hd, i) =>
      cell(hd, { width: widths[i], fill: HEADER_FILL, bold: true, color: HEADER_TEXT,
        align: opts.headerAlign || AlignmentType.CENTER })),
  });
  const bodyRows = rows.map((r, ri) =>
    new TableRow({
      children: r.map((c, i) => {
        const aligns = opts.aligns || [];
        return cell(c, {
          width: widths[i],
          fill: ri % 2 === 1 ? ZEBRA : undefined,
          align: aligns[i] || AlignmentType.LEFT,
          vAlign: VerticalAlign.CENTER,
        });
      }),
    }));
  return new Table({
    width: { size: totalW, type: WidthType.DXA },
    columnWidths: widths,
    rows: [headerRow, ...bodyRows],
  });
}

// ----- Cover page (technical documents) -----
function logoImage(width = 92) {
  if (!fs.existsSync(LOGO_PATH)) return null;
  const ratio = 273 / 225;
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 120 },
    children: [new ImageRun({
      type: "png", data: fs.readFileSync(LOGO_PATH),
      transformation: { width, height: Math.round(width * ratio) },
      altText: { title: "Logo HVQP", description: "Huy hiệu Học viện Quốc phòng", name: "logoHVQP" },
    })],
  });
}

function ruleParagraph(color = GOLD, size = 12, after = 200) {
  return new Paragraph({
    border: { bottom: { style: BorderStyle.SINGLE, size, color, space: 1 } },
    spacing: { after }, children: [new TextRun("")],
  });
}

function centered(text, run = {}, after = 60) {
  return new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after },
    children: [new TextRun({ text: String(text), font: FONT, ...run })] });
}

// meta = { code, version, date, classification }
function coverPage({ docTitle, docSubtitle, meta = {} }) {
  const out = [];
  out.push(spacer(120));
  out.push(centered("HỌC VIỆN QUỐC PHÒNG", { bold: true, size: 26 }, 20));
  out.push(centered("TẠP CHÍ NGHỆ THUẬT QUÂN SỰ VIỆT NAM", { bold: true, size: 28, color: GREEN }, 20));
  out.push(centered("Journal of Vietnamese Military Art", { italics: true, size: 22, color: "555555" }, 60));
  const lg = logoImage(96); if (lg) out.push(lg);
  out.push(ruleParagraph(GOLD, 14, 360));
  out.push(spacer(240));
  out.push(centered("HỒ SƠ NGHIỆM THU DỰ ÁN PHẦN MỀM", { bold: true, size: 30, color: GREEN }, 40));
  out.push(centered("TẠP CHÍ ĐIỆN TỬ NGHỆ THUẬT QUÂN SỰ VIỆT NAM", { bold: true, size: 26 }, 360));
  out.push(spacer(200));
  out.push(centered("TÀI LIỆU", { size: 24, color: "555555" }, 40));
  out.push(centered(docTitle.toUpperCase(), { bold: true, size: 34, color: GREEN }, 40));
  if (docSubtitle) out.push(centered(docSubtitle, { italics: true, size: 24, color: "555555" }, 200));
  out.push(spacer(300));

  // Document control box
  const rows = [
    ["Mã hiệu tài liệu", meta.code || "NTQS-NT-00"],
    ["Phiên bản", meta.version || "1.0"],
    ["Cấp độ", meta.classification || "Lưu hành nội bộ"],
    ["Đơn vị chủ quản", "Học viện Quốc phòng"],
    ["Chủ đầu tư / Tòa soạn", "Tạp chí Nghệ thuật Quân sự Việt Nam"],
  ];
  const ctrl = new Table({
    width: { size: 6400, type: WidthType.DXA },
    columnWidths: [2600, 3800],
    alignment: AlignmentType.CENTER,
    rows: rows.map((r, i) => new TableRow({ children: [
      cell(r[0], { width: 2600, fill: i % 2 ? ZEBRA : "E8EEE9", bold: true }),
      cell(r[1], { width: 3800, fill: i % 2 ? undefined : undefined }),
    ] })),
  });
  out.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [] }));
  out.push(ctrl);
  out.push(spacer(360));
  out.push(centered("HÀ NỘI, NĂM 2026", { bold: true, size: 24 }, 0));
  out.push(pageBreak());
  return out;
}

// National masthead (for legal forms): two columns
function nationalMasthead(leftLines, { docNo = "", place = "Hà Nội" } = {}) {
  const leftCol = [
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 },
      children: [new TextRun({ text: leftLines[0], bold: true, size: 24 })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 },
      children: [new TextRun({ text: leftLines[1], bold: true, size: 24 })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: "000000", space: 1 } },
      children: [new TextRun({ text: "", size: 4 })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 80 },
      children: [new TextRun({ text: docNo ? `Số: ${docNo}` : "Số:        /……", size: 24 })] }),
  ];
  const rightCol = [
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 },
      children: [new TextRun({ text: "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM", bold: true, size: 24 })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: "000000", space: 1 } },
      children: [new TextRun({ text: "Độc lập - Tự do - Hạnh phúc", bold: true, size: 26 })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 80 },
      children: [new TextRun({ text: `${place}, ngày ….. tháng ….. năm 2026`, italics: true, size: 24 })] }),
  ];
  const noBorder = { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE },
    left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } };
  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: [4000, CONTENT_W - 4000],
    borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
      insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE } },
    rows: [new TableRow({ children: [
      new TableCell({ borders: noBorder, width: { size: 4000, type: WidthType.DXA }, children: leftCol }),
      new TableCell({ borders: noBorder, width: { size: CONTENT_W - 4000, type: WidthType.DXA }, children: rightCol }),
    ] })],
  });
}

// ----- Signature block -----
// signers: [{ role, title, name }]  (1..n columns)
function signatureBlock(signers, note) {
  const widths = signers.map(() => Math.floor(CONTENT_W / signers.length));
  const mk = (s) => [
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 },
      children: [new TextRun({ text: s.role, bold: true, size: 25 })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 },
      children: [new TextRun({ text: s.subRole || "(Ký, ghi rõ họ tên" + (s.stamp ? ", đóng dấu)" : ")"), italics: true, size: 22 })] }),
    new Paragraph({ spacing: { after: 0 }, children: [new TextRun("")] }),
    new Paragraph({ spacing: { after: 0 }, children: [new TextRun("")] }),
    new Paragraph({ spacing: { after: 0 }, children: [new TextRun("")] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 40 },
      children: [new TextRun({ text: s.title || "", size: 24 })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 },
      children: [new TextRun({ text: s.name || "……………………………", bold: true, size: 25 })] }),
  ];
  const noBorder = { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE },
    left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } };
  const out = [];
  if (note) out.push(new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { before: 120, after: 60 },
    children: [new TextRun({ text: note, italics: true, size: 23 })] }));
  out.push(new Table({
    width: { size: CONTENT_W, type: WidthType.DXA }, columnWidths: widths,
    borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
      insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE } },
    rows: [new TableRow({ children: signers.map((s, i) =>
      new TableCell({ borders: noBorder, width: { size: widths[i], type: WidthType.DXA }, children: mk(s) })) })],
  }));
  return out;
}

// ----- TOC page -----
function tocPage(title = "MỤC LỤC") {
  return [
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 },
      children: [new TextRun({ text: title, bold: true, size: 30, color: GREEN, allCaps: true })] }),
    new TableOfContents("Mục lục", { hyperlink: true, headingStyleRange: "1-3" }),
    pageBreak(),
  ];
}

// ----- Header / Footer -----
function makeHeader(docTitle) {
  return new Header({ children: [
    new Paragraph({
      tabStops: [{ type: TabStopType.RIGHT, position: CONTENT_W }],
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: GOLD, space: 2 } },
      spacing: { after: 60 },
      children: [
        new TextRun({ text: "Tạp chí Nghệ thuật Quân sự Việt Nam", size: 18, color: GREEN, bold: true }),
        new TextRun({ text: `\t${docTitle}`, size: 18, color: "555555", italics: true }),
      ],
    }),
  ] });
}
function makeFooter(code) {
  return new Footer({ children: [
    new Paragraph({
      tabStops: [{ type: TabStopType.CENTER, position: Math.floor(CONTENT_W / 2) },
                 { type: TabStopType.RIGHT, position: CONTENT_W }],
      border: { top: { style: BorderStyle.SINGLE, size: 6, color: GOLD, space: 2 } },
      spacing: { before: 40 },
      children: [
        new TextRun({ text: code || "NTQS", size: 17, color: "777777" }),
        new TextRun({ text: "\tHồ sơ nghiệm thu — Lưu hành nội bộ", size: 17, color: "777777" }),
        new TextRun({ text: "\tTrang ", size: 17, color: "777777" }),
        new TextRun({ children: [PageNumber.CURRENT], size: 17, color: "777777" }),
        new TextRun({ text: "/", size: 17, color: "777777" }),
        new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 17, color: "777777" }),
      ],
    }),
  ] });
}

// ----- Document assembler -----
// build({ title, code, version, subtitle, classification, body[], outFile, withCover=true, withToc=true, legal=false })
function buildDoc(cfg) {
  const children = [];
  if (cfg.withCover !== false) children.push(...coverPage({
    docTitle: cfg.title, docSubtitle: cfg.subtitle,
    meta: { code: cfg.code, version: cfg.version, classification: cfg.classification },
  }));
  if (cfg.withToc !== false) children.push(...tocPage());
  children.push(...cfg.body);

  const emptyHeader = new Header({ children: [new Paragraph({ children: [new TextRun("")] })] });
  const emptyFooter = new Footer({ children: [new Paragraph({ children: [new TextRun("")] })] });
  const doc = new Document({
    styles: styles(),
    numbering,
    features: { updateFields: true },
    sections: [{
      properties: { page: PAGE, titlePage: cfg.withCover !== false },
      headers: { default: makeHeader(cfg.headerTitle || cfg.title), first: emptyHeader },
      footers: { default: makeFooter(cfg.code), first: emptyFooter },
      children,
    }],
  });
  return Packer.toBuffer(doc).then((buf) => {
    fs.writeFileSync(cfg.outFile, buf);
    return cfg.outFile;
  });
}

module.exports = {
  GREEN, GOLD, GOLD_LIGHT, CONTENT_W, FONT,
  Paragraph, TextRun, AlignmentType, BorderStyle, WidthType, ShadingType, VerticalAlign,
  Table, TableRow, TableCell, HeadingLevel, PageBreak,
  p, t, b, h1, h2, h3, bullet, bullets, spacer, pageBreak, table, cell,
  coverPage, tocPage, centered, ruleParagraph, nationalMasthead, signatureBlock,
  buildDoc, styles, numbering,
};
