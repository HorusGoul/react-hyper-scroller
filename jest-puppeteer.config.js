module.exports = {
  launch: {
    headless: true,
  },

  browserContext: 'default',

  server: {
    command: 'VITE_COVERAGE=true npx vite',
    port: 3000,
    launchTimeout: 10000,
    debug: true,
  },
};
