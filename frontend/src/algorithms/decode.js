/**
 * Huffman Decoding Module
 *
 * Traverses the constructed Huffman tree bit-by-bit to reconstruct the original text.
 * Performs genuine lossless verification.
 */

/**
 * Decodes a bitstream using the provided Huffman tree root.
 *
 * @param {string} bitstream - String of '0' and '1' characters
 * @param {HuffmanNode} root - Root of the constructed Huffman tree
 * @param {string} [originalText=''] - Optional original text for lossless verification
 * @returns {Object} { decodedText, isExactMatch, totalDecodedSymbols, error }
 */
export function decodeBitstream(bitstream, root, originalText = '') {
  if (!root) {
    return {
      decodedText: '',
      isExactMatch: false,
      totalDecodedSymbols: 0,
      error: 'Huffman tree root is missing.',
    };
  }

  if (!bitstream || bitstream.length === 0) {
    return {
      decodedText: '',
      isExactMatch: originalText === '',
      totalDecodedSymbols: 0,
      error: null,
    };
  }

  // Edge case: single distinct symbol tree
  // Either root is the leaf itself or root has a single left child leaf
  const isSingleSymbol =
    root.isLeaf || (root.left && root.left.isLeaf && !root.right);

  if (isSingleSymbol) {
    const singleLeaf = root.isLeaf ? root : root.left;
    const symbol = singleLeaf.symbol;
    const decodedChars = [];

    for (let i = 0; i < bitstream.length; i++) {
      if (bitstream[i] !== '0') {
        return {
          decodedText: decodedChars.join(''),
          isExactMatch: false,
          totalDecodedSymbols: decodedChars.length,
          error: `Invalid bit '${bitstream[i]}' at index ${i} for single-symbol code '0'.`,
        };
      }
      decodedChars.push(symbol);
    }

    const decodedText = decodedChars.join('');
    const isExactMatch = originalText !== '' ? decodedText === originalText : true;

    return {
      decodedText,
      isExactMatch,
      totalDecodedSymbols: decodedChars.length,
      error: null,
    };
  }

  // General Huffman Tree Traversal
  const decodedChars = [];
  let curr = root;

  for (let i = 0; i < bitstream.length; i++) {
    const bit = bitstream[i];

    if (bit === '0') {
      curr = curr.left;
    } else if (bit === '1') {
      curr = curr.right;
    } else {
      return {
        decodedText: decodedChars.join(''),
        isExactMatch: false,
        totalDecodedSymbols: decodedChars.length,
        error: `Unexpected character '${bit}' at bit index ${i}; expected '0' or '1'.`,
      };
    }

    if (!curr) {
      return {
        decodedText: decodedChars.join(''),
        isExactMatch: false,
        totalDecodedSymbols: decodedChars.length,
        error: `Invalid tree traversal at bit index ${i}: path does not exist in Huffman tree.`,
      };
    }

    // Leaf reached: emit symbol and reset to tree root
    if (curr.isLeaf) {
      decodedChars.push(curr.symbol);
      curr = root;
    }
  }

  // If after processing all bits, curr is not at root, we have incomplete/dangling bits
  let trailingError = null;
  if (curr !== root) {
    trailingError = 'Dangling bits detected at the end of the bitstream that do not complete a symbol code.';
  }

  const decodedText = decodedChars.join('');
  const isExactMatch =
    trailingError === null && (originalText !== '' ? decodedText === originalText : true);

  return {
    decodedText,
    isExactMatch,
    totalDecodedSymbols: decodedChars.length,
    error: trailingError,
  };
}

/**
 * Strict character-by-character and byte-by-byte comparison between original and decoded text.
 *
 * @param {string} original
 * @param {string} decoded
 * @returns {Object} { exactMatch, originalLength, decodedLength, originalByteSize, decodedByteSize, diffIndex }
 */
export function verifyLossless(original, decoded) {
  const exactMatch = original === decoded;
  const origEncoder = new TextEncoder();
  const origBytes = origEncoder.encode(original).length;
  const decBytes = origEncoder.encode(decoded).length;

  let diffIndex = -1;
  if (!exactMatch) {
    const minLen = Math.min(original.length, decoded.length);
    for (let i = 0; i < minLen; i++) {
      if (original[i] !== decoded[i]) {
        diffIndex = i;
        break;
      }
    }
    if (diffIndex === -1 && original.length !== decoded.length) {
      diffIndex = minLen;
    }
  }

  return {
    exactMatch,
    originalLength: Array.from(original).length,
    decodedLength: Array.from(decoded).length,
    originalByteSize: origBytes,
    decodedByteSize: decBytes,
    diffIndex,
  };
}

