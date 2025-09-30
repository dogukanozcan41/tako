import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Printer, FileText, Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { DamageRecord } from "@shared/schema";
import { generatePDF } from "@/lib/pdf-generator";
import { exportToExcel, importFromExcel } from "@/lib/excel-utils";
import { apiRequest } from "@/lib/queryClient";

interface ActionButtonsProps {
  records: DamageRecord[];
}

export default function ActionButtons({ records }: ActionButtonsProps) {
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();

  const { data: settings } = useQuery<any>({
    queryKey: ["/api/settings"],
  });

  const handlePrint = () => {
    if (records.length === 0) {
      toast({
        title: "Uyarı",
        description: "Yazdırılacak kayıt bulunmamaktadır.",
        variant: "destructive",
      });
      return;
    }

    // Pagination settings
    const recordsPerPage = 10;
    const totalPages = Math.ceil(records.length / recordsPerPage);
    
    // Generate pages
    let allPages = '';
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const startIndex = (pageNum - 1) * recordsPerPage;
      const endIndex = startIndex + recordsPerPage;
      const pageRecords = records.slice(startIndex, endIndex);
      
      const pageContent = `
        <div class="page" ${pageNum > 1 ? 'style="page-break-before: always;"' : ''}>
          <div class="header">
            <img src="https://resmim.net/cdn/2025/07/11/TzfqXo.jpg" alt="Logo" class="logo" />
            <div class="title-section">
              <div class="title">${settings?.title || 'HASAR TAKİP SİSTEMİ'}</div>
              <div class="subtitle">HASAR TUTANAĞI</div>
            </div>
            <div class="date-info">
              Rapor Tarihi: ${new Date().toLocaleDateString('tr-TR')}<br>
              Sayfa: ${pageNum} / ${totalPages}
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Tarih</th>
                <th>Şasi No</th>
                <th>Model</th>
                <th>Hasar Tanımı</th>
              </tr>
            </thead>
            <tbody>
              ${pageRecords.map(record => `
                <tr>
                  <td>${new Date(record.date).toLocaleDateString('tr-TR')}</td>
                  <td>${record.chassisNumber}</td>
                  <td>${record.model}</td>
                  <td>${record.description}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="footer">
            <p class="note">${settings?.footerNote || 'ARAÇ İÇİ EKSİKLİKLERDEN OMSAN SORUMLU DEĞİLDİR.'}</p>
            <div class="signatures">
              <div class="signature-section">
                <div class="signature-title">YETKİLİ İMZA</div>
                <div class="signature-line"></div>
                <span>${settings?.merturOfficial || 'MERTUR YETKİLİSİ'}</span>
              </div>
              <div class="signature-section">
                <div class="signature-title">YETKİLİ İMZA</div>
                <div class="signature-line"></div>
                <span>${settings?.omsanOfficial || 'OMSAN YETKİLİSİ'}</span>
              </div>
            </div>
          </div>
        </div>
      `;
      allPages += pageContent;
    }

    // Create print content
    const printContent = document.createElement('div');
    printContent.innerHTML = `
      <style>
        @media print {
          body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 20px; 
            background: white; 
            color: black; 
          }
          .page {
            min-height: 100vh;
            page-break-inside: avoid;
          }
          .header { 
            display: flex; 
            align-items: center; 
            justify-content: space-between; 
            margin-bottom: 40px; 
            border-bottom: 2px solid #e5e7eb; 
            padding-bottom: 20px; 
          }
          .logo { 
            width: 80px; 
            height: auto; 
            border-radius: 4px; 
            box-shadow: 0 2px 8px rgba(0,0,0,0.1); 
          }
          .title-section { 
            text-align: center; 
            flex-grow: 1; 
            margin: 0 20px; 
          }
          .title { 
            font-size: 20px; 
            font-weight: bold; 
            margin-bottom: 5px; 
            color: #1e40af; 
            text-transform: uppercase; 
            letter-spacing: 0.5px; 
          }
          .subtitle { 
            font-size: 14px; 
            color: #6b7280; 
            margin-bottom: 0; 
          }
          .date-info { 
            font-size: 12px; 
            color: #6b7280; 
            text-align: right; 
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 40px; 
            box-shadow: 0 2px 8px rgba(0,0,0,0.1); 
          }
          th, td { 
            border: 1px solid #d1d5db; 
            padding: 12px; 
            text-align: left; 
            font-size: 14px; 
          }
          th { 
            background: linear-gradient(to bottom, #f3f4f6, #e5e7eb); 
            font-weight: bold; 
            color: #374151; 
            text-transform: uppercase; 
            font-size: 12px; 
            letter-spacing: 0.5px; 
          }
          tr:nth-child(even) { 
            background-color: #f9fafb; 
          }
          .footer { 
            margin-top: 50px; 
            text-align: center; 
            border-top: 2px solid #e5e7eb; 
            padding-top: 30px; 
          }
          .note { 
            font-weight: bold; 
            margin-bottom: 40px; 
            padding: 15px; 
            background-color: #fef3c7; 
            border: 1px solid #f59e0b; 
            border-radius: 8px; 
            color: #92400e; 
          }
          .signatures { 
            margin-top: 40px; 
            display: flex; 
            justify-content: space-between; 
            gap: 50px; 
          }
          .signature-section { 
            text-align: center; 
            width: 45%; 
            padding: 20px; 
            border: 1px solid #d1d5db; 
            border-radius: 8px; 
            background-color: #f9fafb; 
          }
          .signature-line { 
            border-bottom: 2px solid #374151; 
            height: 50px; 
            margin-bottom: 15px; 
            margin-top: 30px; 
          }
          .signature-title { 
            font-weight: bold; 
            color: #374151; 
            margin-bottom: 10px; 
            text-transform: uppercase; 
            font-size: 14px; 
          }
          .date-info { 
            font-size: 12px; 
            color: #6b7280; 
            margin-top: 20px; 
            text-align: right; 
          }
        }
      </style>
      ${allPages}
    `;

    // Create a hidden iframe for printing
    const printFrame = document.createElement('iframe');
    printFrame.style.display = 'none';
    document.body.appendChild(printFrame);
    
    const frameDoc = printFrame.contentDocument || printFrame.contentWindow?.document;
    if (frameDoc) {
      frameDoc.open();
      frameDoc.write(printContent.innerHTML);
      frameDoc.close();
      
      // Wait for content to load, then print
      setTimeout(() => {
        printFrame.contentWindow?.print();
        // Remove the iframe after printing
        setTimeout(() => {
          document.body.removeChild(printFrame);
        }, 1000);
      }, 500);
    }

    toast({
      title: "Başarılı",
      description: "Yazdırma işlemi başlatıldı.",
    });
  };

  const handleExportPDF = async () => {
    if (records.length === 0) {
      toast({
        title: "Uyarı",
        description: "Dışa aktarılacak kayıt bulunmamaktadır.",
        variant: "destructive",
      });
      return;
    }

    try {
      await generatePDF(records, settings);
      toast({
        title: "Başarılı",
        description: "PDF dosyası başarıyla oluşturuldu.",
      });
    } catch (error) {
      toast({
        title: "Hata",
        description: "PDF oluşturulurken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const handleExportExcel = () => {
    if (records.length === 0) {
      toast({
        title: "Uyarı",
        description: "Dışa aktarılacak kayıt bulunmamaktadır.",
        variant: "destructive",
      });
      return;
    }

    try {
      exportToExcel(records);
      toast({
        title: "Başarılı",
        description: "Excel dosyası başarıyla oluşturuldu.",
      });
    } catch (error) {
      toast({
        title: "Hata",
        description: "Excel dosyası oluşturulurken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const handleImportExcel = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const importedData = await importFromExcel(file);
      
      // Process the imported data as chassis data
      const chassisDataList = importedData.map(record => ({
        chassisNumber: record.chassisNumber,
        model: record.model
      })).filter(item => item.chassisNumber && item.model);
      
      if (chassisDataList.length === 0) {
        toast({
          title: "Hata",
          description: "Excel dosyasında geçerli şasi numarası ve model verisi bulunamadı.",
          variant: "destructive",
        });
        return;
      }
      
      // Send to backend (add instead of replace)
      const response = await apiRequest('POST', '/api/chassis-data/add', chassisDataList);
      
      if (!response.ok) {
        throw new Error('Veri yüklenemedi');
      }
      
      // Get updated chassis data count
      const updatedResponse = await apiRequest('GET', '/api/chassis-data');
      const updatedData = await updatedResponse.json();
      
      toast({
        title: "Başarılı",
        description: `${chassisDataList.length} yeni şasi verisi eklendi. Toplam: ${updatedData.length} şasi numarası`,
      });
    } catch (error) {
      toast({
        title: "Hata",
        description: "Excel dosyası içe aktarılırken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
      event.target.value = '';
    }
  };

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 shadow-lg">
      <CardContent className="pt-6">
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Raporlama ve Dışa Aktarma</h3>
          <p className="text-sm text-gray-600">Hasar kayıtlarınızı yazdırın, PDF veya Excel formatında kaydedin</p>
          <p className="text-xs text-blue-600 mt-1">Excel'den şasi numarası ve model verilerini sisteme yükleyebilirsiniz</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button
            onClick={handlePrint}
            className="bg-green-600 hover:bg-green-700 text-white h-12 flex flex-col items-center justify-center space-y-1 shadow-md"
          >
            <Printer className="h-5 w-5" />
            <span className="text-xs">Yazdır</span>
          </Button>

          <Button
            onClick={handleExportPDF}
            className="bg-red-600 hover:bg-red-700 text-white h-12 flex flex-col items-center justify-center space-y-1 shadow-md"
          >
            <FileText className="h-5 w-5" />
            <span className="text-xs">PDF'e Aktar</span>
          </Button>

          <Button
            onClick={handleExportExcel}
            className="bg-green-600 hover:bg-green-700 text-white h-12 flex flex-col items-center justify-center space-y-1 shadow-md"
          >
            <Download className="h-5 w-5" />
            <span className="text-xs">Excel'e Aktar</span>
          </Button>

          <div className="relative">
            <Input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleImportExcel}
              className="hidden"
              id="excel-import"
              disabled={isImporting}
            />
            <Label htmlFor="excel-import" className="cursor-pointer">
              <Button
                type="button"
                className="bg-blue-600 hover:bg-blue-700 text-white h-12 flex flex-col items-center justify-center space-y-1 shadow-md w-full"
                disabled={isImporting}
                asChild
              >
                <span>
                  <Upload className="h-5 w-5" />
                  <span className="text-xs">
                    {isImporting ? "İçe Aktarılıyor..." : "Excel'den Al"}
                  </span>
                </span>
              </Button>
            </Label>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
