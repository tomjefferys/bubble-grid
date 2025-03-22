/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'tsx', 'js'],
  testMatch: ['**/__tests__/**/*.test.(ts|tsx)'], // Match test files
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
};