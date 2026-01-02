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

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-AE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}


export function toTitleCase(str: string | null | undefined): string {
  if (!str) return "";
  return str.split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

export function toUpperCase(str: string | null | undefined): string {
    if (!str) return "";
    return str.toUpperCase();
}
