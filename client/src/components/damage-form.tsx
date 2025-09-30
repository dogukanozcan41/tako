import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PlusCircle, Settings, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertDamageRecordSchema, InsertDamageRecord } from "@shared/schema";
import { getCurrentUser, getFullName } from "@/lib/auth";
import ModelManagerModal from "./model-manager-modal";
import ChassisAutocomplete from "./chassis-autocomplete";
import EditModal from "./edit-modal";

export default function DamageForm() {
  const [modelManagerOpen, setModelManagerOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [chassisWarning, setChassisWarning] = useState<{
    show: boolean;
    message: string;
    existingRecord?: any;
  }>({ show: false, message: "" });

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const currentUser = getCurrentUser();
  const userFullName = getFullName();

  const { data: models = [] } = useQuery<any[]>({
    queryKey: ["/api/models"],
  });

  const form = useForm<InsertDamageRecord>({
    resolver: zodResolver(insertDamageRecordSchema),
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      chassisNumber: "",
      model: "",
      description: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertDamageRecord) => {
      const response = await apiRequest("POST", "/api/damage-records", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/damage-records"] });
      form.reset({
        date: new Date().toISOString().split("T")[0],
        chassisNumber: "",
        model: "",
        description: "",
      });
      setChassisWarning({ show: false, message: "" });
      toast({
        title: "Başarılı",
        description: "Hasar kaydı başarıyla eklendi.",
      });
    },
    onError: (error: any) => {
      if (error.message.includes("Chassis number already exists")) {
        const errorData = JSON.parse(error.message.split(": ")[1]);
        setChassisWarning({
          show: true,
          message: `Bu Şasi No (${form.getValues("chassisNumber")}) zaten mevcut!`,
          existingRecord: errorData.existingRecord,
        });
      } else {
        toast({
          title: "Hata",
          description: "Hasar kaydı eklenirken bir hata oluştu.",
          variant: "destructive",
        });
      }
    },
  });

  const onSubmit = (data: InsertDamageRecord) => {
    createMutation.mutate(data);
  };

  const handleEditExisting = () => {
    if (chassisWarning.existingRecord) {
      setEditModalOpen(true);
      setChassisWarning({ show: false, message: "" });
    }
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <PlusCircle className="h-5 w-5 mr-2 text-secondary" />
            Yeni Hasar Kaydı
          </CardTitle>
          <div className="flex items-center text-sm text-muted-foreground">
            <User className="h-4 w-4 mr-1" />
            <span className="font-medium">{userFullName}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <Label htmlFor="date">Tarih</Label>
              <Input
                id="date"
                type="date"
                {...form.register("date")}
                className="focus:ring-secondary focus:border-secondary"
              />
              {form.formState.errors.date && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.date.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="chassisNumber">Şasi No</Label>
              <ChassisAutocomplete
                value={form.watch("chassisNumber")}
                onValueChange={(value) => form.setValue("chassisNumber", value)}
                onModelSelect={(model) => form.setValue("model", model)}
                placeholder="Şasi numarası"
                disabled={createMutation.isPending}
              />
              {form.formState.errors.chassisNumber && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.chassisNumber.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <div className="relative">
                <Input
                  id="model"
                  placeholder="Model seçin veya yazın"
                  {...form.register("model")}
                  className="focus:ring-secondary focus:border-secondary pr-10"
                  list="modelList"
                />
                <datalist id="modelList">
                  {models.map((model: any) => (
                    <option key={model.id} value={model.name}>
                      {model.name}
                    </option>
                  ))}
                </datalist>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 h-6 w-6"
                  onClick={() => setModelManagerOpen(true)}
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
              {form.formState.errors.model && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.model.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Hasar Tanımı</Label>
              <Input
                id="description"
                placeholder="Hasar açıklaması"
                {...form.register("description")}
                className="focus:ring-secondary focus:border-secondary"
              />
              {form.formState.errors.description && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.description.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
            <Button
              type="submit"
              size="lg"
              className="bg-success hover:bg-success/90 text-white px-8 py-3 text-base font-semibold w-full sm:w-auto order-2 sm:order-1"
              disabled={createMutation.isPending}
            >
              <PlusCircle className="h-5 w-5 mr-2" />
              {createMutation.isPending ? "Kaydediliyor..." : "Hasar Kaydet"}
            </Button>
          </div>
        </form>

        {chassisWarning.show && (
          <Alert className="mt-4 border-destructive">
            <AlertDescription className="flex items-center justify-between">
              <span className="text-destructive font-medium">
                {chassisWarning.message}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="bg-secondary hover:bg-secondary/90 text-white border-secondary"
                onClick={handleEditExisting}
              >
                Mevcut Kaydı Düzenle
              </Button>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>

      <ModelManagerModal
        open={modelManagerOpen}
        onOpenChange={setModelManagerOpen}
        onModelSelect={(modelName) => {
          form.setValue("model", modelName);
          setModelManagerOpen(false);
        }}
      />

      <EditModal
        record={chassisWarning.existingRecord}
        open={editModalOpen}
        onOpenChange={(open) => {
          setEditModalOpen(open);
          if (!open) {
            setChassisWarning({ show: false, message: "" });
            // Form alanlarını temizle
            form.reset({
              date: new Date().toISOString().split("T")[0],
              chassisNumber: "",
              model: "",
              description: "",
            });
          }
        }}
      />
    </Card>
  );
}
