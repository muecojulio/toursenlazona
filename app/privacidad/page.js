import PoliticaPrivacidad from "../../components/PoliticaPrivacidad.js";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Privacidad y datos — Tours de Historia",
  description: "Cómo se usan las preferencias locales, la cámara y los servicios externos de Tours de Historia.",
};

export default function PrivacidadPage() {
  return (
    <main className="privacy-page">
      <PoliticaPrivacidad />
      <p className="legal-volver"><a href="/">Volver a Tours de Historia</a></p>
    </main>
  );
}
