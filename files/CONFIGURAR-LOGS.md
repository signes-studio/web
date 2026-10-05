# 📊 Registro y Seguimiento de Descargas (Logs)

El sistema de descargas de `signes.studio/files/*` incluye registro automático de actividad tanto en local como de forma remota.

---

## 1. Visualización Rápida en el Navegador

Puedes ver el registro de descargas realizadas en cualquier momento añadiendo `?logs=1` al final de la URL del enlace:

Ejemplo:
```text
https://signes.studio/files/test?logs=1
```

Aparecerá un panel inferior flotante con el número de descargas, archivos y horas exactas.

---

## 2. Registro Remoto Gratuito en Google Sheets (Recomendado)

Dado que la web se aloja en un servidor estático (GitHub Pages), la forma más cómoda y profesional de recibir un registro en tiempo real de **todas** las personas que descargan tus archivos es conectarlo a una hoja de Google Sheets gratuita con un script de 15 líneas:

### Pasos (se tarda 1 minuto):

1. Entra en [Google Sheets](https://sheets.new) y crea una hoja nueva llamada **"SIGNES — Registro de Descargas"**.
2. En la primera fila pon los encabezados de las columnas:
   * **A1:** `Fecha y Hora`
   * **B1:** `Carpeta`
   * **C1:** `Archivo`
   * **D1:** `Tipo (zip / archivo)`
   * **E1:** `Dispositivo / Pantalla`
   * **F1:** `Procedencia (Referrer)`
3. En el menú superior de Google Sheets, ve a:
   **Extensiones** > **Apps Script**.
4. Borra lo que haya y pega este código:

```javascript
function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);
    
    sheet.appendRow([
      data.localTime || new Date().toISOString(),
      data.folder || "",
      data.file || "",
      data.type || "",
      data.screen || "",
      data.referrer || ""
    ]);
    
    return ContentService.createTextOutput("OK").setMimeType(ContentService.MimeType.TEXT);
  } catch (err) {
    return ContentService.createTextOutput("ERROR: " + err.message).setMimeType(ContentService.MimeType.TEXT);
  }
}
```

5. Haz clic arriba a la derecha en **Implementar** (Deploy) > **Nueva implementación** (New deployment).
6. Elige tipo: **Aplicación web** (Web app).
   * **Ejecutar como:** `Yo` (tu cuenta)
   * **Quién tiene acceso:** `Cualquier usuario` (Anyone) *(importante para que la web pueda enviar el registro sin pedir inicio de sesión)*.
7. Haz clic en **Implementar** y copia la **URL de la aplicación web** que te proporciona Google (termina en `/exec`).
8. Pega esa URL en el archivo [`files/config.json`](file:///c:/Users/luiss/Documents/_WEB/web/files/config.json):

```json
{
  "webhookUrl": "https://script.google.com/macros/s/TU_CODIGO_AQUI/exec"
}
```

9. Ejecuta en tu terminal:
```bash
npm run files
```
¡Listo! A partir de ese momento, cada vez que cualquier persona en el mundo pulse "Descargar todo" o descargue cualquier plano o archivo individual, aparecerá una fila nueva en tu Google Sheet al segundo.

---

## 3. Opcional: Notificaciones en Discord o Telegram

Si prefieres recibir una notificación en un canal de Discord o grupo de Telegram cada vez que alguien descargue, puedes pegar la URL de un Webhook de Discord directamente en `webhookUrl` dentro de `files/config.json`.
