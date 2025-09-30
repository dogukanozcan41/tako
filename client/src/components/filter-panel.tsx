import { Filter, Eraser } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface FilterState {
  chassisNumber: string;
  model: string;
  keyword: string;
  startDate: string;
  endDate: string;
}

interface FilterPanelProps {
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
}

export default function FilterPanel({ filters, setFilters }: FilterPanelProps) {
  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    setFilters({
      chassisNumber: "",
      model: "",
      keyword: "",
      startDate: "",
      endDate: ""
    });
  };

  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Filter className="h-5 w-5 mr-2 text-secondary" />
          Filtreleme
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
          <div className="space-y-2">
            <Label htmlFor="chassisFilter">Şasi No Ara</Label>
            <Input
              id="chassisFilter"
              placeholder="Şasi No"
              value={filters.chassisNumber}
              onChange={(e) => handleFilterChange("chassisNumber", e.target.value)}
              className="focus:ring-secondary focus:border-secondary"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="modelFilter">Model Ara</Label>
            <Input
              id="modelFilter"
              placeholder="Model"
              value={filters.model}
              onChange={(e) => handleFilterChange("model", e.target.value)}
              className="focus:ring-secondary focus:border-secondary"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="keywordFilter">Kelime Ara</Label>
            <Input
              id="keywordFilter"
              placeholder="Hasar tanımında ara"
              value={filters.keyword}
              onChange={(e) => handleFilterChange("keyword", e.target.value)}
              className="focus:ring-secondary focus:border-secondary"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="startDateFilter">Başlangıç Tarihi</Label>
            <Input
              id="startDateFilter"
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange("startDate", e.target.value)}
              className="focus:ring-secondary focus:border-secondary"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="endDateFilter">Bitiş Tarihi</Label>
            <Input
              id="endDateFilter"
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange("endDate", e.target.value)}
              className="focus:ring-secondary focus:border-secondary"
            />
          </div>
        </div>

        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={clearFilters}
            disabled={activeFiltersCount === 0}
            className="bg-warning hover:bg-warning/90 text-white border-warning"
          >
            <Eraser className="h-4 w-4 mr-2" />
            Temizle
          </Button>

          <span className="text-sm text-muted-foreground">
            {activeFiltersCount > 0 && `${activeFiltersCount} aktif filtre`}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
