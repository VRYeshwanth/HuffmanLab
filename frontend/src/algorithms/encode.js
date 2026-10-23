/**
 * Huffman Encoding Module
 *
 * Encodes text into a Huffman bitstream and packs bits into physical bytes (Uint8Array).
 */

/**
 * Encodes a text string using the provided Huffman code table.
 *
 * @param {string} text - Original input text
 * @param {Object} codeTable - Map of symbol -> bit string (e.g. { 'a': '01', 'b': '10' })
 * @returns {Object} { bitstream, bitLength, packedBytes, paddingBits, symbolCount }
 */
export function encodeText(text, codeTable) {
  if (!text || typeof text !== 'string') {
    return {
      bitstream: '',
      bitLength: 0,
      packedBytes: new Uint8Array(0),
      paddingBits: 0,
      symbolCount: 0,
    };
  }

  // Iterate over Unicode code points
  const symbols = Array.from(text);
  let bitstream = '';

  for (let i = 0; i < symbols.length; i++) {
    const sym = symbols[i];
    const code = codeTable[sym];
    if (code === undefined) {
      throw new Error(`Symbol '${sym}' (U+${sym.codePointAt(0).toString(16).toUpperCase()}) not found in code table.`);
    }
    bitstream += code;
  }

  const bitLength = bitstream.length;

  // Pack logical bits into physical Uint8Array bytes
  const { packedBytes, paddingBits } = packBitstream(bitstream);

  return {
    bitstream,
    bitLength,
    packedBytes,
    paddingBits,
    symbolCount: symbols.length,
  };
}

/**
 * Packs a binary string ("0101011...") into a Uint8Array of bytes.
 * Pads the final byte with trailing zeros if not a multiple of 8.
 *
 * @param {string} bitstream - String of '0' and '1' characters
 * @returns {{ packedBytes: Uint8Array, paddingBits: number }}
 */
export function packBitstream(bitstream) {
  if (!bitstream || bitstream.length === 0) {
    return { packedBytes: new Uint8Array(0), paddingBits: 0 };
  }

  const bitCount = bitstream.length;
  const paddingBits = (8 - (bitCount % 8)) % 8;
  const totalBits = bitCount + paddingBits;
  const byteCount = totalBits / 8;
  const packedBytes = new Uint8Array(byteCount);

  let currentByte = 0;
  let bitPos = 7;
  let byteIndex = 0;

  for (let i = 0; i < bitCount; i++) {
    if (bitstream[i] === '1') {
      currentByte |= (1 << bitPos);
    }
    bitPos--;
    if (bitPos < 0) {
      packedBytes[byteIndex++] = currentByte;
      currentByte = 0;
      bitPos = 7;
    }
  }

  // If there's an incomplete byte being finished
  if (byteIndex < byteCount) {
    packedBytes[byteIndex] = currentByte;
  }

  return { packedBytes, paddingBits };
}

/**
 * Unpacks a Uint8Array of bytes back into a binary string of '0's and '1's.
 * Strips the specified number of padding bits from the end.
 *
 * @param {Uint8Array} packedBytes
 * @param {number} paddingBits - Number of padding bits to drop from the last byte (0-7)
 * @returns {string} bitstream
 */
export function unpackBitstream(packedBytes, paddingBits = 0) {
  if (!packedBytes || packedBytes.length === 0) {
    return '';
  }

  let bitstream = '';
  const totalBytes = packedBytes.length;

  for (let b = 0; b < totalBytes; b++) {
    const byteVal = packedBytes[b];
    // In the last byte, only take (8 - paddingBits) bits
    const bitsToRead = (b === totalBytes - 1 && paddingBits > 0) ? (8 - paddingBits) : 8;

    for (let i = 7; i >= 8 - bitsToRead; i--) {
      bitstream += ((byteVal >> i) & 1) ? '1' : '0';
    }
  }

  return bitstream;
}

