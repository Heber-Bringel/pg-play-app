# Botão (ExpressiveButton)

Origem no sistema base: Material 3 Expressive, Filled / Tonal / Outlined Button com *Shape Morphing*. Situação: **Adaptado**. Motivo da adaptação: inclusão de transformação elástica de forma (`9999 dp` para `16 dp` ao pressionar) e criação da variante **Jumbo (`64 dp` de altura)** para facilitar toques rápidos durante dinâmicas de grupo sob contagem regressiva.

## Quando usar

- Para disparar a ação principal de uma tela (variante `Primário` ou `Primário Jumbo`, máximo de um por tela).
- Para registrar acerto ou pulo de palavra na Arena de Mímica (variantes `Sucesso Jumbo` e `Secundário`).
- Para ações auxiliares de apoio (variantes `Tonal` e `Delineado`, como *"Revelar Palavra"*, *"Adicionar Equipe"* ou *"Sair"*).

## Quando não usar

- Para navegar entre as seções principais do aplicativo (use a Barra de Navegação Inferior).
- Para exibir as quatro opções de resposta de uma pergunta do Quiz (use [Alternativa de Quiz](alternativa-quiz.md)).
- Para digitar letras no Jogo da Forca (use [Teclado da Forca](teclado-forca.md)).

## Anatomia

1. **Container interativo:** fundo definido por `button.bg` (ou token da variante), altura mínima `button.min-height` (`48 dp`) ou `button.jumbo.height` (`64 dp`), espaçamento horizontal interno `space.lg` (`24 dp`) e raio de borda `button.radius` (`9999 dp` em repouso) que se transforma em `button.radius.pressed` (`16 dp`) no toque.
2. **Ícone opcional à esquerda:** tamanho `24 dp`, espaçado do rótulo por `space.sm` (`8 dp`), herdando a cor do rótulo.
3. **Rótulo de texto:** tipografia `font.label` (`16 dp`, peso `700`) e cor `button.label`.

## Variantes

| Variante | Uso | Tokens |
| --- | --- | --- |
| `Primário` | Ação principal em telas de configuração e modais | `button.bg`, `button.label`, `button.min-height`, `button.radius` |
| `Primário Jumbo` | Ação principal de início de partida ou avanço de rodada | `button.bg`, `button.label`, `button.jumbo.height`, `button.radius`, `space.xl` |
| `Sucesso Jumbo` | Confirmar acerto da equipe na Arena de Mímica | `color.success`, `color.on-success`, `button.jumbo.height`, `button.radius` |
| `Secundário` | Ação alternativa de jogo (ex.: *"Pular Palavra"*) | `color.secondary`, `color.on-secondary`, `button.min-height`, `button.radius` |
| `Tonal` | Ação complementar na mesma tela (ex.: *"Adicionar Equipe"*, *"Revelar Palavra"*) | `color.action-container`, `color.on-action-container`, `button.min-height`, `button.radius` |
| `Delineado` | Ação de saída ou cancelamento (ex.: *"Sair"*, *"Zerar Placar"*) | `color.surface-container`, `color.outline`, `color.on-surface`, `button.min-height`, `button.radius` |

## Estados

| Estado | Aparência (tokens) | Comportamento | Acessibilidade |
| --- | --- | --- | --- |
| Padrão | Fundo `button.bg`, texto `button.label`, raio `button.radius` (`9999 dp`) | Aguarda o toque em formato de pílula | Anunciado com papel `button` e rótulo de ação |
| Hover | Fundo `button.bg-hover` | Aplicável apenas quando conectado a mouse/web; não se aplica em toque puro | Cursor de ponteiro |
| Pressionado | Fundo `button.bg-pressed`, raio `button.radius.pressed` (`16 dp`), escala `0.96` | Executa *Shape Morphing* com mola `motion.spring.spatial` em `motion.duration.short` (`150 ms`) | Feedback tátil (vibração leve opcional) |
| Foco | Anel externo de `3 dp` em `color.focus` | Visível na navegação por teclado externo ou Switch Access | Ordem lógica de tabulação |
| Desabilitado | Fundo `button.bg-disabled`, texto `button.label-disabled`, elevação `elevation.none` | Ignora eventos de toque (`disabled={true}`) | Anunciado com `accessibilityState={{ disabled: true }}` |

## Acessibilidade

- **Alvo de toque mínimo:** `48 dp × 48 dp` (`button.min-height`) nas variantes padrão e `64 dp` de altura (`button.jumbo.height`) nas variantes Jumbo.
- **Contraste:** par `color.on-action` sobre `color.action` com razão de **8,98:1** no claro e **8,62:1** no escuro; par `color.on-success` sobre `color.success` com razão de **5,02:1** no claro e **11,15:1** no escuro (calculadas em [06-acessibilidade.md](../06-acessibilidade.md)).
- **Leitor de tela:** recebe obrigatoriamente `accessibilityRole="button"`, `accessibilityLabel` com verbo no imperativo e `accessibilityState={{ disabled }}`.

## Faça e evite

- **Faça:** use rótulos curtos iniciados por verbo claro (*"Começar Rodada!"*, *"Acertaram! (+20 pts)"*, *"Pular Palavra"*) e mantenha apenas um botão `Primário` por tela.
- **Evite:** colocar dois botões com fundo `color.action` lado a lado competindo pela atenção ou usar texto genérico como *"OK"* ou *"Sim"*.

## Código

```tsx
import React, { useState } from 'react';
import { Pressable, Text, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { tokens } from '../theme/tokens';

type Variant = 'primary' | 'primaryJumbo' | 'successJumbo' | 'secondary' | 'tonal' | 'outlined';

interface ExpressiveButtonProps {
  label: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  variant?: Variant;
  disabled?: boolean;
  onPress: () => void;
}

export function ExpressiveButton({
  label,
  icon,
  variant = 'primary',
  disabled = false,
  onPress,
}: ExpressiveButtonProps) {
  const [pressed, setPressed] = useState(false);
  const [focused, setFocused] = useState(false);

  const isJumbo = variant === 'primaryJumbo' || variant === 'successJumbo';

  const getBackgroundColor = () => {
    if (disabled) return tokens.component.button.bgDisabled;
    if (variant === 'successJumbo') return tokens.semantic.color.success;
    if (variant === 'secondary') return tokens.semantic.color.secondary;
    if (variant === 'tonal') return tokens.semantic.color.actionContainer;
    if (variant === 'outlined') return tokens.semantic.color.surfaceContainer;
    return pressed ? tokens.component.button.bgPressed : tokens.component.button.bg;
  };

  const getTextColor = () => {
    if (disabled) return tokens.component.button.labelDisabled;
    if (variant === 'successJumbo') return tokens.semantic.color.onSuccess;
    if (variant === 'secondary') return tokens.semantic.color.onSecondary;
    if (variant === 'tonal') return tokens.semantic.color.onActionContainer;
    if (variant === 'outlined') return tokens.semantic.color.onSurface;
    return tokens.component.button.label;
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      style={[
        styles.base,
        {
          minHeight: isJumbo
            ? tokens.component.button.jumboHeight
            : tokens.component.button.minHeight,
          paddingHorizontal: isJumbo ? tokens.semantic.space.xl : tokens.semantic.space.lg,
          backgroundColor: getBackgroundColor(),
          borderRadius: pressed
            ? tokens.component.button.radiusPressed
            : tokens.component.button.radius,
          borderColor:
            variant === 'outlined'
              ? tokens.semantic.color.outline
              : focused
              ? tokens.semantic.color.focus
              : tokens.semantic.color.transparent,
        },
      ]}
    >
      <View style={styles.content}>
        {icon && (
          <MaterialCommunityIcons
            name={icon}
            size={tokens.semantic.icon.md}
            color={getTextColor()}
          />
        )}
        <Text
          allowFontScaling
          maxFontSizeMultiplier={tokens.semantic.typography.maxScale}
          style={[styles.label, { color: getTextColor() }]}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: tokens.semantic.border.thin,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.semantic.space.sm,
  },
  label: {
    fontFamily: tokens.semantic.font.label.family,
    fontSize: tokens.semantic.font.label.size,
    fontWeight: tokens.semantic.font.label.weight,
    lineHeight: tokens.semantic.font.label.lineHeight,
  },
});
```
