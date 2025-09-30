import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, Edit, Trash2, User, Shield, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";

interface User {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'user';
  createdAt: string;
}

interface UserFormData {
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'user';
}

interface UserManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function UserManagementModal({ open, onOpenChange }: UserManagementModalProps) {
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    username: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'user'
  });
  const [error, setError] = useState('');
  
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['/api/users'],
    enabled: open,
  });

  const createUserMutation = useMutation({
    mutationFn: async (userData: UserFormData) => {
      const response = await apiRequest('POST', '/api/users', userData);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Kullanıcı oluşturulamadı');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: "Başarılı",
        description: "Kullanıcı başarıyla oluşturuldu",
      });
      resetForm();
    },
    onError: (error: Error) => {
      setError(error.message);
    }
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, userData }: { id: number; userData: Partial<UserFormData> }) => {
      const response = await apiRequest('PUT', `/api/users/${id}`, userData);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Kullanıcı güncellenemedi');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: "Başarılı",
        description: "Kullanıcı başarıyla güncellendi",
      });
      resetForm();
    },
    onError: (error: Error) => {
      setError(error.message);
    }
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/users/${id}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Kullanıcı silinemedi');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: "Başarılı",
        description: "Kullanıcı başarıyla silindi",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      firstName: '',
      lastName: '',
      role: 'user'
    });
    setEditingUser(null);
    setShowUserForm(false);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (editingUser) {
      // Update existing user
      const updateData = { ...formData };
      if (!updateData.password) {
        delete updateData.password; // Don't update password if empty
      }
      updateUserMutation.mutate({ id: editingUser.id, userData: updateData });
    } else {
      // Create new user
      if (!formData.password) {
        setError('Şifre gerekli');
        return;
      }
      createUserMutation.mutate(formData);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: '',
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role
    });
    setShowUserForm(true);
  };

  const handleDelete = (user: User) => {
    if (window.confirm(`${user.firstName} ${user.lastName} kullanıcısını silmek istediğinizden emin misiniz?`)) {
      deleteUserMutation.mutate(user.id);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Kullanıcı Yönetimi
          </DialogTitle>
          <DialogDescription>
            Sistem kullanıcılarını yönetin, yeni kullanıcı ekleyin veya mevcut kullanıcıları düzenleyin.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {!showUserForm ? (
            <>
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Kullanıcılar ({users.length})</h3>
                <Button onClick={() => setShowUserForm(true)} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Yeni Kullanıcı
                </Button>
              </div>

              {isLoading ? (
                <div className="text-center py-4">Kullanıcılar yükleniyor...</div>
              ) : (
                <div className="grid gap-4">
                  {users.map((user: User) => (
                    <Card key={user.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            {user.role === 'admin' ? <Shield className="h-5 w-5 text-blue-500" /> : <User className="h-5 w-5 text-gray-500" />}
                            <div>
                              <h4 className="font-semibold">{user.firstName} {user.lastName}</h4>
                              <p className="text-sm text-gray-600">@{user.username}</p>
                              <p className="text-xs text-gray-500">{formatDate(user.createdAt)}</p>
                            </div>
                          </div>
                          <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                            {user.role === 'admin' ? 'Admin' : 'Kullanıcı'}
                          </Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(user)}
                            className="flex items-center gap-1"
                          >
                            <Edit className="h-3 w-3" />
                            Düzenle
                          </Button>
                          {user.id !== 1 && ( // Prevent deletion of admin user
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(user)}
                              className="flex items-center gap-1 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                              Sil
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>
                  {editingUser ? `${editingUser.firstName} ${editingUser.lastName} Düzenle` : 'Yeni Kullanıcı Ekle'}
                </CardTitle>
                <CardDescription>
                  {editingUser ? 'Kullanıcı bilgilerini güncelleyin.' : 'Yeni kullanıcı bilgilerini girin.'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">Ad</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Soyad</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="username">Kullanıcı Adı</Label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">
                      Şifre {editingUser && <span className="text-sm text-gray-500">(boş bırakılırsa değiştirilmez)</span>}
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      required={!editingUser}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Rol</Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value: 'admin' | 'user') => setFormData(prev => ({ ...prev, role: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">Kullanıcı</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" disabled={createUserMutation.isPending || updateUserMutation.isPending}>
                      {(createUserMutation.isPending || updateUserMutation.isPending) ? 'Kaydediliyor...' : (editingUser ? 'Güncelle' : 'Oluştur')}
                    </Button>
                    <Button type="button" variant="outline" onClick={resetForm}>
                      İptal
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Kapat
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}