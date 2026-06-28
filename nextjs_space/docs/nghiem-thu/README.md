# Hồ sơ nghiệm thu — Phần mềm Tạp chí điện tử Nghệ thuật Quân sự Việt Nam

Bộ hồ sơ phục vụ nghiệm thu dự án phần mềm của **Tạp chí Nghệ thuật Quân sự Việt Nam — Học viện Quốc phòng**.
Tất cả tài liệu ở định dạng Word (`.docx`), trình bày theo bộ nhận diện NTQS (bìa, măng-sét, header/footer, logo HVQP), sẵn sàng in và trình ký.

## Danh mục tài liệu

| Mã hiệu | Tệp | Nội dung |
|---|---|---|
| NTQS-NT-00 | `00_Danh-muc-ho-so-nghiem-thu.docx` | Tờ trình đề nghị nghiệm thu + danh mục tài liệu + sản phẩm bàn giao |
| NTQS-NT-01 | `01_Bao-cao-tong-ket-du-an.docx` | Báo cáo tổng kết kết quả thực hiện dự án |
| NTQS-NT-02 | `02_Dac-ta-yeu-cau-phan-mem-SRS.docx` | Đặc tả yêu cầu phần mềm (FR + NFR) |
| NTQS-NT-03 | `03_Tai-lieu-thiet-ke-he-thong.docx` | Thiết kế kiến trúc, CSDL (67 model), API, tích hợp, triển khai |
| NTQS-NT-04 | `04_Phuong-an-an-toan-thong-tin.docx` | Phương án bảo đảm an toàn thông tin (ATTT) |
| NTQS-NT-05 | `05_Ma-tran-truy-vet-yeu-cau-RTM.docx` | Ma trận truy vết yêu cầu (yêu cầu ↔ thiết kế ↔ kiểm thử) |
| NTQS-NT-06 | `06_Ke-hoach-va-ket-qua-kiem-thu.docx` | Kế hoạch và kết quả kiểm thử (tự động + UAT) |
| NTQS-NT-07 | `07_Huong-dan-cai-dat-trien-khai.docx` | Hướng dẫn cài đặt, triển khai (online + air-gap) |
| NTQS-NT-08 | `08_Huong-dan-quan-tri-va-su-dung.docx` | Hướng dẫn quản trị và sử dụng theo 11 vai trò |
| NTQS-NT-09 | `09_Bieu-mau-phap-ly-quan-ly.docx` | Bộ biểu mẫu pháp lý/quản lý (có chỗ điền) |

## Bản PDF (lưu trữ / trình ký song song)

- `pdf/` — PDF từng tài liệu (đã bỏ trang mục lục trống do LibreOffice không cập nhật trường TOC khi convert).
- `HO-SO-NGHIEM-THU-NTQS-Full.pdf` — **PDF tổng**: bìa hồ sơ chung + trang “MỤC LỤC HỒ SƠ” (có số trang) + 10 tài liệu nối tiếp.

Mục lục bên trong từng tệp `.docx` vẫn hoạt động khi mở bằng Microsoft Word (chọn mục lục → *Update Field*).

## Lưu ý sử dụng

- **NTQS-NT-09** là biểu mẫu **có chỗ điền** (các vị trí `……`): đơn vị bổ sung số hiệu văn bản, thành phần Hội đồng, ngày tháng, điểm đánh giá và kết luận trước khi ban hành.
- Nội dung kỹ thuật (NT-01 → NT-06) được biên soạn bám sát hiện trạng triển khai thực tế của hệ thống.
- Mục lục (TOC) trong các tệp Word: mở tệp, chọn mục lục → *Update Field* → *Update entire table* để cập nhật số trang.

## Tái tạo bộ hồ sơ

Các tệp `.docx` được sinh tự động bằng thư viện `docx` (Node.js). Khi cần cập nhật nội dung,
sửa script trong thư mục `_generator/` rồi chạy:

```bash
# từ thư mục nextjs_space
bash docs/nghiem-thu/_generator/build.sh
```

Nguồn dữ liệu yêu cầu/kiểm thử dùng chung nằm tại `_generator/requirements.js`
(bảo đảm nhất quán giữa SRS, Báo cáo tổng kết và RTM); bố cục/branding dùng chung tại `_generator/branding.js`.
