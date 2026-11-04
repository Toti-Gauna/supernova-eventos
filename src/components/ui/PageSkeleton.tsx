import './page-skeleton.css';

/** Placeholder with the shape of a dashboard while a lazy view loads; announced once as busy. */
export default function PageSkeleton({ label }: { label: string }) {
  return <div className="page-skeleton" role="status" aria-busy="true" aria-label={label}>
    <span className="page-skeleton-title" />
    <div className="page-skeleton-row">{Array.from({ length: 4 }, (_, index) => <span key={index} className="page-skeleton-tile" />)}</div>
    <span className="page-skeleton-block" />
  </div>;
}
