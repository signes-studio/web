# 📤 Cómo Activar la Subida de Archivos con OneDrive

Si tienes suscripción a **Microsoft OneDrive**, puedes permitir que tus clientes o colaboradores te envíen planos, modelos o archivos pesados (hasta 250 GB por archivo) directamente a tu carpeta de OneDrive, sin que ellos necesiten cuenta de Microsoft ni vean los archivos de los demás.

---

## 1. Crear la "Solicitud de archivos" en OneDrive

1. Abre tu **OneDrive** en el navegador (en [onedrive.live.com](https://onedrive.live.com) o en tu portal de Microsoft 365).
2. Ve a la carpeta donde quieras recibir los archivos de ese proyecto o cliente.
3. Selecciona la carpeta y en la barra superior (o haciendo clic en los 3 puntos `...`) pulsa en **"Solicitar archivos"** *(Request files)*.
4. Escribe el título que verá el cliente (ejemplo: *"Planos y documentación para SIGNES.STUDIO"*).
5. Haz clic en **Siguiente** y **Copia el vínculo** que te genera OneDrive (suele ser del tipo `https://1drv.ms/u/s!...`).

---

## 2. Activarlo en tu web para esa carpeta

Dentro de la carpeta del proyecto en tu web (por ejemplo en `files/test/` o `files/nombre-carpeta/`):

1. Crea un archivo llamado **`subidas.txt`** (o `upload.txt`).
2. Abre el archivo y **pega el enlace de OneDrive**:
   ```text
   https://1drv.ms/u/s!tu-enlace-de-onedrive-aqui
   ```
3. Guarda el archivo.
4. En tu terminal ejecuta:
   ```bash
   npm run files
   ```

---

## 3. ¿Qué verá el usuario en la web?

* Si una carpeta **NO** tiene `subidas.txt`: la página solo funciona para descargar (como hasta ahora).
* Si una carpeta **SÍ** tiene `subidas.txt`: en la tarjeta de WeTransfer aparecerá automáticamente un bloque elegante:
  * **"Aportar archivos · OneDrive"**
  * Botón: **"Subir archivos a esta carpeta"**
  * Al hacer clic, se abre la pasarela oficial de carga de OneDrive donde el cliente arrastra sus archivos y caen directos a tu ordenador.
