export type ThemeMode = 'light' | 'dark';

export const primitive = {
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
    neutral600: '#49454F',
    neutral800: '#2B2930',
    neutral900: '#1D1B20',
    neutral950: '#141218',
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
    surface: isDark ? primitive.color.neutral950 : primitive.color.neutral50,
    surfaceContainer: isDark ? primitive.color.neutral900 : primitive.color.neutral0,
    surfaceVariant: isDark ? primitive.color.neutral800 : primitive.color.neutral100,
    onSurface: isDark ? primitive.color.neutral200 : primitive.color.neutral900,
    onSurfaceMuted: isDark ? primitive.color.neutral300 : primitive.color.neutral600,
    outline: isDark ? primitive.color.neutral600 : primitive.color.neutral300,
    success: isDark ? primitive.color.green300 : primitive.color.green700,
    onSuccess: isDark ? primitive.color.green950 : primitive.color.neutral0,
    error: isDark ? primitive.color.red300 : primitive.color.red700,
    onError: isDark ? primitive.color.red950 : primitive.color.neutral0,
    errorContainer: isDark ? primitive.color.red950 : primitive.color.red100,
    onErrorContainer: isDark ? primitive.color.red300 : primitive.color.red950,
    focus: isDark ? primitive.color.gold400 : primitive.color.coral700,
    disabledBg: isDark ? primitive.color.neutral800 : primitive.color.neutral200,
    disabledText: primitive.color.neutral600,
    transparent: primitive.color.transparent,
  };

  const semanticSpace = {
    xs: primitive.space.space4,
    sm: primitive.space.space8,
    md: primitive.space.space16,
    lg: primitive.space.space24,
    xl: primitive.space.space32,
    xxl: primitive.space.space48,
    xxxl: primitive.space.space64,
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
      family: 'Plus Jakarta Sans',
      size: 30,
      weight: '800' as const,
      lineHeight: 36,
    },
    title: {
      family: 'Plus Jakarta Sans',
      size: 24,
      weight: '800' as const,
      lineHeight: 32,
    },
    subtitle: {
      family: 'Plus Jakarta Sans',
      size: 18,
      weight: '700' as const,
      lineHeight: 24,
    },
    body: {
      family: 'Roboto',
      size: 16,
      weight: '400' as const,
      lineHeight: 24,
    },
    label: {
      family: 'Plus Jakarta Sans',
      size: 16,
      weight: '700' as const,
      lineHeight: 20,
    },
    caption: {
      family: 'Roboto',
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
      radius: semantic.radius.full,
      radiusPressed: semantic.radius.md,
      minHeight: semantic.space.xxl,
      jumboHeight: semantic.space.xxxl,
    },
    input: {
      bg: semantic.color.surfaceContainer,
      text: semantic.color.onSurface,
      border: semantic.color.outline,
      borderFocus: semantic.color.action,
      borderError: semantic.color.error,
      bgError: semantic.color.errorContainer,
      radius: semantic.radius.md,
      minHeight: primitive.space.space56,
    },
    card: {
      bg: semantic.color.surfaceContainer,
      border: semantic.color.outline,
      radius: semantic.radius.xl,
      padding: semantic.space.lg,
    },
    timer: {
      bgNormal: semantic.color.highlight,
      textNormal: semantic.color.onHighlight,
      bgCritical: semantic.color.error,
      textCritical: semantic.color.onError,
      radiusNormal: semantic.radius.full,
      radiusCritical: semantic.radius.md,
    },
    quiz: {
      optionBg: semantic.color.surfaceContainer,
      optionBorder: semantic.color.outline,
      optionRadius: semantic.radius.lg,
      optionCorrectBg: semantic.color.success,
      optionWrongBg: semantic.color.error,
    },
    key: {
      size: semantic.space.xxl,
      radius: semantic.radius.md,
      hitBg: semantic.color.success,
      missBg: semantic.color.errorContainer,
    },
  };

  return {
    mode,
    primitive,
    semantic,
    component,
  };
}

export const tokens = createTokens('light');
export const darkTokens = createTokens('dark');
