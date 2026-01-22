module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^uuid$': '<rootDir>/src/__mocks__/uuid.ts',
  },
  transformIgnorePatterns: ['node_modules/(?!(@langchain|@google/generative-ai)/)'],
  testPathIgnorePatterns: ['<rootDir>/src/scripts/'],
};
