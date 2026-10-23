import React, { useState, useMemo } from 'react';
import { Search, ArrowUpDown, Check, Copy, Hash, Sparkles } from 'lucide-react';
import { formatSymbol } from '../utils/formatSymbol.js';

export default function FrequencyTable({
  frequencyTable,
  selectedSymbol,
  onSelectSymbol,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState('freq'); // 'freq' | 'symbol' | 'bitLength'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' | 'desc'
  const [copiedCode, setCopiedCode] = useState(null);

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
  };

  const filteredAndSortedData = useMemo(() => {
    if (!frequencyTable) return [];

    return frequencyTable
      .filter((item) => {
        if (!searchTerm) return true;
        const formatted = formatSymbol(item.symbol);
        const term = searchTerm.toLowerCase();
        return (
          item.symbol.toLowerCase().includes(term) ||
          formatted.display.toLowerCase().includes(term) ||
          formatted.codePoint.toLowerCase().includes(term) ||
          item.code.includes(term)
        );
      })
      .sort((a, b) => {
        let cmp = 0;
        if (sortKey === 'freq') {
          cmp = a.freq - b.freq;
        } else if (sortKey === 'bitLength') {
          cmp = a.bitLength - b.bitLength;
        } else if (sortKey === 'symbol') {
          cmp = a.symbol.localeCompare(b.symbol);
        }
        return sortOrder === 'asc' ? cmp : -cmp;
      });
  }, [frequencyTable, searchTerm, sortKey, sortOrder]);

  const copyCodeToClipboard = (code, symbol, e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(symbol);
    setTimeout(() => setCopiedCode(null), 1800);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
      {/* Header and Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-100 flex items-center space-x-2">
            <span>Symbol Frequency & Codebook</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-normal">
              {frequencyTable?.length || 0} symbols
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Click any row to trace its branch path in the Huffman Tree visualization
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search symbol, code, or U+XXXX..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-slate-950 border border-slate-800 focus:border-cyan-500/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 w-56"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-medium">
              <th
                onClick={() => toggleSort('symbol')}
                className="py-3 px-4 cursor-pointer hover:text-slate-200 transition-colors"
              >
                <div className="flex items-center space-x-1">
                  <span>Symbol</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-3">Representation</th>
              <th className="py-3 px-3">Unicode</th>
              <th
                onClick={() => toggleSort('freq')}
                className="py-3 px-4 cursor-pointer hover:text-slate-200 transition-colors"
              >
                <div className="flex items-center space-x-1">
                  <span>Frequency</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-4">Frequency %</th>
              <th className="py-3 px-4">Huffman Code</th>
              <th
                onClick={() => toggleSort('bitLength')}
                className="py-3 px-4 cursor-pointer hover:text-slate-200 transition-colors"
              >
                <div className="flex items-center space-x-1">
                  <span>Bits</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {filteredAndSortedData.map((item) => {
              const formatted = formatSymbol(item.symbol);
              const isSelected = selectedSymbol === item.symbol;

              return (
                <tr
                  key={item.symbol}
                  onClick={() => onSelectSymbol(isSelected ? null : item.symbol)}
                  className={`cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-cyan-950/40 hover:bg-cyan-900/40 text-cyan-200 border-l-2 border-l-cyan-400'
                      : 'hover:bg-slate-800/40 text-slate-300'
                  }`}
                >
                  {/* Symbol Glyph */}
                  <td className="py-2.5 px-4">
                    <div className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-800/90 border border-slate-700/80 text-sm font-bold text-white shadow-sm">
                      {formatted.isSpecial ? (
                        <span className="text-[10px] text-cyan-400 font-sans">
                          {formatted.display}
                        </span>
                      ) : (
                        <span>{item.symbol}</span>
                      )}
                    </div>
                  </td>

                  {/* Representation */}
                  <td className="py-2.5 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-sans font-medium ${
                        formatted.isSpecial
                          ? 'bg-cyan-950 text-cyan-400 border border-cyan-800/40'
                          : 'text-slate-300'
                      }`}
                    >
                      {formatted.label}
                    </span>
                  </td>

                  {/* Unicode CodePoint */}
                  <td className="py-2.5 px-3 text-[11px] text-slate-400">
                    {formatted.codePoint}
                  </td>

                  {/* Frequency */}
                  <td className="py-2.5 px-4 font-semibold text-slate-200">
                    {item.freq.toLocaleString()}
                  </td>

                  {/* Frequency % */}
                  <td className="py-2.5 px-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-cyan-500 h-full rounded-full"
                          style={{ width: `${Math.min(100, item.percentage)}%` }}
                        />
                      </div>
                      <span className="text-slate-400 text-[11px]">
                        {item.percentage}%
                      </span>
                    </div>
                  </td>

                  {/* Huffman Code */}
                  <td className="py-2.5 px-4">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-cyan-300 font-bold tracking-wider">
                        {item.code}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => copyCodeToClipboard(item.code, item.symbol, e)}
                        className="p-1 hover:bg-slate-800 rounded text-slate-500 hover:text-slate-300 transition-colors"
                        title="Copy binary code"
                      >
                        {copiedCode === item.symbol ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </td>

                  {/* Code Length in bits */}
                  <td className="py-2.5 px-4 text-slate-400">
                    {item.bitLength} <span className="text-[10px] text-slate-400">bits</span>
                  </td>
                </tr>
              );
            })}

            {filteredAndSortedData.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500 font-sans">
                  No symbols matched your search filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

