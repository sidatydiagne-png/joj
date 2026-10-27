import { useState } from "react";
import ModulePage from "../components/ModulePage.jsx";
import { useLang } from "../i18n.jsx";
import { locale } from "../format.js";
import { useApi } from "../hooks.js";

const FILTERS = [
  ["all", "Tout"],
  ["competition", "Compétitions"],
  ["culture", "Culture"],
  ["public", "Événements publics"],
];

export default function Agenda() {
  const { t, lang } = useLang();
  const { data: events, loading, error } = useApi("/api/events");
  const [filter, setFilter] = useState("all");
  const shown = (events ?? []).filter((e) => filter === "all" || e.type === filter);

  return (
    <ModulePage
      slug="agenda"
      title="Agenda simplifié"
      intro="Compétitions, activités culturelles et événements publics pendant les JOJ."
    >
      <div className="filters">
        {FILTERS.map(([key, label]) => (
          <button key={key} className={filter === key ? "active" : ""} onClick={() => setFilter(key)}>
            {t(label)}
          </button>
        ))}
      </div>

      <div className="agenda-list">
        {loading && !events ? (
          <div className="empty">{t("Chargement...")}</div>
        ) : error ? (
          <div className="empty">{t(error)}</div>
        ) : shown.length === 0 ? (
          <div className="empty">{t("Aucun événement programmé pour le moment.")}</div>
        ) : (
          shown.map((ev) => {
            const d = ev.date ? new Date(ev.date + "T00:00:00") : null;
            return (
              <div className="agenda-item" key={ev.id}>
                <div className="date">
                  <span className="d">{d ? String(d.getDate()).padStart(2, "0") : "—"}</span>
                  <span className="m">
                    {d ? d.toLocaleDateString(locale(lang), { month: "short" }).replace(".", "").toUpperCase() : ""}
                  </span>
                </div>
                <div>
                  <h4>{ev.title}</h4>
                  <div className="place">{ev.place}</div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </ModulePage>
  );
}
