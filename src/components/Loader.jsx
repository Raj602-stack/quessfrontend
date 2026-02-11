export default function Loader({ size = "medium" }) {
  const sizeClass = size === "small" ? "loader--small" : size === "large" ? "loader--large" : "";
  return (
    <div className={`loader ${sizeClass}`} role="status" aria-label="Loading">
      <div className="loader__spinner" />
    </div>
  );
}
