import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Table2, Edit, Trash2, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { DamageRecord } from "@shared/schema";
import EditModal from "./edit-modal";

interface DamageTableProps {
  records: DamageRecord[];
}

export default function DamageTable({ records }: DamageTableProps) {
  const [editingRecord, setEditingRecord] = useState<DamageRecord | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/damage-records/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/damage-records"] });
      toast({
        title: "Başarılı",
        description: "Hasar kaydı başarıyla silindi.",
      });
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "Hasar kaydı silinirken bir hata oluştu.",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (record: DamageRecord) => {
    if (window.confirm(`Bu kaydı silmek istediğinizden emin misiniz?\n\nŞasi No: ${record.chassisNumber}`)) {
      deleteMutation.mutate(record.id);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Table2 className="h-5 w-5 mr-2 text-secondary" />
            Hasar Kayıtları
          </div>
          <span className="text-sm text-muted-foreground">
            Toplam: {records.length} kayıt
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {records.length === 0 ? (
          <div className="p-12 text-center">
            <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground text-lg">Henüz hasar kaydı bulunmamaktadır.</p>
            <p className="text-muted-foreground text-sm">Yukarıdaki formu kullanarak yeni kayıt ekleyebilirsiniz.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-primary hover:bg-primary">
                  <TableHead className="text-white font-medium">Tarih</TableHead>
                  <TableHead className="text-white font-medium">Şasi No</TableHead>
                  <TableHead className="text-white font-medium">Model</TableHead>
                  <TableHead className="text-white font-medium">Hasar Tanımı</TableHead>
                  <TableHead className="text-white font-medium text-center">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      {formatDate(record.date)}
                    </TableCell>
                    <TableCell>{record.chassisNumber}</TableCell>
                    <TableCell>{record.model}</TableCell>
                    <TableCell>{record.description}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex space-x-2 justify-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingRecord(record)}
                          className="text-secondary hover:bg-secondary/10"
                          title="Düzenle"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(record)}
                          className="text-destructive hover:bg-destructive/10"
                          title="Sil"
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <EditModal
        record={editingRecord}
        open={!!editingRecord}
        onOpenChange={(open) => !open && setEditingRecord(null)}
      />
    </Card>
  );
}
