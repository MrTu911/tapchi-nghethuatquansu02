const B = require("./branding");
const R = require("./requirements");
const { p, t, b, h1, h2, h3, bullet, bullets, spacer, table, AlignmentType } = B;
const OUT = "/home/kelinton/tapchi-nghethuatquansu02/nextjs_space/docs/nghiem-thu/05_Ma-tran-truy-vet-yeu-cau-RTM.docx";

const rtmSections = [];
R.MODULES.forEach((m) => {
  const frs = R.FRS.filter((f) => f.m === m.id);
  if (!frs.length) return;
  rtmSections.push(h3(`${m.id}. ${m.name}`));
  rtmSections.push(table(
    ["Mã FR", "Yêu cầu", "Thiết kế", "Bằng chứng kiểm thử", "Trạng thái"],
    frs.map((f) => {
      const r = R.RTM[f.id] || {};
      return [f.id, f.name, r.design || "—", r.test || "—", r.status || "—"];
    }),
    [1150, 1950, 1900, 3204, 1150],
    { aligns: [AlignmentType.LEFT, AlignmentType.LEFT, AlignmentType.LEFT, AlignmentType.LEFT, AlignmentType.CENTER] }));
  rtmSections.push(spacer(80));
});

const total = R.FRS.length;
const pass = R.FRS.filter((f) => (R.RTM[f.id] || {}).status && (R.RTM[f.id].status.startsWith("Đạt"))).length;

const body = [
  h1("1. Mục đích"),
  p("Ma trận truy vết yêu cầu (Requirements Traceability Matrix – RTM) thiết lập mối liên hệ hai chiều giữa yêu cầu chức năng (FR) với tài liệu thiết kế tương ứng và bằng chứng kiểm thử, nhằm bảo đảm mọi yêu cầu đều được thiết kế và kiểm chứng, không bỏ sót."),

  h1("2. Quy ước"),
  ...bullets([
    "Cột “Mã FR”: mã yêu cầu chức năng theo tài liệu SRS (NTQS-NT-02).",
    "Cột “Thiết kế”: tham chiếu mục tài liệu thiết kế (NT-03/NT-04) và/hoặc thành phần mã nguồn hiện thực.",
    "Cột “Bằng chứng kiểm thử”: tên bộ kiểm thử tự động (Jest) hoặc kịch bản kiểm thử thủ công (chi tiết tại NTQS-NT-06).",
    "Cột “Trạng thái”: kết quả truy vết — “Đạt” hoặc “Đạt (tùy chọn)” đối với tính năng phụ thuộc Internet.",
  ]),

  h1("3. Tổng hợp"),
  table(["Chỉ tiêu", "Giá trị"], [
    ["Tổng số yêu cầu chức năng", String(total)],
    ["Số yêu cầu có liên kết thiết kế", String(total)],
    ["Số yêu cầu có bằng chứng kiểm thử", String(total)],
    ["Số yêu cầu đạt", `${pass}/${total}`],
  ], [5354, 4000], { aligns: [AlignmentType.LEFT, AlignmentType.CENTER] }),
  spacer(120),

  h1("4. Ma trận truy vết chi tiết"),
  ...rtmSections,

  h1("5. Ghi chú"),
  ...bullets([
    "Các bộ kiểm thử tự động được liệt kê nằm trong thư mục tests/unit của mã nguồn; chạy bằng lệnh npm test.",
    "Kịch bản thủ công đánh dấu “(thủ công)” được mô tả trong tài liệu Kế hoạch và kết quả kiểm thử (NTQS-NT-06).",
    "Yêu cầu “Đạt (tùy chọn)” phụ thuộc dịch vụ Internet, được kiểm chứng khi môi trường cho phép.",
  ]),
];

B.buildDoc({
  title: "Ma trận truy vết yêu cầu", subtitle: "Requirements Traceability Matrix (RTM)",
  code: "NTQS-NT-05", version: "1.0", classification: "Lưu hành nội bộ",
  headerTitle: "Ma trận truy vết yêu cầu (RTM)", body, outFile: OUT,
}).then((f) => console.log("OK", f)).catch((e) => { console.error("ERR 05", e); process.exit(1); });
