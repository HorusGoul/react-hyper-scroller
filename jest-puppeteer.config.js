module.exports = {
  launch: {
    headless: true,
  },

  browserContext: 'default',

  server: {
    command: 'VITE_COVERAGE=true npx vite --config ./config/vite-dev.config.ts',
    port: 3000,
    launchTimeout: 10000,
    debug: true,
  },
};
