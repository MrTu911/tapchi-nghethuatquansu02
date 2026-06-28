// Sinh bìa hồ sơ tổng + trang "MỤC LỤC HỒ SƠ" (có số trang trong PDF gộp).
// Dùng: node bia.js <pagemap.json> <out.docx>
//   pagemap.json = [{ code, name, page (number|null) }, ...]
const fs = require("fs");
const path = require("path");
const docx = require("docx");
const { Document, Packer, Paragraph, TextRun, ImageRun, AlignmentType, BorderStyle, PageBreak } = docx;
const B = require("./branding");

// _generator → nghiem-thu → docs → nextjs_space ; logo tại public/images
const LOGO = path.resolve(__dirname, "../../../public/images/logo-hvqp.png");
const [, , pagemapPath, outFile] = process.argv;
const rows = JSON.parse(fs.readFileSync(pagemapPath, "utf8"));

const centered = (text, run = {}, after = 60) => new Paragraph({
  alignment: AlignmentType.CENTER, spacing: { after },
  children: [new TextRun({ text: String(text), font: B.FONT, ...run })],
});
const rule = (color, size, after) => new Paragraph({
  border: { bottom: { style: BorderStyle.SINGLE, size, color, space: 1 } },
  spacing: { after }, children: [new TextRun("")],
});
const spacer = (after) => new Paragraph({ spacing: { after }, children: [new TextRun("")] });

const logo = () => {
  if (!fs.existsSync(LOGO)) return spacer(120);
  const ratio = 273 / 225, w = 104;
  return new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 120 },
    children: [new ImageRun({ type: "png", data: fs.readFileSync(LOGO),
      transformation: { width: w, height: Math.round(w * ratio) },
      altText: { title: "Logo HVQP", description: "Huy hiệu Học viện Quốc phòng", name: "logo" } })] });
};

const cover = [
  spacer(160),
  centered("HỌC VIỆN QUỐC PHÒNG", { bold: true, size: 26 }, 20),
  centered("TẠP CHÍ NGHỆ THUẬT QUÂN SỰ VIỆT NAM", { bold: true, size: 30, color: B.GREEN }, 20),
  centered("Journal of Vietnamese Military Art", { italics: true, size: 22, color: "555555" }, 60),
  logo(),
  rule(B.GOLD, 16, 400),
  spacer(280),
  centered("HỒ SƠ NGHIỆM THU", { bold: true, size: 56, color: B.GREEN }, 40),
  centered("DỰ ÁN PHẦN MỀM", { bold: true, size: 34 }, 40),
  centered("“TẠP CHÍ ĐIỆN TỬ NGHỆ THUẬT QUÂN SỰ VIỆT NAM”", { bold: true, size: 28, color: B.GREEN }, 280),
  centered("(BỘ HỒ SƠ ĐẦY ĐỦ — 10 TÀI LIỆU)", { italics: true, size: 24, color: "555555" }, 360),
  spacer(240),
  centered("Đơn vị chủ quản: Học viện Quốc phòng", { size: 24 }, 20),
  centered("Chủ đầu tư: Tạp chí Nghệ thuật Quân sự Việt Nam", { size: 24 }, 20),
  centered("ISSN 1859-0454  •  Giấy phép 619/GP-BTTTT", { size: 23, color: "555555" }, 400),
  centered("HÀ NỘI, NĂM 2026", { bold: true, size: 26 }, 0),
  new Paragraph({ children: [new PageBreak()] }),
];

const tocRows = rows.map((r, i) => [String(i + 1), r.code, r.name, r.page == null ? "—" : String(r.page)]);
const toc = [
  centered("MỤC LỤC HỒ SƠ", { bold: true, size: 32, color: B.GREEN }, 60),
  centered("(Số trang theo tệp PDF tổng)", { italics: true, size: 22, color: "555555" }, 220),
  B.table(["STT", "Mã hiệu", "Tên tài liệu", "Trang"], tocRows, [800, 1900, 5354, 1300],
    { aligns: [AlignmentType.CENTER, AlignmentType.CENTER, AlignmentType.LEFT, AlignmentType.CENTER] }),
];

const doc = new Document({
  styles: B.styles(),
  sections: [{
    properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1134, right: 1134, bottom: 1134, left: 1418 } } },
    children: [...cover, ...toc],
  }],
});
Packer.toBuffer(doc).then((buf) => { fs.writeFileSync(outFile, buf); console.log("OK", outFile); })
  .catch((e) => { console.error("ERR bia", e); process.exit(1); });
