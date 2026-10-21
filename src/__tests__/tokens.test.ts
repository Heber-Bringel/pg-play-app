import { tokens, darkTokens, createTokens, primitive } from '../theme/tokens';

describe('Sistema de Design PG Play Expressive - Tokens (02-tokens.md)', () => {
  it('deve exportar tokens primitivos de cor e espaçamento na grade de 8 pontos', () => {
    expect(primitive.color.purple600).toBe('#5B21B6');
    expect(primitive.color.coral700).toBe('#C2410C');
    expect(primitive.color.gold400).toBe('#FACC15');
    expect(primitive.space.space48).toBe(48);
    expect(primitive.space.space64).toBe(64);
  });

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
    expect(tokens.component.timer.bgNormal).toBe('#FACC15');
    expect(tokens.component.timer.bgCritical).toBe('#B91C1C');
    expect(tokens.component.key.size).toBe(48);
  });
});
