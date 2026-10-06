const { PHASE_DEVELOPMENT_SERVER } = require('next/constants');

/** @type {import('next').NextConfig} */
module.exports = (phase) => {
  const isDev = phase === PHASE_DEVELOPMENT_SERVER;

  return {
    // Memisahkan direktori build dev dan production agar 'next build' tidak merusak cache CSS pada 'next dev'
    distDir: isDev ? '.next-dev' : '.next',
    reactStrictMode: true,
  };
};
