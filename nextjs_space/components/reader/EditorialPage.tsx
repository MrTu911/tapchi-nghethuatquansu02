import { SERIF } from './types'

export default function EditorialPage({ C }: { C: Record<string, string> }) {
  return (
    <div style={{
      containerType: 'size',
      position: 'relative',
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      padding: '8.5cqmin 10cqmin',
      textAlign: 'left',
      color: C.text,
    }}>
      <div style={{ zIndex: 10 }}>
        <div style={{
          fontFamily: SERIF,
          fontSize: '5cqmin',
          fontWeight: 700,
          color: C.accent,
          marginBottom: '2cqmin',
          letterSpacing: '0.2cqmin',
        }}>
          Học viện Quốc phòng
        </div>
        <div style={{
          fontFamily: SERIF,
          fontSize: '8cqmin',
          fontWeight: 700,
          marginBottom: '6cqmin',
        }}>
          Tạp chí Nghệ thuật<br/>Quân sự Việt Nam
        </div>

        <div style={{ fontSize: '4.5cqmin', lineHeight: 1.6, marginBottom: '6cqmin', opacity: 0.85 }}>
          <strong>CƠ QUAN CHỦ QUẢN:</strong> Học viện Quốc phòng<br />
          <strong>TỔNG BIÊN TẬP:</strong> Đại tá, TS. Lê Ngọc Bảo<br />
          <strong>THƯ KÝ TÒA SOẠN:</strong> Thượng tá, ThS. Nguyễn Ngọc Nam
        </div>

        <div style={{ width: '20cqmin', height: '3px', background: C.accent, marginBottom: '6cqmin', opacity: 0.5 }} />

        <div style={{ fontSize: '4cqmin', lineHeight: 1.6, opacity: 0.75 }}>
          <strong>TÒA SOẠN:</strong><br />
          93 Hoàng Quốc Việt, Nghĩa Đô, Hà Nội.<br />
          Điện thoại: (069) 556 635<br />
          Email: tapchintqsvn@gmail.com<br /><br />
          Giấy phép xuất bản số 619/GP-BTTTT ngày 23-12-2020 do Bộ Thông tin và Truyền thông cấp.
        </div>
        
        {/* Bản quyền */}
        <div style={{ fontSize: '3.5cqmin', marginTop: '10cqmin', opacity: 0.5 }}>
          © Bản quyền thuộc về Học viện Quốc phòng.<br/>
          Nghiêm cấm sao chép dưới mọi hình thức nếu không có sự cho phép.
        </div>
      </div>
    </div>
  )
}
