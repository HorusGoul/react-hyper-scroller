module.exports = {
  launch: {
    headless: true,
  },

  browserContext: "default",

  server: {
    command: "npm run dev",
    port: 3000,
    launchTimeout: 10000,
    debug: true,
  },
};
