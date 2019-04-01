module.exports = {
  launch:
    process.env.NODE_ENV === "debug"
      ? {
          headless: false,
          slowMo: 250,
          devtools: true,
        }
      : {},
  browserContext: "default",
};
