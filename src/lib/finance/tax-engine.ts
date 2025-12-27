import { Decimal } from "decimal.js";

/**
 * UAE/GCC VAT Engine
 * Handles tax calculations for Standard (5%), Zero-Rated (0%), and Exempt supplies.
 * Supports both Inclusive and Exclusive tax pricing models.
 */

export type TaxRateType = "STANDARD" | "ZERO" | "EXEMPT" | "OUT_OF_SCOPE";

export interface TaxRate {
  id: string;
  name: string;
  ratePercent: number;
  type: TaxRateType;
}

export interface TaxCalculationResult {
  taxableAmount: number;
  taxAmount: number;
  totalAmount: number;
}

// Default UAE Tax Rates
export const UAE_TAX_RATES: Record<string, TaxRate> = {
  STANDARD: { id: "vat_std", name: "Standard Rated (5%)", ratePercent: 5, type: "STANDARD" },
  ZERO: { id: "vat_zero", name: "Zero Rated (0%)", ratePercent: 0, type: "ZERO" },
  EXEMPT: { id: "vat_exempt", name: "Exempt", ratePercent: 0, type: "EXEMPT" },
};

/**
 * Calculate VAT for a single line item
 * 
 * @param amount - The base amount or total amount depending on isInclusive
 * @param taxPercent - The VAT percentage (e.g. 5 for 5%)
 * @param isInclusive - Whether the input amount already includes tax
 */
export function calculateLineTax(
  amount: number,
  taxPercent: number,
  isInclusive: boolean = false
): TaxCalculationResult {
  const dAmount = new Decimal(amount);
  const dRate = new Decimal(taxPercent).div(100);

  let taxableAmount: Decimal;
  let taxAmount: Decimal;
  let totalAmount: Decimal;

  if (isInclusive) {
    // Formula: Taxable = Total / (1 + Rate)
    // Tax = Total - Taxable
    totalAmount = dAmount;
    taxableAmount = totalAmount.div(dRate.plus(1));
    taxAmount = totalAmount.minus(taxableAmount);
  } else {
    // Formula: Tax = Amount * Rate
    // Total = Amount + Tax
    taxableAmount = dAmount;
    taxAmount = taxableAmount.times(dRate);
    totalAmount = taxableAmount.plus(taxAmount);
  }

  return {
    taxableAmount: taxableAmount.toDecimalPlaces(2).toNumber(),
    taxAmount: taxAmount.toDecimalPlaces(2).toNumber(),
    totalAmount: totalAmount.toDecimalPlaces(2).toNumber(),
  };
}

/**
 * Calculate totals for an entire document
 */
export interface DocumentTotalResult {
  subtotal: number;
  totalVat: number;
  grandTotal: number;
  vatBreakdown: Record<number, number>; // rate -> amount
}

export function calculateDocumentTotals(
  lines: { total: number; vatPercent: number; isInclusive?: boolean }[]
): DocumentTotalResult {
  let subtotal = new Decimal(0);
  let totalVat = new Decimal(0);
  const vatBreakdown: Record<number, Decimal> = {};

  for (const line of lines) {
    const result = calculateLineTax(line.total, line.vatPercent, line.isInclusive);
    
    subtotal = subtotal.plus(result.taxableAmount);
    totalVat = totalVat.plus(result.taxAmount);

    // Aggregate by rate
    if (!vatBreakdown[line.vatPercent]) {
      vatBreakdown[line.vatPercent] = new Decimal(0);
    }
    vatBreakdown[line.vatPercent] = vatBreakdown[line.vatPercent].plus(result.taxAmount);
  }

  // Convert breakdown to numbers
  const finalBreakdown: Record<number, number> = {};
  for (const [rate, amount] of Object.entries(vatBreakdown)) {
    finalBreakdown[Number(rate)] = amount.toDecimalPlaces(2).toNumber();
  }

  return {
    subtotal: subtotal.toDecimalPlaces(2).toNumber(),
    totalVat: totalVat.toDecimalPlaces(2).toNumber(),
    grandTotal: subtotal.plus(totalVat).toDecimalPlaces(2).toNumber(),
    vatBreakdown: finalBreakdown,
  };
}
