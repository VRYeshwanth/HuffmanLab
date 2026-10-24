# HuffmanLab — Huffman Coding & Lossless Compression Visualizer

**HuffmanLab** is a modern, streamlined developer tool and educational visualizer for exploring Huffman coding and lossless data compression.

Designed around **progressive disclosure**, HuffmanLab keeps the interface clean, focused, and beginner-friendly: users can immediately type or paste text, click **"Encode Text"**, and inspect essential compression results without cognitive overload, while still having access to full interactive tree visualizations, character code tables, and binary file tools.

---

## 🧭 Simplified User Experience (Progressive Disclosure)

### 1. Initial State (Clean & Uncluttered)
- **Header:** Compact, minimalist header with application title and subtitle.
- **Input Area:** Prominent centered text area with live character counting, a **"Load Example"** button, a **"Clear"** button, and a single primary action: **"Encode Text"**.
- No distracting graphs, empty panels, or overwhelming statistics are rendered before the user submits text.

### 2. Level 1 — Essential Results
Displayed immediately upon encoding:
- **Three Compact Metric Cards:**
  - **Original Size:** e.g., `86 B` (`688 bits`)
  - **Encoded Size:** e.g., `384 bits` (`48 B packed`)
  - **Size Reduction:** e.g., `+44.19%` (with theoretical comparison explanation in an unobtrusive disclosure)
- **Lossless Verification Badge:** Confirms whether tree-traversal decoding matches the original input.
- **Encoded Bitstream Box:** Formatted in clean 8-bit blocks with a one-click **"Copy Bits"** button.

### 3. Level 2 — Additional Details (3 Clean Tabs)
Users can explore deep algorithmic details through three tabs (only the active tab is rendered):
1. **Huffman Tree:** Interactive custom SVG tree visualization with hierarchical layout, pan/zoom, "Fit to Screen", "Reset View", distinct leaf/internal nodes, and glowing path tracing when a character is selected.
2. **Character Codes:** Beginner-friendly table displaying character glyphs, descriptions (`SPACE`, `NEWLINE`, `TAB`), counts, frequencies, prefix codes, and bit lengths with quick search.
3. **Decode & Verify:** True tree-traversal decoding demonstrating bit-by-bit reconstruction, verification status, and one-click copy of decoded text.

### 4. Advanced: Standalone Binary File (.huff) Tool
Tucked neatly in an unobtrusive collapsible section at the bottom:
- Compress `.txt` files into standalone, byte-packed `.huff` binary files.
- Upload `.huff` files to decompress and verify file integrity.

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

## 📂 Project Structure

```
Directory structure:
└── HuffmanLab/
    ├── frontend/
    │   ├── eslint.config.js
    │   ├── index.html
    │   ├── package-lock.json
    │   ├── package.json
    │   ├── src/
    │   │   ├── algorithms/
    │   │   │   ├── binaryFile.js
    │   │   │   ├── compressionStats.js
    │   │   │   ├── decode.js
    │   │   │   ├── encode.js
    │   │   │   ├── huffman.js
    │   │   │   └── MinHeap.js
    │   │   ├── App.jsx
    │   │   ├── components/
    │   │   │   ├── CompressionStats.jsx
    │   │   │   ├── DecodingPanel.jsx
    │   │   │   ├── EncodedOutput.jsx
    │   │   │   ├── FileCompressor.jsx
    │   │   │   ├── Footer.jsx
    │   │   │   ├── FrequencyTable.jsx
    │   │   │   ├── Header.jsx
    │   │   │   ├── HuffmanTree.jsx
    │   │   │   ├── TextInput.jsx
    │   │   │   └── TreeStepper.jsx
    │   │   ├── index.css
    │   │   ├── main.jsx
    │   │   ├── tests/
    │   │   │   └── huffman.test.js
    │   │   └── utils/
    │   │       ├── formatBytes.js
    │   │       └── formatSymbol.js
    │   └── vite.config.js
    └── README.md
```

---

## 🚀 Getting Started

### Installation

1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

4. Run unit test suite:
   ```bash
   npm test
   ```

5. Production build:
   ```bash
   npm run build
   ```
