import net from 'node:net';
import { syncBuiltinESMExports } from 'node:module';

// Local regression tests must never send fixtures to a hosted backend.
const loopback = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);
const originalConnect = net.Socket.prototype.connect;
net.Socket.prototype.connect = function (...args) {
  let options = args[0];
  if (Array.isArray(options)) options = options[0];
  let host;
  if (typeof options === 'object' && options !== null) {
    if (options.path) return originalConnect.apply(this, args);
    host = options.host || 'localhost';
  } else if (typeof options === 'number') {
    host = typeof args[1] === 'string' ? args[1] : 'localhost';
  } else if (typeof options === 'string' && options.startsWith('/')) {
    return originalConnect.apply(this, args);
  }
  if (!loopback.has(host)) throw new Error('BIB_TEST_EXTERNAL_NETWORK_BLOCKED');
  return originalConnect.apply(this, args);
};
const originalFetch = globalThis.fetch;
globalThis.fetch = (input, init) => {
  const value = typeof input === 'string' || input instanceof URL ? input : input.url;
  if (!loopback.has(new URL(value).hostname)) {
    return Promise.reject(new Error('BIB_TEST_EXTERNAL_NETWORK_BLOCKED'));
  }
  return originalFetch(input, init);
};
syncBuiltinESMExports();
