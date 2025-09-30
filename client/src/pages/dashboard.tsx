import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Settings, Cog, LogOut, User, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import DamageForm from "@/components/damage-form";
import FilterPanel from "@/components/filter-panel";
import DamageTable from "@/components/damage-table";
import ActionButtons from "@/components/action-buttons";
import SettingsModal from "@/components/settings-modal";
import UserManagementModal from "@/components/user-management-modal";
import { DamageRecord, Settings as AppSettings } from "@shared/schema";
import { logout, getCurrentUser, isAdmin } from "@/lib/auth";

interface FilterState {
  chassisNumber: string;
  model: string;
  keyword: string;
  startDate: string;
  endDate: string;
}

export default function Dashboard() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [usersOpen, setUsersOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    chassisNumber: "",
    model: "",
    keyword: "",
    startDate: "",
    endDate: "",
  });

  const currentUser = getCurrentUser();
  const userIsAdmin = isAdmin();

  const { data: settings } = useQuery<AppSettings | null>({
    queryKey: ["/api/settings"],
  });

  const { data: damageRecords = [] } = useQuery<DamageRecord[]>({
    queryKey: ["/api/damage-records"],
  });

  const filteredRecords = damageRecords.filter((record: DamageRecord) => {
    if (
      filters.chassisNumber &&
      !record.chassisNumber
        .toLowerCase()
        .includes(filters.chassisNumber.toLowerCase())
    ) {
      return false;
    }
    if (
      filters.model &&
      !record.model.toLowerCase().startsWith(filters.model.toLowerCase())
    ) {
      return false;
    }
    if (
      filters.keyword &&
      !(
        record.description
          .toLowerCase()
          .includes(filters.keyword.toLowerCase()) ||
        record.model.toLowerCase().includes(filters.keyword.toLowerCase())
      )
    ) {
      return false;
    }
    if (filters.startDate && record.date < filters.startDate) {
      return false;
    }
    if (filters.endDate && record.date > filters.endDate) {
      return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="bg-primary text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Settings className="h-6 w-6" />
              <h1 className="text-xl font-bold">Hasar Takip Sistemi</h1>
            </div>
            <nav className="flex space-x-4">
              <Button
                variant="ghost"
                className="text-white hover:bg-primary/80"
                onClick={() => setSettingsOpen(true)}
              >
                <Cog className="h-4 w-4 mr-2" />
                Ayarlar
              </Button>
              {userIsAdmin && (
                <Button
                  variant="ghost"
                  className="text-white hover:bg-primary/80"
                  onClick={() => setUsersOpen(true)}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Kullanıcı Yönetimi
                </Button>
              )}
              <Button
                variant="ghost"
                className="text-white hover:bg-red-500/80 border-white/20"
                onClick={logout}
              >
                <User className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">
                  {currentUser?.firstName || "Kullanıcı"}
                </span>
                <LogOut className="h-4 w-4 ml-2" />
              </Button>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="bg-primary rounded-xl p-8 mb-8 text-center relative">
          <h2 className="text-3xl font-bold text-white">
            {settings?.title || "HASAR TAKİP SİSTEMİ"}
          </h2>
        </div>

        {/* Damage Entry Form */}
        <DamageForm />

        {/* Filter Panel */}
        <FilterPanel filters={filters} setFilters={setFilters} />

        {/* Data Table */}
        <DamageTable records={filteredRecords} />

        {/* Action Buttons */}
        <ActionButtons records={filteredRecords} />
      </main>

      {/* Settings Modal */}
      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />

      {/* User Management Modal (Admin Only) */}
      {userIsAdmin && (
        <UserManagementModal open={usersOpen} onOpenChange={setUsersOpen} />
      )}

      {/* Footer */}
      <footer className="bg-primary text-white mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-gray-300">© 2025 Hasar Takip Sistemi</p>
            <p className="text-gray-400 text-sm mt-2">By Dogu</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
