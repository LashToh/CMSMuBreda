import net from 'node:net';

/**
 * Probe MU GameServer TCP port to determine online/offline status.
 * Resolves true if a TCP connection succeeds within the timeout.
 */
export function probeGameServer(host, port, timeoutMs = 1500) {
  const h = String(host || '').trim();
  const p = Number(port);
  if (!h || !Number.isFinite(p) || p <= 0) {
    return Promise.resolve(null);
  }

  const ms = Math.max(200, Math.min(10000, Number(timeoutMs) || 1500));

  return new Promise((resolve) => {
    const socket = new net.Socket();
    let settled = false;

    const finish = (value) => {
      if (settled) return;
      settled = true;
      try {
        socket.destroy();
      } catch {
        /* ignore */
      }
      resolve(value);
    };

    socket.setTimeout(ms);
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false));
    socket.once('error', () => finish(false));

    try {
      socket.connect(p, h);
    } catch {
      finish(false);
    }
  });
}
