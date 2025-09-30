import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface ChassisAutocompleteProps {
  value: string;
  onValueChange: (value: string) => void;
  onModelSelect: (model: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

interface ChassisData {
  id: number;
  chassisNumber: string;
  model: string;
  uploadDate: string;
}

export default function ChassisAutocomplete({
  value,
  onValueChange,
  onModelSelect,
  placeholder = "Şasi Numarası",
  disabled = false,
}: ChassisAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<ChassisData[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [chassisData, setChassisData] = useState<ChassisData[]>([]);
  const [isSelectingItem, setIsSelectingItem] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load chassis data on component mount and refresh when needed
  useEffect(() => {
    const fetchChassisData = async () => {
      try {
        const response = await apiRequest('GET', '/api/chassis-data');
        const data = await response.json();
        setChassisData(data);
      } catch (error) {
        console.error('Şasi verisi yüklenemedi:', error);
        setChassisData([]); // Set empty array on error
      }
    };

    fetchChassisData();
    
    // Refresh data every 30 seconds to catch updates (reduced frequency)
    const interval = setInterval(fetchChassisData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Filter suggestions based on input
  useEffect(() => {
    if (!value || value.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const searchValue = value.toLowerCase();
    const filtered = chassisData.filter(item => {
      const chassis = item.chassisNumber.toLowerCase();
      // Şasi numarası içinde arama yap (başlangıç, son, içinde)
      return chassis.includes(searchValue) || 
             chassis.endsWith(searchValue) || 
             chassis.startsWith(searchValue);
    });

    // Önce tam eşleşenleri, sonra başlangıç eşleşenleri, son olarak içinde geçenleri sırala
    const sorted = filtered.sort((a, b) => {
      const aLower = a.chassisNumber.toLowerCase();
      const bLower = b.chassisNumber.toLowerCase();
      
      // Tam eşleşme önceliği
      if (aLower === searchValue) return -1;
      if (bLower === searchValue) return 1;
      
      // Son kısmı eşleşme önceliği
      if (aLower.endsWith(searchValue) && !bLower.endsWith(searchValue)) return -1;
      if (bLower.endsWith(searchValue) && !aLower.endsWith(searchValue)) return 1;
      
      // Başlangıç eşleşme önceliği
      if (aLower.startsWith(searchValue) && !bLower.startsWith(searchValue)) return -1;
      if (bLower.startsWith(searchValue) && !aLower.startsWith(searchValue)) return 1;
      
      return 0;
    });

    setSuggestions(sorted.slice(0, 10)); // Show max 10 suggestions
    
    // Only show suggestions if user is actively typing and not selecting an item
    if (!isSelectingItem && document.activeElement === inputRef.current) {
      setShowSuggestions(sorted.length > 0);
    }
  }, [value, chassisData, isSelectingItem]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onValueChange(newValue);
  };

  const handleSuggestionClick = (suggestion: ChassisData) => {
    setIsSelectingItem(true);
    onValueChange(suggestion.chassisNumber);
    onModelSelect(suggestion.model);
    setShowSuggestions(false);
    
    // Blur input to prevent refocus
    if (inputRef.current) {
      inputRef.current.blur();
    }
    
    // Reset selection flag after a short delay
    setTimeout(() => {
      setIsSelectingItem(false);
    }, 300);
  };

  const handleInputBlur = () => {
    // Don't hide suggestions if user is selecting an item
    if (isSelectingItem) {
      return;
    }
    
    // Hide suggestions after a short delay
    setTimeout(() => {
      setShowSuggestions(false);
    }, 150);
  };

  const handleInputFocus = () => {
    // Don't show suggestions immediately on focus
    // Only show when user types
  };

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
        placeholder={placeholder}
        disabled={disabled}
        className="focus:ring-secondary focus:border-secondary"
      />
      
      {showSuggestions && suggestions.length > 0 && (
        <Card className="absolute z-10 w-full mt-1 max-h-60 overflow-y-auto shadow-lg border-2 border-gray-200 suggestion-container">
          <CardContent className="p-0">
            {suggestions.map((suggestion) => (
              <Button
                key={suggestion.id}
                variant="ghost"
                className="w-full justify-start p-3 h-auto text-left hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSuggestionClick(suggestion);
                }}
              >
                <div className="flex items-center space-x-3 w-full">
                  <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {suggestion.chassisNumber}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      Model: {suggestion.model}
                    </div>
                  </div>
                </div>
              </Button>
            ))}
          </CardContent>
        </Card>
      )}
      
      {chassisData.length > 0 && (
        <div className="text-xs text-blue-600 mt-1 font-medium">
          Toplam {chassisData.length} şasi verisi mevcut
        </div>
      )}
    </div>
  );
}