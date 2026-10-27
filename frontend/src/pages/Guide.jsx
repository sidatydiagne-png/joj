import ModulePage from "../components/ModulePage.jsx";
import { useLang } from "../i18n.jsx";

export default function Guide() {
  const { t } = useLang();
  return (
    <ModulePage
      slug="guide-pratique"
      title="Guide pratique"
      intro="Transports, hébergements, restaurants, santé et sécurité : les informations utiles pour votre séjour à Dakar pendant les JOJ."
    >
      <details className="acc" open>
        <summary>{t("Transports")}<span>+</span></summary>
        <div className="body">
          <p>{t("Le TER relie Dakar à Diamniadio et le BRT dessert l'axe Petersen–Guédiawaye. Les taxis officiels sont jaune et noir. Consultez les annonces officielles pour les navettes entre les sites pendant les JOJ.")}</p>
        </div>
      </details>
      <details className="acc">
        <summary>{t("Hébergements")}<span>+</span></summary>
        <div className="body">
          <p>{t("Hôtels et résidences à Dakar, Diamniadio et Saly pour tous les budgets.")}</p>
        </div>
      </details>
      <details className="acc">
        <summary>{t("Restaurants, pharmacies, hôpitaux, commissariats, lieux de culte")}<span>+</span></summary>
        <div className="body">
          <p><strong>{t("Restaurants.")}</strong> {t("Cuisine sénégalaise (thiéboudienne, yassa, mafé) des gargotes aux restaurants du Plateau, de Ngor et des Almadies. Demandez conseil à votre hôtel pour des adresses fiables.")}</p>
          <p><strong>{t("Pharmacies.")}</strong> {t("Les pharmacies de garde sont indiquées sur la vitrine de chaque pharmacie. Votre hôtel peut aussi vous renseigner.")}</p>
          <p><strong>{t("Hôpitaux.")}</strong> {t("Principaux hôpitaux publics de Dakar : Hôpital principal, Hôpital Aristide Le Dantec, Hôpital de Fann, Hôpital Abass Ndao et Hôpital général Idrissa Pouye. En cas d'urgence, appelez le SAMU au 1515.")}</p>
          <p><strong>{t("Commissariats.")}</strong> {t("Pour signaler une infraction ou la perte de documents, rendez-vous au commissariat le plus proche ou contactez la Police touristique (numéro ci-dessous).")}</p>
          <p><strong>{t("Lieux de culte.")}</strong> {t("Mosquée de la Divinité (Ouakam), Grande Mosquée de Dakar, Cathédrale du Souvenir africain. Adoptez une tenue correcte et demandez l'autorisation avant de photographier.")}</p>
        </div>
      </details>

      <h3 style={{ marginTop: 34, fontSize: "1.05rem" }}>{t("Numéros d'urgence")}</h3>
      <div className="emergency">
        <div className="num"><strong>17</strong><span>{t("Police / Gendarmerie")}</span></div>
        <div className="num"><strong>18</strong><span>{t("Pompiers")}</span></div>
        <div className="num"><strong>1515</strong><span>{t("SAMU — urgences médicales")}</span></div>
        <div className="num"><strong>+221 33 860 38 10</strong><span>{t("Police touristique de Dakar")}</span></div>
      </div>
    </ModulePage>
  );
}
