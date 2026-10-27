import { Link } from "react-router-dom";
import { useLang } from "../i18n.jsx";
import { usePageTitle } from "../hooks.js";
import { PAGES } from "../pages.js";

// Gabarit commun des 7 modules : fil d'Ariane, titre numéroté, introduction, contenu, « précédent / suivant »
export default function ModulePage({ slug, title, intro, children }) {
  const { t } = useLang();
  const index = PAGES.findIndex((p) => p.slug === slug);
  const page = PAGES[index];
  const prev = PAGES[index - 1];
  const next = PAGES[index + 1];
  usePageTitle(t(page.label));

  return (
    <main id="main">
      <div className="wrap crumb-row">
        <Link className="crumb" to="/">{t("← Accueil")}</Link>
      </div>

      <section className="mod" id={slug} data-accent={page.accent}>
        <div className="wrap">
          <div className="mod-head">
            <span className="tag">{String(index + 1).padStart(2, "0")}</span>
            <h1>{t(title)}</h1>
          </div>
          <p className="mod-intro">{t(intro)}</p>
          {children}
        </div>
      </section>

      <nav className="wrap pager" aria-label={t("Modules du portail")}>
        {prev ? <Link to={"/" + prev.slug}>← {t(prev.label)}</Link> : <span />}
        {next ? <Link to={"/" + next.slug}>{t(next.label)} →</Link> : <span />}
      </nav>
    </main>
  );
}
