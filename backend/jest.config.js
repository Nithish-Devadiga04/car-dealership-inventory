/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: ['src/**/*.ts', '!src/server.ts', '!src/scripts/**'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'text-summary', 'html'],
  // Each integration test file creates its own SQLite file, so files can run in parallel.
  testTimeout: 15000,
};
