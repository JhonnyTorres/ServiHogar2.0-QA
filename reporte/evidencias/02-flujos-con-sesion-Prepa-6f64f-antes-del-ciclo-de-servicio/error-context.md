# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 02-flujos-con-sesion.spec.ts >> Preparación @con-login >> T00 Limpieza: sin solicitudes activas antes del ciclo de servicio
- Location: tests\02-flujos-con-sesion.spec.ts:108:3

# Error details

```
Error: No hay un elemento tocable (¿tapado por otra pantalla?)

No hay un elemento tocable (¿tapado por otra pantalla?)

expect(received).toBeGreaterThan(expected)

Expected: > 0
Received:   0

Call Log:
- Timeout 20000ms exceeded while waiting on the predicate
```

# Page snapshot

```yaml
- generic [ref=e12]:
  - generic [ref=e13]:
    - generic [ref=e17]:
      - generic [ref=e18]:
        - generic [ref=e19]: ¡Hola, Jonathan! 👋
        - generic [ref=e20]: Aquí está tu resumen de hoy
      - generic [ref=e22]:
        - generic [ref=e23]:
          - generic [ref=e24]:
            - generic [ref=e25]: Nuevas
            - generic [ref=e26]: "0"
          - generic [ref=e27]:
            - generic [ref=e28]: En proceso
            - generic [ref=e29]: "0"
          - generic [ref=e30]:
            - generic [ref=e31]: Finalizados
            - generic [ref=e32]: "25"
        - generic [ref=e33] [cursor=pointer]:
          - generic [ref=e34]: 
          - generic [ref=e35]: Historial de pagos
          - generic [ref=e36]: 
        - generic [ref=e37] [cursor=pointer]:
          - generic [ref=e38]: 
          - generic [ref=e39]: Mis certificaciones
          - generic [ref=e40]: 
        - generic [ref=e41]: Estado de tu perfil
        - generic [ref=e42]:
          - generic [ref=e43]:
            - generic [ref=e44]: JM
            - generic [ref=e46]:
              - generic [ref=e47]: Jonathan Montoya
              - generic [ref=e48]:
                - generic [ref=e49]: 
                - generic [ref=e50]: 
                - generic [ref=e51]: 
                - generic [ref=e52]: 
                - generic [ref=e53]: 
                - generic [ref=e54]: 4.4 (11 reseñas)
          - generic [ref=e55]:
            - generic [ref=e56]: Electricidad
            - generic [ref=e58]: Carpintería
            - generic [ref=e60]: Jardinería
            - generic [ref=e62]: Climatización
    - generic [ref=e67]:
      - generic [ref=e70]:
        - generic [ref=e71]: Mis solicitudes
        - generic [ref=e72]: 34 en total
      - generic [ref=e74]:
        - generic [ref=e75] [cursor=pointer]: Pendientes
        - generic [ref=e77] [cursor=pointer]: En proceso
        - generic [ref=e79] [cursor=pointer]: Finalizados (25)
        - generic [ref=e81] [cursor=pointer]: Rechazados (9)
      - generic [ref=e83]:
        - generic [ref=e84]: 
        - generic [ref=e85]: No tienes solicitudes pendientes
  - tablist [ref=e87]:
    - tab "  Home" [ref=e89] [cursor=pointer]:
      - generic [ref=e90]:
        - generic [ref=e91]: 
        - generic [ref=e93]: 
      - generic [ref=e95]: Home
    - tab "  Solicitudes" [active] [selected] [ref=e97] [cursor=pointer]:
      - generic [ref=e98]:
        - generic [ref=e99]: 
        - generic [ref=e101]: 
      - generic [ref=e103]: Solicitudes
    - tab "  Mensajes" [ref=e105] [cursor=pointer]:
      - generic [ref=e106]:
        - generic [ref=e107]: 
        - generic [ref=e109]: 
      - generic [ref=e111]: Mensajes
    - tab "  Usuario" [ref=e113] [cursor=pointer]:
      - generic [ref=e114]:
        - generic [ref=e115]: 
        - generic [ref=e117]: 
      - generic [ref=e119]: Usuario
    - tab "  Ajustes" [ref=e121] [cursor=pointer]:
      - generic [ref=e122]:
        - generic [ref=e123]: 
        - generic [ref=e125]: 
      - generic [ref=e127]: Ajustes
```

# Test source

```ts
  22  | /** Texto exacto visible. */
  23  | export const texto = (p: Page, t: string) => visible(p.getByText(t, { exact: true }));
  24  | /** Texto parcial/regex visible. */
  25  | export const textoParcial = (p: Page, t: string | RegExp) => visible(p.getByText(t));
  26  | /** Campo por placeholder, visible. */
  27  | export const campo = (p: Page, placeholder: string | RegExp, exact = false) =>
  28  |   visible(p.getByPlaceholder(placeholder, { exact }));
  29  | 
  30  | export const campoCorreo = (p: Page) => campo(p, 'Correo electrónico');
  31  | export const campoClave = (p: Page) => campo(p, 'Contraseña', true);
  32  | /** "Iniciar sesión" aparece como título y como botón; el botón es el último. */
  33  | export const botonIniciarSesion = (p: Page) => texto(p, 'Iniciar sesión').last();
  34  | 
  35  | /**
  36  |  * Pestañas de la barra inferior: SOLO elementos con rol "tab". No se acepta "cualquier texto igual"
  37  |  * porque pantallas ya visitadas (p. ej. el título "Mis servicios") siguen montadas y aparecen antes
  38  |  * en el DOM que la pestaña, aunque estén tapadas.
  39  |  */
  40  | export const pestana = (p: Page, nombre: string) =>
  41  |   visible(p.getByRole('tab', { name: nombre })).first();
  42  | 
  43  | // ── Alertas (visibles gracias a web-stubs/Alert.js) ──────────────────────────
  44  | export const alertaTitulo = (p: Page) => p.getByTestId('rn-alert-title');
  45  | export const alertaMensaje = (p: Page) => p.getByTestId('rn-alert-message');
  46  | export async function cerrarAlerta(p: Page, texto = 'OK') {
  47  |   await p.getByTestId('rn-alert-btn').filter({ hasText: texto }).first().click();
  48  | }
  49  | 
  50  | // ── Acciones ─────────────────────────────────────────────────────────────────
  51  | export async function abrirApp(p: Page) {
  52  |   await p.goto('/');
  53  |   await expect(campoCorreo(p)).toBeVisible({ timeout: 30_000 });
  54  | }
  55  | 
  56  | /** Inicia sesión y espera a que termine la pantalla de bienvenida (≈3 s) y aparezca la barra de pestañas. */
  57  | export async function iniciarSesion(p: Page, u: Usuario) {
  58  |   await abrirApp(p);
  59  |   await campoCorreo(p).fill(u.email!);
  60  |   await campoClave(p).fill(u.clave!);
  61  |   await botonIniciarSesion(p).click();
  62  |   await expect(pestana(p, 'Ajustes')).toBeVisible({ timeout: 30_000 });
  63  | }
  64  | 
  65  | /** Adjunta una captura con nombre al reporte (evidencia de un paso concreto). */
  66  | export async function evidencia(p: Page, info: TestInfo, nombre: string) {
  67  |   await info.attach(nombre, { body: await p.screenshot(), contentType: 'image/png' });
  68  | }
  69  | 
  70  | /** Recoge errores de consola/JS durante la prueba; útil como evidencia de bugs. */
  71  | export function vigilarErrores(p: Page) {
  72  |   const errores: string[] = [];
  73  |   p.on('pageerror', (e) => errores.push(`pageerror: ${e.message}`));
  74  |   p.on('console', (m) => {
  75  |     if (m.type() === 'error') errores.push(`console.error: ${m.text().slice(0, 300)}`);
  76  |   });
  77  |   return errores;
  78  | }
  79  | 
  80  | /** Abre una sesión aparte (otro "teléfono") para simular al otro rol en la misma prueba. */
  81  | export async function nuevaSesion(browser: Browser, u: Usuario) {
  82  |   const ctx = await browser.newContext({ viewport: { width: 420, height: 860 }, baseURL: process.env.BASE_URL || 'http://localhost:8081' });
  83  |   const page = await ctx.newPage();
  84  |   await iniciarSesion(page, u);
  85  |   return { ctx, page };
  86  | }
  87  | 
  88  | /** Flujo del cliente: busca por categoría y envía una solicitud al profesional de prueba. */
  89  | export async function crearSolicitud(p: Page, descripcion: string) {
  90  |   await pestana(p, 'Buscar').click();
  91  |   await tocar(texto(p, CRED.categoria));
  92  |   const tarjeta = textoParcial(p, CRED.proNombre).first();
  93  |   await expect(tarjeta).toBeVisible({ timeout: 20_000 });
  94  |   await tocar(texto(p, 'Solicitar servicio'));
  95  |   await campo(p, /Describe el trabajo/).fill(descripcion);
  96  |   await campo(p, 'Ej: 80000').first().fill('80000');
  97  |   await tocar(texto(p, 'Enviar solicitud'));
  98  | }
  99  | 
  100 | /**
  101 |  * En web, React Navigation deja montadas las pantallas ya visitadas, apiladas unas sobre otras.
  102 |  * Un mismo texto (p. ej. la categoría "Electricidad") existe en Home, Buscar y Mis servicios, y
  103 |  * Playwright puede escoger la copia que está TAPADA por la pantalla activa (el clic no llega).
  104 |  * Esta función devuelve la primera coincidencia que el usuario realmente puede tocar.
  105 |  */
  106 | export async function tocable(loc: Locator): Promise<Locator> {
  107 |   const indices = () =>
  108 |     loc.evaluateAll((els) =>
  109 |       els
  110 |         .map((e, i) => {
  111 |           const r = e.getBoundingClientRect();
  112 |           if (r.width === 0 || r.height === 0) return -1;
  113 |           e.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  114 |           const r2 = e.getBoundingClientRect();
  115 |           const t = document.elementFromPoint(r2.left + r2.width / 2, r2.top + r2.height / 2);
  116 |           return t && (t === e || e.contains(t)) ? i : -1;
  117 |         })
  118 |         .filter((i) => i >= 0)
  119 |     );
  120 |   await expect
  121 |     .poll(async () => (await indices()).length, { timeout: 20_000, message: 'No hay un elemento tocable (¿tapado por otra pantalla?)' })
> 122 |     .toBeGreaterThan(0);
      |      ^ Error: No hay un elemento tocable (¿tapado por otra pantalla?)
  123 |   return loc.nth((await indices())[0]);
  124 | }
  125 | 
  126 | /** Toca la primera coincidencia realmente tocable de un localizador. */
  127 | export async function tocar(loc: Locator) {
  128 |   await (await tocable(loc)).click();
  129 | }
  130 | 
  131 | /**
  132 |  * Tras aceptar/finalizar, la app intenta generar un PDF (expo-print). En el navegador eso no existe y la app
  133 |  * muestra la alerta "Documento no generado", que TAPA la pantalla. El PDF está fuera del alcance de la prueba web
  134 |  * (se verifica en el celular), así que se cierra la alerta y se anota en el reporte.
  135 |  */
  136 | export async function cerrarAvisoPdf(p: Page, info?: TestInfo) {
  137 |   const t = alertaTitulo(p);
  138 |   if (await aparece(t.filter({ hasText: 'Documento no generado' }), 6000)) {
  139 |     info?.annotations.push({ type: 'nota', description: 'Web: el PDF no se genera (expo-print); se verifica en el dispositivo.' });
  140 |     await cerrarAlerta(p, 'OK');
  141 |   }
  142 | }
  143 | 
  144 | /**
  145 |  * ¿Aparece este elemento dentro de `ms` milisegundos? (locator.isVisible() NO espera: responde al instante
  146 |  * e ignora el timeout, por eso no sirve para "esperar y ver si sale".)
  147 |  */
  148 | export async function aparece(loc: Locator, ms = 5000): Promise<boolean> {
  149 |   try {
  150 |     await loc.first().waitFor({ state: 'visible', timeout: ms });
  151 |     return true;
  152 |   } catch {
  153 |     return false;
  154 |   }
  155 | }
  156 | 
  157 | /**
  158 |  * Chip de filtro de las listas de servicios. La app le agrega el conteo al texto cuando hay elementos
  159 |  * ("En proceso (1)", "Finalizados (20)"), así que el texto exacto cambia: se acepta con o sin "(N)".
  160 |  */
  161 | export const filtro = (p: Page, nombre: string) =>
  162 |   visible(p.getByText(new RegExp(`^${nombre}( \\(\\d+\\))?$`)));
  163 | 
```