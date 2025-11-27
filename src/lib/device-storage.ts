const STORAGE_KEY_BRANDS = 'repairshop_custom_brands';
const STORAGE_KEY_MODELS = 'repairshop_custom_models';

export interface CustomDeviceData {
  brands: string[];
  models: Record<string, string[]>;
}

/**
 * Get all custom brands from localStorage
 */
export function getCustomBrands(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY_BRANDS);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Get all custom models for a brand from localStorage
 */
export function getCustomModels(brand: string): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY_MODELS);
    const allModels: Record<string, string[]> = stored ? JSON.parse(stored) : {};
    return allModels[brand] || [];
  } catch {
    return [];
  }
}

/**
 * Add a custom brand to localStorage
 */
export function addCustomBrand(brand: string): void {
  if (typeof window === 'undefined') return;
  try {
    const brands = getCustomBrands();
    if (!brands.includes(brand)) {
      brands.push(brand);
      localStorage.setItem(STORAGE_KEY_BRANDS, JSON.stringify(brands));
    }
  } catch (error) {
    console.error('Error saving custom brand:', error);
  }
}

/**
 * Add a custom model to localStorage for a specific brand
 */
export function addCustomModel(brand: string, model: string): void {
  if (typeof window === 'undefined') return;
  try {
    const stored = localStorage.getItem(STORAGE_KEY_MODELS);
    const allModels: Record<string, string[]> = stored ? JSON.parse(stored) : {};
    
    if (!allModels[brand]) {
      allModels[brand] = [];
    }
    
    if (!allModels[brand].includes(model)) {
      allModels[brand].push(model);
      localStorage.setItem(STORAGE_KEY_MODELS, JSON.stringify(allModels));
    }
  } catch (error) {
    console.error('Error saving custom model:', error);
  }
}

/**
 * Get all brands (default + custom)
 */
export function getAllBrands(defaultBrands: string[]): string[] {
  const customBrands = getCustomBrands();
  const allBrands = [...defaultBrands, ...customBrands];
  // Remove duplicates and sort
  return Array.from(new Set(allBrands)).sort();
}

/**
 * Get all models for a brand (default + custom)
 */
export function getAllModels(brand: string, defaultModels: string[]): string[] {
  const customModels = getCustomModels(brand);
  const allModels = [...defaultModels, ...customModels];
  // Remove duplicates and sort
  return Array.from(new Set(allModels)).sort();
}

