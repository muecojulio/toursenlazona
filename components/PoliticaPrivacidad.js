const FECHA_ACTUALIZACION = "9 de octubre de 2026";

export default function PoliticaPrivacidad() {
  return (
    <article className="legal" aria-labelledby="titulo-politica-privacidad">
      <header className="legal-hero">
        <span className="legal-insignia" aria-hidden="true">🛡️</span>
        <p className="eyebrow">Claridad antes de cada viaje</p>
        <h1 id="titulo-politica-privacidad">Política de privacidad</h1>
        <p className="legal-actualizacion">Actualizada el {FECHA_ACTUALIZACION}</p>
        <p className="legal-lead">
          Esta guía está diseñada para explorar lugares, no para crear perfiles. A continuación explicamos
          qué información usa, qué se queda en tu dispositivo y cuándo intervienen servicios externos.
        </p>
      </header>

      <section className="legal-seccion">
        <h2>1. Qué información usa la aplicación</h2>
        <p>
          No necesitas crear una cuenta. La app no solicita nombre, correo, contactos ni ubicación GPS.
          El tiempo, el amanecer y los festivos se consultan con las coordenadas o el país del sitio histórico
          que hayas elegido; son datos del catálogo, no tu posición. Para mostrar resúmenes y recuperar una
          imagen alternativa, también se pueden consultar los nombres de los lugares visibles en la app.
        </p>
        <p>
          Esta versión no incorpora publicidad, analítica de uso ni cookies propias de seguimiento. El proveedor
          que aloja la web puede procesar datos técnicos de conexión —por ejemplo, dirección IP, fecha y hora,
          navegador y ruta solicitada— para operar y proteger el servicio, según sus propias condiciones y plazos.
        </p>
      </section>

      <section className="legal-seccion">
        <h2>2. Preferencias, cámara y voz</h2>
        <ul>
          <li>
            <strong>Preferencias de voz:</strong> el identificador de voz elegido, el tipo y el tono se guardan
            en el almacenamiento local del navegador para recordarlos en este dispositivo. No se envían a una
            cuenta ni a un perfil del servidor. Si el almacenamiento está bloqueado, la app sigue funcionando
            mientras permanezca abierta.
          </li>
          <li>
            <strong>Narración:</strong> el texto se entrega al motor de síntesis de voz del navegador o del
            sistema operativo. La app no graba ni envía el texto a su propio servidor; algunos motores o voces
            instaladas pueden usar servicios del proveedor del dispositivo conforme a sus propias condiciones.
          </li>
          <li>
            <strong>Cámara:</strong> el modo inmersivo solicita permiso solo después de que lo activas. El vídeo
            se muestra localmente; no se graba, transmite ni guarda. Las pistas de cámara se detienen al cerrar
            el modo, al salir de la página o al desmontar la app.
          </li>
          <li>
            <strong>Uso sin conexión:</strong> el service worker conserva en la caché del navegador la carcasa
            de la app, archivos estáticos y respuestas públicas de sus rutas para ofrecer una versión sin red.
            No almacena perfiles ni datos de cuenta. Puedes borrar esos datos desde los ajustes del navegador.
          </li>
        </ul>
      </section>

      <section className="legal-seccion">
        <h2>3. Servicios externos</h2>
        <p>
          Para mostrar contenido se contacta con los siguientes servicios. Las consultas de clima, país, salida
          del sol, festivos y resúmenes de Wikipedia pasan por las rutas de esta aplicación: el servidor consulta
          el lugar seleccionado y, cuando hace falta, títulos de lugares cuyas imágenes se muestran. El navegador
          sí conecta directamente con los proveedores de mapas, imágenes,
          la biblioteca cartográfica y el generador del código QR.
        </p>
        <ul className="legal-proveedores">
          <li>
            <strong>Open-Meteo</strong> — clima por las coordenadas del sitio, solicitado desde el servidor.
            <a href="https://open-meteo.com/en/terms" target="_blank" rel="noreferrer"> Información del servicio</a>.
          </li>
          <li>
            <strong>REST Countries, Sunrise-Sunset y Nager.Date</strong> — datos de país, amanecer/atardecer y
            festivos públicos, consultados desde el servidor con el país o lugar elegido.
            <a href="https://restcountries.com/" target="_blank" rel="noreferrer"> REST Countries</a>,
            <a href="https://sunrise-sunset.org/api" target="_blank" rel="noreferrer"> Sunrise-Sunset</a> y
            <a href="https://date.nager.at/" target="_blank" rel="noreferrer"> Nager.Date</a>.
          </li>
          <li>
            <strong>Wikipedia y Wikimedia Commons</strong> — el servidor solicita resúmenes e imágenes; el
            navegador descarga las imágenes desde Wikimedia.
            <a href="https://foundation.wikimedia.org/wiki/Policy:Privacy_policy" target="_blank" rel="noreferrer"> Política de privacidad de Wikimedia</a>.
          </li>
          <li>
            <strong>Leaflet desde unpkg y teselas de OpenStreetMap</strong> — la biblioteca del mapa se descarga
            desde unpkg y el navegador pide las imágenes cartográficas a OpenStreetMap.
            <a href="https://wiki.osmfoundation.org/wiki/Privacy_Policy" target="_blank" rel="noreferrer"> Política de privacidad de OpenStreetMap</a>.
          </li>
          <li>
            <strong>QR Server</strong> — genera la imagen del código QR de instalación. Recibe la dirección pública
            de la app como parámetro de la solicitud y puede recibir datos técnicos de conexión.
            <a href="https://goqr.me/api/" target="_blank" rel="noreferrer"> Información de QR Server</a>.
          </li>
        </ul>
        <p>
          Los servicios externos pueden recibir la IP del servidor o, cuando el navegador los contacta directamente,
          tu IP y datos técnicos del dispositivo. En las solicitudes entre sitios, la política de referencia de la
          app limita el referente a su origen. Cada proveedor aplica sus propias condiciones y política de privacidad.
        </p>
      </section>

      <section className="legal-seccion">
        <h2>4. Conservación y control</h2>
        <p>
          Las preferencias y la caché se conservan en tu navegador hasta que las borres o el propio navegador las
          elimine. Las respuestas públicas en caché pueden actualizarse al volver a conectarte. La aplicación no
          mantiene un registro de actividad personal ni un mecanismo de cuenta para asociar consultas a una persona.
        </p>
        <p>
          Para borrar las preferencias o el contenido sin conexión, elimina los datos del sitio y el almacenamiento
          local desde la configuración del navegador. Las solicitudes sobre registros técnicos del alojamiento
          deben dirigirse al titular del dominio o a la entidad que publicó esta instancia.
        </p>
      </section>

      <section className="legal-seccion">
        <h2>5. Responsable y cambios</h2>
        <p>
          El responsable de la publicación es el titular del dominio o la entidad que ofrece esta instancia de
          Tours de Historia. Este repositorio no configura un correo de contacto; consulta la información del sitio
          donde abriste la app para contactar a su responsable. Si la política cambia, se publicará aquí la nueva
          fecha de actualización.
        </p>
      </section>

      <aside className="legal-nota">
        <strong>En pocas palabras:</strong> no pedimos tu identidad ni tu ubicación. Las opciones de voz quedan en
        el dispositivo; la cámara funciona localmente; algunos proveedores externos participan en las funciones de
        mapa, imágenes, información pública y QR.
      </aside>
    </article>
  );
}
