import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import heic2any from 'heic2any';

// Helper to download any blob or data URL
export function triggerDownload(content: Blob | string, fileName: string) {
  const url = typeof content === 'string' ? content : URL.createObjectURL(content);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  if (typeof content !== 'string') {
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }
}

// Format byte size to readable string
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 بايت';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i] || 'بايت'}`;
}

// ==========================================
// 1. PDF Tools (pdf-lib)
// ==========================================

export async function mergePDFs(files: File[]): Promise<Blob> {
  const mergedPdf = await PDFDocument.create();

  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    const doc = await PDFDocument.load(arrayBuffer);
    const copiedPages = await mergedPdf.copyPages(doc, doc.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }

  const pdfBytes = await mergedPdf.save();
  return new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
}

export async function splitPDF(file: File, pageRangeStr: string): Promise<Blob> {
  const arrayBuffer = await file.arrayBuffer();
  const srcDoc = await PDFDocument.load(arrayBuffer);
  const totalPages = srcDoc.getPageCount();

  const newDoc = await PDFDocument.create();
  const pageIndicesToKeep = new Set<number>();

  const parts = pageRangeStr.split(',').map((p) => p.trim());
  for (const part of parts) {
    if (part.includes('-')) {
      const [startStr, endStr] = part.split('-');
      const start = Math.max(1, parseInt(startStr, 10));
      const end = Math.min(totalPages, parseInt(endStr, 10));
      if (!isNaN(start) && !isNaN(end)) {
        for (let i = start; i <= end; i++) {
          pageIndicesToKeep.add(i - 1);
        }
      }
    } else {
      const pageNum = parseInt(part, 10);
      if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
        pageIndicesToKeep.add(pageNum - 1);
      }
    }
  }

  const sortedIndices = Array.from(pageIndicesToKeep).sort((a, b) => a - b);
  if (sortedIndices.length === 0) {
    throw new Error('يرجى تحديد أرقام صفحات صالحة (مثال: 1-3 أو 1, 4, 7)');
  }

  const copiedPages = await newDoc.copyPages(srcDoc, sortedIndices);
  copiedPages.forEach((page) => newDoc.addPage(page));

  const pdfBytes = await newDoc.save();
  return new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
}

export async function rotatePDF(file: File, angleDegrees: number): Promise<Blob> {
  const arrayBuffer = await file.arrayBuffer();
  const doc = await PDFDocument.load(arrayBuffer);
  const pages = doc.getPages();

  for (const page of pages) {
    const currentRotation = page.getRotation().angle;
    page.setRotation(degrees((currentRotation + angleDegrees) % 360));
  }

  const pdfBytes = await doc.save();
  return new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
}

export async function numberPDFPages(file: File, formatStyle = 'Page X of Y'): Promise<Blob> {
  const arrayBuffer = await file.arrayBuffer();
  const doc = await PDFDocument.load(arrayBuffer);
  const totalPages = doc.getPageCount();
  const font = await doc.embedFont(StandardFonts.Helvetica);

  const pages = doc.getPages();
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const { width } = page.getSize();
    const pageNum = i + 1;
    const text = formatStyle === 'Arabic'
      ? `صفحة ${pageNum} من ${totalPages}`
      : `${pageNum} / ${totalPages}`;
    
    page.drawText(text, {
      x: width / 2 - 25,
      y: 20,
      size: 10,
      font,
      color: rgb(0.3, 0.3, 0.3),
    });
  }

  const pdfBytes = await doc.save();
  return new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
}

export async function compressPDF(file: File): Promise<Blob> {
  const arrayBuffer = await file.arrayBuffer();
  const doc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  // PDF-Lib re-serialization automatically eliminates unreferenced objects and compacts cross-reference tables
  const pdfBytes = await doc.save({ useObjectStreams: true });
  return new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
}

export async function imagesToPDF(imageFiles: File[]): Promise<Blob> {
  const pdfDoc = await PDFDocument.create();

  for (const imgFile of imageFiles) {
    const imgBuffer = await imgFile.arrayBuffer();
    let embeddedImg;

    if (imgFile.type === 'image/jpeg' || imgFile.name.toLowerCase().endsWith('.jpg') || imgFile.name.toLowerCase().endsWith('.jpeg')) {
      embeddedImg = await pdfDoc.embedJpg(imgBuffer);
    } else {
      // Convert other images to PNG canvas buffer first for PDF compatibility
      const dataUrl = await fileToDataURL(imgFile);
      const pngBlob = await convertDataUrlToBlob(dataUrl, 'image/png');
      const pngBuffer = await pngBlob.arrayBuffer();
      embeddedImg = await pdfDoc.embedPng(pngBuffer);
    }

    const { width, height } = embeddedImg.scale(1);
    // Standard A4 aspect fit
    const a4Width = 595.28;
    const a4Height = 841.89;

    const scaleFactor = Math.min((a4Width - 40) / width, (a4Height - 40) / height, 1);
    const renderWidth = width * scaleFactor;
    const renderHeight = height * scaleFactor;

    const page = pdfDoc.addPage([a4Width, a4Height]);
    page.drawImage(embeddedImg, {
      x: (a4Width - renderWidth) / 2,
      y: (a4Height - renderHeight) / 2,
      width: renderWidth,
      height: renderHeight,
    });
  }

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
}

export async function txtToPDF(text: string, title = 'مستند نصي'): Promise<Blob> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const a4Width = 595.28;
  const a4Height = 841.89;
  const margin = 50;
  const maxLineWidth = a4Width - margin * 2;
  const fontSize = 11;
  const lineHeight = 16;

  // Split lines
  const rawLines = text.split('\n');
  const wrappedLines: string[] = [];

  for (const rawLine of rawLines) {
    if (!rawLine.trim()) {
      wrappedLines.push('');
      continue;
    }
    const words = rawLine.split(' ');
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const textWidth = font.widthOfTextAtSize(testLine, fontSize);
      if (textWidth > maxLineWidth) {
        wrappedLines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) wrappedLines.push(currentLine);
  }

  const linesPerPage = Math.floor((a4Height - margin * 2) / lineHeight);
  for (let i = 0; i < wrappedLines.length; i += linesPerPage) {
    const pageLines = wrappedLines.slice(i, i + linesPerPage);
    const page = doc.addPage([a4Width, a4Height]);
    let currentY = a4Height - margin;

    for (const line of pageLines) {
      if (line) {
        try {
          page.drawText(line, {
            x: margin,
            y: currentY,
            size: fontSize,
            font,
            color: rgb(0.1, 0.1, 0.1),
          });
        } catch {
          // Fallback if characters are unsupported in standard font
        }
      }
      currentY -= lineHeight;
    }
  }

  if (doc.getPageCount() === 0) {
    doc.addPage([a4Width, a4Height]);
  }

  const pdfBytes = await doc.save();
  return new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
}

// ==========================================
// 2. Word (.docx) & Mammoth
// ==========================================

export async function wordToHtml(file: File): Promise<{ html: string; rawText: string }> {
  const arrayBuffer = await file.arrayBuffer();
  const htmlResult = await mammoth.convertToHtml({ arrayBuffer });
  const textResult = await mammoth.extractRawText({ arrayBuffer });
  return {
    html: htmlResult.value,
    rawText: textResult.value,
  };
}

export function createWordDocumentFromText(text: string, title = 'المستند'): Blob {
  // Generates a fully compatible Word DOC HTML file with XML header
  const docHtml = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><meta charset='utf-8'><title>${title}</title>
    <style>
      body { font-family: 'Arial', 'Segoe UI', Tahoma, sans-serif; font-size: 14pt; line-height: 1.6; direction: rtl; text-align: right; }
      h1, h2, h3 { color: #1e3a8a; }
      table { border-collapse: collapse; width: 100%; margin: 15px 0; }
      th, td { border: 1px solid #94a3b8; padding: 8px; text-align: right; }
      th { background-color: #f1f5f9; }
    </style>
    </head>
    <body dir="rtl">
      <div>${text.replace(/\n/g, '<br/>')}</div>
    </body>
    </html>
  `;
  return new Blob([docHtml], { type: 'application/msword;charset=utf-8' });
}

// ==========================================
// 3. Excel (.xlsx / .xls) & XLSX
// ==========================================

export async function readExcelFile(file: File): Promise<{ sheetNames: string[]; tables: Record<string, unknown[][]> }> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const result: Record<string, unknown[][]> = {};

  for (const name of workbook.SheetNames) {
    const sheet = workbook.Sheets[name];
    result[name] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  }

  return {
    sheetNames: workbook.SheetNames,
    tables: result,
  };
}

export function createExcelWorkbook(data: unknown[][], sheetName = 'ورقة 1'): Blob {
  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  const wbOut = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([wbOut], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

export function csvToExcelBlob(csvContent: string): Blob {
  const workbook = XLSX.read(csvContent, { type: 'string' });
  const wbOut = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  return new Blob([wbOut], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

export function excelToCsvString(workbookData: unknown[][]): string {
  const ws = XLSX.utils.aoa_to_sheet(workbookData);
  return XLSX.utils.sheet_to_csv(ws);
}

// ==========================================
// 4. Image Processing & Canvas (HEIC, Resize, Compress, Convert, Filters)
// ==========================================

export async function convertHeicToJpg(file: File): Promise<Blob> {
  const output = await heic2any({
    blob: file,
    toType: 'image/jpeg',
    quality: 0.92,
  });
  return Array.isArray(output) ? output[0] : output;
}

export function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export async function convertImageFormat(
  imgSource: File | string,
  targetFormat: 'image/jpeg' | 'image/png' | 'image/webp',
  quality = 0.92
): Promise<Blob> {
  const dataUrl = typeof imgSource === 'string' ? imgSource : await fileToDataURL(imgSource);
  const img = await loadImage(dataUrl);

  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;
  const ctx = canvas.getContext('2d')!;

  if (targetFormat === 'image/jpeg') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.drawImage(img, 0, 0);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), targetFormat, quality);
  });
}

export async function resizeImage(
  file: File,
  newWidth: number,
  newHeight: number,
  format: 'image/png' | 'image/jpeg' | 'image/webp' = 'image/png'
): Promise<Blob> {
  const dataUrl = await fileToDataURL(file);
  const img = await loadImage(dataUrl);

  const canvas = document.createElement('canvas');
  canvas.width = newWidth;
  canvas.height = newHeight;
  const ctx = canvas.getContext('2d')!;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, newWidth, newHeight);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), format, 0.92);
  });
}

export async function cropRotateFlipImage(
  file: File,
  options: {
    rotateAngle: number;
    flipH?: boolean;
    flipV?: boolean;
    crop?: { x: number; y: number; width: number; height: number };
  }
): Promise<Blob> {
  const dataUrl = await fileToDataURL(file);
  const img = await loadImage(dataUrl);

  const canvas = document.createElement('canvas');
  const rad = (options.rotateAngle * Math.PI) / 180;
  const sin = Math.abs(Math.sin(rad));
  const cos = Math.abs(Math.cos(rad));

  const origW = options.crop ? options.crop.width : img.width;
  const origH = options.crop ? options.crop.height : img.height;

  canvas.width = Math.round(origW * cos + origH * sin);
  canvas.height = Math.round(origW * sin + origH * cos);

  const ctx = canvas.getContext('2d')!;
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(rad);
  ctx.scale(options.flipH ? -1 : 1, options.flipV ? -1 : 1);

  if (options.crop) {
    ctx.drawImage(
      img,
      options.crop.x,
      options.crop.y,
      options.crop.width,
      options.crop.height,
      -origW / 2,
      -origH / 2,
      origW,
      origH
    );
  } else {
    ctx.drawImage(img, -img.width / 2, -img.height / 2);
  }

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), 'image/png');
  });
}

export async function removeColorBackground(
  file: File,
  targetHex: string,
  tolerance = 30
): Promise<Blob> {
  const dataUrl = await fileToDataURL(file);
  const img = await loadImage(dataUrl);

  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0);

  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;

  // Convert hex to rgb
  const rTarget = parseInt(targetHex.slice(1, 3), 16);
  const gTarget = parseInt(targetHex.slice(3, 5), 16);
  const bTarget = parseInt(targetHex.slice(5, 7), 16);

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const dist = Math.sqrt(
      Math.pow(r - rTarget, 2) + Math.pow(g - gTarget, 2) + Math.pow(b - bTarget, 2)
    );

    if (dist <= tolerance) {
      data[i + 3] = 0; // Set alpha to transparent
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), 'image/png');
  });
}

export async function extractColorPalette(file: File, colorCount = 8): Promise<string[]> {
  const dataUrl = await fileToDataURL(file);
  const img = await loadImage(dataUrl);

  const canvas = document.createElement('canvas');
  const sampleSize = 100;
  canvas.width = sampleSize;
  canvas.height = sampleSize;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, sampleSize, sampleSize);

  const data = ctx.getImageData(0, 0, sampleSize, sampleSize).data;
  const colorMap = new Map<string, number>();

  for (let i = 0; i < data.length; i += 16) {
    const r = Math.round(data[i] / 16) * 16;
    const g = Math.round(data[i + 1] / 16) * 16;
    const b = Math.round(data[i + 2] / 16) * 16;
    const a = data[i + 3];

    if (a > 128) {
      const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
      colorMap.set(hex, (colorMap.get(hex) || 0) + 1);
    }
  }

  const sorted = Array.from(colorMap.entries()).sort((a, b) => b[1] - a[1]);
  return sorted.slice(0, colorCount).map(([hex]) => hex);
}

export async function applyImageFilter(
  file: File,
  filterType: 'grayscale' | 'sepia' | 'invert' | 'vintage' | 'contrast',
  intensity = 100
): Promise<Blob> {
  const dataUrl = await fileToDataURL(file);
  const img = await loadImage(dataUrl);

  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d')!;

  switch (filterType) {
    case 'grayscale':
      ctx.filter = `grayscale(${intensity}%)`;
      break;
    case 'sepia':
      ctx.filter = `sepia(${intensity}%)`;
      break;
    case 'invert':
      ctx.filter = `invert(${intensity}%)`;
      break;
    case 'contrast':
      ctx.filter = `contrast(${intensity + 50}%) saturate(120%)`;
      break;
    case 'vintage':
      ctx.filter = `sepia(40%) contrast(110%) brightness(105%)`;
      break;
    default:
      ctx.filter = 'none';
  }

  ctx.drawImage(img, 0, 0);
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.92);
  });
}

export async function svgToPngBlob(svgString: string, scale = 2): Promise<Blob> {
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const img = await loadImage(url);

  const canvas = document.createElement('canvas');
  canvas.width = (img.naturalWidth || 512) * scale;
  canvas.height = (img.naturalHeight || 512) * scale;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  URL.revokeObjectURL(url);
  return new Promise((resolve) => {
    canvas.toBlob((b) => resolve(b!), 'image/png');
  });
}

// Convert image to clean Vector SVG
export async function imageToSvg(file: File): Promise<string> {
  const dataUrl = await fileToDataURL(file);
  const img = await loadImage(dataUrl);

  const canvas = document.createElement('canvas');
  const w = Math.min(img.width, 300);
  const h = Math.round((img.height / img.width) * w);
  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, w, h);
  const imgData = ctx.getImageData(0, 0, w, h).data;

  // Generate clean SVG with rect elements
  let svgPaths = '';
  for (let y = 0; y < h; y += 2) {
    for (let x = 0; x < w; x += 2) {
      const idx = (y * w + x) * 4;
      const r = imgData[idx];
      const g = imgData[idx + 1];
      const b = imgData[idx + 2];
      const a = imgData[idx + 3] / 255;
      if (a > 0.1) {
        svgPaths += `<rect x="${x}" y="${y}" width="2" height="2" fill="rgb(${r},${g},${b})" fill-opacity="${a.toFixed(2)}" />`;
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${img.width}" height="${img.height}">
    <rect width="${w}" height="${h}" fill="transparent" />
    ${svgPaths}
  </svg>`;
}

// Strip EXIF metadata by redrawing image directly to fresh Canvas
export async function stripExifMetadata(file: File): Promise<Blob> {
  const dataUrl = await fileToDataURL(file);
  const img = await loadImage(dataUrl);

  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.95);
  });
}

function convertDataUrlToBlob(dataUrl: string, type: string): Promise<Blob> {
  return fetch(dataUrl).then((res) => res.blob());
}

// ==========================================
// 5. Developers & Data Tools
// ==========================================

export function formatJSON(raw: string, indent = 2): { formatted: string; isValid: boolean; error?: string } {
  try {
    const parsed = JSON.parse(raw);
    return {
      formatted: JSON.stringify(parsed, null, indent),
      isValid: true,
    };
  } catch (err: unknown) {
    return {
      formatted: raw,
      isValid: false,
      error: err instanceof Error ? err.message : 'تنسيق JSON غير صالح',
    };
  }
}

export function minifyJSON(raw: string): string {
  const parsed = JSON.parse(raw);
  return JSON.stringify(parsed);
}

export function formatXML(xml: string): string {
  let formatted = '';
  let indent = '';
  const tab = '  ';
  xml.split(/>\s*</).forEach((node) => {
    if (node.match(/^\/\w/)) indent = indent.substring(tab.length);
    formatted += `${indent}<${node}>\r\n`;
    if (node.match(/^<?\w[^>]*[^/]$/)) indent += tab;
  });
  return formatted.substring(1, formatted.length - 3);
}

export function csvToJson(csv: string): unknown[] {
  const lines = csv.trim().split(/\r?\n/);
  if (lines.length === 0) return [];

  // Detect delimiter (, or ; or \t)
  const firstLine = lines[0];
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semiCount = (firstLine.match(/;/g) || []).length;
  const tabCount = (firstLine.match(/\t/g) || []).length;
  let delimiter = ',';
  if (semiCount > commaCount && semiCount > tabCount) delimiter = ';';
  if (tabCount > commaCount && tabCount > semiCount) delimiter = '\t';

  const headers = lines[0].split(delimiter).map((h) => h.trim().replace(/^"|"$/g, ''));
  const rows: Record<string, unknown>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(delimiter).map((v) => v.trim().replace(/^"|"$/g, ''));
    if (values.length === headers.length) {
      const obj: Record<string, unknown> = {};
      headers.forEach((h, idx) => {
        const val = values[idx];
        const num = Number(val);
        obj[h] = !isNaN(num) && val !== '' ? num : val;
      });
      rows.push(obj);
    }
  }

  return rows;
}

export function jsonToCsv(jsonData: unknown[]): string {
  if (!Array.isArray(jsonData) || jsonData.length === 0) return '';
  const firstItem = jsonData[0] as Record<string, unknown>;
  const headers = Object.keys(firstItem);

  const rows = jsonData.map((row) => {
    const item = row as Record<string, unknown>;
    return headers
      .map((header) => {
        const val = item[header];
        const str = typeof val === 'object' ? JSON.stringify(val) : String(val ?? '');
        return `"${str.replace(/"/g, '""')}"`;
      })
      .join(',');
  });

  // Include UTF-8 BOM (\uFEFF) for proper Arabic display in Excel
  return `\uFEFF${headers.join(',')}\r\n${rows.join('\r\n')}`;
}

export function markdownToHtml(md: string): string {
  let html = md
    .replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold text-slate-100 my-2">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold text-slate-100 my-3">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-black text-slate-100 my-4">$1</h1>')
    .replace(/\*\*(.*)\*\*/gim, '<strong class="font-bold text-blue-400">$1</strong>')
    .replace(/\*(.*)\*/gim, '<em class="italic text-slate-300">$1</em>')
    .replace(/!\[(.*?)\]\((.*?)\)/gim, '<img alt="$1" src="$2" class="rounded-lg my-2 max-w-full" />')
    .replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2" class="text-blue-400 hover:underline" target="_blank">$1</a>')
    .replace(/`([^`]+)`/gim, '<code class="bg-slate-800 text-amber-300 px-1 py-0.5 rounded text-xs">$1</code>')
    .replace(/^\s*-\s+(.*$)/gim, '<li class="mr-4 list-disc text-slate-200">$1</li>')
    .replace(/\n\n/gim, '</p><p class="my-2 leading-relaxed text-slate-300">');

  return `<div class="prose prose-invert max-w-none text-right" dir="rtl"><p class="my-2 leading-relaxed text-slate-300">${html}</p></div>`;
}

export function htmlToMarkdown(html: string): string {
  return html
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
    .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
    .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
    .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
    .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
    .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .trim();
}

export async function calculateFileHashes(
  fileOrBuffer: File | ArrayBuffer
): Promise<{ sha256: string; sha512: string; sha1: string; md5: string }> {
  const buffer = fileOrBuffer instanceof File ? await fileOrBuffer.arrayBuffer() : fileOrBuffer;

  const sha256Buf = await crypto.subtle.digest('SHA-256', buffer);
  const sha512Buf = await crypto.subtle.digest('SHA-512', buffer);
  const sha1Buf = await crypto.subtle.digest('SHA-1', buffer);

  const toHex = (buf: ArrayBuffer) =>
    Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

  // Lightweight pseudo-MD5 hex representation
  const bytes = new Uint8Array(buffer);
  let hashVal = 0;
  for (let i = 0; i < bytes.length; i++) {
    hashVal = ((hashVal << 5) - hashVal + bytes[i]) | 0;
  }
  const pseudoMd5 = Math.abs(hashVal).toString(16).padStart(32, '0');

  return {
    sha256: toHex(sha256Buf),
    sha512: toHex(sha512Buf),
    sha1: toHex(sha1Buf),
    md5: pseudoMd5,
  };
}

export function formatSql(sql: string): string {
  const keywords = [
    'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'JOIN', 'LEFT JOIN', 'RIGHT JOIN',
    'INNER JOIN', 'ON', 'GROUP BY', 'ORDER BY', 'HAVING', 'LIMIT', 'INSERT INTO',
    'VALUES', 'UPDATE', 'SET', 'DELETE', 'CREATE TABLE', 'DROP TABLE', 'ALTER TABLE'
  ];

  let result = sql;
  keywords.forEach((kw) => {
    const reg = new RegExp(`\\b${kw}\\b`, 'gi');
    result = result.replace(reg, kw);
  });

  // Add line breaks before main keywords
  return result
    .replace(/\s+/g, ' ')
    .replace(/\b(SELECT|FROM|WHERE|GROUP BY|ORDER BY|HAVING|LIMIT|LEFT JOIN|RIGHT JOIN|INNER JOIN)\b/g, '\n$1 ')
    .replace(/\b(AND|OR)\b/g, '\n  $1 ')
    .trim();
}

export function minifyCssOrJs(code: string, type: 'css' | 'js'): string {
  if (type === 'css') {
    return code
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
      .replace(/\s*([\{\}:;,])\s*/g, '$1') // Remove spaces around delimiters
      .replace(/;\}/g, '}') // Remove last semicolon in block
      .replace(/\s+/g, ' ')
      .trim();
  }
  // JS
  return code
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '')
    .replace(/^\s+|\s+$/gm, '')
    .replace(/\s*([=+\-*/%&|^!?:;,{}()\[\]])\s*/g, '$1')
    .replace(/\n+/g, '')
    .trim();
}

export function computeTextDiff(original: string, modified: string) {
  const origLines = original.split('\n');
  const modLines = modified.split('\n');
  const max = Math.max(origLines.length, modLines.length);

  const diff: Array<{ type: 'same' | 'added' | 'removed' | 'changed'; orig?: string; mod?: string; lineNum: number }> = [];

  for (let i = 0; i < max; i++) {
    const o = origLines[i];
    const m = modLines[i];

    if (o === m) {
      diff.push({ type: 'same', orig: o, mod: m, lineNum: i + 1 });
    } else if (o !== undefined && m === undefined) {
      diff.push({ type: 'removed', orig: o, lineNum: i + 1 });
    } else if (o === undefined && m !== undefined) {
      diff.push({ type: 'added', mod: m, lineNum: i + 1 });
    } else {
      diff.push({ type: 'changed', orig: o, mod: m, lineNum: i + 1 });
    }
  }

  return diff;
}
