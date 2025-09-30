import * as XLSX from 'xlsx';
import { DamageRecord } from "@shared/schema";

export const exportToExcel = (records: DamageRecord[]) => {
  const worksheet = XLSX.utils.json_to_sheet(
    records.map(record => ({
      'Tarih': new Date(record.date).toLocaleDateString('tr-TR'),
      'Şasi No': record.chassisNumber,
      'Model': record.model,
      'Hasar Tanımı': record.description
    }))
  );

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Hasar Kayıtları');

  // Auto-size columns
  const colWidths = [
    { wch: 12 }, // Tarih
    { wch: 15 }, // Şasi No
    { wch: 15 }, // Model
    { wch: 50 }  // Hasar Tanımı
  ];
  worksheet['!cols'] = colWidths;

  XLSX.writeFile(workbook, 'hasar-kayitlari.xlsx');
};

export const importFromExcel = async (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        // A sütunu: Model, B sütunu: Şasi Numarası
        const chassisData = jsonData.map((row: any) => ({
          model: row[0] ? String(row[0]).trim() : '', // A sütunu - Model
          chassisNumber: row[1] ? String(row[1]).trim() : '', // B sütunu - Şasi Numarası
          uploadDate: new Date().toISOString().split('T')[0]
        })).filter(record => record.model && record.chassisNumber);
        
        resolve(chassisData);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Dosya okuma hatası'));
    };
    
    reader.readAsArrayBuffer(file);
  });
};
