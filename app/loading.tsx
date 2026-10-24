export default function Loading() {
  return (
    <main className="content standalone-content" aria-busy="true" aria-live="polite">
      <div className="section-heading page-heading">
        <div>
          <div className="loading-bar loading-eyebrow" />
          <div className="loading-bar loading-title" />
          <div className="loading-bar loading-subtitle" />
        </div>
      </div>
      <div className="loading-panel">
        <div className="loading-bar loading-wide" />
        <div className="loading-grid">
          <div className="loading-tile" />
          <div className="loading-tile" />
          <div className="loading-tile" />
        </div>
        <div className="loading-bar loading-row" />
        <div className="loading-bar loading-row" />
        <div className="loading-bar loading-row" />
      </div>
      <style>{`
        .loading-bar,.loading-tile{background:linear-gradient(90deg,rgba(222,244,232,.07),rgba(222,244,232,.15),rgba(222,244,232,.07));background-size:200% 100%;animation:loading-sheen 1.2s ease-in-out infinite;border-radius:10px}
        .loading-eyebrow{width:140px;height:10px;margin:4px 0 14px}
        .loading-title{width:min(340px,70vw);height:30px;margin-bottom:14px}
        .loading-subtitle{width:min(520px,85vw);height:13px}
        .loading-panel{margin-top:28px;padding:24px;border:1px solid rgba(220,245,230,.12);border-radius:18px;background:rgba(4,65,55,.55)}
        .loading-wide{width:190px;height:18px;margin-bottom:22px}
        .loading-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin-bottom:24px}
        .loading-tile{height:74px}
        .loading-row{height:42px;margin-top:10px}
        @keyframes loading-sheen{to{background-position:-200% 0}}
        @media(max-width:640px){.loading-grid{grid-template-columns:1fr}.loading-tile{height:54px}}
        @media(prefers-reduced-motion:reduce){.loading-bar,.loading-tile{animation:none}}
      `}</style>
    </main>
  );
}
