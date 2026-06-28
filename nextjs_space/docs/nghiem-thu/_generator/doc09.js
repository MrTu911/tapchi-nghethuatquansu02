const B = require("./branding");
const { p, t, b, h1, h2, h3, bullet, bullets, spacer, pageBreak, table, centered,
  nationalMasthead, signatureBlock, AlignmentType } = B;
const OUT = "/home/kelinton/tapchi-nghethuatquansu02/nextjs_space/docs/nghiem-thu/09_Bieu-mau-phap-ly-quan-ly.docx";

const dot = (label, after = 80) => p([b(label + " "), t("………………………………………………………………")], { after });
const fld = (label, val) => p([b(label + " "), t(val || "……………………………………")], { after: 60 });

// Bảng tiêu chí đánh giá dùng chung (Phiếu nhận xét + Biên bản nghiệm thu)
const criteria = [
  ["1", "Mức độ đầy đủ chức năng so với yêu cầu (SRS)", "25", "……"],
  ["2", "Chất lượng kỹ thuật: kiến trúc, cơ sở dữ liệu, mã nguồn", "20", "……"],
  ["3", "An toàn thông tin (xác thực, phân quyền, kiểm toán)", "20", "……"],
  ["4", "Kết quả kiểm thử và độ ổn định", "15", "……"],
  ["5", "Tài liệu hồ sơ (đầy đủ, rõ ràng, đúng nhận diện NTQS)", "10", "……"],
  ["6", "Khả năng triển khai, vận hành, bảo trì", "10", "……"],
  ["", "TỔNG ĐIỂM", "100", "……"],
];
const criteriaTable = () => table(["STT", "Tiêu chí đánh giá", "Điểm tối đa", "Điểm chấm"], criteria,
  [800, 5754, 1400, 1400], { aligns: [AlignmentType.CENTER, AlignmentType.LEFT, AlignmentType.CENTER, AlignmentType.CENTER] });

const intro = [
  h1("Hướng dẫn sử dụng bộ biểu mẫu"),
  p("Tài liệu cung cấp các biểu mẫu phục vụ tổ chức nghiệm thu. Đây là biểu mẫu có chỗ điền: đơn vị bổ sung số hiệu văn bản, thành phần hội đồng, ngày tháng, điểm đánh giá và kết luận trước khi ban hành. Các vị trí “……” là phần cần điền."),
  ...bullets([
    "Mẫu 01 — Quyết định thành lập Hội đồng nghiệm thu.",
    "Mẫu 02 — Biên bản họp Hội đồng nghiệm thu.",
    "Mẫu 03 — Phiếu nhận xét, đánh giá của thành viên Hội đồng.",
    "Mẫu 04 — Biên bản nghiệm thu (kết luận).",
  ]),
  p([b("Lưu ý: "), t("nội dung pháp lý/hành chính do đơn vị quyết định; các thông tin định danh sản phẩm đã được điền sẵn theo Tạp chí Nghệ thuật Quân sự Việt Nam — Học viện Quốc phòng.")]),
  pageBreak(),
];

// ---- Mẫu 01: Quyết định ----
const form1 = [
  nationalMasthead(["HỌC VIỆN QUỐC PHÒNG"], { docNo: "      /QĐ-……" }),
  spacer(120),
  centered("QUYẾT ĐỊNH", { bold: true, size: 30, color: B.GREEN }, 20),
  centered("Về việc thành lập Hội đồng nghiệm thu dự án phần mềm", { bold: true, size: 25 }, 20),
  centered("“Tạp chí điện tử Nghệ thuật Quân sự Việt Nam”", { italics: true, size: 25 }, 160),
  p([b("THỦ TRƯỞNG ……………………………")], { align: AlignmentType.CENTER, after: 120 }),
  p([t("Căn cứ chức năng, nhiệm vụ, quyền hạn của ………………………………;")]),
  p([t("Căn cứ kế hoạch xây dựng và triển khai phần mềm “Tạp chí điện tử Nghệ thuật Quân sự Việt Nam”;")]),
  p([t("Xét đề nghị của ………………………………,")]),
  p([b("QUYẾT ĐỊNH:")], { align: AlignmentType.CENTER, after: 120 }),
  p([b("Điều 1. "), t("Thành lập Hội đồng nghiệm thu dự án phần mềm “Tạp chí điện tử Nghệ thuật Quân sự Việt Nam” gồm các ông (bà) có tên sau:")]),
  p([t("1. ……………………………… — Chủ tịch Hội đồng;")], { after: 40 }),
  p([t("2. ……………………………… — Ủy viên phản biện;")], { after: 40 }),
  p([t("3. ……………………………… — Ủy viên phản biện;")], { after: 40 }),
  p([t("4. ……………………………… — Ủy viên;")], { after: 40 }),
  p([t("5. ……………………………… — Ủy viên Thư ký.")], { after: 80 }),
  p([b("Điều 2. "), t("Hội đồng có nhiệm vụ tổ chức nghiệm thu, đánh giá kết quả thực hiện dự án theo quy định; tự giải thể sau khi hoàn thành nhiệm vụ.")]),
  p([b("Điều 3. "), t("Quyết định có hiệu lực kể từ ngày ký. Các tổ chức, cá nhân có liên quan chịu trách nhiệm thi hành Quyết định này./.")]),
  spacer(160),
  ...signatureBlock([
    { role: "Nơi nhận:", subRole: "- Như Điều 3;  - Lưu: VT.", title: " ", name: " " },
    { role: "THỦ TRƯỞNG", subRole: "(Ký tên, đóng dấu)", stamp: true, title: " ", name: "……………………………" },
  ], null),
  pageBreak(),
];

// ---- Mẫu 02: Biên bản họp hội đồng ----
const form2 = [
  nationalMasthead(["HỌC VIỆN QUỐC PHÒNG", "HỘI ĐỒNG NGHIỆM THU"], { docNo: "      /BB-HĐNT" }),
  spacer(120),
  centered("BIÊN BẢN HỌP HỘI ĐỒNG NGHIỆM THU", { bold: true, size: 30, color: B.GREEN }, 20),
  centered("Dự án phần mềm “Tạp chí điện tử Nghệ thuật Quân sự Việt Nam”", { italics: true, size: 24 }, 160),
  fld("Thời gian:", "….. giờ ….., ngày ….. tháng ….. năm 2026."),
  fld("Địa điểm:", "………………………………………………………"),
  h3("I. Thành phần Hội đồng"),
  p([t("- Chủ tịch Hội đồng: ………………………………;")], { after: 40 }),
  p([t("- Ủy viên phản biện: ………………………………;")], { after: 40 }),
  p([t("- Các ủy viên: ………………………………;")], { after: 40 }),
  p([t("- Ủy viên Thư ký: ………………………………;")], { after: 40 }),
  p([t("- Thành viên vắng mặt (nếu có): ………………………")], { after: 60 }),
  fld("Đại biểu, khách mời:", "………………………………………"),
  h3("II. Nội dung làm việc"),
  p([t("1. Thư ký công bố Quyết định thành lập Hội đồng và chương trình làm việc.")], { after: 40 }),
  p([t("2. Đại diện nhóm thực hiện trình bày Báo cáo tổng kết kết quả dự án (NTQS-NT-01).")], { after: 40 }),
  p([t("3. Ủy viên phản biện trình bày nhận xét, đánh giá.")], { after: 40 }),
  p([t("4. Hội đồng trao đổi, đặt câu hỏi; nhóm thực hiện giải trình.")], { after: 60 }),
  dot("Tóm tắt ý kiến thảo luận:"),
  dot(""),
  dot(""),
  h3("III. Kết luận và biểu quyết"),
  fld("- Điểm trung bình của Hội đồng:", "…… / 100 điểm."),
  fld("- Kết luận:", "Đạt / Không đạt (khoanh chọn)."),
  dot("- Kiến nghị, yêu cầu chỉnh sửa (nếu có):"),
  dot(""),
  p([t("Biên bản được lập thành ….. bản, đọc lại cho Hội đồng cùng nghe và thống nhất thông qua.")]),
  spacer(160),
  ...signatureBlock([
    { role: "THƯ KÝ HỘI ĐỒNG", subRole: "(Ký, ghi rõ họ tên)", title: " ", name: "……………………………" },
    { role: "CHỦ TỊCH HỘI ĐỒNG", subRole: "(Ký, ghi rõ họ tên)", title: " ", name: "……………………………" },
  ], null),
  pageBreak(),
];

// ---- Mẫu 03: Phiếu nhận xét đánh giá ----
const form3 = [
  nationalMasthead(["HỌC VIỆN QUỐC PHÒNG", "HỘI ĐỒNG NGHIỆM THU"], { docNo: "" }),
  spacer(120),
  centered("PHIẾU NHẬN XÉT, ĐÁNH GIÁ", { bold: true, size: 30, color: B.GREEN }, 20),
  centered("(Dành cho thành viên Hội đồng nghiệm thu)", { italics: true, size: 23 }, 160),
  fld("Họ và tên thành viên:", "………………………………………"),
  fld("Chức danh trong Hội đồng:", "………………………………"),
  fld("Tên sản phẩm:", "Phần mềm “Tạp chí điện tử Nghệ thuật Quân sự Việt Nam”."),
  h3("I. Nhận xét chung"),
  dot("Ưu điểm:"),
  dot(""),
  dot("Hạn chế, tồn tại:"),
  dot(""),
  h3("II. Đánh giá theo tiêu chí"),
  criteriaTable(),
  spacer(80),
  h3("III. Kết luận"),
  fld("- Tổng điểm:", "…… / 100 điểm."),
  fld("- Đề nghị:", "Nghiệm thu / Nghiệm thu có chỉnh sửa / Chưa nghiệm thu (khoanh chọn)."),
  dot("- Yêu cầu chỉnh sửa cụ thể (nếu có):"),
  dot(""),
  spacer(160),
  ...signatureBlock([
    { role: " ", subRole: " ", title: " ", name: " " },
    { role: "THÀNH VIÊN HỘI ĐỒNG", subRole: "(Ký, ghi rõ họ tên)", title: " ", name: "……………………………" },
  ], "……………, ngày ….. tháng ….. năm 2026"),
  pageBreak(),
];

// ---- Mẫu 04: Biên bản nghiệm thu ----
const form4 = [
  nationalMasthead(["HỌC VIỆN QUỐC PHÒNG", "HỘI ĐỒNG NGHIỆM THU"], { docNo: "      /BBNT-HĐNT" }),
  spacer(120),
  centered("BIÊN BẢN NGHIỆM THU", { bold: true, size: 32, color: B.GREEN }, 20),
  centered("Dự án phần mềm “Tạp chí điện tử Nghệ thuật Quân sự Việt Nam”", { italics: true, size: 24 }, 160),
  p([t("Căn cứ Quyết định số ……/QĐ-…… ngày ….. tháng ….. năm ….. về việc thành lập Hội đồng nghiệm thu;")]),
  p([t("Căn cứ hồ sơ nghiệm thu và kết quả làm việc của Hội đồng,")]),
  fld("Hôm nay, vào lúc:", "….. giờ ….., ngày ….. tháng ….. năm 2026, tại ………………………"),
  p([t("Hội đồng nghiệm thu tiến hành nghiệm thu sản phẩm với các nội dung sau:")]),
  h3("I. Thông tin sản phẩm"),
  fld("- Tên sản phẩm:", "Phần mềm “Tạp chí điện tử Nghệ thuật Quân sự Việt Nam” (JVMA)."),
  fld("- Đơn vị chủ quản:", "Học viện Quốc phòng."),
  fld("- Chủ đầu tư/Tòa soạn:", "Tạp chí Nghệ thuật Quân sự Việt Nam."),
  h3("II. Thành phần Hội đồng"),
  p([t("- Có mặt: …… / …… thành viên (danh sách kèm theo).")], { after: 60 }),
  h3("III. Kết quả nghiệm thu"),
  p([t("Hội đồng đã xem xét hồ sơ, nghe báo cáo, nhận xét phản biện và đánh giá theo các tiêu chí:")]),
  criteriaTable(),
  spacer(80),
  fld("- Điểm trung bình của Hội đồng:", "…… / 100 điểm."),
  fld("- Xếp loại:", "Xuất sắc / Tốt / Đạt / Không đạt (theo thang điểm của đơn vị)."),
  fld("- Kết luận:", "Sản phẩm ĐẠT / KHÔNG ĐẠT yêu cầu nghiệm thu (khoanh chọn)."),
  dot("- Kiến nghị của Hội đồng:"),
  dot(""),
  p([t("Biên bản được lập thành ….. bản có giá trị như nhau, được Hội đồng thông qua./.")]),
  spacer(160),
  ...signatureBlock([
    { role: "THƯ KÝ HỘI ĐỒNG", subRole: "(Ký, ghi rõ họ tên)", title: " ", name: "……………………" },
    { role: "CHỦ TỊCH HỘI ĐỒNG", subRole: "(Ký, ghi rõ họ tên)", title: " ", name: "……………………" },
  ], null),
  spacer(120),
  p([b("Đại diện các bên liên quan")], { align: AlignmentType.CENTER, after: 80 }),
  ...signatureBlock([
    { role: "ĐẠI DIỆN NHÓM THỰC HIỆN", subRole: "(Ký, ghi rõ họ tên)", title: " ", name: "……………………" },
    { role: "ĐẠI DIỆN ĐƠN VỊ TIẾP NHẬN", subRole: "(Ký, ghi rõ họ tên)", title: " ", name: "……………………" },
  ], null),
];

const body = [...intro, ...form1, ...form2, ...form3, ...form4];

B.buildDoc({
  title: "Bộ biểu mẫu pháp lý — quản lý", subtitle: "Biểu mẫu nghiệm thu có chỗ điền",
  code: "NTQS-NT-09", version: "1.0", classification: "Lưu hành nội bộ",
  headerTitle: "Biểu mẫu pháp lý — quản lý nghiệm thu",
  withToc: false, body, outFile: OUT,
}).then((f) => console.log("OK", f)).catch((e) => { console.error("ERR 09", e); process.exit(1); });
