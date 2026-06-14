# Cải Tiến Giao Diện - Tạp chí HCQS

## Tổng Quan

Đã cải thiện giao diện của 2 trang quan trọng:
1. **Trang xem bài viết** (`/articles/[id]`) - Layout mới với PDF ở trung tâm
2. **Trang quy trình xuất bản** (`/publishing-process`) - Timeline đẹp, trực quan

---

## 1. Trang Xem Bài Viết

### 🎯 Vấn Đề Trước Đây
- PDF viewer ở sidebar (desktop) hoặc dưới cùng (mobile)
- Khó đọc toàn văn bài báo
- Metadata rải rác, không tập trung
- Thiếu điểm nhấn cho nội dung chính

### ✅ Cải Tiến

#### Layout Mới
```
┌─────────────────────────────────────────────────┐
│              Back Button                         │
├──────────────┬──────────────────────────────────┤
│   Sidebar    │        Main Content               │
│   (320px)    │        (Flexible)                 │
│   Sticky     │                                   │
│              │  1. Article Header + Abstract     │
│  • Author    │  2. ⭐ PDF VIEWER (CENTER) ⭐      │
│  • Metadata  │  3. HTML Content (if available)   │
│  • Stats     │  4. Related Articles              │
│  • Actions   │  5. Comments                      │
│  • Citation  │                                   │
│  • TOC       │                                   │
│              │                                   │
└──────────────┴──────────────────────────────────┘
```

#### Chi Tiết Cải Tiến

**1. Sidebar Bên Trái (320px, Sticky)**
- ✅ Compact và tổ chức tốt hơn
- ✅ Tất cả metadata trong 1 card
- ✅ Author info nổi bật với avatar gradient
- ✅ Stats hiển thị dạng grid 2 cột
- ✅ Action buttons full-width
- ✅ Citation box và Table of Contents

**2. Main Content - PDF Ở Trung Tâm**
- ✅ PDF viewer có header gradient đẹp (emerald to teal)
- ✅ Nút "Tải về" ngay trong header PDF viewer
- ✅ PDF hiển thị lớn, rõ ràng ở vị trí trung tâm
- ✅ Abstract được đưa vào trong article header
- ✅ Keywords có border và icon phân biệt

**3. Responsive**
- Mobile: Sidebar xuống dưới, content lên trên (order-1/order-2)
- Desktop: Sidebar sticky bên trái, content bên phải

### 🎨 Style Highlights
```css
/* Sidebar Card */
- shadow-lg, sticky top-8
- Category badge: w-full, justify-center
- Author avatar: 14x14, gradient emerald-teal
- Stats: grid 2 cols, bold numbers
- Buttons: full-width, gradient

/* PDF Viewer */
- Card: shadow-xl, border-2 emerald-100
- Header: gradient emerald-600 to teal-600
- Download button: white/20 overlay
```

---

## 2. Trang Quy Trình Xuất Bản

### 🎯 Vấn Đề Trước Đây
- Redirect sang CMS dynamic page
- Nội dung chung chung, không chi tiết
- Không có timeline hoặc flowchart
- Thiếu thông tin về thời gian và quy trình

### ✅ Cải Tiến

#### Timeline Style với 7 Bước
```
┌─────────────────────────────────────────────────┐
│          Header (Centered)                       │
│  - Badge: "Hướng dẫn cho Tác giả"               │
│  - Title: Quy trình Xuất bản Bài báo            │
│  - Duration: 50-80 ngày                          │
├─────────────────────────────────────────────────┤
│                                                  │
│        ○ ← Vertical Gradient Line →             │
│    ┌───────────────────────────────┐            │
│    │  Step 1: Nộp Bài (1-2 ngày)   │            │
│    └───────────────────────────────┘            │
│        ○                                         │
│    ┌───────────────────────────────┐            │
│    │  Step 2: Kiểm tra (3-5 ngày)  │            │
│    └───────────────────────────────┘            │
│        ○                                         │
│        ... (7 steps total)                       │
│        ○                                         │
├─────────────────────────────────────────────────┤
│          Important Notes Card                    │
│          CTA: Nộp bài ngay                       │
└─────────────────────────────────────────────────┘
```

#### Các Bước Quy Trình

**1. Nộp Bài** (1-2 ngày)
- Icon: Send (blue gradient)
- Chi tiết: Đăng ký, điền form, upload file
- Tips: Tuân thủ template

**2. Kiểm tra Sơ bộ** (3-5 ngày)
- Icon: FileEdit (emerald gradient)
- Chi tiết: Kiểm tra phù hợp, định dạng
- Outcomes: Chuyển phản biện / Chỉnh sửa / Từ chối

**3. Phản Biện** (20-30 ngày)
- Icon: UserCheck (purple gradient)
- Chi tiết: 2-3 phản biện viên đánh giá
- Tips: Double Blind Review

**4. Quyết định Biên tập** (5-7 ngày)
- Icon: FileCheck (orange gradient)
- Chi tiết: Tổng hợp ý kiến, quyết định
- Outcomes: Chấp nhận / Sửa nhỏ / Sửa lớn / Từ chối

**5. Chỉnh sửa & Duyệt lại** (10-15 ngày)
- Icon: RefreshCcw (cyan gradient)
- Chi tiết: Tác giả sửa và gửi lại
- Tips: Trả lời chi tiết từng góp ý

**6. Sản xuất & Trình bày** (7-10 ngày)
- Icon: Layout (pink gradient)
- Chi tiết: Biên tập bố cục, tạo PDF
- Tips: Kiểm tra kỹ bản proof

**7. Xuất bản** (1-2 ngày)
- Icon: BookOpen (teal gradient)
- Chi tiết: Gán DOI, đăng tải
- Tips: Có thể trích dẫn ngay

#### Chi Tiết Mỗi Bước

**Cấu Trúc Card:**
```tsx
┌─────────────────────────────────────┐
│ [Icon]  Step Title       [Duration] │
│         Description                 │
├─────────────────────────────────────┤
│ Chi tiết:                           │
│  ✓ Step 1                           │
│  ✓ Step 2                           │
│  ✓ Step 3                           │
│  ✓ Step 4                           │
├─────────────────────────────────────┤
│ Kết quả có thể: (if applicable)    │
│  [✓ Accept] [↻ Revise] [✗ Reject]  │
├─────────────────────────────────────┤
│ ⚠ Lưu ý: Important tip here        │
└─────────────────────────────────────┘
```

**Desktop Timeline:**
- Vertical gradient line (blue → purple → teal)
- Steps alternate left/right (zigzag)
- Step number badge ở giữa line
- Cards hover effect (shadow-2xl)

**Mobile Timeline:**
- Icon ở trên cùng trong card
- Linear layout (top to bottom)
- No alternating sides

### 🎨 Color Palette
```javascript
blue:    gradient from-blue-500 to-cyan-500
emerald: gradient from-emerald-500 to-teal-500
purple:  gradient from-purple-500 to-pink-500
orange:  gradient from-orange-500 to-red-500
cyan:    gradient from-cyan-500 to-blue-500
pink:    gradient from-pink-500 to-rose-500
teal:    gradient from-teal-500 to-emerald-500
```

### 🎯 Outcomes Badge Colors
```javascript
green:  Success (Chấp nhận, Chuyển phản biện)
yellow: Warning (Sửa lớn)
blue:   Info (Sửa nhỏ)
red:    Error (Từ chối)
```

---

## 3. Lợi Ích Người Dùng

### Trang Xem Bài Viết
✅ **Dễ đọc hơn**: PDF ở trung tâm, kích thước lớn  
✅ **Tìm thông tin nhanh**: Sidebar tổ chức tốt  
✅ **Trải nghiệm tốt**: Sticky sidebar, smooth scroll  
✅ **Responsive**: Hoạt động tốt trên mọi thiết bị  
✅ **Professional**: Gradient, shadows, spacing  

### Trang Quy Trình Xuất Bản
✅ **Hiểu rõ quy trình**: Timeline 7 bước chi tiết  
✅ **Biết thời gian**: Duration cho mỗi bước  
✅ **Chuẩn bị tốt**: Tips và lưu ý quan trọng  
✅ **Biết outcomes**: Các kết quả có thể xảy ra  
✅ **Call-to-action**: Nút "Nộp bài ngay" nổi bật  

---

## 4. Technical Details

### Files Changed
```
app/(public)/articles/[id]/page.tsx       (Major redesign)
app/(public)/publishing-process/page.tsx  (Complete rewrite)
```

### Dependencies Used
- **Existing**: lucide-react icons, shadcn/ui components
- **No new packages**: Chỉ sử dụng Tailwind CSS

### Performance
- Static rendering where possible
- Dynamic imports cho PDF viewer
- Optimized images với Next.js Image
- Minimal JavaScript

---

## 5. Testing Checklist

### Trang Xem Bài Viết
- [ ] PDF viewer hiển thị ở trung tâm
- [ ] Sidebar sticky hoạt động
- [ ] Stats counter đúng
- [ ] Download button hoạt động
- [ ] Share button hoạt động
- [ ] Citation box hiển thị đúng
- [ ] TOC hoạt động (nếu có HTML content)
- [ ] Responsive trên mobile
- [ ] Related articles hiển thị
- [ ] Comments section hoạt động

### Trang Quy Trình Xuất Bản
- [ ] Timeline hiển thị 7 bước
- [ ] Vertical line gradient đẹp (desktop)
- [ ] Cards alternate left/right (desktop)
- [ ] Icons và colors đúng
- [ ] Outcomes badges hiển thị
- [ ] Tips/notes hiển thị
- [ ] Important notes card
- [ ] CTA button hoạt động
- [ ] Responsive trên mobile
- [ ] Back button hoạt động

---

## 6. Future Enhancements

### Trang Xem Bài Viết
- [ ] Add print button
- [ ] Add bookmark feature
- [ ] Add reading progress tracker
- [ ] Add related videos/media
- [ ] Add article recommendations AI

### Trang Quy Trình Xuất Bản
- [ ] Add animated timeline
- [ ] Add progress tracker cho submission
- [ ] Add interactive FAQ
- [ ] Add video tutorials
- [ ] Add downloadable checklist PDF

---

**Date**: 2026-01-08  
**Version**: 2.1  
**Status**: ✅ Completed
