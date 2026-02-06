export default function AlertCard({ title, children }) {
  return (
    <details className="alert-card alert-details">
      <summary className="alert-summary">
        <p className="nav-label">{title}</p>
        <span className="alert-chevron" aria-hidden="true" />
      </summary>
      {children ? <div className="alert-body">{children}</div> : null}
    </details>
  );
}
