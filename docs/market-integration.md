# Player market web integration

The CMS now has a web-side API boundary for the player market. It intentionally ships with a
disconnected adapter. No CMS route writes to a game inventory, item-storage row, or currency table.
The public market page uses clearly labeled preview listings until a GameServer bridge is available.

## Enablement

`ENABLE_PLAYER_MARKET` defaults to `false`. Turning it on does not enable trades by itself: the
adapter must also report `connected: true`. Until then, authenticated write endpoints return
`MARKET_DISABLED` or `MARKET_BRIDGE_UNAVAILABLE`; they never return a simulated success.

## CMS API contract

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/api/market/status` | Connection state and supported capabilities |
| GET | `/api/market/listings` | Public listing search, category, class, currency, sort, and pagination |
| GET | `/api/market/inventory` | Seller's eligible game items; authenticated |
| GET | `/api/market/me` | Seller's listings and account market summary; authenticated |
| GET | `/api/market/offers` | Offers received and sent; authenticated |
| GET | `/api/market/wallet` | Available and pending proceeds; authenticated |
| GET | `/api/market/history` | Purchases, sales, offers, and withdrawals; authenticated |
| POST | `/api/market/listings` | Publish an item selected from the returned game inventory |
| DELETE | `/api/market/listings/:listingId` | Cancel an active listing |
| POST | `/api/market/listings/:listingId/buy` | Buy a listing |
| POST | `/api/market/listings/:listingId/offers` | Make an offer |
| POST | `/api/market/offers/:offerId/decision` | Accept or decline an offer |
| POST | `/api/market/wallet/withdraw` | Request proceeds delivery to a selected character |

Every mutating request is authenticated and sends an 8–128 character `Idempotency-Key`. Seller/buyer identity comes
from the verified CMS session, never from a body field. A listing request contains only the opaque
`gameItemId` from the inventory response, character, price, and currency. The browser cannot submit
item bytes or forge the item description as authoritative data.

### Response shapes expected from the future adapter

`GET /status` returns `{ enabled, connected, previewOnly, capabilities, stats }` (`stats` is optional and may contain `listings`, `online`, and `sold`). The CMS reports the
market as connected only when both the feature flag is enabled and the adapter confirms the bridge.
`GET /listings` returns `{ items, total, connected }`. Each public item contains `id`, `name`, `createdAt` (ISO 8601),
`category`, `className`, `level`, `options`, `price`, `currency` (`Zen`, `WCoinC`, or `Jewel`),
`seller`, `age`, and optional `qualities`.

`GET /inventory` returns `{ items: [{ gameItemId, name, character }] }`; only server-eligible items
belonging to the authenticated account may appear. `GET /me` returns `{ listings, summary }`;
`/offers` and `/history` return `{ items }`; `/wallet` returns `{ balances: { zen, wcoinc, jewels } }`.
The UI submits only the opaque item/listing/offer IDs from those server responses.

Mutations should return only after the game side confirms the operation. Failures use the normal
CMS error envelope (`success: false`, `code`, `message`); the web UI can therefore show server
rejections without guessing whether an item or balance moved.

## Required GameServer behavior before enabling

The future adapter must verify account ownership and online/lock state, reserve or remove the exact
item in a transaction, and return a stable listing ID. Purchase and accepted-offer settlement must
atomically transfer the item and update the web wallet ledger. Withdrawals need an idempotent server
acknowledgement. Expired/cancelled listings and rejected offers must release reserved items and
funds. The adapter should return a success only after the GameServer confirms the operation.

The UI calls the CMS API for status, listing data, and authenticated actions. Preview rows are local
illustrations and are never sent as listing IDs or offered to the server.
