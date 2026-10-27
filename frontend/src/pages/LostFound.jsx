import { useEffect, useRef, useState } from "react";
import ModulePage from "../components/ModulePage.jsx";
import { useToast } from "../components/Toast.jsx";
import { useLang } from "../i18n.jsx";
import { api, errorMessage, photoSrc } from "../api.js";
import { formatDate } from "../format.js";
import { useApi } from "../hooks.js";

const CATEGORIES = ["Document", "Électronique", "Vêtement", "Bagage", "Autre"];
const MAX_PHOTO = 5 * 1024 * 1024;

// Champ piège invisible : un humain ne le remplit jamais, un robot oui
const Honeypot = () => (
  <div style={{ position: "absolute", left: "-9999px" }} aria-hidden="true">
    <input name="website" tabIndex={-1} autoComplete="off" />
  </div>
);

export default function LostFound() {
  const { t, lang } = useLang();
  const toast = useToast();
  const { data: items, loading, error, reload } = useApi("/api/lost-items");
  const [sending, setSending] = useState(false);
  const [contactItem, setContactItem] = useState(null);
  const [photoItem, setPhotoItem] = useState(null);

  async function onSubmit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const photo = fd.get("photo");
    if (photo instanceof File && photo.size === 0) fd.delete("photo");
    if (photo instanceof File && photo.size > MAX_PHOTO) return toast(t("Photo trop lourde (5 Mo maximum)."));

    setSending(true);
    try {
      await api("/api/lost-items", { method: "POST", form: fd });
      form.reset();
      toast(t("Déclaration publiée."));
      reload();
    } catch (err) {
      toast(t(errorMessage(err)));
    } finally {
      setSending(false);
    }
  }

  return (
    <ModulePage
      slug="objets-perdus"
      title="Objets perdus et retrouvés"
      intro="Déclarez un objet perdu ou retrouvé avec photo, catégorie, lieu et date. La mise en relation se fait par e-mail via le portail — vos coordonnées ne sont jamais affichées publiquement."
    >
      <div className="two-col">
        <div>
          <h3 style={{ fontSize: "1.05rem", marginBottom: 14 }}>{t("Déclarer un objet")}</h3>
          <form className="card" onSubmit={onSubmit}>
            <Honeypot />
            <div className="field">
              <label htmlFor="lf-title">{t("Objet")}</label>
              <input id="lf-title" name="title" required maxLength={120} placeholder={t("Ex. Portefeuille en cuir marron")} />
            </div>
            <div className="field">
              <label htmlFor="lf-cat">{t("Catégorie")}</label>
              <select id="lf-cat" name="category">
                {CATEGORIES.map((c) => <option key={c} value={c}>{t(c)}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="lf-place">{t("Lieu")}</label>
              <input id="lf-place" name="place" required maxLength={120} placeholder={t("Ex. Stade Abdoulaye Wade")} />
            </div>
            <div className="field">
              <label htmlFor="lf-date">Date</label>
              <input id="lf-date" name="date" type="date" />
            </div>
            <div className="field">
              <label htmlFor="lf-type">Type</label>
              <select id="lf-type" name="type">
                <option value="perdu">{t("Objet perdu")}</option>
                <option value="trouve">{t("Objet trouvé")}</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="lf-email">{t("Votre e-mail (jamais affiché)")}</label>
              <input id="lf-email" name="email" type="email" required maxLength={254} placeholder="vous@exemple.com" />
            </div>
            <div className="field">
              <label htmlFor="lf-photo">{t("Photo (optionnel)")}</label>
              <input id="lf-photo" name="photo" type="file" accept="image/jpeg,image/png,image/webp,image/gif" />
            </div>
            <button type="submit" className="btn btn-primary" disabled={sending}>
              {sending ? t("Envoi...") : t("Publier la déclaration")}
            </button>
            <p className="hint">{t("Votre e-mail n'est jamais affiché. Les personnes intéressées vous écrivent via le portail et le message est transmis à votre adresse.")}</p>
          </form>
        </div>

        <div>
          <h3 style={{ fontSize: "1.05rem", marginBottom: 14 }}>{t("Déclarations récentes")}</h3>
          <div className="item-list">
            {loading && !items ? (
              <div className="empty">{t("Chargement...")}</div>
            ) : error ? (
              <div className="empty">{t(error)}</div>
            ) : items.length === 0 ? (
              <div className="empty">{t("Aucune déclaration pour le moment. Soyez le premier à en publier une.")}</div>
            ) : (
              items.map((it) => (
                <div className="item" key={it.id}>
                  {it.photo ? (
                    <button type="button" className="thumb" aria-label={t("Agrandir la photo")} onClick={() => setPhotoItem(it)}>
                      <img src={photoSrc(it.photo)} alt="" width="64" height="64" loading="lazy" />
                    </button>
                  ) : (
                    <div style={{ width: 64, height: 64, borderRadius: 6, background: "var(--sand-2)", flex: "none" }} />
                  )}
                  <div className="meta">
                    <span className="badge">{it.type === "trouve" ? t("Objet trouvé") : t("Objet perdu")}</span>
                    <span className="badge">{t(it.category)}</span>
                    <h4>{it.title}</h4>
                    <div className="sub">
                      {it.place}
                      {it.date ? ` · ${formatDate(it.date, lang)}` : ""}
                    </div>
                    <button type="button" className="contact-btn" onClick={() => setContactItem(it)}>
                      {t("Contacter en toute sécurité")}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <ContactDialog item={contactItem} onClose={() => setContactItem(null)} />
      <PhotoDialog item={photoItem} onClose={() => setPhotoItem(null)} />
    </ModulePage>
  );
}

// Fenêtre « Message sécurisé » : le message part au serveur, qui le transmet au déclarant sans montrer son e-mail
function ContactDialog({ item, onClose }) {
  const { t } = useLang();
  const toast = useToast();
  const ref = useRef(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (item && !dialog.open) dialog.showModal();
    if (!item && dialog.open) dialog.close();
  }, [item]);

  async function onSubmit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const body = Object.fromEntries(new FormData(form));
    setSending(true);
    try {
      const res = await api(`/api/lost-items/${item.id}/contact`, { method: "POST", body });
      toast(
        res.emailed
          ? t("Message envoyé au déclarant.")
          : t("Message enregistré. L'équipe du portail le transmettra au déclarant.")
      );
      form.reset();
      onClose();
    } catch (err) {
      toast(t(errorMessage(err)));
    } finally {
      setSending(false);
    }
  }

  return (
    <dialog ref={ref} className="modal" onClose={onClose}>
      {item && (
        <div className="inner">
          <button type="button" className="close" aria-label={t("Fermer")} onClick={onClose}>×</button>
          <h3>{t("Message sécurisé")}</h3>
          <p style={{ fontSize: "0.86rem" }}>{t("Votre message sera transmis par e-mail au déclarant, sans révéler ses coordonnées.")}</p>
          <form onSubmit={onSubmit}>
            <Honeypot />
            <div className="field"><label htmlFor="cf-name">{t("Votre nom")}</label><input id="cf-name" name="name" required maxLength={80} /></div>
            <div className="field"><label htmlFor="cf-contact">{t("Votre e-mail ou téléphone")}</label><input id="cf-contact" name="contact" required maxLength={120} /></div>
            <div className="field"><label htmlFor="cf-msg">Message</label><textarea id="cf-msg" name="message" required maxLength={2000} /></div>
            <button type="submit" className="btn btn-primary" disabled={sending} style={{ width: "100%", justifyContent: "center" }}>
              {sending ? t("Envoi...") : t("Envoyer")}
            </button>
          </form>
        </div>
      )}
    </dialog>
  );
}

// Photo en grand : clic sur la miniature ; on ferme avec la croix, Échap ou un clic à côté de l'image
function PhotoDialog({ item, onClose }) {
  const { t } = useLang();
  const ref = useRef(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (item && !dialog.open) dialog.showModal();
    if (!item && dialog.open) dialog.close();
  }, [item]);

  return (
    <dialog
      ref={ref}
      className="modal photo-modal"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      {item && (
        <div className="inner">
          <button type="button" className="close" aria-label={t("Fermer")} onClick={onClose}>×</button>
          <img src={photoSrc(item.photo)} alt={item.title} />
          <p className="photo-caption">{item.title}</p>
        </div>
      )}
    </dialog>
  );
}
