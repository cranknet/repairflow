'use client';

import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DEVICE_BRANDS, DEVICE_MODELS } from '@/lib/device-brands';
import {
  getAllBrands,
  getAllModels,
  addCustomBrand,
  addCustomModel,
} from '@/lib/device-storage';
import { PlusIcon } from '@heroicons/react/24/outline';

interface DeviceAutocompleteProps {
  brand: string;
  model: string;
  onBrandChange: (brand: string) => void;
  onModelChange: (model: string) => void;
  brandError?: string;
  modelError?: string;
}

export function DeviceAutocomplete({
  brand,
  model,
  onBrandChange,
  onModelChange,
  brandError,
  modelError,
}: DeviceAutocompleteProps) {
  const [showBrandDropdown, setShowBrandDropdown] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [filteredBrands, setFilteredBrands] = useState<string[]>([]);
  const [filteredModels, setFilteredModels] = useState<string[]>([]);
  const [showAddBrand, setShowAddBrand] = useState(false);
  const [showAddModel, setShowAddModel] = useState(false);
  const brandInputRef = useRef<HTMLInputElement>(null);
  const modelInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load all brands (default + custom) on mount
  useEffect(() => {
    const allBrands = getAllBrands(DEVICE_BRANDS);
    setFilteredBrands(allBrands);
  }, []);

  useEffect(() => {
    if (brand) {
      const defaultModels = DEVICE_MODELS[brand] || [];
      const allModels = getAllModels(brand, defaultModels);
      setFilteredModels(allModels);
    } else {
      setFilteredModels([]);
    }
  }, [brand]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowBrandDropdown(false);
        setShowModelDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleBrandInput = (value: string) => {
    onBrandChange(value);
    if (value) {
      const allBrands = getAllBrands(DEVICE_BRANDS);
      const filtered = allBrands.filter((b) =>
        b.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredBrands(filtered);
      
      // Show "Add new" option if input doesn't exactly match any brand
      const exactMatch = allBrands.some(
        (b) => b.toLowerCase() === value.toLowerCase()
      );
      setShowAddBrand(!exactMatch && value.trim().length > 0);
      setShowBrandDropdown(true);
    } else {
      const allBrands = getAllBrands(DEVICE_BRANDS);
      setFilteredBrands(allBrands);
      setShowAddBrand(false);
      setShowBrandDropdown(false);
    }
  };

  const handleModelInput = (value: string) => {
    onModelChange(value);
    if (value && brand) {
      const defaultModels = DEVICE_MODELS[brand] || [];
      const allModels = getAllModels(brand, defaultModels);
      const filtered = allModels.filter((m) =>
        m.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredModels(filtered);
      
      // Show "Add new" option if input doesn't exactly match any model
      const exactMatch = allModels.some(
        (m) => m.toLowerCase() === value.toLowerCase()
      );
      setShowAddModel(!exactMatch && value.trim().length > 0);
      setShowModelDropdown(true);
    } else {
      setShowModelDropdown(false);
      setShowAddModel(false);
    }
  };

  const selectBrand = (selectedBrand: string) => {
    onBrandChange(selectedBrand);
    setShowBrandDropdown(false);
    setShowAddBrand(false);
    if (brandInputRef.current) {
      brandInputRef.current.blur();
    }
    // Clear model when brand changes
    onModelChange('');
  };

  const selectModel = (selectedModel: string) => {
    onModelChange(selectedModel);
    setShowModelDropdown(false);
    setShowAddModel(false);
    if (modelInputRef.current) {
      modelInputRef.current.blur();
    }
  };

  const handleAddBrand = () => {
    const newBrand = brand.trim();
    if (newBrand) {
      addCustomBrand(newBrand);
      selectBrand(newBrand);
      // Refresh brands list
      const allBrands = getAllBrands(DEVICE_BRANDS);
      setFilteredBrands(allBrands);
    }
  };

  const handleAddModel = () => {
    const newModel = model.trim();
    if (newModel && brand) {
      addCustomModel(brand, newModel);
      selectModel(newModel);
      // Refresh models list
      const defaultModels = DEVICE_MODELS[brand] || [];
      const allModels = getAllModels(brand, defaultModels);
      setFilteredModels(allModels);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-4" ref={dropdownRef}>
      <div className="space-y-2 relative">
        <Label htmlFor="deviceBrand">Device Brand *</Label>
        <div className="relative">
          <Input
            id="deviceBrand"
            ref={brandInputRef}
            value={brand}
            onChange={(e) => handleBrandInput(e.target.value)}
            onFocus={() => {
              if (brand) {
                handleBrandInput(brand);
              } else {
                setShowBrandDropdown(true);
              }
            }}
            placeholder="e.g., Apple, Samsung"
            autoComplete="off"
          />
          {showBrandDropdown && (filteredBrands.length > 0 || showAddBrand) && (
            <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-auto">
              {filteredBrands.map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => selectBrand(b)}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
                >
                  {b}
                </button>
              ))}
              {showAddBrand && (
                <button
                  type="button"
                  onClick={handleAddBrand}
                  className="w-full text-left px-4 py-2 hover:bg-primary-100 dark:hover:bg-primary-900 text-sm text-primary-600 dark:text-primary-400 font-medium border-t border-gray-300 dark:border-gray-700 flex items-center gap-2"
                >
                  <PlusIcon className="h-4 w-4" />
                  Add &quot;{brand}&quot; as new brand
                </button>
              )}
            </div>
          )}
        </div>
        {brandError && <p className="text-sm text-red-600">{brandError}</p>}
      </div>

      <div className="space-y-2 relative">
        <Label htmlFor="deviceModel">Device Model *</Label>
        <div className="relative">
          <Input
            id="deviceModel"
            ref={modelInputRef}
            value={model}
            onChange={(e) => handleModelInput(e.target.value)}
            onFocus={() => {
              if (brand && DEVICE_MODELS[brand] && model) {
                handleModelInput(model);
              }
            }}
            placeholder="e.g., iPhone 13, Galaxy S21"
            disabled={!brand}
            autoComplete="off"
          />
          {showModelDropdown && (filteredModels.length > 0 || showAddModel) && (
            <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-auto">
              {filteredModels.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => selectModel(m)}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
                >
                  {m}
                </button>
              ))}
              {showAddModel && (
                <button
                  type="button"
                  onClick={handleAddModel}
                  className="w-full text-left px-4 py-2 hover:bg-primary-100 dark:hover:bg-primary-900 text-sm text-primary-600 dark:text-primary-400 font-medium border-t border-gray-300 dark:border-gray-700 flex items-center gap-2"
                >
                  <PlusIcon className="h-4 w-4" />
                  Add &quot;{model}&quot; as new model
                </button>
              )}
            </div>
          )}
        </div>
        {modelError && <p className="text-sm text-red-600">{modelError}</p>}
      </div>
    </div>
  );
}

