# Cấu trúc hệ thống Module của KindleReader

Thư mục này chứa toàn bộ mã nguồn của giao diện Trình đọc sách (KindleReader) dành cho Tạp chí Nghệ thuật Quân sự. Để dễ dàng nâng cấp, bảo trì và tìm lỗi, mã nguồn đã được chia tách thành các module riêng biệt như sau:

## 1. Dữ liệu và Cấu hình (Data & Config)
- **`types.ts`**: Chứa toàn bộ các định nghĩa TypeScript (Interfaces, Types) như `ReaderSettings` và các hằng số màu sắc, font chữ. Việc đưa type ra file riêng giúp các components khác có thể import dễ dàng mà không bị phụ thuộc vòng (circular dependency).
- **`styles.ts`**: Chứa chuỗi văn bản định dạng CSS. Thay vì code CSS cứng vào trong Component, nó được tách riêng ra đây. Nếu mai sau muốn đổi màu hay đổi kiểu dáng toàn bộ tạp chí, chỉ cần sửa file này.

## 2. Giao diện (UI Components)
- **`ReaderHeader.tsx`**: Thanh công cụ nằm ở cạnh trên màn hình. Bao gồm các nút: Quay lại, phóng to/thu nhỏ cỡ chữ, chuyển chế độ 1/2 trang, và đổi màu nền (sáng/tối).
- **`ReaderSidebar.tsx`**: Thanh Mục lục (Table of Contents) nằm ở cạnh trái. Chứa logic nhấp chuột vào chuyên mục, tự động tính toán để bôi đậm bài đang đọc (is-active).
- **`CoverPage.tsx`**: Giao diện hiển thị Bìa tạp chí (khi `currentIdx === -1`).
- **`Article.tsx`**: Giao diện hiển thị chi tiết một bài báo (khi `currentIdx >= 0`). Nó bao gồm phần xử lý tiêu đề, tóm tắt, từ khóa, văn bản, và tài liệu tham khảo.

## 3. Trái tim Hệ thống (Core Logic)
- **`useReaderLayout.ts`**: Hook này là bộ não của cả trình đọc. Nó đảm nhận việc: Đo đạc kích thước màn hình (resize), tính toán thuật toán chia cột (CSS multi-column), tính tổng số trang (totalSpreads), và xử lý các thao tác chuyển trang (bấm nút, bấm phím mũi tên).

## 4. Lắp ráp (Orchestrator)
- **`KindleReader.tsx`**: Trạm trung chuyển cuối cùng. Nó thu thập Dữ liệu (từ JSON), gọi Hook (từ `useReaderLayout.ts`), và truyền dữ liệu xuống các Component (từ thư mục UI) để vẽ ra toàn bộ màn hình trình đọc mà bạn đang thấy.
