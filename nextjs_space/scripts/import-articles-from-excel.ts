// @ts-nocheck - DEPRECATED: This script needs refactoring for local-storage API
/**
 * Script import hàng loạt bài báo từ file Excel + PDF
 * 
 * CÁCH SỬ DỤNG:
 * 1. Chuẩn bị file Excel theo template IMPORT_TEMPLATE.xlsx
 * 2. Đặt tất cả file PDF vào folder `./pdf-imports/`
 * 3. Chạy: yarn tsx scripts/import-articles-from-excel.ts <đường-dẫn-file-excel>
 * 
 * VÍ DỤ:
 * yarn tsx scripts/import-articles-from-excel.ts ./scripts/articles-import.xlsx
 */

import { PrismaClient, SubmissionStatus, Role } from '@prisma/client';
import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { saveFile } from '../lib/local-storage';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

// Đường dẫn folder chứa PDF files
const PDF_FOLDER = path.join(__dirname, 'pdf-imports');

interface ArticleImportRow {
  stt: number;
  maBaiBao: string;
  tieuDeVN: string;
  tieuDeEN?: string;
  tacGia: string;
  emailTacGia: string;
  donVi: string;
  tomTatVN: string;
  tomTatEN?: string;
  tuKhoa: string; // Phân cách bằng dấu phẩy
  danhMuc: string; // Tên hoặc mã danh mục
  namXuatBan: number;
  soTapChi: number;
  tapTapChi?: number;
  trangBatDau?: string;
  trangKetThuc?: string;
  trangSo?: string; // Ví dụ: "1-10" hoặc "5-15"
  trangSoFormat?: string; // Ví dụ: "pp. 1-10"
  tenFilePDF: string; // Tên file PDF (ví dụ: "article-001.pdf")
  trangThai: 'PUBLISHED' | 'REJECTED'; // PUBLISHED = đã đăng, REJECTED = không duyệt
  doi?: string; // DOI (nếu có)
  ghiChu?: string;
}

interface ImportStats {
  total: number;
  success: number;
  failed: number;
  skipped: number;
  errors: Array<{ row: number; error: string }>;
}

/**
 * Đọc file Excel và parse thành array of ArticleImportRow
 */
async function readExcelFile(filePath: string): Promise<ArticleImportRow[]> {
  console.log(`\n📂 Đọc file Excel: ${filePath}`);
  
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  
  const worksheet = workbook.getWorksheet(1); // Sheet đầu tiên
  if (!worksheet) {
    throw new Error('Không tìm thấy sheet nào trong file Excel');
  }

  const rows: ArticleImportRow[] = [];
  
  // Bỏ qua row 1 (header)
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // Skip header
    
    const rowData: ArticleImportRow = {
      stt: Number(row.getCell(1).value) || rowNumber - 1,
      maBaiBao: String(row.getCell(2).value || '').trim(),
      tieuDeVN: String(row.getCell(3).value || '').trim(),
      tieuDeEN: String(row.getCell(4).value || '').trim() || undefined,
      tacGia: String(row.getCell(5).value || '').trim(),
      emailTacGia: String(row.getCell(6).value || '').trim(),
      donVi: String(row.getCell(7).value || '').trim(),
      tomTatVN: String(row.getCell(8).value || '').trim(),
      tomTatEN: String(row.getCell(9).value || '').trim() || undefined,
      tuKhoa: String(row.getCell(10).value || '').trim(),
      danhMuc: String(row.getCell(11).value || '').trim(),
      namXuatBan: Number(row.getCell(12).value) || new Date().getFullYear(),
      soTapChi: Number(row.getCell(13).value) || 1,
      tapTapChi: Number(row.getCell(14).value) || undefined,
      trangBatDau: String(row.getCell(15).value || '').trim() || undefined,
      trangKetThuc: String(row.getCell(16).value || '').trim() || undefined,
      trangSo: String(row.getCell(17).value || '').trim() || undefined,
      trangSoFormat: String(row.getCell(18).value || '').trim() || undefined,
      tenFilePDF: String(row.getCell(19).value || '').trim(),
      trangThai: (String(row.getCell(20).value || '').trim().toUpperCase() === 'PUBLISHED' ? 'PUBLISHED' : 'REJECTED') as 'PUBLISHED' | 'REJECTED',
      doi: String(row.getCell(21).value || '').trim() || undefined,
      ghiChu: String(row.getCell(22).value || '').trim() || undefined,
    };
    
    // Validate required fields
    if (rowData.tieuDeVN && rowData.tacGia && rowData.tenFilePDF) {
      rows.push(rowData);
    }
  });
  
  console.log(`✅ Đã đọc ${rows.length} dòng dữ liệu hợp lệ`);
  return rows;
}

/**
 * Tìm hoặc tạo User (tác giả)
 */
async function findOrCreateAuthor(data: ArticleImportRow): Promise<any> {
  // Tìm user theo email
  let user = await prisma.user.findUnique({
    where: { email: data.emailTacGia },
  });
  
  if (!user) {
    console.log(`  📝 Tạo tác giả mới: ${data.tacGia} (${data.emailTacGia})`);
    
    // Tạo user mới với role AUTHOR
    user = await prisma.user.create({
      data: {
        email: data.emailTacGia,
        fullName: data.tacGia,
        org: data.donVi,
        role: Role.AUTHOR,
        passwordHash: '', // Không cần password cho import
        isActive: true,
        emailVerified: false,
        status: 'APPROVED',
        approvedAt: new Date(),
        approvedBy: 'SYSTEM_IMPORT',
      },
    });
  }
  
  return user;
}

/**
 * Tìm hoặc tạo Category
 */
async function findOrCreateCategory(categoryName: string): Promise<any> {
  // Tìm category theo tên hoặc code
  let category = await prisma.category.findFirst({
    where: {
      OR: [
        { name: { contains: categoryName, mode: 'insensitive' } },
        { code: { contains: categoryName, mode: 'insensitive' } },
      ],
    },
  });
  
  if (!category) {
    console.log(`  📂 Tạo danh mục mới: ${categoryName}`);
    
    // Tạo slug từ tên danh mục
    const slug = categoryName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    // Tạo code ngắn gọn (3-5 ký tự)
    const code = slug.substring(0, 5).toUpperCase();
    
    category = await prisma.category.create({
      data: {
        name: categoryName,
        slug,
        code,
        description: `Danh mục ${categoryName}`,
      },
    });
  }
  
  return category;
}

/**
 * Tìm hoặc tạo Issue (số tạp chí)
 */
async function findOrCreateIssue(year: number, issueNumber: number, volumeNumber?: number): Promise<any> {
  // Tìm hoặc tạo Volume
  let volume = await prisma.volume.findFirst({
    where: {
      year,
      volumeNo: volumeNumber || 1,
    },
  });
  
  if (!volume) {
    console.log(`  📚 Tạo Volume mới: Tập ${volumeNumber || 1}, Năm ${year}`);
    volume = await prisma.volume.create({
      data: {
        volumeNo: volumeNumber || 1,
        year,
        title: `Tập ${volumeNumber || 1} - Năm ${year}`,
      },
    });
  }
  
  // Tìm hoặc tạo Issue
  let issue = await prisma.issue.findFirst({
    where: {
      volumeId: volume.id,
      number: issueNumber,
      year,
    },
  });
  
  if (!issue) {
    console.log(`  📖 Tạo Issue mới: Số ${issueNumber}, Tập ${volume.volumeNo}, Năm ${year}`);
    issue = await prisma.issue.create({
      data: {
        volumeId: volume.id,
        number: issueNumber,
        year,
        title: `Số ${issueNumber} - Tập ${volume.volumeNo} - Năm ${year}`,
        status: 'PUBLISHED',
        publishDate: new Date(year, 0, 1), // 1st Jan of that year
      },
    });
  }
  
  return issue;
}

/**
 * Upload PDF file lên S3
 */
async function uploadPDFFile(fileName: string, articleCode: string): Promise<string | null> {
  const pdfPath = path.join(PDF_FOLDER, fileName);
  
  if (!fs.existsSync(pdfPath)) {
    console.log(`  ⚠️  File PDF không tồn tại: ${fileName}`);
    return null;
  }
  
  try {
    const fileBuffer = fs.readFileSync(pdfPath);
    const s3Key = `articles/${Date.now()}-${articleCode}-${fileName}`;
    
    console.log(`  📤 Upload PDF: ${fileName} (${(fileBuffer.length / 1024 / 1024).toFixed(2)} MB)`);
    
    const cloudPath = await saveFile(fileBuffer, s3Key, 'application/pdf');
    console.log(`  ✅ Upload thành công: ${cloudPath}`);
    
    return cloudPath;
  } catch (error: any) {
    console.error(`  ❌ Lỗi upload PDF: ${error.message}`);
    return null;
  }
}

/**
 * Import một bài báo
 */
async function importArticle(data: ArticleImportRow, stats: ImportStats): Promise<void> {
  console.log(`\n[${data.stt}] Import: ${data.tieuDeVN}`);
  
  try {
    // 1. Tìm/tạo tác giả
    const author = await findOrCreateAuthor(data);
    
    // 2. Tìm/tạo danh mục
    const category = await findOrCreateCategory(data.danhMuc);
    
    // 3. Tìm/tạo Issue
    const issue = await findOrCreateIssue(data.namXuatBan, data.soTapChi, data.tapTapChi);
    
    // 4. Upload PDF file
    const pdfCloudPath = await uploadPDFFile(data.tenFilePDF, data.maBaiBao);
    
    // 5. Parse keywords
    const keywords = data.tuKhoa.split(',').map(k => k.trim()).filter(Boolean);
    
    // 6. Tạo Submission
    // Note: Submission model only has 'title' (not titleEn), so we use Vietnamese title
    // English title from data.tieuDeEN will be stored in Article metadata if needed
    const submission = await prisma.submission.create({
      data: {
        code: data.maBaiBao,
        title: data.tieuDeVN,
        abstractVn: data.tomTatVN,
        abstractEn: data.tomTatEN,
        keywords,
        createdBy: author.id,
        categoryId: category.id,
        status: data.trangThai === 'PUBLISHED' ? 'PUBLISHED' : 'REJECTED',
      },
    });
    
    console.log(`  ✅ Tạo Submission: ${submission.code}`);
    
    // 7. Nếu là PUBLISHED, tạo Article
    if (data.trangThai === 'PUBLISHED' && pdfCloudPath) {
      // Tạo pages string
      let pages = data.trangSo || data.trangSoFormat;
      if (!pages && data.trangBatDau && data.trangKetThuc) {
        pages = `${data.trangBatDau}-${data.trangKetThuc}`;
      }
      
      const article = await prisma.article.create({
        data: {
          submissionId: submission.id,
          issueId: issue.id,
          pages: pages || undefined,
          pdfFile: pdfCloudPath,
          doiLocal: data.doi,
          publishedAt: new Date(data.namXuatBan, 0, 1),
          approvalStatus: 'APPROVED',
          approvedBy: 'SYSTEM_IMPORT',
          approvedAt: new Date(),
        },
      });
      
      console.log(`  ✅ Tạo Article: ID ${article.id}`);
    }
    
    stats.success++;
    console.log(`  ✨ Hoàn tất import bài báo #${data.stt}`);
    
  } catch (error: any) {
    console.error(`  ❌ Lỗi: ${error.message}`);
    stats.failed++;
    stats.errors.push({
      row: data.stt,
      error: `${data.tieuDeVN}: ${error.message}`,
    });
  }
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('\n❌ Thiếu tham số: Vui lòng cung cấp đường dẫn file Excel');
    console.log('\n📖 Cách sử dụng:');
    console.log('   yarn tsx scripts/import-articles-from-excel.ts <đường-dẫn-file-excel>');
    console.log('\n📝 Ví dụ:');
    console.log('   yarn tsx scripts/import-articles-from-excel.ts ./scripts/articles-import.xlsx\n');
    process.exit(1);
  }
  
  const excelFilePath = args[0];
  
  // Kiểm tra file Excel tồn tại
  if (!fs.existsSync(excelFilePath)) {
    console.error(`\n❌ File không tồn tại: ${excelFilePath}\n`);
    process.exit(1);
  }
  
  // Kiểm tra folder PDF
  if (!fs.existsSync(PDF_FOLDER)) {
    console.error(`\n❌ Folder PDF không tồn tại: ${PDF_FOLDER}`);
    console.log('   Vui lòng tạo folder và đặt các file PDF vào đó.\n');
    process.exit(1);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('  🚀 BẮT ĐẦU IMPORT BÀI BÁO TỪ EXCEL + PDF');
  console.log('='.repeat(60));
  
  const stats: ImportStats = {
    total: 0,
    success: 0,
    failed: 0,
    skipped: 0,
    errors: [],
  };
  
  try {
    // 1. Đọc file Excel
    const rows = await readExcelFile(excelFilePath);
    stats.total = rows.length;
    
    if (rows.length === 0) {
      console.log('\n⚠️  Không có dữ liệu để import\n');
      return;
    }
    
    console.log(`\n📊 Tổng số bài báo cần import: ${stats.total}`);
    console.log('\n' + '-'.repeat(60));
    
    // 2. Import từng bài báo
    for (const row of rows) {
      await importArticle(row, stats);
    }
    
    // 3. Hiển thị kết quả
    console.log('\n' + '='.repeat(60));
    console.log('  📊 KẾT QUẢ IMPORT');
    console.log('='.repeat(60));
    console.log(`  ✅ Thành công: ${stats.success}/${stats.total}`);
    console.log(`  ❌ Thất bại: ${stats.failed}/${stats.total}`);
    
    if (stats.errors.length > 0) {
      console.log('\n  ⚠️  CHI TIẾT LỖI:');
      stats.errors.forEach(({ row, error }) => {
        console.log(`     [Dòng ${row}] ${error}`);
      });
    }
    
    console.log('\n' + '='.repeat(60) + '\n');
    
  } catch (error: any) {
    console.error(`\n❌ Lỗi nghiêm trọng: ${error.message}\n`);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
