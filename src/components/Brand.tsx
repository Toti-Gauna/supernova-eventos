export default function Brand({ compact = false }: { compact?: boolean }) {
  return <span className="brand"><svg viewBox="0 0 40 40" aria-hidden="true"><path d="M20 3c0 12-5 17-17 17 12 0 17 5 17 17 0-12 5-17 17-17C25 20 20 15 20 3Z" fill="currentColor" /><circle cx="20" cy="20" r="17" fill="none" stroke="currentColor" strokeWidth=".6" opacity=".55" /></svg><span className="wordmark">supernova</span>{!compact && <span className="brand-section">EVENTOS</span>}</span>;
}
