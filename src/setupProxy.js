

const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function setupProxy(app) {
  const target = process.env.PROXY_API_TARGET || 'http://127.0.0.1:3001';
  app.use(
    '/api',
    createProxyMiddleware({
      target,
      changeOrigin: true,
      logLevel: process.env.PROXY_DEBUG ? 'debug' : 'silent',
    })
  );
};
