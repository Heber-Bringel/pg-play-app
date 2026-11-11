export const mockPush = jest.fn();
export const mockReplace = jest.fn();
export const mockBack = jest.fn();
export const mockDismissTo = jest.fn();

export const useRouter = () => ({
  push: mockPush,
  replace: mockReplace,
  back: mockBack,
  dismissTo: mockDismissTo,
});

export const router = {
  push: mockPush,
  replace: mockReplace,
  back: mockBack,
  dismissTo: mockDismissTo,
};

export const useLocalSearchParams = () => ({});
