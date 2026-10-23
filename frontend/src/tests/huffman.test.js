import { describe, it, expect } from 'vitest';
import { MinHeap } from '../algorithms/MinHeap.js';
import { buildHuffmanTree, calculateFrequencies, getPathToSymbol } from '../algorithms/huffman.js';
import { encodeText, packBitstream, unpackBitstream } from '../algorithms/encode.js';
import { decodeBitstream, verifyLossless } from '../algorithms/decode.js';
import { calculateCompressionStats } from '../algorithms/compressionStats.js';
import { compressToBinaryFile, decompressBinaryFile } from '../algorithms/binaryFile.js';

describe('MinHeap Implementation', () => {
  it('correctly maintains min-heap property on insert and extractMin', () => {
    const heap = new MinHeap();
    const numbers = [15, 3, 20, 1, 8, 2, 0];
    numbers.forEach((num) => heap.insert({ freq: num, symbol: String(num) }));

    const extracted = [];
    while (!heap.isEmpty()) {
      extracted.push(heap.extractMin().freq);
    }

    expect(extracted).toEqual([0, 1, 2, 3, 8, 15, 20]);
  });

  it('breaks ties deterministically', () => {
    const heap = new MinHeap();
    heap.insert({ freq: 5, symbol: 'B', minSymbol: 'B', id: 2 });
    heap.insert({ freq: 5, symbol: 'A', minSymbol: 'A', id: 1 });
    heap.insert({ freq: 5, symbol: 'C', minSymbol: 'C', id: 3 });

    expect(heap.extractMin().symbol).toBe('A');
    expect(heap.extractMin().symbol).toBe('B');
    expect(heap.extractMin().symbol).toBe('C');
  });
});

describe('Huffman Algorithm & Frequency Counting', () => {
  it('throws an error on empty input', () => {
    expect(() => buildHuffmanTree('')).toThrow('Input text cannot be empty');
    expect(() => buildHuffmanTree(null)).toThrow('Input text cannot be empty');
  });

  it('correctly counts frequencies with spaces, punctuation and newlines', () => {
    const text = 'Hello,\nWorld! ';
    const freqs = calculateFrequencies(text);
    expect(freqs.get('H')).toBe(1);
    expect(freqs.get('l')).toBe(3);
    expect(freqs.get('\n')).toBe(1);
    expect(freqs.get(' ')).toBe(1);
    expect(freqs.get('!')).toBe(1);
  });

  it('correctly handles Unicode code points and emojis', () => {
    const text = '🚀🚀🌟🔥';
    const freqs = calculateFrequencies(text);
    expect(freqs.get('🚀')).toBe(2);
    expect(freqs.get('🌟')).toBe(1);
    expect(freqs.get('🔥')).toBe(1);

    const { codeTable } = buildHuffmanTree(text);
    expect(codeTable['🚀']).toBeDefined();
    expect(codeTable['🌟']).toBeDefined();
    expect(codeTable['🔥']).toBeDefined();
  });

  it('handles single distinct symbol with unambiguous 1-bit code "0"', () => {
    const text = 'AAAAAAA';
    const { root, codeTable, frequencyTable } = buildHuffmanTree(text);

    expect(codeTable['A']).toBe('0');
    expect(frequencyTable[0].bitLength).toBe(1);

    const { bitstream } = encodeText(text, codeTable);
    expect(bitstream).toBe('0000000');

    const { decodedText, isExactMatch } = decodeBitstream(bitstream, root, text);
    expect(decodedText).toBe(text);
    expect(isExactMatch).toBe(true);
  });

  it('handles two distinct symbols', () => {
    const text = 'ABABA';
    const { root, codeTable } = buildHuffmanTree(text);

    expect(codeTable['A'].length).toBe(1);
    expect(codeTable['B'].length).toBe(1);

    const { bitstream } = encodeText(text, codeTable);
    const { decodedText, isExactMatch } = decodeBitstream(bitstream, root, text);
    expect(decodedText).toBe(text);
    expect(isExactMatch).toBe(true);
  });

  it('produces 100% deterministic trees across multiple runs for identical input', () => {
    const text = 'the quick brown fox jumps over the lazy dog';
    const run1 = buildHuffmanTree(text);
    const run2 = buildHuffmanTree(text);

    expect(run1.codeTable).toEqual(run2.codeTable);
    expect(run1.frequencyTable).toEqual(run2.frequencyTable);
  });

  it('assigns shorter codes to higher frequency symbols', () => {
    const text = 'AAAAABBBCCDE';
    const { codeTable } = buildHuffmanTree(text);

    // 'A' has freq 5, 'E' has freq 1 -> 'A' should have shorter or equal code length compared to 'E'
    expect(codeTable['A'].length).toBeLessThanOrEqual(codeTable['E'].length);
  });
});

describe('Lossless Round-Trip Encoding and Decoding', () => {
  const testCases = [
    { name: 'Simple text', text: 'Huffman coding is optimal!' },
    { name: 'Repeated characters', text: 'zzzzzzzz' },
    { name: 'All equal frequencies', text: 'abcdefgh' },
    { name: 'Multiline text with tabs and newlines', text: 'Line 1\n\tLine 2 with tab\r\nLine 3' },
    { name: 'Complex Unicode & emoji text', text: 'Hello, 世界! 🌍 Data compression ⚡🚀' },
    {
      name: 'Long prose paragraph',
      text: 'Lossless data compression algorithms reduce the size of data without losing any information. Huffman coding is a greedy algorithm that builds an optimal prefix code for a given alphabet based on symbol probabilities.',
    },
  ];

  testCases.forEach(({ name, text }) => {
    it(`guarantees exact round-trip reconstruction for: ${name}`, () => {
      const { root, codeTable } = buildHuffmanTree(text);
      const { bitstream } = encodeText(text, codeTable);
      const { decodedText, isExactMatch, error } = decodeBitstream(bitstream, root, text);

      expect(error).toBeNull();
      expect(isExactMatch).toBe(true);
      expect(decodedText).toBe(text);

      const verification = verifyLossless(text, decodedText);
      expect(verification.exactMatch).toBe(true);
      expect(verification.diffIndex).toBe(-1);
    });
  });

  it('detects dangling incomplete bits during decoding', () => {
    const text = 'abcdef';
    const { root, codeTable } = buildHuffmanTree(text);
    const { bitstream } = encodeText(text, codeTable);

    // Find a symbol with code length >= 2 and take its first bit
    const multiBitSymbol = Object.keys(codeTable).find((s) => codeTable[s].length >= 2);
    const danglingBit = codeTable[multiBitSymbol][0]; // incomplete prefix

    const corruptedBitstream = bitstream + danglingBit;
    const result = decodeBitstream(corruptedBitstream, root, text);
    expect(result.error).toContain('Dangling bits');
  });

  it('finds path to symbol for interactive tree highlighting', () => {
    const text = 'ABRACADABRA';
    const { root } = buildHuffmanTree(text);
    const path = getPathToSymbol(root, 'A');

    expect(path.length).toBeGreaterThan(1);
    expect(path[0].node).toBe(root);
    expect(path[path.length - 1].node.symbol).toBe('A');
  });
});

describe('Compression Statistics Calculations', () => {
  it('correctly calculates UTF-8 bytes and bit reduction', () => {
    const text = 'AAAAABBBCC';
    const { codeTable, frequencyTable } = buildHuffmanTree(text);
    const { bitstream } = encodeText(text, codeTable);
    const stats = calculateCompressionStats(text, bitstream, frequencyTable, codeTable);

    expect(stats.originalBytes).toBe(10);
    expect(stats.originalBits).toBe(80);
    expect(stats.encodedPayloadBits).toBe(bitstream.length);
    expect(stats.reductionPercent).toBeGreaterThan(0);
    expect(stats.compressionRatio).toBeGreaterThan(1);
    expect(stats.shannonEntropy).toBeGreaterThan(0);
  });

  it('allows negative reduction percentage when encoded payload is larger than baseline', () => {
    // If a text has high entropy and each symbol took fewer bits in baseline than simulated,
    // or calculate with an artificially large payload bitstream:
    const text = 'a';
    const stats = calculateCompressionStats(text, '0101010101010101', [{ symbol: 'a', freq: 1 }], { a: '0101010101010101' });
    // original bits = 8, encoded bits = 16 -> reduction = ((8 - 16) / 8) * 100 = -100%
    expect(stats.reductionPercent).toBe(-100);
    expect(stats.isPayloadLarger).toBe(true);
  });
});

describe('Physical Bit Packing & Binary File (.huff) Compression/Decompression', () => {
  it('correctly packs and unpacks bits with padding', () => {
    const bitstream = '101100111'; // 9 bits -> 2 bytes, 7 padding bits
    const { packedBytes, paddingBits } = packBitstream(bitstream);
    expect(packedBytes.length).toBe(2);
    expect(paddingBits).toBe(7);

    const unpacked = unpackBitstream(packedBytes, paddingBits);
    expect(unpacked).toBe(bitstream);
  });

  it('compresses and decompresses text into actual self-contained binary file', () => {
    const text = 'HuffmanLab self-contained binary compression format verification test 12345! 🚀';
    const { codeTable, frequencyTable } = buildHuffmanTree(text);
    const { bitstream } = encodeText(text, codeTable);

    const { fileBuffer, headerSize, metadataSize, payloadSize, totalSize } = compressToBinaryFile(text, frequencyTable, bitstream);
    expect(totalSize).toBe(headerSize + metadataSize + payloadSize);
    expect(fileBuffer.length).toBe(totalSize);

    // Decompress the binary buffer
    const decompressed = decompressBinaryFile(fileBuffer);
    expect(decompressed.text).toBe(text);
    expect(decompressed.originalByteLength).toBe(new TextEncoder().encode(text).length);
  });

  it('detects corrupted or invalid magic header in binary file', () => {
    const text = 'Testing file errors';
    const { codeTable, frequencyTable } = buildHuffmanTree(text);
    const { bitstream } = encodeText(text, codeTable);
    const { fileBuffer } = compressToBinaryFile(text, frequencyTable, bitstream);

    // Corrupt magic bytes
    fileBuffer[0] = 0x58; // 'X' instead of 'H'
    expect(() => decompressBinaryFile(fileBuffer)).toThrow('missing "HUFF" magic identifier');
  });

  it('detects truncated binary files', () => {
    const truncatedBuffer = new Uint8Array([0x48, 0x55]); // only 2 bytes
    expect(() => decompressBinaryFile(truncatedBuffer)).toThrow('File is truncated');
  });
});
