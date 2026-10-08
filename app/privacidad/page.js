import PoliticaPrivacidad from "../../components/PoliticaPrivacidad.js";

export const metadata = { title: "Privacidad — Tours de Historia" };

export default function PrivacidadPage() {
  return (
    <main className="privacy-page">
      <PoliticaPrivacidad />
      <p className="legal-volver"><a href="/">Volver a Tours de Historia</a></p>
    </main>
  );
}
