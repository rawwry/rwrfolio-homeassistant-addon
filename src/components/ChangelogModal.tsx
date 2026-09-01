import React from 'react';
import { X, History, Sparkles, CheckCircle2, Tag, Wrench, Palette, Cpu } from 'lucide-react';
import { CHANGELOG_DATA, APP_VERSION } from '../data/changelog';

interface ChangelogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChangelogModal: React.FC<ChangelogModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const getTypeIcon = (type: 'feat' | 'fix' | 'ui' | 'perf') => {
    switch (type) {
      case 'feat':
        return <Sparkles className="w-3.5 h-3.5 text-indigo-400" />;
      case 'ui':
        return <Palette className="w-3.5 h-3.5 text-purple-400" />;
      case 'fix':
        return <Wrench className="w-3.5 h-3.5 text-amber-400" />;
      case 'perf':
        return <Cpu className="w-3.5 h-3.5 text-emerald-400" />;
    }
  };

  const getTypeBadge = (type: 'feat' | 'fix' | 'ui' | 'perf') => {
    switch (type) {
      case 'feat':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">Neu</span>;
      case 'ui':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/20">UI / Design</span>;
      case 'fix':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20">Fix</span>;
      case 'perf':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">Perf</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-white">Versionsverlauf &amp; Changelog</h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-indigo-600 text-white shadow-sm">
                  v{APP_VERSION}
                </span>
              </div>
              <p className="text-xs text-slate-400">Alle Neuerungen, Fehlerbehebungen und Funktionserweiterungen</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Changelog Timeline Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 divide-y divide-slate-800/60">
          {CHANGELOG_DATA.map((release, index) => (
            <div key={release.version} className={index > 0 ? 'pt-6' : ''}>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="flex items-center space-x-2.5">
                  <span className="font-mono text-sm font-bold text-white bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
                    v{release.version}
                  </span>
                  <h3 className="text-sm font-semibold text-slate-200">{release.title}</h3>
                  {release.badge && (
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {release.badge}
                    </span>
                  )}
                </div>
                <span className="text-xs text-slate-400 font-mono">{release.date}</span>
              </div>

              <div className="space-y-2.5 pl-2 sm:pl-3">
                {release.changes.map((change, cIdx) => (
                  <div key={cIdx} className="flex items-start space-x-2.5 text-xs text-slate-300 leading-relaxed">
                    <div className="mt-0.5 flex-shrink-0">
                      {getTypeIcon(change.type)}
                    </div>
                    <div className="flex-1">
                      <span className="mr-2 inline-block">
                        {getTypeBadge(change.type)}
                      </span>
                      <span>{change.text}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-1.5">
            <Tag className="w-3.5 h-3.5 text-slate-500" />
            <span>Aktuelle Version: <strong className="text-slate-200 font-mono">v{APP_VERSION}</strong></span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition-colors cursor-pointer"
          >
            Schließen
          </button>
        </div>

      </div>
    </div>
  );
};
