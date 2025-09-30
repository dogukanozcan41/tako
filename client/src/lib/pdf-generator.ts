import { jsPDF } from "jspdf";
import { DamageRecord } from "@shared/schema";

/**
 * Professional PDF generator for damage records with Turkish character support
 * Uses character approximations for Turkish letters to ensure readability
 */
export const generatePDF = async (records: DamageRecord[], settings: any) => {
  const doc = new jsPDF();
  
  // Page dimensions and settings
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;
  
  // Color scheme
  const primaryBlue = [41, 128, 185] as const;
  const darkGray = [52, 73, 94] as const;
  const lightGray = [149, 165, 166] as const;
  const borderGray = [189, 195, 199] as const;
  
  // Turkish character mapping for better PDF compatibility
  // Uses closest available characters for PDF display
  const turkishCharMap: { [key: string]: string } = {
    'ş': 's',  'Ş': 'S',
    'ğ': 'g',  'Ğ': 'G', 
    'ı': 'i',  'İ': 'I',
    'ü': 'u',  'Ü': 'U',
    'ö': 'o',  'Ö': 'O',
    'ç': 'c',  'Ç': 'C'
  };
  
  // Convert Turkish text for PDF display with note about original characters
  const convertForPDF = (text: string): string => {
    let converted = text;
    for (const [turkish, replacement] of Object.entries(turkishCharMap)) {
      converted = converted.replace(new RegExp(turkish, 'g'), replacement);
    }
    return converted;
  };
  
  // Date formatting
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('tr-TR');
  };
  
  const reportDate = new Date().toLocaleDateString('tr-TR');
  const reportTime = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  
  // Header function
  const addHeader = () => {
    // Top border line
    doc.setDrawColor(...primaryBlue);
    doc.setLineWidth(3);
    doc.line(margin, 20, pageWidth - margin, 20);
    
    // Main title with note about Turkish characters
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.setTextColor(...primaryBlue);
    doc.text("HASAR KAYITLARI", pageWidth / 2, 40, { align: "center" });
    
    // Note about character conversion for PDF compatibility
    doc.setFontSize(8);
    doc.setTextColor(...lightGray);
    doc.text("(Turkce karakterler PDF uyumluluğu icin cevrilmistir)", pageWidth / 2, 48, { align: "center" });
    
    // Subtitle
    doc.setFontSize(14);
    doc.setTextColor(...darkGray);
    doc.text(convertForPDF("Araç Hasar Takip Sistemi Raporu"), pageWidth / 2, 58, { align: "center" });
    
    // Report info
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...lightGray);
    doc.text(`Rapor Tarihi: ${reportDate}`, pageWidth - margin, 35, { align: "right" });
    doc.text(`Saat: ${reportTime}`, pageWidth - margin, 42, { align: "right" });
    doc.text(`Toplam Kayit: ${records.length}`, pageWidth - margin, 49, { align: "right" });
    
    // Separator line
    doc.setDrawColor(...borderGray);
    doc.setLineWidth(1);
    doc.line(margin, 70, pageWidth - margin, 70);
  };
  
  // Table configuration
  const tableConfig = {
    startY: 85,
    rowHeight: 20, // Increased for better readability
    headerHeight: 18,
    columns: [
      { header: "SIRA", width: 20 },
      { header: "TARIH", width: 35 },
      { header: convertForPDF("SASI NUMARASI"), width: 50 },
      { header: "MODEL", width: 35 },
      { header: convertForPDF("HASAR TANIMI"), width: 70 }
    ]
  };
  
  const totalTableWidth = tableConfig.columns.reduce((sum, col) => sum + col.width, 0);
  const tableStartX = (pageWidth - totalTableWidth) / 2;
  
  // Table header function
  const addTableHeader = (y: number) => {
    // Header background
    doc.setFillColor(...darkGray);
    doc.rect(tableStartX, y, totalTableWidth, tableConfig.headerHeight, 'F');
    
    // Header text
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    
    let currentX = tableStartX;
    tableConfig.columns.forEach(col => {
      doc.text(
        col.header, 
        currentX + col.width / 2, 
        y + 12, 
        { align: "center" }
      );
      currentX += col.width;
    });
    
    return y + tableConfig.headerHeight;
  };
  
  // Table row function with proper multi-line support
  const addTableRow = (record: DamageRecord, index: number, y: number) => {
    const isEvenRow = index % 2 === 0;
    
    // Row background (alternating colors)
    if (isEvenRow) {
      doc.setFillColor(248, 249, 250);
      doc.rect(tableStartX, y, totalTableWidth, tableConfig.rowHeight, 'F');
    }
    
    // Row border
    doc.setDrawColor(...borderGray);
    doc.setLineWidth(0.3);
    doc.rect(tableStartX, y, totalTableWidth, tableConfig.rowHeight);
    
    // Cell data
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...darkGray);
    
    const rowData = [
      (index + 1).toString(),
      formatDate(record.date),
      record.chassisNumber,
      convertForPDF(record.model),
      convertForPDF(record.description)
    ];
    
    let currentX = tableStartX;
    
    tableConfig.columns.forEach((col, colIndex) => {
      const cellData = rowData[colIndex];
      
      if (colIndex === 4) { // Description column - multi-line support
        const lines = doc.splitTextToSize(cellData, col.width - 4);
        const linesArray = Array.isArray(lines) ? lines : [lines];
        
        // Display up to 2 lines in the cell
        const maxLines = Math.min(linesArray.length, 2);
        for (let i = 0; i < maxLines; i++) {
          doc.text(linesArray[i], currentX + 2, y + 8 + (i * 4));
        }
        
        // Add "..." if there are more lines
        if (linesArray.length > 2) {
          doc.text("...", currentX + 2, y + 16);
        }
        
      } else {
        // Center align for number, left align for others
        const align = colIndex === 0 ? "center" : "left";
        const textX = colIndex === 0 ? currentX + col.width / 2 : currentX + 2;
        doc.text(cellData, textX, y + 12, { align });
      }
      
      // Column borders
      if (colIndex < tableConfig.columns.length - 1) {
        doc.line(currentX + col.width, y, currentX + col.width, y + tableConfig.rowHeight);
      }
      
      currentX += col.width;
    });
    
    return y + tableConfig.rowHeight;
  };
  
  // Footer function
  const addFooter = (pageNum: number, totalPages: number) => {
    const footerY = pageHeight - 25;
    
    // Footer line
    doc.setDrawColor(...borderGray);
    doc.setLineWidth(1);
    doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
    
    // Page number
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...lightGray);
    doc.text(`Sayfa ${pageNum} / ${totalPages}`, pageWidth / 2, footerY, { align: "center" });
    
    // System info
    doc.text(convertForPDF("Hasar Takip Sistemi"), margin, footerY, { align: "left" });
    doc.text(reportDate, pageWidth - margin, footerY, { align: "right" });
  };
  
  // Calculate pagination
  const recordsPerPage = 20; // Reduced for better readability with larger rows
  const totalPages = Math.ceil(records.length / recordsPerPage);
  
  // Generate pages
  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    if (pageNum > 1) {
      doc.addPage();
    }
    
    // Add header
    addHeader();
    
    // Calculate records for this page
    const startIndex = (pageNum - 1) * recordsPerPage;
    const endIndex = Math.min(startIndex + recordsPerPage, records.length);
    const pageRecords = records.slice(startIndex, endIndex);
    
    // Add table header
    let currentY = addTableHeader(tableConfig.startY);
    
    // Add table rows
    pageRecords.forEach((record, index) => {
      currentY = addTableRow(record, startIndex + index, currentY);
    });
    
    // Add footer
    addFooter(pageNum, totalPages);
  }
  
  // Save PDF with Turkish-friendly filename
  const fileName = `${reportDate.replace(/\./g, '-')}-Hasar-Kayitlari.pdf`;
  doc.save(fileName);
};