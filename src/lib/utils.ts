import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatId(id: string) {
  if (!id) return '';
  // If id is a UUID (long), format it
  if (id.length > 20) {
    return `#${id.substring(0, 8).toUpperCase()}`;
  }
  return id;
}

