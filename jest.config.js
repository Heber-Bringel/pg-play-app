/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  moduleNameMapper: {
    '^react-native$': '<rootDir>/src/__mocks__/react-native.tsx',
    '^@expo/vector-icons$': '<rootDir>/src/__mocks__/expo-vector-icons.tsx',
  },
  collectCoverageFrom: [
    'src/theme/**/*.ts',
    'src/components/**/*.tsx',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
};
