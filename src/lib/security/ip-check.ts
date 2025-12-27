/**
 * IP Validation Utilities
 */

/**
 * Validates if an IP is within a CIDR range or specific list
 * Simplified for now to exact match
 */
export function isIpAllowed(ip: string, allowedIps: string[]): boolean {
  if (allowedIps.length === 0) return true; // No restrictions if empty
  return allowedIps.includes(ip);
}
