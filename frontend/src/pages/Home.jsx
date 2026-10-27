import { Link } from "react-router-dom";
import { useLang } from "../i18n.jsx";
import { usePageTitle } from "../hooks.js";
import { PAGES } from "../pages.js";

export default function Home() {
  const { t } = useLang();
  usePageTitle(null);

  return (
    <main id="accueil">
      {/* La photo d'Ayo (public/mascotte.webp) sert d'arrière-plan du hero */}
      <section className="hero has-bg" style={{ "--hero-img": "url('/mascotte.webp')" }}>
        <div className="wrap">
          <div className="hero-text">
            <div className="hero-eyebrow">{t("Dakar 2026 · 31 octobre – 13 novembre")}</div>
            <h1>{t("Bienvenue aux JOJ Dakar 2026")}</h1>
            <p className="lede">
              {t("Les Jeux Olympiques de la Jeunesse réunissent plus de 2 700 jeunes athlètes à Dakar, Diamniadio et Saly. Ce portail vous aide à vivre l'événement sereinement.")}
            </p>
            <div className="hero-ctas">
              <a href="#joj" className="btn btn-primary">{t("Découvrir les JOJ")}</a>
              <Link to="/assistance" className="btn btn-ghost">{t("Demander de l'aide")}</Link>
            </div>
          </div>
        </div>
        <span className="hero-credit">{t("Ayo, mascotte officielle de Dakar 2026")}</span>
      </section>

      <nav className="route" aria-label={t("Modules du portail")}>
        <div className="wrap">
          <div className="route-track">
            {PAGES.map((p, i) => (
              <Link key={p.slug} className="stop" to={"/" + p.slug}>
                <span className="dot" />
                <span className="num">{String(i + 1).padStart(2, "0")}</span>
                <span className="label">{t(p.label)}</span>
              </Link>
            ))}
          </div>
        </div>
      </nav>

      <section className="mod" id="joj" data-accent="clay" style={{ borderBottom: "none" }}>
        <div className="wrap">
          <div className="mod-head"><h2>{t("Qu'est-ce que les JOJ ?")}</h2></div>
          <div className="joj-grid">
            <div>
              <p>{t("Les Jeux Olympiques de la Jeunesse (JOJ) sont une compétition multisports organisée par le Comité international olympique pour les jeunes athlètes d'environ 15 à 18 ans. Autour du sport, ils mêlent éducation, culture et échanges entre jeunes du monde entier.")}</p>
              <p>{t("Dakar 2026 est la 4e édition d'été des JOJ, et le premier événement olympique jamais organisé en Afrique. Les épreuves se répartissent entre Dakar, Diamniadio et Saly, avec des disciplines nouvelles comme le breaking, le baseball5 et le wushu.")}</p>
              <div className="ayo-box">
                <h3 style={{ fontSize: "1.1rem", marginBottom: 6 }}>{t("Ayo, la mascotte")}</h3>
                <p>{t("Un jeune lion, animal des armoiries du Sénégal, coiffé du tengadé, la casquette traditionnelle peule, et accompagné d'un tambour djembé. Il a été dessiné par Ndèye Mariama Diop, 16 ans, élève de seconde, à l'issue d'un concours national auprès des élèves.")}</p>
              </div>
            </div>
            <div className="facts">
              <div className="fact"><strong>{t("31 oct. → 13 nov.")}</strong><span>{t("Dates des Jeux, 2026")}</span></div>
              <div className="fact"><strong>2 700+</strong><span>{t("jeunes athlètes")}</span></div>
              <div className="fact"><strong>{t("3 sites")}</strong><span>Dakar, Diamniadio, Saly</span></div>
              <div className="fact"><strong>{t("1er")}</strong><span>{t("événement olympique en Afrique")}</span></div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
