import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number | string) {
  if (amount === undefined || amount === null) return "-";
  return new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency: "AED",
  }).format(Number(amount));
}
