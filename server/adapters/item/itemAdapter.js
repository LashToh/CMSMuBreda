/**
 * Item Adapter — Season 21 item serialization boundary.
 *
 * MU Online item binary/hex formats differ by server version (IGCN, MuDevs, etc.).
 * DO NOT invent encoding. Delivery must stay disabled until:
 *  1. Season 21 Item*.txt / Item.bmd format is documented
 *  2. Warehouse / CashShop / Gift table targets are confirmed
 *  3. A verified encode/decode implementation exists for this server
 *
 * Feature flag: ENABLE_WEBSHOP_DELIVERY (default false)
 */

export class ItemAdapter {
  constructor({ verified = false } = {}) {
    this.verified = verified;
  }

  isDeliveryEnabled() {
    return this.verified === true;
  }

  /**
   * @returns {{ ok: false, reason: string } | { ok: true, payload: Buffer|string }}
   */
  encodeItem(_definition) {
    return {
      ok: false,
      reason:
        'Season 21 item serialization is not verified. Map Item Adapter before enabling delivery.',
    };
  }

  async deliverToAccount(_username, _encodedItem, _quantity = 1) {
    return {
      ok: false,
      reason: 'Item delivery disabled. Confirm warehouse/cashshop target tables first.',
    };
  }
}

export const itemAdapter = new ItemAdapter({ verified: false });
