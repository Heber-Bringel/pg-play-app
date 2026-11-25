import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useColorScheme } from 'react-native';
import type { ThemePreference } from '@/model/entities/themePreference';

export type { ThemePreference };
export type ThemeMode = 'light' | 'dark';

const primitive = {
  color: {
    purple50: '#F5F3FF',
    purple100: '#EDE9FE',
    purple200: '#DDD6FE',
    purple300: '#D8B4FE',
    purple600: '#5B21B6',
    purple700: '#4C1D95',
    purple800: '#3B0764',
    purple950: '#2E1065',
    coral100: '#FFEDD5',
    coral300: '#FDBA74',
    coral700: '#C2410C',
    coral800: '#9A3412',
    coral950: '#431407',
    gold100: '#FEF9C3',
    gold400: '#FACC15',
    gold700: '#A16207',
    gold950: '#422006',
    green100: '#DCFCE7',
    green300: '#86EFAC',
    green700: '#15803D',
    green950: '#052E16',
    red100: '#FEE2E2',
    red300: '#FCA5A5',
    red700: '#B91C1C',
    red950: '#450A0A',
    neutral0: '#FFFFFF',
    neutral50: '#FDF8FF',
    neutral100: '#F3EDF7',
    neutral200: '#E6E0E9',
    neutral300: '#CAC4D0',
    neutral400: '#938F99',
    neutral500: '#79747E',
    neutral600: '#49454F',
    neutral800: '#2B2930',
    neutral900: '#1D1B20',
    neutral950: '#141218',
    scrim: 'rgba(20, 18, 24, 0.55)',
    transparent: 'transparent',
  },
  space: {
    space4: 4,
    space8: 8,
    space12: 12,
    space16: 16,
    space24: 24,
    space32: 32,
    space48: 48,
    space56: 56,
    space64: 64,
  },
} as const;

export function createTokens(mode: ThemeMode = 'light') {
  const isDark = mode === 'dark';

  const semanticColor = {
    action: isDark ? primitive.color.purple300 : primitive.color.purple600,
    actionHover: isDark ? primitive.color.purple200 : primitive.color.purple700,
    actionPressed: isDark ? primitive.color.purple100 : primitive.color.purple800,
    onAction: isDark ? primitive.color.purple950 : primitive.color.neutral0,
    actionContainer: isDark ? primitive.color.purple800 : primitive.color.purple100,
    onActionContainer: isDark ? primitive.color.purple100 : primitive.color.purple950,
    secondary: isDark ? primitive.color.coral300 : primitive.color.coral700,
    onSecondary: isDark ? primitive.color.coral950 : primitive.color.neutral0,
    secondaryContainer: isDark ? primitive.color.coral800 : primitive.color.coral100,
    onSecondaryContainer: isDark ? primitive.color.coral100 : primitive.color.coral950,
    highlight: primitive.color.gold400,
    onHighlight: primitive.color.neutral900,
    highlightContainer: isDark ? primitive.color.gold950 : primitive.color.gold100,
    onHighlightContainer: isDark ? primitive.color.gold100 : primitive.color.neutral900,
    highlightBorder: isDark ? primitive.color.gold400 : primitive.color.gold700,
    surface: isDark ? primitive.color.neutral950 : primitive.color.neutral50,
    surfaceContainer: isDark ? primitive.color.neutral900 : primitive.color.neutral0,
    surfaceVariant: isDark ? primitive.color.neutral800 : primitive.color.neutral100,
    onSurface: isDark ? primitive.color.neutral200 : primitive.color.neutral900,
    onSurfaceMuted: isDark ? primitive.color.neutral300 : primitive.color.neutral600,
    outline: isDark ? primitive.color.neutral400 : primitive.color.neutral500,
    success: isDark ? primitive.color.green300 : primitive.color.green700,
    onSuccess: isDark ? primitive.color.green950 : primitive.color.neutral0,
    successContainer: isDark ? primitive.color.green950 : primitive.color.green100,
    onSuccessContainer: isDark ? primitive.color.green100 : primitive.color.green950,
    error: isDark ? primitive.color.red300 : primitive.color.red700,
    onError: isDark ? primitive.color.red950 : primitive.color.neutral0,
    errorContainer: isDark ? primitive.color.red950 : primitive.color.red100,
    onErrorContainer: isDark ? primitive.color.red300 : primitive.color.red950,
    focus: isDark ? primitive.color.neutral200 : primitive.color.neutral900,
    focusOffset: isDark ? primitive.color.neutral950 : primitive.color.neutral50,
    disabledBg: isDark ? primitive.color.neutral800 : primitive.color.neutral200,
    disabledText: isDark ? primitive.color.neutral400 : primitive.color.neutral600,
    scrim: primitive.color.scrim,
    transparent: primitive.color.transparent,
    canvasPaper: primitive.color.neutral50,
    canvasInk: primitive.color.neutral900,
    canvasPurple: primitive.color.purple600,
    canvasCoral: primitive.color.coral700,
    canvasGreen: primitive.color.green700,
  };

  const semanticSpace = {
    xs: primitive.space.space4,
    sm: primitive.space.space8,
    md: primitive.space.space16,
    lg: primitive.space.space24,
    xl: primitive.space.space32,
    '2xl': primitive.space.space48,
    container: primitive.space.space56,
    '3xl': primitive.space.space64,
  };

  const semanticRadius = {
    sm: 8,
    md: 16,
    lg: 20,
    xl: 28,
    full: 9999,
  };

  const semanticFont = {
    display: {
      family: 'PlusJakartaSans_800ExtraBold',
      size: 30,
      weight: '800' as const,
      lineHeight: 36,
    },
    title: {
      family: 'PlusJakartaSans_800ExtraBold',
      size: 24,
      weight: '800' as const,
      lineHeight: 32,
    },
    subtitle: {
      family: 'PlusJakartaSans_700Bold',
      size: 18,
      weight: '700' as const,
      lineHeight: 24,
    },
    body: {
      family: 'PlusJakartaSans_400Regular',
      size: 16,
      weight: '400' as const,
      lineHeight: 24,
    },
    label: {
      family: 'PlusJakartaSans_700Bold',
      size: 16,
      weight: '700' as const,
      lineHeight: 20,
    },
    tag: {
      family: 'PlusJakartaSans_700Bold',
      size: 14,
      weight: '700' as const,
      lineHeight: 18,
    },
    caption: {
      family: 'PlusJakartaSans_700Bold',
      size: 12,
      weight: '700' as const,
      lineHeight: 16,
    },
  };

  const semantic = {
    color: semanticColor,
    space: semanticSpace,
    radius: semanticRadius,
    font: semanticFont,
    border: {
      thin: 2,
      focus: 3,
    },
    icon: {
      sm: 16,
      md: 24,
      lg: 28,
    },
    typography: {
      maxScale: 1.5,
    },
    elevation: {
      none: 0,
      card: 4,
      floating: 12,
    },
    motion: {
      duration: {
        short: 150,
        medium: 300,
        long: 600,
      },
      spring: {
        spatial: { damping: 14, stiffness: 280 },
        effects: { damping: 22, stiffness: 300 },
      },
    },
  };

  const component = {
    button: {
      bg: semantic.color.action,
      label: semantic.color.onAction,
      bgHover: semantic.color.actionHover,
      bgPressed: semantic.color.actionPressed,
      bgDisabled: semantic.color.disabledBg,
      labelDisabled: semantic.color.disabledText,
      border: {
        outlined: semantic.color.outline,
        focus: semantic.color.focus,
      },
      radius: semantic.radius.full,
      radiusPressed: semantic.radius.md,
      minHeight: semantic.space['2xl'],
      iconSize: semantic.space['2xl'],
      jumbo: {
        height: semantic.space['3xl'],
      },
    },
    input: {
      bg: semantic.color.surfaceContainer,
      text: semantic.color.onSurface,
      border: semantic.color.outline,
      borderFocus: semantic.color.action,
      borderError: semantic.color.error,
      bgError: semantic.color.errorContainer,
      radius: semantic.radius.md,
      minHeight: semantic.space.container,
    },
    card: {
      bg: semantic.color.surfaceContainer,
      border: semantic.color.outline,
      borderLeader: semantic.color.highlightBorder,
      borderPressed: semantic.color.action,
      borderFocus: semantic.color.focus,
      radius: semantic.radius.xl,
      padding: semantic.space.lg,
      badgeSize: semantic.space.container,
    },
    chip: {
      bg: {
        default: semantic.color.surfaceContainer,
        pressed: semantic.color.surfaceVariant,
        selected: semantic.color.actionContainer,
        disabled: semantic.color.disabledBg,
      },
      border: {
        default: semantic.color.outline,
        selected: semantic.color.action,
        focus: semantic.color.focus,
        disabled: semantic.color.outline,
        error: semantic.color.error,
        success: semantic.color.success,
        secondary: semantic.color.secondary,
      },
      radius: semantic.radius.full,
      radiusPressed: semantic.radius.md,
      minHeight: semantic.space['2xl'],
      minWidth: semantic.space['3xl'],
    },
    option: {
      bg: {
        default: semantic.color.surfaceContainer,
        selected: semantic.color.actionContainer,
        disabled: semantic.color.disabledBg,
        error: semantic.color.errorContainer,
      },
      border: {
        default: semantic.color.outline,
        selected: semantic.color.action,
        focus: semantic.color.focus,
        disabled: semantic.color.outline,
        error: semantic.color.error,
        success: semantic.color.success,
      },
      radius: semantic.radius.lg,
      radiusPressed: semantic.radius.md,
      minHeight: semantic.space.container,
    },
    tag: {
      neutral: {
        bg: semantic.color.surfaceVariant,
        border: semantic.color.outline,
        text: semantic.color.onSurface,
      },
      action: {
        bg: semantic.color.actionContainer,
        border: semantic.color.action,
        text: semantic.color.onActionContainer,
      },
      secondary: {
        bg: semantic.color.secondaryContainer,
        border: semantic.color.secondary,
        text: semantic.color.onSecondaryContainer,
      },
      success: {
        bg: semantic.color.successContainer,
        border: semantic.color.success,
        text: semantic.color.onSuccessContainer,
      },
      error: {
        bg: semantic.color.errorContainer,
        border: semantic.color.error,
        text: semantic.color.onErrorContainer,
      },
      highlight: {
        bg: semantic.color.highlightContainer,
        border: semantic.color.highlightBorder,
        text: semantic.color.onHighlightContainer,
      },
      radius: semantic.radius.full,
    },
    banner: {
      info: {
        bg: semantic.color.actionContainer,
        border: semantic.color.action,
        text: semantic.color.onActionContainer,
      },
      success: {
        bg: semantic.color.successContainer,
        border: semantic.color.success,
        text: semantic.color.onSuccessContainer,
      },
      warning: {
        bg: semantic.color.secondaryContainer,
        border: semantic.color.secondary,
        text: semantic.color.onSecondaryContainer,
      },
      error: {
        bg: semantic.color.errorContainer,
        border: semantic.color.error,
        text: semantic.color.onErrorContainer,
      },
      radius: semantic.radius.lg,
    },
    timer: {
      bg: {
        normal: semantic.color.highlight,
        critical: semantic.color.error,
        calm: semantic.color.action,
      },
      text: {
        normal: semantic.color.onHighlight,
        critical: semantic.color.onError,
      },
      radius: {
        normal: semantic.radius.full,
        critical: semantic.radius.md,
      },
    },
    quiz: {
      option: {
        bg: semantic.color.surfaceContainer,
        border: semantic.color.outline,
        radius: semantic.radius.lg,
        correct: {
          bg: semantic.color.success,
        },
        wrong: {
          bg: semantic.color.error,
        },
        minHeight: semantic.space.container,
      },
    },
    key: {
      size: semantic.space['2xl'],
      radius: semantic.radius.md,
      hit: {
        bg: semantic.color.success,
      },
      miss: {
        bg: semantic.color.errorContainer,
      },
    },
    canvas: {
      paperBg: semantic.color.canvasPaper,
      border: semantic.color.outline,
      radius: semantic.radius.lg,
      minHeight: semantic.space['3xl'] * 5,
      expandedMinHeight: semantic.space['3xl'] * 6,
      pen: {
        ink: semantic.color.canvasInk,
        purple: semantic.color.canvasPurple,
        coral: semantic.color.canvasCoral,
        green: semantic.color.canvasGreen,
        onPen: semantic.color.canvasPaper,
      },
      stroke: {
        thin: semantic.space.xs,
        thick: semantic.space.sm,
      },
      tool: {
        size: semantic.space['2xl'],
        radius: semantic.radius.full,
        radiusSelected: semantic.radius.md,
        border: {
          default: semantic.color.outline,
          selected: semantic.color.action,
          focus: semantic.color.focus,
        },
      },
    },
  };

  return {
    mode,
    semantic,
    component,
  };
}

export type AppTokens = ReturnType<typeof createTokens>;

export const tokens = createTokens('light');
export const darkTokens = createTokens('dark');

type ThemeOverrideSetter = (mode: ThemeMode | null) => void;

type ThemePreferenceContextValue = {
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
};

const ThemeModeContext = createContext<ThemeMode | null>(null);
const ThemeOverrideSetterContext = createContext<ThemeOverrideSetter | null>(
  null
);
const ThemePreferenceContext = createContext<ThemePreferenceContextValue | null>(
  null
);

export type ThemeProviderProps = {
  mode?: ThemeMode;
  preference?: ThemePreference;
  onChangePreference?: (preference: ThemePreference) => void;
  children: React.ReactNode;
};

export const ThemeProvider = ({
  mode,
  preference,
  onChangePreference,
  children,
}: ThemeProviderProps) => {
  const systemScheme = useColorScheme();
  const parentMode = useContext(ThemeModeContext);
  const parentOverrideSetter = useContext(ThemeOverrideSetterContext);
  const [overrideMode, setOverrideMode] = useState<ThemeMode | null>(null);
  const [internalPreference, setInternalPreference] =
    useState<ThemePreference>(preference ?? 'auto');

  const activePreference: ThemePreference = preference ?? internalPreference;

  const handleSetPreference = useCallback(
    (next: ThemePreference) => {
      setInternalPreference(next);
      onChangePreference?.(next);
    },
    [onChangePreference]
  );

  const preferenceContextValue = useMemo<ThemePreferenceContextValue>(
    () => ({
      preference: activePreference,
      setPreference: handleSetPreference,
    }),
    [activePreference, handleSetPreference]
  );

  const isRootAutoProvider = parentMode === null && mode === undefined;
  const preferenceMode: ThemeMode | null =
    isRootAutoProvider && activePreference !== 'auto'
      ? activePreference
      : null;

  const resolvedMode: ThemeMode =
    mode ??
    parentMode ??
    (isRootAutoProvider ? overrideMode : null) ??
    preferenceMode ??
    (systemScheme === 'dark' ? 'dark' : 'light');

  const modeElement = React.createElement(
    ThemeModeContext.Provider,
    { value: resolvedMode },
    children
  );

  if (isRootAutoProvider && parentOverrideSetter === null) {
    return React.createElement(
      ThemePreferenceContext.Provider,
      { value: preferenceContextValue },
      React.createElement(
        ThemeOverrideSetterContext.Provider,
        { value: setOverrideMode },
        modeElement
      )
    );
  }

  return modeElement;
};

export function useTheme(overrideMode?: ThemeMode): AppTokens {
  const systemScheme = useColorScheme();
  const contextMode = useContext(ThemeModeContext);
  const resolvedMode: ThemeMode =
    overrideMode ?? contextMode ?? (systemScheme === 'dark' ? 'dark' : 'light');

  return useMemo(
    () => (resolvedMode === 'dark' ? darkTokens : tokens),
    [resolvedMode]
  );
}

export function useThemePreference(): ThemePreferenceContextValue {
  const context = useContext(ThemePreferenceContext);
  return useMemo(
    () =>
      context ?? {
        preference: 'auto',
        setPreference: () => {},
      },
    [context]
  );
}

export function useThemeOverride(mode: ThemeMode | null): void {
  const setOverrideMode = useContext(ThemeOverrideSetterContext);

  useEffect(() => {
    if (!setOverrideMode) return;
    setOverrideMode(mode);
  }, [mode, setOverrideMode]);

  useEffect(() => {
    if (!setOverrideMode) return;
    return () => {
      setOverrideMode(null);
    };
  }, [setOverrideMode]);
}

export const {
  color,
  space,
  radius,
  font,
  border,
  icon,
  typography,
  elevation,
  motion,
} = tokens.semantic;

export const {
  button,
  input,
  card,
  chip,
  option,
  tag,
  banner,
  timer,
  quiz,
  key,
  canvas,
} = tokens.component;
