export default function PoliticaPrivacidad() {
  return (
    <article className="legal" aria-labelledby="titulo-politica-privacidad">
      <h1 id="titulo-politica-privacidad">Política de privacidad</h1>
      <p>Borrador informativo. No sustituye asesoría legal.</p>
      <h2>Qué no pedimos</h2>
      <p>No hay cuentas, cookies de seguimiento ni venta de datos. No se envían nombres, correos ni ubicación continua a un servidor propio.</p>
      <h2>Qué se guarda en el dispositivo</h2>
      <p>Las preferencias de voz y tono se guardan en localStorage. La caché de la PWA se conserva en el navegador para uso sin conexión.</p>
      <h2>Cámara</h2>
      <p>El modo inmersivo usa la cámara solo en el dispositivo y se apaga al cerrar. No se graba ni se sube el vídeo.</p>
      <h2>APIs de terceros</h2>
      <ul>
        <li>Open-Meteo: clima por coordenadas del sitio.</li>
        <li>Wikipedia y Wikimedia Commons: texto e imágenes de los lugares.</li>
        <li>REST Countries: datos públicos del país.</li>
        <li>Sunrise-Sunset: amanecer y atardecer.</li>
        <li>Nager.Date: festivos públicos.</li>
        <li>OpenStreetMap y Leaflet: mapa.</li>
        <li>QR Server: código de instalación.</li>
      </ul>
      <p>Esas consultas salen desde las rutas de esta app o el navegador. No incluyen tu identidad.</p>
    </article>
  );
}
