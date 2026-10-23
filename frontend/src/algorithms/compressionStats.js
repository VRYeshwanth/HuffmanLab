/**
 * Compression Statistics Module
 *
 * Calculates mathematically accurate compression metrics, comparing
 * theoretical UTF-8 baseline vs Huffman payload, plus Shannon entropy.
 */

/**
 * Calculates full compression statistics for a given text and its Huffman encoding.
 *
 * @param {string} text - Original input text
 * @param {string} bitstream - Concatenated Huffman bitstream
 * @param {Map<string, number>|Array} frequencyTable - Symbol frequencies
 * @param {Object} codeTable - Map of symbol -> code
 * @returns {Object} Comprehensive statistics
 */
export function calculateCompressionStats(text, bitstream, frequencyTable, codeTable) {
  if (!text || typeof text !== 'string' || text.length === 0) {
    return {
      originalBytes: 0,
      originalBits: 0,
      totalSymbols: 0,
      distinctSymbols: 0,
      encodedPayloadBits: 0,
      encodedPayloadBytes: 0,
      avgCodeLength: 0,
      shannonEntropy: 0,
      reductionPercent: 0,
      compressionRatio: 0,
      isPayloadLarger: false,
    };
  }

  // UTF-8 byte length
  const encoder = new TextEncoder();
  const originalBytes = encoder.encode(text).length;
  const originalBits = originalBytes * 8;

  const symbols = Array.from(text);
  const totalSymbols = symbols.length;

  // Normalized frequencies
  let freqMap = new Map();
  if (Array.isArray(frequencyTable)) {
    for (const item of frequencyTable) {
      freqMap.set(item.symbol, item.freq);
    }
  } else if (frequencyTable instanceof Map) {
    freqMap = frequencyTable;
  }

  const distinctSymbols = freqMap.size;
  const encodedPayloadBits = bitstream ? bitstream.length : 0;
  const encodedPayloadBytes = Math.ceil(encodedPayloadBits / 8);

  // Average Huffman code length (bits / symbol)
  const avgCodeLength =
    totalSymbols > 0 ? Number((encodedPayloadBits / totalSymbols).toFixed(4)) : 0;

  // Shannon Entropy: H = - sum(p * log2(p))
  let shannonEntropy = 0;
  for (const [, freq] of freqMap.entries()) {
    const p = freq / totalSymbols;
    if (p > 0) {
      shannonEntropy -= p * Math.log2(p);
    }
  }
  shannonEntropy = Number(shannonEntropy.toFixed(4));

  // Theoretical payload reduction percentage:
  // Reduction (%) = ((Original bits - Encoded payload bits) / Original bits) * 100
  let reductionPercent = 0;
  if (originalBits > 0) {
    reductionPercent = Number(
      (((originalBits - encodedPayloadBits) / originalBits) * 100).toFixed(2)
    );
  }

  // Compression ratio: Original bits / Encoded payload bits
  let compressionRatio = 0;
  if (encodedPayloadBits > 0) {
    compressionRatio = Number((originalBits / encodedPayloadBits).toFixed(3));
  } else if (originalBits > 0) {
    compressionRatio = 1;
  }

  const isPayloadLarger = encodedPayloadBits > originalBits;

  return {
    originalBytes,
    originalBits,
    totalSymbols,
    distinctSymbols,
    encodedPayloadBits,
    encodedPayloadBytes,
    avgCodeLength,
    shannonEntropy,
    reductionPercent,
    compressionRatio,
    isPayloadLarger,
  };
}

