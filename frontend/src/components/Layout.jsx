/**
 * components/Layout.jsx
 * ---------------------------------------------------------------------------
 * Full-page shell: header bar + main content area.
 * The header carries the logo, title, SIH badge, and health indicator.
 */

import StatusIndicator from './StatusIndicator.jsx';

/**
 * @param {object}           props
 * @param {React.ReactNode}  props.children
 */
export default function Layout({ children, viewMode, onToggleView, onOpenCopilot }) {
  return (
    <div className="h-dvh flex flex-col overflow-hidden">
      {/* ---- Header ---- */}
      <header className="flex items-center justify-between px-3 sm:px-5 py-2 border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-primary)] z-20 flex-shrink-0">
        {/* Left: exact uploaded logo */}
        <div className="flex items-center gap-3">
          <div className="px-2 py-1 rounded-xl bg-slate-900/90 border border-slate-700/50 shadow-md flex items-center">
            <img 
              src="/logo.jpeg" 
              alt="CryptoTrace" 
              className="h-8 sm:h-10 w-auto object-contain rounded-md"
            />
          </div>
          <div className="hidden md:block border-l border-slate-800 pl-3 py-0.5">
            <p className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">
              Blockchain Fraud Analytics
            </p>
          </div>
        </div>

        {/* Right: controls + badge */}
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex items-center bg-[rgba(255,255,255,0.03)] rounded-lg p-1 border border-[var(--color-border-subtle)]">
            {onToggleView && (
              <>
                <button 
                  onClick={() => onToggleView('graph')}
                  className={`flex items-center gap-1.5 px-2.5 sm:px-4 py-1 sm:py-1.5 text-xs font-medium rounded-md transition-all ${viewMode === 'graph' ? 'bg-[var(--color-accent-from)]/10 text-[var(--color-text-accent)] shadow-sm' : 'text-gray-400 hover:text-white'}`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
                  <span>Graph</span>
                </button>
                <button 
                  onClick={() => onToggleView('story')}
                  className={`flex items-center gap-1.5 px-2.5 sm:px-4 py-1 sm:py-1.5 text-xs font-medium rounded-md transition-all ${viewMode === 'story' ? 'bg-[var(--color-accent-from)]/10 text-[var(--color-text-accent)] shadow-sm' : 'text-gray-400 hover:text-white'}`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                  <span>Timeline</span>
                </button>
              </>
            )}
            
            {onOpenCopilot && (
              <button 
                onClick={onOpenCopilot}
                className="flex items-center gap-1.5 px-2.5 sm:px-4 py-1 sm:py-1.5 text-xs font-bold uppercase tracking-wide btn-liquid rounded-md ml-1"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                <span className="hidden sm:inline">AI Copilot</span>
                <span className="sm:hidden">Copilot</span>
              </button>
            )}
          </div>

          <span className="hidden md:inline-flex text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-muted)] bg-[rgba(255,255,255,0.04)] px-3 py-1.5 rounded-full border border-[var(--color-border-subtle)]">
            SIH 2026
          </span>
        </div>
      </header>

      {/* Floating Status Indicator (Bottom Right) */}
      <div className="absolute bottom-4 right-4 z-50">
        <StatusIndicator />
      </div>

      {/* ---- Main content ---- */}
      <main className="flex-1 min-h-0">
        {children}
      </main>
    </div>
  );
}
