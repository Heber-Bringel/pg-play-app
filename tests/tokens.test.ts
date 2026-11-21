import {
  tokens,
  darkTokens,
  createTokens,
  color,
  space,
  radius,
  font,
  border,
  icon,
  typography,
  elevation,
  motion,
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
} from '@/view/theme';

function relativeLuminance(hex: string): number {
  const [r, g, b] = [1, 3, 5]
    .map((index) => parseInt(hex.slice(index, index + 2), 16) / 255)
    .map((channel) =>
      channel <= 0.03928
        ? channel / 12.92
        : Math.pow((channel + 0.055) / 1.055, 2.4)
    );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(hexA: string, hexB: string): number {
  const l1 = Math.max(relativeLuminance(hexA), relativeLuminance(hexB));
  const l2 = Math.min(relativeLuminance(hexA), relativeLuminance(hexB));
  return (l1 + 0.05) / (l2 + 0.05);
}

describe('Sistema de Design PG Play Expressive v1.1.0 - Tokens (02-tokens.md)', () => {
  it('deve resolver tokens semânticos corretamente no modo claro (padrão)', () => {
    const defaultTheme = createTokens();
    expect(defaultTheme.mode).toBe('light');
    expect(tokens.semantic.color.action).toBe('#5B21B6');
    expect(tokens.semantic.color.onAction).toBe('#FFFFFF');
    expect(tokens.semantic.color.secondary).toBe('#C2410C');
    expect(tokens.semantic.color.highlight).toBe('#FACC15');
    expect(tokens.semantic.color.highlightBorder).toBe('#A16207');
    expect(tokens.semantic.color.surface).toBe('#FDF8FF');
    expect(tokens.semantic.color.outline).toBe('#79747E');
    expect(tokens.semantic.color.focus).toBe('#1D1B20');
    expect(tokens.semantic.color.focusOffset).toBe('#FDF8FF');
    expect(tokens.semantic.color.disabledText).toBe('#49454F');
    expect(tokens.semantic.color.success).toBe('#15803D');
    expect(tokens.semantic.color.error).toBe('#B91C1C');
  });

  it('deve resolver tokens semânticos corretamente no modo escuro sem alterar a estrutura de componente', () => {
    expect(darkTokens.mode).toBe('dark');
    expect(darkTokens.semantic.color.action).toBe('#D8B4FE');
    expect(darkTokens.semantic.color.onAction).toBe('#2E1065');
    expect(darkTokens.semantic.color.secondary).toBe('#FDBA74');
    expect(darkTokens.semantic.color.surface).toBe('#141218');
    expect(darkTokens.semantic.color.outline).toBe('#938F99');
    expect(darkTokens.semantic.color.focus).toBe('#E6E0E9');
    expect(darkTokens.semantic.color.focusOffset).toBe('#141218');
    expect(darkTokens.semantic.color.disabledText).toBe('#938F99');
    expect(darkTokens.semantic.color.success).toBe('#86EFAC');
    expect(darkTokens.semantic.color.error).toBe('#FCA5A5');
    expect(darkTokens.semantic.color.highlight).toBe('#FACC15');
    expect(darkTokens.semantic.color.highlightBorder).toBe('#FACC15');
    expect(darkTokens.component.button.bg).toBe('#D8B4FE');
    expect(darkTokens.component.button.jumbo.height).toBe(64);
  });

  it('deve mapear tipografia exclusivamente em Plus Jakarta Sans com peso explícito e font.tag de 14dp', () => {
    expect(font.display.family).toBe('PlusJakartaSans_800ExtraBold');
    expect(font.title.family).toBe('PlusJakartaSans_800ExtraBold');
    expect(font.subtitle.family).toBe('PlusJakartaSans_700Bold');
    expect(font.body.family).toBe('PlusJakartaSans_400Regular');
    expect(font.label.family).toBe('PlusJakartaSans_700Bold');
    expect(font.tag).toEqual({
      family: 'PlusJakartaSans_700Bold',
      size: 14,
      weight: '700',
      lineHeight: 18,
    });
    expect(font.caption.family).toBe('PlusJakartaSans_700Bold');
  });

  it('não deve manter aliases duplicados em space ou tokens de componente', () => {
    expect('xxl' in space).toBe(false);
    expect('xxxl' in space).toBe(false);
    expect('jumboHeight' in button).toBe(false);
    expect('bgNormal' in timer).toBe(false);
    expect('bgCritical' in timer).toBe(false);
    expect('textNormal' in timer).toBe(false);
    expect('radiusNormal' in timer).toBe(false);
    expect('optionBg' in quiz).toBe(false);
    expect('optionBorder' in quiz).toBe(false);
    expect('optionRadius' in quiz).toBe(false);
    expect('hitBg' in key).toBe(false);
    expect('missBg' in key).toBe(false);
  });

  it('deve exportar submódulos semânticos e de componente completos', () => {
    expect(color.action).toBe('#5B21B6');
    expect(space.xs).toBe(4);
    expect(space.sm).toBe(8);
    expect(space.md).toBe(16);
    expect(space.lg).toBe(24);
    expect(space.xl).toBe(32);
    expect(space['2xl']).toBe(48);
    expect(space.container).toBe(56);
    expect(space['3xl']).toBe(64);
    expect(radius.full).toBe(9999);
    expect(border.thin).toBe(2);
    expect(border.focus).toBe(3);
    expect(icon.md).toBe(24);
    expect(typography.maxScale).toBe(1.5);
    expect(elevation.card).toBe(4);
    expect(motion.duration.short).toBe(150);
    expect(button.minHeight).toBe(48);
    expect(button.iconSize).toBe(48);
    expect(button.jumbo.height).toBe(64);
    expect(input.minHeight).toBe(56);
    expect(card.radius).toBe(28);
    expect(card.borderLeader).toBe('#A16207');
    expect(chip.border.default).toBe(color.outline);
    expect(chip.border.selected).toBe(color.action);
    expect(option.border.default).toBe(color.outline);
    expect(option.minHeight).toBe(56);
    expect(tag.neutral.border).toBe(color.outline);
    expect(banner.error.border).toBe(color.error);
    expect(timer.bg.normal).toBe('#FACC15');
    expect(timer.bg.critical).toBe('#B91C1C');
    expect(timer.bg.calm).toBe('#5B21B6');
    expect(timer.radius.normal).toBe(9999);
    expect(quiz.option.radius).toBe(20);
    expect(quiz.option.bg).toBe('#FFFFFF');
    expect(key.size).toBe(48);
    expect(key.hit.bg).toBe('#15803D');
  });

  it('deve cumprir WCAG 1.4.11 (>= 3:1) em contornos/componentes e >= 4,5:1 em textos nos modos claro e escuro', () => {
    for (const theme of [tokens, darkTokens]) {
      const c = theme.semantic.color;
      expect(contrastRatio(c.outline, c.surface)).toBeGreaterThanOrEqual(3);
      expect(contrastRatio(c.outline, c.surfaceContainer)).toBeGreaterThanOrEqual(3);
      expect(contrastRatio(c.outline, c.surfaceVariant)).toBeGreaterThanOrEqual(3);
      expect(contrastRatio(c.highlightBorder, c.surface)).toBeGreaterThanOrEqual(3);
      expect(contrastRatio(c.highlightBorder, c.surfaceContainer)).toBeGreaterThanOrEqual(3);
      expect(contrastRatio(c.focus, c.focusOffset)).toBeGreaterThanOrEqual(14);
      expect(contrastRatio(c.disabledText, c.disabledBg)).toBeGreaterThanOrEqual(4.5);
      expect(
        contrastRatio(theme.component.timer.bg.calm, c.surfaceVariant)
      ).toBeGreaterThanOrEqual(3);

      const tones = [
        'neutral',
        'action',
        'secondary',
        'success',
        'error',
        'highlight',
      ] as const;
      for (const tone of tones) {
        const tagPalette = theme.component.tag[tone];
        expect(contrastRatio(tagPalette.text, tagPalette.bg)).toBeGreaterThanOrEqual(4.5);
        expect(
          contrastRatio(tagPalette.border, c.surfaceContainer)
        ).toBeGreaterThanOrEqual(3);
      }
    }
  });
});
