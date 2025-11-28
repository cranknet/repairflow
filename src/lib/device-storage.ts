const STORAGE_KEY_BRANDS = 'repairflow_custom_brands';
const STORAGE_KEY_MODELS = 'repairflow_custom_models';

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

const STORAGE_KEY_ISSUES = 'repairflow_custom_issues';

/**
 * Get all custom issues from localStorage
 */
export function getCustomIssues(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY_ISSUES);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Add a custom issue to localStorage
 */
export function addCustomIssue(issue: string): void {
  if (typeof window === 'undefined') return;
  try {
    const issues = getCustomIssues();
    if (!issues.includes(issue)) {
      issues.push(issue);
      localStorage.setItem(STORAGE_KEY_ISSUES, JSON.stringify(issues));
    }
  } catch (error) {
    console.error('Error saving custom issue:', error);
  }
}

/**
 * Get all issues (default + custom)
 */
export function getAllIssues(defaultIssues: string[]): string[] {
  const customIssues = getCustomIssues();
  const allIssues = [...defaultIssues, ...customIssues];
  // Remove duplicates and sort
  return Array.from(new Set(allIssues)).sort();
}

