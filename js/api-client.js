(() => {
  'use strict';

  window.NaveApi = {
    async request(url, options = {}) {
      const method = (options.method || 'GET').toUpperCase();
      const headers = new Headers(options.headers || {});
      const target = new URL(url, location.href);

      if (!['GET', 'HEAD', 'OPTIONS'].includes(method) && target.origin === location.origin) {
        const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        if (!token) throw new Error('Token de segurança indisponível.');
        headers.set('X-CSRF-Token', token);
      }

      return fetch(url, {
        ...options,
        method,
        headers,
        credentials: options.credentials || 'same-origin'
      });
    }
  };
})();
