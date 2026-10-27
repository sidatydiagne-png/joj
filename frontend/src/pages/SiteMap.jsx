import { useState } from "react";
import ModulePage from "../components/ModulePage.jsx";
import { useLang } from "../i18n.jsx";
import { useApi } from "../hooks.js";

export default function SiteMap() {
  const { t } = useLang();
  const { data: sites, loading, error } = useApi("/api/sites");
  const [activeId, setActiveId] = useState(null);
  const current = sites?.find((s) => s.id === activeId) ?? sites?.[0];

  return (
    <ModulePage
      slug="carte"
      title="Carte des sites"
      intro="Dakar, Diamniadio et Saly — les trois pôles des JOJ. Touchez un site sur la carte pour voir les informations."
    >
      {loading && !sites ? (
        <div className="empty">{t("Chargement...")}</div>
      ) : error ? (
        <div className="empty">{t(error)}</div>
      ) : (
        <div className="map-wrap">
          <div className="map-svg">
            <svg viewBox="0 0 480 360" role="img" aria-label={t("Carte illustrative des sites")}>
              <path d="M0 60 C120 30 260 40 480 10 L480 0 L0 0 Z" fill="#F0E4C4" opacity="0.5" />
              <path d="M0 340 C140 300 260 330 480 300 L480 360 L0 360 Z" fill="#B7D7B0" />
              <path d="M20 250 C90 200 150 210 190 170 C220 140 210 100 250 90 C300 80 330 130 380 120 C420 112 440 150 460 170 L460 300 L20 300 Z" fill="#CFE7C8" stroke="#9FC79A" strokeWidth="1" />
              {sites.map((s) => (
                <g
                  key={s.id}
                  className={"pin" + (current?.id === s.id ? " active" : "")}
                  tabIndex={0}
                  role="button"
                  aria-label={s.title}
                  onClick={() => setActiveId(s.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setActiveId(s.id);
                    }
                  }}
                >
                  <circle className="dot" cx={s.x} cy={s.y} r="9" />
                  <text x={s.x} y={s.y - 15} textAnchor="middle">{s.title}</text>
                </g>
              ))}
            </svg>
          </div>
          <div className="site-info">
            {sites.map((s) => (
              <button
                key={s.id}
                className={"tab-btn" + (current?.id === s.id ? " active" : "")}
                onClick={() => setActiveId(s.id)}
              >
                {s.title}
              </button>
            ))}
            <div className="site-panel">
              {current && (
                <div className="site-panel-content">
                  <h3>{current.title}</h3>
                  <p>{current.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </ModulePage>
  );
}
