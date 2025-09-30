import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Settings2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertModelSchema, InsertModel, Model } from "@shared/schema";

interface ModelManagerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onModelSelect?: (modelName: string) => void;
}

export default function ModelManagerModal({ open, onOpenChange, onModelSelect }: ModelManagerModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: models = [] } = useQuery<Model[]>({
    queryKey: ["/api/models"],
  });

  const form = useForm<InsertModel>({
    resolver: zodResolver(insertModelSchema),
    defaultValues: {
      name: "",
    },
  });

  const createMutation = useMutation<Model, Error, InsertModel>({
    mutationFn: async (data: InsertModel) => {
      const response = await apiRequest("POST", "/api/models", data);
      return response.json() as Promise<Model>;
    },
    onSuccess: (newModel) => {
      queryClient.invalidateQueries({ queryKey: ["/api/models"] });
      form.reset();
      toast({
        title: "Başarılı",
        description: "Model başarıyla eklendi.",
      });
      if (onModelSelect) {
        onModelSelect(newModel.name);
      }
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "Model eklenirken bir hata oluştu.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation<void, Error, number>({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/models/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/models"] });
      toast({
        title: "Başarılı",
        description: "Model başarıyla silindi.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Model silinirken bir hata oluştu.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertModel) => {
    createMutation.mutate(data);
  };

  const handleDelete = (model: Model) => {
    if (window.confirm(`"${model.name}" modelini silmek istediğinizden emin misiniz?`)) {
      deleteMutation.mutate(model.id);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Settings2 className="h-5 w-5 mr-2 text-secondary" />
            Model Yönetimi
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add New Model */}
          <div className="border border-border rounded-lg p-4">
            <h4 className="font-medium text-foreground mb-4">Yeni Model Ekle</h4>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex space-x-4">
              <div className="flex-1">
                <Input
                  {...form.register("name")}
                  placeholder="Model adı"
                  className="focus:ring-secondary focus:border-secondary"
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-destructive mt-1">{form.formState.errors.name.message}</p>
                )}
              </div>
              <Button
                type="submit"
                className="bg-success hover:bg-success/90 text-white"
                disabled={createMutation.isPending}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </form>
          </div>

          {/* Model List */}
          <div className="border border-border rounded-lg p-4">
            <h4 className="font-medium text-foreground mb-4">Mevcut Modeller</h4>
            <ScrollArea className="h-60">
              <div className="space-y-2">
                {models.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    Henüz model bulunmamaktadır.
                  </p>
                ) : (
                  models.map((model) => (
                    <div
                      key={model.id}
                      className="flex items-center justify-between p-3 bg-muted rounded-md"
                    >
                      <span className="text-foreground">{model.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(model)}
                        className="text-destructive hover:bg-destructive/10"
                        disabled={deleteMutation.isPending}
                        title="Sil"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Kapat
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
