# Guía completa del mercado de jugadores

Esta guía describe la implementación web del mercado de MU Breda Season 6, los recursos visuales usados, el contrato entre la web y su API y el trabajo que todavía requiere el GameServer. El mercado sigue en modo de vista previa: **la web todavía no mueve objetos ni monedas del juego**.

## Qué incluye la web

- Página `/market`, integrada al diseño y a los idiomas español, inglés y portugués de CMSMuBreda.
- Exploración de publicaciones en cuadrícula o lista, búsqueda, orden, filtros de clase, moneda, opciones y nivel.
- Categorías separadas en tres grupos: **Armor**, **Weapons** y **Accessories & more**. Armor contiene Helms, Body Armor, Pants, Gloves y Boots. Weapons contiene Blades & Swords, Bows & Crossbows, Staves & Sticks, Scepters y Shields & Books. El tercer grupo reúne Accessories, Wings, Jewels y Pets.
- Retratos PNG para las clases disponibles en el cliente de Season 6.
- Etiqueta visible **WC** para la moneda que el backend identifica técnicamente como `WCoinC`. Se conserva el nombre interno para que la web pueda mapearlo a la configuración de la cuenta.
- Flujo de compra al precio publicado y flujo separado para enviar una oferta. La oferta permite combinar Zen, WC y joyas en la interfaz.
- Formulario de publicación desde un inventario que debe devolver la conexión del juego. El vendedor puede elegir monedas aceptadas para ofertas; el formulario web permite combinar componentes del precio.
- Secciones de Mis publicaciones, Ofertas, Saldo web e Historial, preparadas para presentar datos de la API cuando el puente esté conectado.
- Datos de muestra claramente identificados mientras el estado del mercado sea desconectado.

## Categorías e identificación de objetos

Los grupos son solo presentación: al pulsar un botón, el cliente filtra por la categoría normalizada en `getListingCategory()` dentro de `src/pages/MarketPage.jsx`. La función reconoce categorías y también revisa el nombre, tipo, subcategoría y tipo de arma devueltos por el servidor. Por ejemplo, una publicación llamada “Dark Phoenix Shield” se muestra en Shields & Books aunque su categoría general sea `armor`.

Para que los filtros funcionen sin depender de heurísticas por nombre, el futuro adaptador debería devolver una categoría de ranura (`helm`, `armor`, `pants`, `gloves`, `boots`) o una subcategoría de arma (`bladeSword`, `bowCrossbow`, `staffStick`, `scepter`, `shieldBook`). Los iconos y títulos tienen texto accesible y el nombre completo también aparece al pasar el cursor.

## Iconos y recursos

Los archivos originales de `G:\Server Breda\Mu Breda Season 6 - OpenMu\imagenes\Iconos Web` se conservaron. Las copias preparadas para la página están en `public/assets/market-icons/`. En las copias SVG se retiró el fondo cuadrado, se cambió el dibujo blanco a dorado y se eliminaron estilos de tamaño fijos. El PNG del cetro se convirtió a dorado con transparencia basada en la luminosidad, para quitar el fondo negro.

| Grupo/categoría | Recurso del cliente web | Icono tomado de |
| --- | --- | --- |
| Helms | `helms.svg` | `visored-helm.svg` |
| Body Armor | `armor.svg` | `lamellar.svg` |
| Pants | `pants.svg` | `armored-pants.svg` |
| Gloves | `gloves.svg` | `gloves.svg` |
| Boots | `boots.svg` | `leg-armor.svg` |
| Blades & Swords | `blades-swords.svg` | `sword.svg` |
| Bows & Crossbows | `bows-crossbows.svg` | `bow.svg` |
| Staves & Sticks | `staves-sticks.svg` | `wizard-staff.svg` |
| Scepters | `scepters.png` | `bird-scepter.png` |
| Shields & Books | `shields-books.svg` | `shield.svg` |
| Accessories | `accessories.svg` | `acesories.svg` (nombre original corregido en la copia) |
| Wings | `wings.svg` | `wings.svg` |
| Jewels | `jewels.svg` | `jewels.svg` |
| Pets | `pets.png` | recurso preparado en el trabajo anterior |

Los retratos de personajes están en `public/assets/characters/`. La definición de filtros, normalización de categorías, traducciones y flujos de pantalla está en `src/pages/MarketPage.jsx`; los estilos responsive y la presentación agrupada están en `src/pages/MarketPage.scss`; los textos visibles están en `src/i18n/translations/es.js`, `en.js` y `pt.js`.

## Cómo se conecta la web con el servidor

El navegador **no debe conectarse directamente a las tablas del GameServer**. La secuencia prevista es:

1. La página llama a la API del CMS mediante las funciones de `src/services/api.js`.
2. Las rutas `/api/market/*` están montadas por `server/routes/index.js` y se procesan en `server/routes/market.js`.
3. `server/controllers/marketController.js` obtiene la identidad de la sesión verificada y delega en `server/services/marketService.js`.
4. `marketService` revisa `ENABLE_PLAYER_MARKET` y el estado del adaptador `server/adapters/market/index.js`.
5. Cuando exista un puente real, el adaptador debe consultar o pedir al GameServer las operaciones. El GameServer debe validar propiedad y estado de los objetos, bloquearlos y confirmar cada transferencia antes de que la API devuelva éxito.

Las lecturas públicas de estado y publicaciones no requieren inicio de sesión. Inventario, datos propios, ofertas, saldo e historial sí requieren autenticación. Las operaciones que cambian datos requieren autenticación y un `Idempotency-Key`; la identidad del comprador o vendedor se toma de la sesión, no de un nombre enviado por el navegador.

### Rutas de la API preparadas

| Método y ruta | Uso |
| --- | --- |
| `GET /api/market/status` | Informa si el mercado está habilitado, conectado y qué capacidades soporta. |
| `GET /api/market/listings` | Devuelve publicaciones con búsqueda, categoría, clase, moneda, orden y paginación. |
| `GET /api/market/inventory` | Inventario elegible de la cuenta autenticada. |
| `GET /api/market/me` | Publicaciones y resumen de la cuenta. |
| `GET /api/market/offers` | Ofertas enviadas y recibidas. |
| `GET /api/market/wallet` | Saldos y fondos pendientes del mercado. |
| `GET /api/market/history` | Compras, ventas, ofertas y retiros. |
| `POST /api/market/listings` | Publica un objeto usando su identificador opaco de inventario. |
| `DELETE /api/market/listings/:listingId` | Retira una publicación propia. |
| `POST /api/market/listings/:listingId/buy` | Solicita comprar una publicación. |
| `POST /api/market/listings/:listingId/offers` | Envía una oferta. |
| `POST /api/market/offers/:offerId/decision` | Acepta o rechaza una oferta recibida. |
| `POST /api/market/wallet/withdraw` | Solicita entregar saldo a un personaje. |

En desarrollo, la API usa `VITE_API_URL` si está configurado; si no, apunta a `http://localhost:3001`. En producción, una URL vacía usa `/api` en el mismo dominio. Las solicitudes incluyen credenciales y, para endpoints privados, el token CMS cuando está disponible. Las operaciones de cambio generan una clave de idempotencia para evitar repetir una compra o publicación por reintentos.

## Estado actual de la conexión

La conexión está **preparada como interfaz API, pero no implementada hacia el GameServer**:

- `ENABLE_PLAYER_MARKET` está en `false` por defecto.
- El adaptador de mercado siempre informa `connected: false` y las capacidades como no disponibles.
- Con ese estado, la web muestra datos de ejemplo. Los botones de compra, publicación y oferta no informan éxitos simulados ni alteran inventarios.
- La aplicación no lee ni modifica tablas de inventario, baúl o monedas del juego para el mercado.
- No hay todavía reserva transaccional de objetos, entrega al comprador, billetera real, liquidación de ofertas o retiro hacia un personaje.
- La configuración del CMS y las rutas no sustituyen un proceso seguro en el GameServer.

## Pago mixto: límite actual importante

La interfaz permite preparar un precio u oferta con varios componentes, por ejemplo `1 Bless + 10 WC + 1.000.000 Zen`. El frontend envía una lista `priceComponents` y solo debería habilitar ese envío real si el estado del puente anuncia `capabilities.mixedCurrency`.

Sin embargo, los validadores actuales de `server/validators/market.js` todavía aceptan un solo par `price`/`currency` para publicar, un solo `amount`/`currency` para ofertas y retiros, y los enums `zen`, `wcoinc`, `jewels`. Las propiedades `priceComponents`, `acceptOffers` y `offerCurrencies` aún no forman parte completa de esos esquemas. Antes de activar el puente, hay que ampliar validación y contrato en conjunto; no alcanza con activar la variable de entorno.

## Requisitos para activar operaciones reales

1. Implementar el puente en `server/adapters/market/` para hablar con un servicio seguro del GameServer.
2. Definir cómo se reservan los objetos del baúl y cómo se recuperan si la publicación se cancela o vence.
3. Extender los esquemas y respuestas de la API para precios mixtos, ofertas mixtas y monedas de oferta permitidas.
4. Implementar una liquidación atómica: transferir el objeto, cobrar todos los componentes y registrar el saldo del vendedor como una única operación.
5. Guardar movimientos e idempotencia de forma persistente, resolver fallos/reintentos y registrar historial auditable.
6. Implementar retiros con confirmación del GameServer y reconciliación si un servicio se cae a mitad de una operación.
7. Probar en un servidor aislado con dos cuentas y datos de prueba; recién después habilitar `ENABLE_PLAYER_MARKET=true` y anunciarlo como conectado.

La guía técnica de rutas y contrato inicial está también en [`market-integration.md`](market-integration.md). Esta guía amplía esa referencia con la organización visual, los recursos y las limitaciones del pago mixto.
