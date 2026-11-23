export const Accelerometer = {
  isAvailableAsync: jest.fn(async () => true),
  setUpdateInterval: jest.fn(),
  addListener: jest.fn(() => ({ remove: jest.fn() })),
};
