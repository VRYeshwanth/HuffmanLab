/**
 * Deterministic MinHeap Implementation for Huffman Coding
 *
 * Maintains min-heap invariant using an array.
 * Provides custom comparator support with deterministic tie-breaking.
 */
export class MinHeap {
  /**
   * @param {Function} [comparator] - Optional comparator: (a, b) => negative if a < b, positive if a > b, 0 if equal.
   */
  constructor(comparator = null) {
    this.heap = [];
    this.comparator = comparator || MinHeap.defaultComparator;
  }

  /**
   * Default deterministic comparator for Huffman tree nodes.
   * Compares by frequency first.
   * If tied, breaks ties using minimum symbol in subtree or unique node id for deterministic output.
   */
  static defaultComparator(a, b) {
    if (a.freq !== b.freq) {
      return a.freq - b.freq;
    }
    // Tie-breaker: If both have minSymbol property, compare symbols
    const symA = a.minSymbol ?? (a.symbol || '');
    const symB = b.minSymbol ?? (b.symbol || '');
    if (symA !== symB) {
      return symA < symB ? -1 : 1;
    }
    // Final tie-breaker: creation id
    return (a.id ?? 0) - (b.id ?? 0);
  }

  /**
   * Returns current number of elements in the heap.
   * @returns {number}
   */
  size() {
    return this.heap.length;
  }

  /**
   * Checks if heap is empty.
   * @returns {boolean}
   */
  isEmpty() {
    return this.heap.length === 0;
  }

  /**
   * Peeks at the minimum element without removing it.
   * @returns {any|null}
   */
  peek() {
    return this.heap.length > 0 ? this.heap[0] : null;
  }

  /**
   * Inserts an element into the min-heap.
   * @param {any} item
   */
  insert(item) {
    this.heap.push(item);
    this._bubbleUp(this.heap.length - 1);
  }

  /**
   * Extracts and returns the minimum element from the heap.
   * @returns {any|null}
   */
  extractMin() {
    if (this.heap.length === 0) return null;
    if (this.heap.length === 1) return this.heap.pop();

    const min = this.heap[0];
    this.heap[0] = this.heap.pop();
    this._sinkDown(0);
    return min;
  }

  /**
   * Returns a shallow copy array of all elements currently in heap.
   * @returns {Array}
   */
  toArray() {
    return [...this.heap];
  }

  /**
   * Bubbles up element at index to restore heap invariant.
   * @private
   */
  _bubbleUp(index) {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      if (this.comparator(this.heap[index], this.heap[parentIndex]) < 0) {
        // Swap with parent
        const temp = this.heap[index];
        this.heap[index] = this.heap[parentIndex];
        this.heap[parentIndex] = temp;
        index = parentIndex;
      } else {
        break;
      }
    }
  }

  /**
   * Sinks down element at index to restore heap invariant.
   * @private
   */
  _sinkDown(index) {
    const length = this.heap.length;
    while (true) {
      const leftChildIndex = 2 * index + 1;
      const rightChildIndex = 2 * index + 2;
      let smallestIndex = index;

      if (
        leftChildIndex < length &&
        this.comparator(this.heap[leftChildIndex], this.heap[smallestIndex]) < 0
      ) {
        smallestIndex = leftChildIndex;
      }

      if (
        rightChildIndex < length &&
        this.comparator(this.heap[rightChildIndex], this.heap[smallestIndex]) < 0
      ) {
        smallestIndex = rightChildIndex;
      }

      if (smallestIndex !== index) {
        // Swap with smallest child
        const temp = this.heap[index];
        this.heap[index] = this.heap[smallestIndex];
        this.heap[smallestIndex] = temp;
        index = smallestIndex;
      } else {
        break;
      }
    }
  }
}

