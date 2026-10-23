/**
 * Symbol formatting utilities for clear display in tables, trees, and UI.
 */

/**
 * Returns a human-friendly representation of any character or symbol.
 *
 * @param {string} symbol - Single character / code point
 * @returns {{ display: string, label: string, codePoint: string, isSpecial: boolean }}
 */
export function formatSymbol(symbol) {
  if (symbol === null || symbol === undefined) {
    return { display: '∅', label: 'NULL', codePoint: 'N/A', isSpecial: true };
  }

  const codePoint = symbol.codePointAt(0);
  const hexCode = 'U+' + codePoint.toString(16).toUpperCase().padStart(4, '0');

  switch (symbol) {
    case ' ':
      return { display: 'SPACE', label: 'Space', codePoint: hexCode, isSpecial: true };
    case '\n':
      return { display: 'NEWLINE', label: 'Newline (LF)', codePoint: hexCode, isSpecial: true };
    case '\r':
      return { display: 'CR', label: 'Carriage Return', codePoint: hexCode, isSpecial: true };
    case '\t':
      return { display: 'TAB', label: 'Tab', codePoint: hexCode, isSpecial: true };
    case '\0':
      return { display: 'NUL', label: 'Null Byte', codePoint: hexCode, isSpecial: true };
    default:
      // If control character
      if (codePoint < 32 || (codePoint >= 127 && codePoint <= 159)) {
        return { display: hexCode, label: `Control (${hexCode})`, codePoint: hexCode, isSpecial: true };
      }
      return { display: symbol, label: symbol, codePoint: hexCode, isSpecial: false };
  }
}

