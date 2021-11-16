module.exports = {
  preset: 'jest-puppeteer',

  testMatch: ['**/e2e/*.test.tsx'],
  transform: {
    '^.+\\.tsx$': 'ts-jest',
    '^.+\\.ts$': 'ts-jest',
  },

  collectCoverage: true,
  collectCoverageFrom: ['lib/**/*.ts', 'lib/**/*.tsx'],
  coverageReporters: ['json', 'text', 'lcov'],

  setupFilesAfterEnv: ['jest-puppeteer-istanbul/lib/setup'],
  reporters: ['default', 'jest-puppeteer-istanbul/lib/reporter'],
};
