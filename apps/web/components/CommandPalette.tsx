'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, FileText, Building2, ShieldCheck, ArrowRight, X, Sparkles, RefreshCw } from 'lucide-react';
import { FDRInstrument } from '@/lib/supabase/types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [instruments, setInstruments] = useState<FDRInstrument[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchItems();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else fetchItems();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/instruments');
      const data = await res.json();
      if (data.instruments) setInstruments(data.instruments);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const filtered = instruments.filter(i => {
    const q = query.toLowerCase();
    return (
      i.fdr_number.toLowerCase().includes(q) ||
      (i.institution?.name || '').toLowerCase().includes(q) ||
      (i.bank?.name || '').toLowerCase().includes(q) ||
      i.status.toLowerCase().includes(q)
    );
  });

  const navigateTo = (path: string) => {
    onClose();
    router.push(path);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center px-4 border-b border-slate-100">
          <Search className="w-5 h-5 text-slate-400 mr-3" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Type a command or search FDR #, College, or Status..."
            className="w-full py-4 text-sm bg-transparent outline-hidden text-slate-900 placeholder:text-slate-400"
          />
          <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Navigation Commands */}
        {!query && (
          <div className="p-3 border-b border-slate-100 bg-slate-50/50">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1.5">
              Quick Shortcuts
            </p>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              <button
                onClick={() => navigateTo('/institution/dashboard')}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-white hover:shadow-2xs text-left text-slate-700 transition cursor-pointer"
              >
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Institution Deposit Dashboard</span>
              </button>
              <button
                onClick={() => navigateTo('/officer/dashboard')}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-white hover:shadow-2xs text-left text-slate-700 transition cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Regional Verification Queue</span>
              </button>
              <button
                onClick={() => navigateTo('/admin/dashboard')}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-white hover:shadow-2xs text-left text-slate-700 transition cursor-pointer"
              >
                <Building2 className="w-4 h-4 text-amber-600" />
                <span>Central Compliance & Audit Log</span>
              </button>
            </div>
          </div>
        )}

        {/* Filtered Search Results */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-xs text-slate-400">
              <RefreshCw className="w-4 h-4 animate-spin mr-2" />
              Loading instruments...
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center py-8 text-xs text-slate-400">No matching instruments found</p>
          ) : (
            filtered.map(item => (
              <div
                key={item.id}
                onClick={() => navigateTo(`/instruments/${item.id}`)}
                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-blue-50/70 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                    ₹
                  </div>
                  <div>
                    <div className="flex items-center gap-2 font-semibold text-xs text-slate-900">
                      <span>{item.fdr_number}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 uppercase font-medium">
                        {item.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {item.institution?.name} • ₹{item.amount.toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
              </div>
            ))
          )}
        </div>

        <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between px-4">
          <span>Navigate with mouse or arrow keys</span>
          <span>Esc to exit</span>
        </div>
      </div>
    </div>
  );
}
