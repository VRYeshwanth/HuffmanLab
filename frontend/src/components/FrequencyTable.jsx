import React, { useState, useMemo } from 'react';
import { Search, ArrowUpDown, Check, Copy } from 'lucide-react';
import { formatSymbol } from '../utils/formatSymbol.js';

export default function FrequencyTable({
  frequencyTable,
  selectedSymbol,
  onSelectSymbol,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState('freq');
  const [sortOrder, setSortOrder] = useState('desc');
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
    setTimeout(() => setCopiedCode(null), 1500);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-lg space-y-3">
      {/* Search & Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-100">
            Character Codes ({frequencyTable?.length || 0} unique)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Click any row to trace its path in the Huffman Tree tab.
          </p>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search character or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none w-48"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-800">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-medium">
              <th
                onClick={() => toggleSort('symbol')}
                className="py-2.5 px-3 cursor-pointer hover:text-slate-200"
              >
                <div className="flex items-center space-x-1">
                  <span>Character</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-2.5 px-3">Description</th>
              <th
                onClick={() => toggleSort('freq')}
                className="py-2.5 px-3 cursor-pointer hover:text-slate-200"
              >
                <div className="flex items-center space-x-1">
                  <span>Count</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-2.5 px-3">Frequency</th>
              <th className="py-2.5 px-3">Huffman Code</th>
              <th
                onClick={() => toggleSort('bitLength')}
                className="py-2.5 px-3 cursor-pointer hover:text-slate-200"
              >
                <div className="flex items-center space-x-1">
                  <span>Code Length</span>
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
                      ? 'bg-cyan-950/40 text-cyan-200'
                      : 'hover:bg-slate-800/30 text-slate-300'
                  }`}
                >
                  <td className="py-2 px-3">
                    <div className="inline-flex items-center justify-center w-6 h-6 rounded bg-slate-800 border border-slate-700 text-xs font-bold text-white">
                      {formatted.isSpecial ? (
                        <span className="text-[10px] text-cyan-400 font-sans">
                          {formatted.display}
                        </span>
                      ) : (
                        item.symbol
                      )}
                    </div>
                  </td>

                  <td className="py-2 px-3 font-sans text-slate-400">
                    {formatted.label}
                  </td>

                  <td className="py-2 px-3 text-slate-200 font-semibold">
                    {item.freq.toLocaleString()}
                  </td>

                  <td className="py-2 px-3 text-slate-400 font-sans text-[11px]">
                    {item.percentage}%
                  </td>

                  <td className="py-2 px-3">
                    <div className="flex items-center space-x-1.5">
                      <span className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-cyan-300 font-bold tracking-wider">
                        {item.code}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => copyCodeToClipboard(item.code, item.symbol, e)}
                        className="p-1 hover:bg-slate-800 rounded text-slate-500 hover:text-slate-300"
                        title="Copy code"
                      >
                        {copiedCode === item.symbol ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </td>

                  <td className="py-2 px-3 text-slate-400">
                    {item.bitLength} {item.bitLength === 1 ? 'bit' : 'bits'}
                  </td>
                </tr>
              );
            })}

            {filteredAndSortedData.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-slate-500 font-sans">
                  No characters match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
