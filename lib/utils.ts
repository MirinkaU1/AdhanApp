import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility to merge Tailwind classes with proper precedence
 * Similar to shadcn's cn() helper
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
