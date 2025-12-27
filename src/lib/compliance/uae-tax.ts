import { Buffer } from "buffer";

interface QrData {
  sellerName: string;
  vatRegistrationNumber: string;
  timestamp: string; // ISO 8601
  invoiceTotal: string; // Total with VAT
  vatTotal: string; // VAT Amount
}

/**
 * Generates a UAE FTA compliant QR code string (Base64 TLV format)
 * 
 * Tags:
 * 1. Seller Name
 * 2. VAT Registration Number
 * 3. Time Stamp
 * 4. Invoice Total
 * 5. VAT Total
 */
export function generateUaeQrCode(data: QrData): string {
  const buffers: Buffer[] = [];

  // Helper to append TLV
  const appendTlv = (tag: number, value: string) => {
    const valueBuffer = Buffer.from(value, "utf8");
    const len = valueBuffer.length;
    
    // Tag (1 byte)
    const tagBuffer = Buffer.from([tag]);
    
    // Length (1 byte) - simplified, assuming standard length logic fits in 1 byte for short strings
    // In strict TLV, length can be multi-byte, but for QR fields < 255 chars, 1 byte is standard.
    const lengthBuffer = Buffer.from([len]);
    
    buffers.push(tagBuffer, lengthBuffer, valueBuffer);
  };

  appendTlv(1, data.sellerName);
  appendTlv(2, data.vatRegistrationNumber);
  appendTlv(3, data.timestamp);
  appendTlv(4, data.invoiceTotal);
  appendTlv(5, data.vatTotal);

  // Concatenate all buffers
  const finalBuffer = Buffer.concat(buffers);

  // Return Base64
  return finalBuffer.toString("base64");
}
