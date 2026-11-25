/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  setupFiles: ['<rootDir>/tests/setup.ts'],
  transform: {
    // O tsconfig do Expo usa "module: preserve" (Metro); no Jest compilamos para CommonJS.
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          jsx: 'react-jsx',
          module: 'commonjs',
          moduleResolution: 'bundler',
          rootDir: '.',
          customConditions: null,
          esModuleInterop: true,
          isolatedModules: true,
        },
      },
    ],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^react-native$': '<rootDir>/tests/__mocks__/react-native.tsx',
    '^react-native-safe-area-context$': '<rootDir>/tests/__mocks__/react-native-safe-area-context.tsx',
    '^@expo/vector-icons$': '<rootDir>/tests/__mocks__/expo-vector-icons.tsx',
    '^expo-router$': '<rootDir>/tests/__mocks__/expo-router.ts',
    '^expo-speech$': '<rootDir>/tests/__mocks__/expo-speech.ts',
    '^expo-sensors$': '<rootDir>/tests/__mocks__/expo-sensors.ts',
    '^expo-screen-orientation$': '<rootDir>/tests/__mocks__/expo-screen-orientation.ts',
    '^expo-haptics$': '<rootDir>/tests/__mocks__/expo-haptics.ts',
    '^expo-audio$': '<rootDir>/tests/__mocks__/expo-audio.ts',
    '\\.(wav|mp3|ogg)$': '<rootDir>/tests/__mocks__/soundAssetMock.js',
  },
  collectCoverageFrom: [
    'src/view/theme.ts',
    'src/view/components/**/*.tsx',
    'src/usecase/**/*.ts',
    'src/viewmodel/**/*.ts',
    'src/infra/**/*.ts',
    'src/model/**/*.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
};
