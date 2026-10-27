import { Link } from "react-router-dom";
import { useLang } from "../i18n.jsx";
import { usePageTitle } from "../hooks.js";

export default function NotFound() {
  const { t } = useLang();
  usePageTitle(t("Page introuvable"));
  return (
    <main id="main">
      <div className="wrap" style={{ padding: "80px 24px", minHeight: "50vh" }}>
        <h1>{t("Page introuvable")}</h1>
        <p style={{ marginTop: 14 }}>{t("Cette page n'existe pas.")}</p>
        <Link to="/" className="btn btn-primary">{t("Retour à l'accueil")}</Link>
      </div>
    </main>
  );
}
