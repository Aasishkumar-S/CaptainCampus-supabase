module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.ts'],
  moduleNameMapper: {
    '^@captain-campus/shared_types$': '<rootDir>/../../packages/shared_types/src/index.ts'
  },
  setupFiles: ['<rootDir>/src/tests/setup.ts'],
  coverageDirectory: 'coverage',
  collectCoverageFrom: ['src/**/*.ts', '!src/tests/**']
};
