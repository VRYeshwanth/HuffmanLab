/**
 * Formats byte counts, bit counts, and ratios for clear display.
 */

/**
 * Formats byte counts into human-readable strings (B, KB, MB).
 * @param {number} bytes
 * @returns {string}
 */
export function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  if (!bytes || isNaN(bytes)) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  if (i === 0) {
    return `${bytes} B`;
  }

  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * Formats a bit count into readable bits / kilobits.
 * @param {number} bits
 * @returns {string}
 */
export function formatBits(bits) {
  if (bits === 0) return '0 bits';
  if (!bits || isNaN(bits)) return '0 bits';

  if (bits >= 8000) {
    return `${bits.toLocaleString()} bits (${(bits / 8).toFixed(1)} B)`;
  }
  return `${bits.toLocaleString()} bits`;
}

/**
 * Formats percentage with sign.
 * @param {number} percent
 * @returns {string}
 */
export function formatPercent(percent) {
  if (isNaN(percent)) return '0.00%';
  const prefix = percent > 0 ? '+' : '';
  return `${prefix}${percent.toFixed(2)}%`;
}

