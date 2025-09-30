import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { updateDamageRecordSchema, DamageRecord, Model } from "@shared/schema";
import { z } from "zod";

interface EditModalProps {
  record: DamageRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type UpdateDamageRecordForm = z.infer<typeof updateDamageRecordSchema>;

export default function EditModal({ record, open, onOpenChange }: EditModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: models = [] } = useQuery<Model[]>({
    queryKey: ["/api/models"],
  });

  const form = useForm<UpdateDamageRecordForm>({
    resolver: zodResolver(updateDamageRecordSchema),
    defaultValues: {
      id: 0,
      date: "",
      model: "",
      description: "",
    },
  });

  useEffect(() => {
    if (record) {
      form.reset({
        id: record.id,
        date: record.date,
        model: record.model,
        description: record.description,
      });
    }
  }, [record, form]);

  const updateMutation = useMutation({
    mutationFn: async (data: UpdateDamageRecordForm) => {
      const { id, ...updateData } = data;
      const response = await apiRequest("PUT", `/api/damage-records/${id}`, updateData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/damage-records"] });
      onOpenChange(false);
      toast({
        title: "Başarılı",
        description: "Hasar kaydı başarıyla güncellendi.",
      });
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "Hasar kaydı güncellenirken bir hata oluştu.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: UpdateDamageRecordForm) => {
    updateMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Edit className="h-5 w-5 mr-2 text-secondary" />
            Hasar Kaydını Düzenle
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="editDate">Tarih</Label>
              <Input
                id="editDate"
                type="date"
                {...form.register("date")}
                className="focus:ring-secondary focus:border-secondary"
              />
              {form.formState.errors.date && (
                <p className="text-sm text-destructive">{form.formState.errors.date.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="editChassisNumber">Şasi No</Label>
              <Input
                id="editChassisNumber"
                value={record?.chassisNumber || ""}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editModel">Model</Label>
              <Input
                id="editModel"
                {...form.register("model")}
                className="focus:ring-secondary focus:border-secondary"
                list="editModelList"
              />
              <datalist id="editModelList">
                {models.map((model) => (
                  <option key={model.id} value={model.name}>
                    {model.name}
                  </option>
                ))}
              </datalist>
              {form.formState.errors.model && (
                <p className="text-sm text-destructive">{form.formState.errors.model.message}</p>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="editDescription">Hasar Tanımı</Label>
              <Textarea
                id="editDescription"
                {...form.register("description")}
                className="focus:ring-secondary focus:border-secondary"
                rows={3}
              />
              {form.formState.errors.description && (
                <p className="text-sm text-destructive">{form.formState.errors.description.message}</p>
              )}
            </div>
          </div>

          <div className="flex space-x-4 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              İptal
            </Button>
            <Button
              type="submit"
              className="bg-secondary hover:bg-secondary/90 text-white"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Güncelleniyor..." : "Güncelle"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
