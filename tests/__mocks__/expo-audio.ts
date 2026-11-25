export const createMockAudioPlayer = (source?: unknown) => ({
  source,
  play: jest.fn(),
  pause: jest.fn(),
  seekTo: jest.fn(async () => {}),
  remove: jest.fn(),
});

export const createAudioPlayer = jest.fn((source?: unknown) =>
  createMockAudioPlayer(source)
);

export const preload = jest.fn(async () => {});

export const setAudioModeAsync = jest.fn(async () => {});

export const setIsAudioActiveAsync = jest.fn(async () => {});
