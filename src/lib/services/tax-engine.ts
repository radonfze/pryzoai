
// Basic Tax Calculator Interface
export interface TaxCalculationResult {
    taxableAmount: number;
    taxAmount: number;
    totalAmount: number;
    taxRate: number;
    details: {
        code: string;
        name: string;
        rate: number;
        type: "standard" | "zero_rated" | "exempt" | "out_of_scope" | "reverse_charge";
    };
}

/**
 * Calculate VAT based on amount and tax code configuration.
 * Handles standard 5% (UAE), Zero-rated, and Exempt.
 */
export function calculateVAT(
    amount: number, 
    taxRate: number, 
    taxType: string,
    taxCode: string,
    isInclusive: boolean = false
): TaxCalculationResult {
    let taxable = amount;
    let tax = 0;
    
    // Normalize rate
    const rate = Number(taxRate);

    if (taxType === "exempt" || taxType === "out_of_scope") {
        return {
            taxableAmount: amount, // Technically exempt supplies are reported differently, but calculation-wise tax is 0
            taxAmount: 0,
            totalAmount: amount,
            taxRate: 0,
            details: { code: taxCode, name: taxType, rate: 0, type: taxType as any }
        };
    }

    if (isInclusive) {
        // Reverse calculation: Tax = Total - (Total / (1 + rate/100))
        const div = 1 + (rate / 100);
        taxable = amount / div;
        tax = amount - taxable;
    } else {
        // Standard calculation
        tax = amount * (rate / 100);
    }

    // Rounding to 2 decimal places per line is standard, but some ERPs do it at Total.
    // For per-line calculation service:
    return {
        taxableAmount: Number(taxable.toFixed(2)),
        taxAmount: Number(tax.toFixed(2)),
        totalAmount: Number((taxable + tax).toFixed(2)),
        taxRate: rate,
        details: { code: taxCode, name: `VAT ${rate}%`, rate: rate, type: taxType as any }
    };
}

/**
 * Determine Tax Return Box (UAE FTA)
 * @param type "standard" | "zero_rated" | "exempt" | "rcm"
 * @param direction "sales" | "purchase"
 */
export function getFTABox(type: string, direction: "sales" | "purchase"): string {
    // Simplified mapping for Phase 5
    if (direction === "sales") {
        switch(type) {
            case "standard": return "1a"; // Standard Rated Supplies (DXB)
            case "zero_rated": return "4"; // Zero Rated
            case "exempt": return "5"; // Exempt
            default: return "";
        }
    } else {
        switch(type) {
            case "standard": return "8"; // Standard Rated Expenses
            case "reverse_charge": return "10"; // RCM
            default: return "";
        }
    }
}
