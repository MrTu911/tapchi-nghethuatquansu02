#!/usr/bin/env python3
"""Xuất PDF cho 10 tài liệu nghiệm thu + gộp thành 1 PDF tổng có bìa và mục lục.

- Bỏ trang "MỤC LỤC" trống (trường TOC mà LibreOffice không populate khi convert headless).
- Sinh bìa hồ sơ tổng + trang "MỤC LỤC HỒ SƠ" với số trang chính xác trong PDF gộp.

Yêu cầu: LibreOffice (soffice), Node.js + gói docx, python pypdf.
Chạy:  python3 docs/nghiem-thu/_generator/build_pdf.py
"""
import os, sys, json, subprocess, shutil, tempfile
from pypdf import PdfReader, PdfWriter

GEN = os.path.dirname(os.path.abspath(__file__))
APP = os.path.abspath(os.path.join(GEN, "..", "..", ".."))   # nextjs_space
DOSSIER = os.path.join(APP, "docs", "nghiem-thu")
PDFDIR = os.path.join(DOSSIER, "pdf")
SOFFICE = shutil.which("soffice") or shutil.which("libreoffice")

DOCS = [
    ("00", "00_Danh-muc-ho-so-nghiem-thu",      "NTQS-NT-00", "Danh mục hồ sơ + Tờ trình",         False),
    ("01", "01_Bao-cao-tong-ket-du-an",         "NTQS-NT-01", "Báo cáo tổng kết dự án",            True),
    ("02", "02_Dac-ta-yeu-cau-phan-mem-SRS",    "NTQS-NT-02", "Đặc tả yêu cầu phần mềm (SRS)",      True),
    ("03", "03_Tai-lieu-thiet-ke-he-thong",     "NTQS-NT-03", "Tài liệu thiết kế hệ thống",        True),
    ("04", "04_Phuong-an-an-toan-thong-tin",    "NTQS-NT-04", "Phương án an toàn thông tin (ATTT)", True),
    ("05", "05_Ma-tran-truy-vet-yeu-cau-RTM",   "NTQS-NT-05", "Ma trận truy vết yêu cầu (RTM)",     True),
    ("06", "06_Ke-hoach-va-ket-qua-kiem-thu",   "NTQS-NT-06", "Kế hoạch và kết quả kiểm thử",       True),
    ("07", "07_Huong-dan-cai-dat-trien-khai",   "NTQS-NT-07", "Hướng dẫn cài đặt và triển khai",    True),
    ("08", "08_Huong-dan-quan-tri-va-su-dung",  "NTQS-NT-08", "Hướng dẫn quản trị và sử dụng",      True),
    ("09", "09_Bieu-mau-phap-ly-quan-ly",       "NTQS-NT-09", "Biểu mẫu pháp lý — quản lý",         False),
]
TMP = tempfile.mkdtemp(prefix="ntqs-pdf-")

def soffice_pdf(srcs, outdir):
    if not SOFFICE:
        sys.exit("Không tìm thấy LibreOffice (soffice). Hãy cài libreoffice.")
    subprocess.run([SOFFICE, "--headless", "--convert-to", "pdf", "--outdir", outdir, *srcs],
                   check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

def ptext(page):
    try: return page.extract_text() or ""
    except Exception: return ""

def strip_toc(src, dst):
    r = PdfReader(src); drop = set()
    if len(r.pages) >= 3:
        t = ptext(r.pages[1])
        if "MỤC LỤC" in t and "1." not in t:   # field TOC rỗng -> bỏ
            drop.add(1)
    w = PdfWriter()
    for i, pg in enumerate(r.pages):
        if i not in drop: w.add_page(pg)
    with open(dst, "wb") as f: w.write(f)
    return len(r.pages) - len(drop)

def count(path): return len(PdfReader(path).pages)

def gen_bia(pagemap, out_docx):
    pm = os.path.join(TMP, "pagemap.json")
    with open(pm, "w") as f: json.dump(pagemap, f, ensure_ascii=False)
    env = dict(os.environ, NODE_PATH=os.path.join(APP, "node_modules"))
    subprocess.run(["node", os.path.join(GEN, "bia.js"), pm, out_docx],
                   check=True, cwd=GEN, env=env,
                   stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)

def main():
    os.makedirs(PDFDIR, exist_ok=True)
    soffice_pdf([os.path.join(DOSSIER, f"{b}.docx") for _, b, *_ in DOCS], TMP)

    pages = {}
    for num, base, code, name, has_toc in DOCS:
        raw = os.path.join(TMP, f"{base}.pdf"); clean = os.path.join(PDFDIR, f"{base}.pdf")
        if has_toc:
            pages[num] = strip_toc(raw, clean)
        else:
            shutil.copyfile(raw, clean); pages[num] = count(clean)
    print("Số trang mỗi tài liệu:", {DOCS[i][2]: pages[DOCS[i][0]] for i in range(len(DOCS))})

    dummy = [{"code": c, "name": n, "page": None} for _, _, c, n, _ in DOCS]
    bia = os.path.join(TMP, "bia.docx"); gen_bia(dummy, bia); soffice_pdf([bia], TMP)
    fm = count(os.path.join(TMP, "bia.pdf"))
    start = fm + 1; real = []
    for num, _, c, n, _ in DOCS:
        real.append({"code": c, "name": n, "page": start}); start += pages[num]
    gen_bia(real, bia); soffice_pdf([bia], TMP)
    shutil.copyfile(os.path.join(TMP, "bia.pdf"), os.path.join(PDFDIR, "00_Bia-ho-so-tong.pdf"))

    out = os.path.join(DOSSIER, "HO-SO-NGHIEM-THU-NTQS-Full.pdf")
    w = PdfWriter()
    for pg in PdfReader(os.path.join(TMP, "bia.pdf")).pages: w.add_page(pg)
    for _, base, *_ in DOCS:
        for pg in PdfReader(os.path.join(PDFDIR, f"{base}.pdf")).pages: w.add_page(pg)
    with open(out, "wb") as f: w.write(f)
    print(f"PDF tổng: {count(out)} trang -> {out}")
    shutil.rmtree(TMP, ignore_errors=True)

if __name__ == "__main__":
    main()
