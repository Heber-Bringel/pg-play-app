// Declarações globais de ambiente TypeScript

declare module 'react-native' {
  type StyleProp<T> = T | Array<T | undefined | null | false> | undefined | null | false;

  type ViewStyle = {
    [key: string]: unknown;
  };

  type TextStyle = {
    [key: string]: unknown;
  };

  type ViewProps = {
    style?: StyleProp<ViewStyle>;
    children?: React.ReactNode;
    accessible?: boolean;
    accessibilityRole?: string;
    accessibilityLabel?: string;
    accessibilityLiveRegion?: 'none' | 'polite' | 'assertive';
    accessibilityState?: {
      disabled?: boolean;
      selected?: boolean;
      [key: string]: unknown;
    };
  };

  type TextProps = {
    style?: StyleProp<TextStyle>;
    children?: React.ReactNode;
    allowFontScaling?: boolean;
    maxFontSizeMultiplier?: number;
    accessibilityLabel?: string;
  };

  type TextInputProps = {
    value?: string;
    onChangeText?: (text: string) => void;
    placeholder?: string;
    placeholderTextColor?: string;
    maxLength?: number;
    editable?: boolean;
    onFocus?: () => void;
    onBlur?: () => void;
    style?: StyleProp<TextStyle>;
    accessibilityLabel?: string;
    accessibilityHint?: string;
    accessibilityState?: {
      disabled?: boolean;
      [key: string]: unknown;
    };
  };

  type PressableProps = {
    onPress?: (event?: unknown) => void;
    onPressIn?: () => void;
    onPressOut?: () => void;
    onFocus?: () => void;
    onBlur?: () => void;
    disabled?: boolean;
    style?: StyleProp<ViewStyle> | ((state: { pressed: boolean }) => StyleProp<ViewStyle>);
    children?: React.ReactNode;
    accessible?: boolean;
    accessibilityRole?: string;
    accessibilityLabel?: string;
    accessibilityState?: {
      disabled?: boolean;
      selected?: boolean;
      [key: string]: unknown;
    };
  };

  export const View: React.ComponentType<ViewProps>;
  export const Text: React.ComponentType<TextProps>;
  export const TextInput: React.ComponentType<TextInputProps>;
  export const Pressable: React.ComponentType<PressableProps>;

  export const StyleSheet: {
    create: <T extends Record<string, unknown>>(styles: T) => T;
    flatten: <T extends Record<string, unknown>>(style: StyleProp<T>) => T;
  };
}

declare module '@expo/vector-icons' {
  type IconProps = {
    name: string;
    size?: number;
    color?: string;
  };

  export const MaterialCommunityIcons: React.ComponentType<IconProps> & {
    glyphMap: Record<string, number>;
  };
}

declare module 'expo-router' {
  export type Router = {
    push: (href: string) => void;
    replace: (href: string) => void;
    back: () => void;
    dismissTo: (href: string) => void;
  };

  export function useRouter(): Router;
  export const router: Router;
  export function useLocalSearchParams<T extends Record<string, string | string[]> = Record<string, string>>(): T;
}
