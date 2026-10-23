import { MinHeap } from './MinHeap.js';
import { HuffmanNode } from './huffman.js';
import { packBitstream, unpackBitstream } from './encode.js';

const MAGIC_BYTES = new Uint8Array([0x48, 0x55, 0x46, 0x46]); // "HUFF"
const FORMAT_VERSION = 1;

/**
 * Reconstructs the deterministic Huffman tree from a map of symbols and frequencies.
 * Used during binary file decompression.
 *
 * @param {Map<string, number>} freqMap
 * @returns {HuffmanNode} root
 */
export function reconstructTreeFromFrequencies(freqMap) {
  if (freqMap.size === 0) {
    throw new Error('Codebook frequency map is empty');
  }

  let nextId = 1;
  const heap = new MinHeap();
  const sortedSymbols = Array.from(freqMap.keys()).sort();

  const leafNodes = sortedSymbols.map((sym) => {
    const node = new HuffmanNode({
      id: nextId++,
      symbol: sym,
      freq: freqMap.get(sym),
      isLeaf: true,
      minSymbol: sym,
    });
    heap.insert(node);
    return node;
  });

  if (leafNodes.length === 1) {
    const onlyLeaf = leafNodes[0];
    onlyLeaf.code = '0';
    return new HuffmanNode({
      id: nextId++,
      symbol: null,
      freq: onlyLeaf.freq,
      left: onlyLeaf,
      right: null,
      isLeaf: false,
      minSymbol: onlyLeaf.minSymbol,
    });
  }

  while (heap.size() > 1) {
    const left = heap.extractMin();
    const right = heap.extractMin();

    const minSym = left.minSymbol <= right.minSymbol ? left.minSymbol : right.minSymbol;

    const parent = new HuffmanNode({
      id: nextId++,
      symbol: null,
      freq: left.freq + right.freq,
      left,
      right,
      isLeaf: false,
      minSymbol: minSym,
    });

    heap.insert(parent);
  }

  return heap.extractMin();
}

/**
 * Compresses raw text into a self-contained binary file buffer (.huff).
 *
 * @param {string} text - Original text
 * @param {Map<string, number>|Array} frequencyTable
 * @param {string} bitstream - Concatenated Huffman bitstream
 * @returns {Object} { fileBuffer: Uint8Array, headerSize, metadataSize, payloadSize, totalSize }
 */
export function compressToBinaryFile(text, frequencyTable, bitstream) {
  const encoder = new TextEncoder();
  const originalBytes = encoder.encode(text);
  const originalByteLength = originalBytes.length;

  let freqMap = new Map();
  if (Array.isArray(frequencyTable)) {
    for (const item of frequencyTable) {
      freqMap.set(item.symbol, item.freq);
    }
  } else if (frequencyTable instanceof Map) {
    freqMap = frequencyTable;
  }

  // Pack bitstream
  const { packedBytes, paddingBits } = packBitstream(bitstream);

  // Encode Codebook metadata
  // Format for each symbol: [length of symbol UTF-8 bytes (1 byte), symbol UTF-8 bytes, frequency (4 bytes Big-Endian)]
  const symbolEntries = [];
  let metadataSize = 0;

  for (const [symbol, freq] of freqMap.entries()) {
    const symBytes = encoder.encode(symbol);
    if (symBytes.length > 255) {
      throw new Error(`Symbol '${symbol}' exceeds maximum representation length.`);
    }
    symbolEntries.push({ symBytes, freq });
    metadataSize += 1 + symBytes.length + 4; // 1 byte length + symBytes + 4 bytes freq
  }

  const headerSize = 12; // Magic(4) + Version(1) + Padding(1) + OrigBytes(4) + SymCount(2)
  const payloadSize = packedBytes.length;
  const totalSize = headerSize + metadataSize + payloadSize;

  const buffer = new Uint8Array(totalSize);
  const dataView = new DataView(buffer.buffer);

  // 1. Write Magic "HUFF"
  buffer.set(MAGIC_BYTES, 0);

  // 2. Version
  buffer[4] = FORMAT_VERSION;

  // 3. Padding bits in final byte
  buffer[5] = paddingBits;

  // 4. Original text length in bytes (Uint32 Big-Endian)
  dataView.setUint32(6, originalByteLength, false);

  // 5. Symbol count (Uint16 Big-Endian)
  dataView.setUint16(10, symbolEntries.length, false);

  // 6. Write Codebook Metadata
  let offset = headerSize;
  for (const entry of symbolEntries) {
    buffer[offset++] = entry.symBytes.length;
    buffer.set(entry.symBytes, offset);
    offset += entry.symBytes.length;
    dataView.setUint32(offset, entry.freq, false);
    offset += 4;
  }

  // 7. Write Payload bytes
  buffer.set(packedBytes, offset);

  return {
    fileBuffer: buffer,
    headerSize,
    metadataSize,
    payloadSize,
    totalSize,
    paddingBits,
  };
}

/**
 * Decompresses a .huff binary buffer back into original text.
 * Validates integrity and detects corrupted or malformed files.
 *
 * @param {Uint8Array} buffer
 * @returns {Object} { text, originalByteLength, symbolCount, paddingBits }
 */
export function decompressBinaryFile(buffer) {
  if (!buffer || !(buffer instanceof Uint8Array)) {
    throw new Error('Invalid input: expected Uint8Array buffer.');
  }

  const minHeaderSize = 12;
  if (buffer.length < minHeaderSize) {
    throw new Error(`File is truncated. Minimum header size is ${minHeaderSize} bytes, but file has only ${buffer.length} bytes.`);
  }

  // 1. Verify Magic Bytes
  for (let i = 0; i < 4; i++) {
    if (buffer[i] !== MAGIC_BYTES[i]) {
      throw new Error('Invalid file format: missing "HUFF" magic identifier. Not a valid HuffmanLab compressed file.');
    }
  }

  // 2. Verify Version
  const version = buffer[4];
  if (version !== FORMAT_VERSION) {
    throw new Error(`Unsupported format version: ${version}. Expected version ${FORMAT_VERSION}.`);
  }

  // 3. Padding bits
  const paddingBits = buffer[5];
  if (paddingBits < 0 || paddingBits > 7) {
    throw new Error(`Invalid padding bits count: ${paddingBits}. Must be between 0 and 7.`);
  }

  const dataView = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);

  // 4. Original Byte Length
  const originalByteLength = dataView.getUint32(6, false);

  // 5. Symbol Count
  const symbolCount = dataView.getUint16(10, false);
  if (symbolCount === 0 && originalByteLength > 0) {
    throw new Error('Corrupted file: Symbol count is zero for non-empty text.');
  }

  // 6. Read Codebook Metadata
  const decoder = new TextDecoder('utf-8', { fatal: true });
  const freqMap = new Map();
  let offset = minHeaderSize;

  for (let i = 0; i < symbolCount; i++) {
    if (offset >= buffer.length) {
      throw new Error(`Corrupted file: Unexpected end of buffer while reading codebook symbol #${i + 1}.`);
    }

    const symLen = buffer[offset++];
    if (offset + symLen + 4 > buffer.length) {
      throw new Error(`Corrupted file: Metadata truncated for symbol #${i + 1}.`);
    }

    const symBytes = buffer.subarray(offset, offset + symLen);
    offset += symLen;

    let symbol;
    try {
      symbol = decoder.decode(symBytes);
    } catch {
      throw new Error(`Corrupted file: Malformed UTF-8 symbol at symbol #${i + 1}.`);
    }

    const freq = dataView.getUint32(offset, false);
    offset += 4;

    freqMap.set(symbol, freq);
  }

  // 7. Read Payload
  const payloadBytes = buffer.subarray(offset);

  // Empty file edge case
  if (originalByteLength === 0) {
    return {
      text: '',
      originalByteLength: 0,
      symbolCount: 0,
      paddingBits: 0,
    };
  }

  // 8. Reconstruct Tree
  const root = reconstructTreeFromFrequencies(freqMap);

  // 9. Unpack bits
  const bitstream = unpackBitstream(payloadBytes, paddingBits);

  // 10. Decode bitstream using reconstructed tree
  // Single symbol edge case
  const isSingleSymbol =
    root.isLeaf || (root.left && root.left.isLeaf && !root.right);

  const decodedChars = [];

  if (isSingleSymbol) {
    const sym = root.isLeaf ? root.symbol : root.left.symbol;
    for (let i = 0; i < bitstream.length; i++) {
      if (bitstream[i] !== '0') {
        throw new Error(`Corrupted bitstream: unexpected bit '${bitstream[i]}' in single-symbol stream.`);
      }
      decodedChars.push(sym);
    }
  } else {
    let curr = root;
    for (let i = 0; i < bitstream.length; i++) {
      const bit = bitstream[i];
      curr = bit === '0' ? curr.left : curr.right;

      if (!curr) {
        throw new Error(`Corrupted bitstream: traversal path missing in tree at bit #${i}.`);
      }

      if (curr.isLeaf) {
        decodedChars.push(curr.symbol);
        curr = root;
      }
    }

    if (curr !== root) {
      throw new Error('Corrupted file: bitstream contains incomplete symbol at end of payload.');
    }
  }

  const text = decodedChars.join('');
  const encoder = new TextEncoder();
  const actualByteLength = encoder.encode(text).length;

  if (actualByteLength !== originalByteLength) {
    throw new Error(`Integrity check failed: expected ${originalByteLength} bytes, but decoded ${actualByteLength} bytes.`);
  }

  return {
    text,
    originalByteLength,
    symbolCount,
    paddingBits,
  };
}

