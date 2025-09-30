import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertSettingsSchema, InsertSettings } from "@shared/schema";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SettingsModal({
  open,
  onOpenChange,
}: SettingsModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings } = useQuery({
    queryKey: ["/api/settings"],
  });

  const form = useForm<InsertSettings>({
    resolver: zodResolver(insertSettingsSchema),
    defaultValues: {
      title: "",
      merturOfficial: "",
      omsanOfficial: "",
      footerNote: "",
    },
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        title: settings.title,
        merturOfficial: settings.merturOfficial,
        omsanOfficial: settings.omsanOfficial,
        footerNote: settings.footerNote,
      });
    }
  }, [settings, form]);

  const updateMutation = useMutation({
    mutationFn: async (data: InsertSettings) => {
      const response = await apiRequest("PUT", "/api/settings", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      onOpenChange(false);
      toast({
        title: "Başarılı",
        description: "Ayarlar başarıyla güncellendi.",
      });
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "Ayarlar güncellenirken bir hata oluştu.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertSettings) => {
    updateMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Settings className="h-5 w-5 mr-2 text-secondary" />
            Sistem Ayarları
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Sistem Başlığı</Label>
            <Input
              id="title"
              {...form.register("title")}
              placeholder="MERTUR HASAR TAKİP SİSTEMİ"
              className="focus:ring-secondary focus:border-secondary"
            />
            {form.formState.errors.title && (
              <p className="text-sm text-destructive">
                {form.formState.errors.title.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="merturOfficial">Mertur Yetkili</Label>
            <Input
              id="merturOfficial"
              {...form.register("merturOfficial")}
              placeholder="MERTUR YETKİLİSİ"
              className="focus:ring-secondary focus:border-secondary"
            />
            {form.formState.errors.merturOfficial && (
              <p className="text-sm text-destructive">
                {form.formState.errors.merturOfficial.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="omsanOfficial">Omsan Yetkili</Label>
            <Input
              id="omsanOfficial"
              {...form.register("omsanOfficial")}
              placeholder="OMSAN YETKİLİSİ"
              className="focus:ring-secondary focus:border-secondary"
            />
            {form.formState.errors.omsanOfficial && (
              <p className="text-sm text-destructive">
                {form.formState.errors.omsanOfficial.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="footerNote">Dipnot</Label>
            <Input
              id="footerNote"
              {...form.register("footerNote")}
              placeholder="ARAÇ İÇİ EKSİKLİKLERDEN OMSAN SORUMLU DEĞİLDİR."
              className="focus:ring-secondary focus:border-secondary"
            />
            {form.formState.errors.footerNote && (
              <p className="text-sm text-destructive">
                {form.formState.errors.footerNote.message}
              </p>
            )}
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
              {updateMutation.isPending ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
