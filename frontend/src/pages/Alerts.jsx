import ModulePage from "../components/ModulePage.jsx";
import { useLang } from "../i18n.jsx";
import { formatDate, trimWords } from "../format.js";
import { useApi } from "../hooks.js";

const KINDS = { horaires: "Horaires", circulation: "Circulation", meteo: "Météo" };

export default function Alerts() {
  const { t, lang } = useLang();
  const { data: alerts, loading, error } = useApi("/api/alerts");

  return (
    <ModulePage
      slug="alertes"
      title="Alertes et actualités pratiques"
      intro="Changements d'horaires, circulation, météo : les informations de dernière minute pour vos déplacements."
    >
      <div className="alert-list">
        {loading && !alerts ? (
          <div className="empty">{t("Chargement...")}</div>
        ) : error ? (
          <div className="empty">{t(error)}</div>
        ) : alerts.length === 0 ? (
          <div className="empty">{t("Aucune alerte pour le moment. Revenez bientôt.")}</div>
        ) : (
          alerts.map((a) => (
            <div className="alert-item" key={a.id}>
              <div className="adate">{formatDate(a.createdAt, lang)}</div>
              <div>
                {KINDS[a.kind] && <span className={"alert-kind " + a.kind}>{t(KINDS[a.kind])}</span>}
                <h4>{a.title}</h4>
                <p>{trimWords(a.body, 30)}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </ModulePage>
  );
}
