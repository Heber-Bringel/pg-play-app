export const speak = jest.fn();
export const stop = jest.fn(async () => {});
export const getAvailableVoicesAsync = jest.fn(async () => []);
export const isSpeakingAsync = jest.fn(async () => false);
