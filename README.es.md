# DSH BTW Continuity

Preguntas laterales continuas en DeepSeek Harness: un panel cronológico por sesión, seguimiento directo y sin interrumpir la tarea principal.

[简体中文](README.zh-CN.md) · [English](README.en.md) · [日本語](README.ja.md) · Español · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

> **BTW Continuity es una modificación independiente de [MichengAI DSH BTW 1.3.10](https://github.com/MichengAI/dsh-btw)**, con licencia Apache-2.0 y sin respaldo de DeepSeek AI ni MichengAI. Consulta [NOTICE.md](NOTICE.md) para ver la atribución y los cambios.

## Características

- Todas las preguntas y respuestas BTW de una sesión aparecen en un único panel cronológico.
- El compositor inferior permite preguntar directamente: Enter envía y Shift+Enter inserta una nueva línea.
- El campo comienza con una línea, crece hasta cuatro y luego permite desplazarse internamente; vuelve a una línea tras enviar.
- X solo oculta el panel; la siguiente pregunta restaura el historial visible.
- El icono de papelera borra el historial BTW de la sesión actual y permite empezar de nuevo.
- Las respuestas no entran en la conversación principal salvo que se solicite expresamente `send_message`.
- Respuestas de solo lectura, preguntas sobre texto seleccionado, Markdown, fórmulas, copia y ocho idiomas.

## Interfaz actual

![Conversación de BTW Continuity en un solo panel con historial y campo de seguimiento](assets/screenshots/btw-continuity-panel.webp)

## Requisitos

- DeepSeek Harness `>=0.2.0-rc.1 <0.3.0-0`
- Node.js 22+
- Un proveedor de modelos configurado

**Este paquete es una modificación de `@michengai/dsh-btw`. Ambos registran `/btw`, por lo que no pueden estar activados a la vez.**

## Instalación

Sustituye `desktop` por tu perfil real:

```bash
dsh plugin --profile desktop add dsh-btw-continuity@latest --registry=https://registry.npmjs.org/
```

Si no se activa automáticamente, recarga la aplicación de escritorio o reinicia el servicio DSH correspondiente.

## Uso

```text
/btw Resume la propuesta actual en una frase
```

También puedes elegir `btw` en el menú `/` o usar **Preguntar a BTW** sobre texto seleccionado.

Expande el panel y escribe en el campo inferior. Las preguntas del panel y `/btw` comparten el mismo historial.

| Acción | Comportamiento |
| --- | --- |
| X | Oculta el panel sin borrar el historial; se restaura con la siguiente pregunta. |
| Papelera | Borra todo el historial BTW de esta sesión y elimina el panel. |
| Copiar | Copia el Markdown original de la respuesta correspondiente. |

## Historial y privacidad

- Las solicitudes posteriores incluyen turnos BTW completados y el contexto de la sesión principal, lo que puede aumentar el uso de tokens.
- Las solicitudes solo se envían al proveedor configurado; no se añade ningún tercero receptor.
- El historial se conserva en la memoria del Host y se pierde al reiniciarlo. Copia las respuestas que necesites conservar.

## Configuración

En **Plugins → BTW Continuity → Configurar** puedes permitir herramientas además de `send_message` (una por línea) y sustituir el prompt integrado. El modo predeterminado es solo texto.

## Desinstalación

```bash
dsh plugin --profile desktop remove dsh-btw-continuity
```

## Desarrollo

```bash
npm ci --ignore-scripts
npm run check
```

## Licencia

[Apache-2.0](LICENSE) · [Atribución y modificaciones](NOTICE.md)
