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
  timer,
  quiz,
  key,
} from '@/view/theme';

describe('Sistema de Design PG Play Expressive - Tokens (02-tokens.md)', () => {
  it('deve resolver tokens semânticos corretamente no modo claro (padrão)', () => {
    const defaultTheme = createTokens();
    expect(defaultTheme.mode).toBe('light');
    expect(tokens.semantic.color.action).toBe('#5B21B6');
    expect(tokens.semantic.color.onAction).toBe('#FFFFFF');
    expect(tokens.semantic.color.secondary).toBe('#C2410C');
    expect(tokens.semantic.color.highlight).toBe('#FACC15');
    expect(tokens.semantic.color.surface).toBe('#FDF8FF');
    expect(tokens.semantic.color.success).toBe('#15803D');
    expect(tokens.semantic.color.error).toBe('#B91C1C');
  });

  it('deve resolver tokens semânticos corretamente no modo escuro sem alterar a estrutura de componente', () => {
    expect(darkTokens.mode).toBe('dark');
    expect(darkTokens.semantic.color.action).toBe('#D8B4FE');
    expect(darkTokens.semantic.color.onAction).toBe('#2E1065');
    expect(darkTokens.semantic.color.secondary).toBe('#FDBA74');
    expect(darkTokens.semantic.color.surface).toBe('#141218');
    expect(darkTokens.semantic.color.success).toBe('#86EFAC');
    expect(darkTokens.semantic.color.error).toBe('#FCA5A5');
    expect(darkTokens.semantic.color.highlight).toBe('#FACC15');
    expect(darkTokens.component.button.bg).toBe('#D8B4FE');
    expect(darkTokens.component.button.jumboHeight).toBe(64);
  });

  it('deve mapear tokens de componente para os tokens semânticos correspondentes', () => {
    expect(tokens.component.button.minHeight).toBe(48);
    expect(tokens.component.button.jumboHeight).toBe(64);
    expect(tokens.component.button.radius).toBe(9999);
    expect(tokens.component.button.radiusPressed).toBe(16);
    expect(tokens.component.input.minHeight).toBe(56);
    expect(tokens.component.card.radius).toBe(28);
    expect(tokens.component.card.badgeSize).toBe(56);
    expect(tokens.component.timer.bgNormal).toBe('#FACC15');
    expect(tokens.component.timer.bgCritical).toBe('#B91C1C');
    expect(tokens.component.key.size).toBe(48);
  });

  it('deve exportar diretamente submódulos semânticos e de componente para conveniência', () => {
    expect(color.action).toBe('#5B21B6');
    expect(space.xs).toBe(4);
    expect(space.sm).toBe(8);
    expect(space.md).toBe(16);
    expect(space.lg).toBe(24);
    expect(space.xl).toBe(32);
    expect(space.xxl).toBe(48);
    expect(space.xxxl).toBe(64);
    expect(radius.full).toBe(9999);
    expect(font.display.size).toBe(30);
    expect(border.thin).toBe(2);
    expect(icon.md).toBe(24);
    expect(typography.maxScale).toBe(1.5);
    expect(elevation.card).toBe(4);
    expect(motion.duration.short).toBe(150);
    expect(button.radius).toBe(9999);
    expect(input.minHeight).toBe(56);
    expect(card.radius).toBe(28);
    expect(timer.radiusNormal).toBe(9999);
    expect(quiz.optionRadius).toBe(20);
    expect(key.size).toBe(48);
  });
});
