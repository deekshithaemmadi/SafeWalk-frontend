import { CheckCircle2, Clock, Navigation2 } from "lucide-react";

export default function RouteCard({
  route,
  isSelected = false,
  onSelect,
}) {
  const {
    name,
    label,
    distanceKm,
    durationMin,
    summary,
    source,
  } = route;

  return (
    <div
      className={`route-card-item ${isSelected ? "selected" : ""}`}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          if (onSelect) {
            onSelect();
          }
        }
      }}
      aria-pressed={isSelected}
    >
      <div className="route-card-header">
        <div className="route-card-tag">
          <span className="route-badge-letter">{label || "R"}</span>
          <div className="route-title-group">
            <h4 className="route-card-title">{name}</h4>
            {summary && <p className="route-card-summary">via {summary}</p>}
          </div>
        </div>

        {isSelected && (
          <span className="route-active-check">
            <CheckCircle2 size={18} className="check-icon" />
            <span className="active-tag-text">Active</span>
          </span>
        )}
      </div>

      <div className="route-metrics-row">
        <div className="metric-item">
          <Navigation2 size={15} className="metric-icon" />
          <span className="metric-value">{distanceKm} km</span>
        </div>

        <div className="metric-item">
          <Clock size={15} className="metric-icon" />
          <span className="metric-value">~{durationMin} mins</span>
        </div>
      </div>

      {source && (
        <div className="route-source-note">
          <small>Source: {source}</small>
        </div>
      )}
    </div>
  );
}
