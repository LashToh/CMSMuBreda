import crypto from 'node:crypto';
import { config } from '../config/index.js';

/**
 * Configurable MU password adapter.
 * Modes mirror common JoinServer / WebEngine setups.
 * Never migrate existing passwords automatically.
 */
export function hashPassword(password, username) {
  switch (config.hashMethod) {
    case 'plain':
      return password;
    case 'md5':
      return crypto.createHash('md5').update(password, 'utf8').digest('hex');
    case 'wz_md5':
      return password;
    case 'sha256': {
      const salt = config.sha256Salt || '';
      return crypto
        .createHash('sha256')
        .update(`${password}${username}${salt}`, 'utf8')
        .digest('hex');
    }
    default:
      throw new Error(`Unsupported HASH_METHOD: ${config.hashMethod}`);
  }
}

export function getPasswordSqlExpression() {
  if (config.hashMethod === 'wz_md5') {
    return 'dbo.fn_md5(@password, @username)';
  }
  if (config.hashMethod === 'sha256') {
    return "HASHBYTES('SHA2_256', @password + @username + @sha256Salt)";
  }
  return '@passwordHash';
}

export function passwordsMatch(stored, password, username) {
  if (config.hashMethod === 'wz_md5') {
    // Compared in SQL for wz_md5
    return false;
  }
  if (config.hashMethod === 'plain') {
    return stored === password;
  }
  if (config.hashMethod === 'md5') {
    return String(stored).toLowerCase() === hashPassword(password, username).toLowerCase();
  }
  if (config.hashMethod === 'sha256') {
    const hex = hashPassword(password, username);
    const buf = Buffer.isBuffer(stored) ? stored : Buffer.from(String(stored).replace(/^0x/i, ''), 'hex');
    return buf.toString('hex').toLowerCase() === hex.toLowerCase();
  }
  return false;
}
