import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useLang } from "../i18n.jsx";
import { PAGES, SITE_NAME } from "../pages.js";

export default function Layout() {
  const { t, lang, setLang } = useLang();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    setOpen(false);
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <>
      <header className="site">
        <div className="wrap nav-row">
          <Link to="/" className="brand">
            <span className="mark" aria-hidden="true">
              <svg viewBox="0 0 40 40" width="30" height="30">
                <circle cx="20" cy="20" r="19" fill="none" stroke="#E2A233" strokeWidth="2" />
                <circle cx="14" cy="16" r="3" fill="#C1440E" />
                <circle cx="24" cy="14" r="3" fill="#0E6E5C" />
                <circle cx="22" cy="26" r="3" fill="#E2A233" />
                <path d="M14 16 L24 14 L22 26 Z" fill="none" stroke="#F6EFDD" strokeWidth="1.3" />
              </svg>
            </span>
            <span>{SITE_NAME}</span>
          </Link>
          <button
            className="nav-toggle"
            aria-expanded={open}
            aria-controls="primaryNav"
            aria-label={t("Menu")}
            onClick={() => setOpen((o) => !o)}
          >
            ≡
          </button>
          <nav className={"primary" + (open ? " open" : "")} id="primaryNav">
            {PAGES.map((p) => (
              <NavLink key={p.slug} to={"/" + p.slug}>
                {t(p.label)}
              </NavLink>
            ))}
          </nav>
          <div className="langs" role="group" aria-label={t("Langue")}>
            <button className={lang === "fr" ? "active" : ""} onClick={() => setLang("fr")}>FR</button>
            <button className={lang === "en" ? "active" : ""} onClick={() => setLang("en")}>EN</button>
          </div>
        </div>
      </header>

      <Outlet />

      <footer className="site">
        <div className="wrap">
          <div className="foot-grid">
            <div>
              <h3>{SITE_NAME}</h3>
              <p style={{ color: "rgba(246,239,221,0.72)", maxWidth: "36ch" }}>
                {t("Portail pratique pour les visiteurs, bénévoles et habitants pendant les Jeux Olympiques de la Jeunesse à Dakar.")}
              </p>
            </div>
            <div>
              <h3>{t("Modules")}</h3>
              {PAGES.map((p) => (
                <Link key={p.slug} to={"/" + p.slug}>{t(p.label)}</Link>
              ))}
            </div>
            <div>
              <h3>{t("Urgences")}</h3>
              <a href="tel:17">{t("Police / Gendarmerie — 17")}</a>
              <a href="tel:18">{t("Pompiers — 18")}</a>
              <a href="tel:1515">{t("SAMU — 1515")}</a>
            </div>
          </div>
          <div className="foot-bottom">
            <span>© {new Date().getFullYear()} {SITE_NAME} — {t("Portail non officiel réalisé pour les JOJ.")}</span>
            <span>{t("Les informations de ce portail sont données à titre indicatif.")}</span>
          </div>
        </div>
      </footer>
    </>
  );
}
