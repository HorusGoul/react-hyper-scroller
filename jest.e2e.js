module.exports = {
  preset: "jest-puppeteer",

  testMatch: ["**/e2e/*.test.tsx"],
  transform: {
    "^.+\\.tsx$": "ts-jest",
  },
};
