import { MinHeap } from './MinHeap.js';

/**
 * Node class representing a node in the Huffman Tree.
 */
export class HuffmanNode {
  /**
   * @param {Object} options
   * @param {number} options.id - Unique node id
   * @param {string|null} options.symbol - Character symbol (null for internal nodes)
   * @param {number} options.freq - Frequency count of symbol or sum of children
   * @param {HuffmanNode|null} [options.left=null] - Left child (branch '0')
   * @param {HuffmanNode|null} [options.right=null] - Right child (branch '1')
   * @param {boolean} [options.isLeaf=false] - Whether node is a leaf
   * @param {string} [options.minSymbol=''] - Minimum symbol lexicographically in subtree for deterministic sorting
   */
  constructor({
    id,
    symbol = null,
    freq = 0,
    left = null,
    right = null,
    isLeaf = false,
    minSymbol = '',
  }) {
    this.id = id;
    this.symbol = symbol;
    this.freq = freq;
    this.left = left;
    this.right = right;
    this.isLeaf = isLeaf;
    this.minSymbol = minSymbol;
    this.code = '';
  }
}

/**
 * Counts symbol frequencies using Unicode code points (supports surrogate pairs/emoji).
 * @param {string} text
 * @returns {Map<string, number>}
 */
export function calculateFrequencies(text) {
  if (!text || typeof text !== 'string') {
    return new Map();
  }

  const freqMap = new Map();
  // Array.from splits correctly on Unicode code points (emoji, astral planes)
  for (const char of Array.from(text)) {
    freqMap.set(char, (freqMap.get(char) || 0) + 1);
  }
  return freqMap;
}

/**
 * Builds the Huffman Tree from input text deterministically.
 * Also generates step-by-step merge snapshots for visual animation.
 *
 * @param {string} text
 * @returns {Object} { root, codeTable, frequencyTable, steps, totalSymbols }
 */
export function buildHuffmanTree(text) {
  if (!text || typeof text !== 'string' || text.length === 0) {
    throw new Error('Input text cannot be empty');
  }

  const freqMap = calculateFrequencies(text);
  const totalSymbols = Array.from(text).length;

  let nextId = 1;
  const heap = new MinHeap();
  const steps = [];

  // Create leaf nodes
  // Sort symbols first to guarantee 100% deterministic initial heap insertion
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

  // Record initial step
  steps.push({
    stepIndex: 0,
    description: `Initialized min-heap with ${leafNodes.length} distinct symbol leaf nodes.`,
    heapNodes: heap.toArray().map((n) => cloneNodeShallow(n)),
    extractedLeft: null,
    extractedRight: null,
    createdParent: null,
  });

  // Handle single distinct symbol edge case
  if (leafNodes.length === 1) {
    const onlyLeaf = leafNodes[0];
    onlyLeaf.code = '0';

    // Create a synthetic root for tree visualization consistency
    const root = new HuffmanNode({
      id: nextId++,
      symbol: null,
      freq: onlyLeaf.freq,
      left: onlyLeaf,
      right: null,
      isLeaf: false,
      minSymbol: onlyLeaf.minSymbol,
    });

    const codeTable = { [onlyLeaf.symbol]: '0' };
    const frequencyTable = [
      {
        symbol: onlyLeaf.symbol,
        freq: onlyLeaf.freq,
        percentage: 100.0,
        code: '0',
        bitLength: 1,
      },
    ];

    steps.push({
      stepIndex: 1,
      description: `Single distinct symbol '${onlyLeaf.symbol}'. Assigned 1-bit code '0'.`,
      heapNodes: [cloneNodeShallow(root)],
      extractedLeft: cloneNodeShallow(onlyLeaf),
      extractedRight: null,
      createdParent: cloneNodeShallow(root),
    });

    return {
      root,
      codeTable,
      frequencyTable,
      steps,
      totalSymbols,
    };
  }

  // Standard Huffman iterative merge
  let stepIndex = 1;
  while (heap.size() > 1) {
    const left = heap.extractMin();
    const right = heap.extractMin();

    // Determine minSymbol between left and right for deterministic parent comparison
    const minSym =
      left.minSymbol <= right.minSymbol ? left.minSymbol : right.minSymbol;

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

    steps.push({
      stepIndex: stepIndex++,
      description: `Merged lowest: '${left.symbol ?? `Node#${left.id}`}' (freq: ${left.freq}) and '${right.symbol ?? `Node#${right.id}`}' (freq: ${right.freq}) -> Parent (freq: ${parent.freq}).`,
      heapNodes: heap.toArray().map((n) => cloneNodeShallow(n)),
      extractedLeft: cloneNodeShallow(left),
      extractedRight: cloneNodeShallow(right),
      createdParent: cloneNodeShallow(parent),
    });
  }

  const root = heap.extractMin();

  // Traverse tree to generate codes (left = 0, right = 1)
  const codeTable = {};
  assignCodes(root, '', codeTable);

  // Build formatted frequency table
  const frequencyTable = sortedSymbols
    .map((sym) => {
      const freq = freqMap.get(sym);
      const code = codeTable[sym];
      const percentage = (freq / totalSymbols) * 100;
      return {
        symbol: sym,
        freq,
        percentage: Number(percentage.toFixed(2)),
        code,
        bitLength: code.length,
      };
    })
    .sort((a, b) => b.freq - a.freq || a.symbol.localeCompare(b.symbol));

  return {
    root,
    codeTable,
    frequencyTable,
    steps,
    totalSymbols,
  };
}

/**
 * Traverses Huffman tree and assigns binary codes to leaf nodes.
 * @param {HuffmanNode} node
 * @param {string} currentCode
 * @param {Object} codeTable
 */
function assignCodes(node, currentCode, codeTable) {
  if (!node) return;

  node.code = currentCode;

  if (node.isLeaf && node.symbol !== null) {
    codeTable[node.symbol] = currentCode || '0';
    return;
  }

  if (node.left) {
    assignCodes(node.left, currentCode + '0', codeTable);
  }
  if (node.right) {
    assignCodes(node.right, currentCode + '1', codeTable);
  }
}

/**
 * Helper to clone node shallowly for step recording
 */
function cloneNodeShallow(node) {
  if (!node) return null;
  return {
    id: node.id,
    symbol: node.symbol,
    freq: node.freq,
    isLeaf: node.isLeaf,
    minSymbol: node.minSymbol,
    code: node.code,
  };
}

/**
 * Finds the path from root to a specific symbol.
 * Returns array of { node, branchLabel: '0'|'1'|null } from root to leaf.
 *
 * @param {HuffmanNode} root
 * @param {string} targetSymbol
 * @returns {Array<{node: HuffmanNode, branch: string|null}>}
 */
export function getPathToSymbol(root, targetSymbol) {
  if (!root) return [];
  const path = [];

  function dfs(curr, branch) {
    if (!curr) return false;

    path.push({ node: curr, branch });

    if (curr.isLeaf && curr.symbol === targetSymbol) {
      return true;
    }

    if (curr.left && dfs(curr.left, '0')) {
      return true;
    }
    if (curr.right && dfs(curr.right, '1')) {
      return true;
    }

    path.pop();
    return false;
  }

  dfs(root, null);
  return path;
}

