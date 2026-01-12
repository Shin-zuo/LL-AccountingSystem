export function formatPHP(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined) return "₱0.00";
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "₱0.00";
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

export function formatNumber(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined) return "0.00";
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "0.00";
  return new Intl.NumberFormat("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

export function calculateVAT(amount: number, vatRate: number = 0.12): { net: number; vat: number } {
  const net = amount / (1 + vatRate);
  const vat = amount - net;
  return { net: Math.round(net * 100) / 100, vat: Math.round(vat * 100) / 100 };
}

export function addVAT(netAmount: number, vatRate: number = 0.12): { gross: number; vat: number } {
  const vat = netAmount * vatRate;
  const gross = netAmount + vat;
  return { gross: Math.round(gross * 100) / 100, vat: Math.round(vat * 100) / 100 };
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

export function formatDateInput(date: string | Date | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toISOString().split("T")[0];
}
