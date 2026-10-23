# HuffmanLab — Huffman Coding & Lossless Compression Visualizer

**HuffmanLab** is a modern, developer-focused web application that visualizes the Huffman coding algorithm, encodes arbitrary text with full Unicode/emoji support, analyzes mathematically accurate compression metrics, provides genuine lossless decoding, and includes an actual byte-packed standalone binary file compressor (`.huff`).

---

## 🌟 Key Features

### 1. Robust Text Input & Unicode Code Point Support
- Large, resizable text area supporting paragraphs, essays, punctuation, spaces, tabs, and newlines.
- Live symbol counter and accurate UTF-8 byte counter.
- Curated sample texts: English prose, high-repetition strings, source code, Unicode/emoji combinations, and single-symbol edge cases.
- Input validation and keyboard shortcuts (`Ctrl`/`Cmd` + `Enter` to analyze).

### 2. Interactive SVG Huffman Tree Visualization
- Custom binary tree hierarchical layout with dynamic spacing to eliminate node overlap.
- Smooth mouse drag-to-pan, mouse wheel zoom, "Fit to Screen", and "Reset View" controls.
- Distinct styling for leaf nodes (showing symbol glyph, frequency, and code) and internal nodes (showing combined frequency sum).
- Distinct edge styling with bit labels (`0` in cyan on left branches, `1` in amber on right branches).
- **Interactive Path Tracing:** Selecting any character in the frequency table or clicking a leaf node illuminates the exact path from root to leaf with glowing animated edges and displays its binary code.

### 3. Step-by-Step Min-Heap Construction Stepper
- Visual playback of the greedy algorithm:
  - Play, Pause, Next Step, Previous Step, Jump to End, and Reset.
  - Configurable animation playback speed (0.5x, 1x, 2x).
  - Clear explanations of each merge event: extracts the two smallest nodes and merges them into a parent with their combined frequency.
  - Active inspection of min-heap contents at each step.

### 4. Comprehensive Frequency & Code Table
- Displays symbol glyphs, human-readable representations (`SPACE`, `NEWLINE`, `TAB`, control codes), and Unicode code points (`U+XXXX`).
- Calculates frequency counts, frequency percentages, Huffman codes, and bit lengths.
- Real-time search/filter and column sorting (by frequency, symbol, or bit length).
- One-click copy for binary codes.

### 5. Huffman Encoding & Bitstream Display
- Concatenated prefix bitstream formatted into 8-bit byte blocks or continuous stream.
- Truncated expandable display for large text inputs to ensure zero UI freezing.
- Logical bit handling with physical byte packing (`Uint8Array`) and final-byte padding bit metrics.

### 6. Accurate Compression Statistics
- **Original UTF-8 Size:** Byte count and bits (`UTF-8 bytes × 8`).
- **Huffman Payload Size:** Total bits and packed bytes.
- **Payload Size Reduction:** `((Original bits - Encoded payload bits) / Original bits) × 100`. Correctly handles negative reduction when small inputs expand.
- **Compression Ratio:** `Original bits / Encoded payload bits`.
- **Average Code Length:** bits per symbol.
- **Shannon Entropy:** Theoretical limit `H = - ∑ p_i log₂(p_i)` comparing Huffman efficiency against Shannon's source coding theorem.
- Transparent disclaimer clearly distinguishing theoretical bare payload metrics from real file format overhead.

### 7. Lossless Tree Traversal Decoder & Verification
- Reconstructs text from the bitstream using true Huffman tree traversal (not by returning original input).
- Character-by-character and byte-by-byte comparison between original input and decoded output.
- Prominent verification badge confirming 100% exact match or pinpointing mismatch indices.

### 8. Physical Binary File Compressor & Decompressor (`.huff`)
- Upload any `.txt` file, compress it into a self-contained `.huff` binary file, and download it.
- Upload any `.huff` file created by the app to validate headers, decompress, and restore the original text.
- Validates magic numbers, version, and padding, throwing clear error messages if files are malformed or truncated.

---

## 📐 Binary File Format Specification (`.huff`)

Stand-alone compressed `.huff` files use a documented, self-contained binary layout:

| Offset (Bytes) | Field | Type | Description |
|---|---|---|---|
| `0 - 3` | Magic Number | ASCII `HUFF` | `[0x48, 0x55, 0x46, 0x46]` file identifier |
| `4` | Version | `Uint8` | Format version (`0x01`) |
| `5` | Padding Bits | `Uint8` | Number of trailing padding bits in final payload byte (`0 - 7`) |
| `6 - 9` | Original Length | `Uint32` (BE) | Original text UTF-8 byte length |
| `10 - 11` | Symbol Count | `Uint16` (BE) | Number of unique symbols in codebook ($K$) |
| `12 ... M` | Codebook Metadata | Variable | For each symbol: 1 byte UTF-8 length, symbol UTF-8 bytes, 4 bytes frequency (`Uint32` BE) |
| `M ... End` | Payload | `Uint8Array` | Packed bits of Huffman bitstream |

---

## 🛠 Technology Stack

- **Frontend:** React 19, Vite 8
- **Language:** JavaScript (ESNext, modular modules)
- **Styling:** Tailwind CSS v4
- **Icons:** Lucide React
- **Test Framework:** Vitest
- **Execution:** 100% in-browser client-side execution; zero backend dependencies.

---

## 📂 Project Architecture

```
HuffmanLab/
├── frontend/
│   ├── src/
│   │   ├── algorithms/
│   │   │   ├── MinHeap.js             # Priority queue with deterministic tie-breaking
│   │   │   ├── huffman.js             # Huffman tree builder & step-by-step recorder
│   │   │   ├── encode.js              # Bitstream encoder & physical bit packing
│   │   │   ├── decode.js              # Real tree-traversal decoder & verification
│   │   │   ├── compressionStats.js    # Accurate metrics & Shannon entropy
│   │   │   └── binaryFile.js          # Self-contained .huff packer & unpacker
│   │   ├── components/
│   │   │   ├── Header.jsx             # Top branding & algorithm indicator
│   │   │   ├── TextInput.jsx          # Input textarea, presets, live metrics
│   │   │   ├── CompressionStats.jsx   # Metric cards, comparison bar, disclaimer
│   │   │   ├── FrequencyTable.jsx     # Searchable, sortable frequency/code table
│   │   │   ├── HuffmanTree.jsx        # Custom SVG tree with pan/zoom & path tracing
│   │   │   ├── TreeStepper.jsx        # Step-by-step min-heap merge playback
│   │   │   ├── EncodedOutput.jsx      # Bitstream viewer (8-bit blocks, copy, padding)
│   │   │   ├── DecodingPanel.jsx      # Lossless verification & restored text
│   │   │   ├── FileCompressor.jsx     # .txt -> .huff and .huff -> .txt tool
│   │   │   └── Footer.jsx             # Algorithmic notes & theory
│   │   ├── utils/
│   │   │   ├── formatSymbol.js        # Formatting for SPACE, TAB, NEWLINE, U+XXXX
│   │   │   └── formatBytes.js         # Byte, bit, and percentage formatters
│   │   ├── tests/
│   │   │   └── huffman.test.js        # Vitest suite (23 unit tests)
│   │   ├── App.jsx                    # Main application controller & tabs
│   │   ├── Main.jsx                   # React root entry
│   │   └── index.css                  # Tailwind styles & theme variables
│   ├── package.json
│   └── vite.config.js
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or newer)
- npm or pnpm

### Installation

1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser at the URL shown (typically `http://localhost:5173`).

---

## 🧪 Running Automated Tests

To run the complete automated test suite:

```bash
cd frontend
npm test
```

The test suite covers 23 comprehensive unit tests including:
- Min-heap invariant preservation and deterministic tie-breaking
- Empty input validation
- Single-symbol input with unambiguous 1-bit code `'0'`
- Repeated characters and equal-frequency symbols
- Spaces, tabs, newlines, and punctuation
- Complex Unicode code points and emojis (`🚀`, `🌍`, etc.)
- Strict lossless round-trip verification
- Detection of dangling incomplete bits in bitstream
- Accurate UTF-8 baseline vs payload calculation
- Negative reduction reporting for small inputs
- Bit packing, padding, and round-trip unpacking
- `.huff` binary file serialization and deserialization
- Corrupted file rejection (wrong magic number, truncated buffers)

---

## 📦 Production Build & Deployment

To compile the production static build:

```bash
cd frontend
npm run build
```

This generates an optimized static distribution in `frontend/dist/`.

### Static Hosting Instructions

#### 1. Vercel
```bash
npx vercel deploy
```
- Root Directory: `frontend`
- Build Command: `npm run build`
- Output Directory: `dist`

#### 2. Netlify
- Drag and drop the `frontend/dist` directory into Netlify, or link the Git repository with:
  - Base directory: `frontend`
  - Build command: `npm run build`
  - Publish directory: `dist`

#### 3. GitHub Pages
Add the `base` path in `frontend/vite.config.js` if deploying under a subpath (e.g. `base: '/HuffmanLab/'`), build, and deploy the `dist/` directory via the `gh-pages` branch or GitHub Actions.

---

## ℹ️ Handled Edge Cases

- **Single Distinct Symbol (e.g., `"AAAA"`):** Assigned a unambiguous 1-bit code `'0'` so decoding can traverse without ambiguity.
- **Equal-Frequency Nodes:** Deterministic tie-breaking ensures identical tree structures across all runs.
- **Astral Plane Unicode & Emojis:** Symbols are split and counted using Unicode code points (`Array.from(text)`), preserving multi-byte emoji sequences.
- **Large Inputs:** Bitstreams are chunked and virtualized with preview truncation to prevent DOM locking.

