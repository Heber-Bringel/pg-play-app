# Alternativa de Quiz (QuizOption)

Origem no sistema base: Material 3, Outlined Card combinado com Selectable Action Button. Situação: **Adaptado**. Motivo da adaptação: inclusão de emblema circular com a letra da alternativa (`A`, `B`, `C`, `D`) para permitir que o grupo grite a resposta à distância, além de estados explícitos de revelação (`Correta` e `Incorreta`) que combinam cor semântica, mudança de raio e ícone de confirmação.

## Quando usar

- Na Arena de Quiz Relâmpago para apresentar as opções de resposta de uma pergunta de múltipla escolha.

## Quando não usar

- Para ações de navegação ou confirmação de telas (use [Botão](botao.md)).
- Para seleção de letras individuais no Jogo da Forca (use [Teclado da Forca](teclado-forca.md)).

## Anatomia

1. **Container da alternativa:** largura total (`100%`), altura mínima `space-56` (`56 dp`), padding interno `space.md` (`16 dp`), fundo `quiz.option.bg` (`color.surface-container`), borda de `2 dp` em `quiz.option.border` (`color.outline`) e raio `quiz.option.radius` (`20 dp`).
2. **Emblema da letra (`A`–`D`):** círculo (`radius.full`) de `32 dp × 32 dp` em `color.surface-variant` com tipografia `font.label` (`16 dp`, peso `700`).
3. **Texto da resposta:** tipografia `font.label` (`16 dp`, peso `700`) alinhada à esquerda e com quebra de linha automática.
4. **Ícone de resultado (pós-resposta):** tamanho `24 dp` à direita (`check-circle` para alternativa correta e `close-circle` para alternativa incorreta).

## Variantes

| Variante | Uso | Tokens |
| --- | --- | --- |
| `Padrão` | Opção aguardando escolha da equipe | `quiz.option.bg`, `quiz.option.border`, `quiz.option.radius`, `color.on-surface` |
| `Selecionada` | Opção marcada antes da revelação final | `color.action-container`, `color.action`, `color.on-action-container` |
| `Correta` | Revelação da resposta certa da rodada | `quiz.option.correct.bg` (`color.success`), `color.on-success`, `radius.md` |
| `Incorreta` | Revelação de palpite errado escolhido pela equipe | `quiz.option.wrong.bg` (`color.error`), `color.on-error`, `radius.sm` |

## Estados

| Estado | Aparência (tokens) | Comportamento | Acessibilidade |
| --- | --- | --- | --- |
| Padrão | Fundo `quiz.option.bg`, borda `quiz.option.border`, raio `20 dp` | Aguarda o toque do jogador | Anunciado como botão com letra + texto da opção |
| Hover | Borda `color.action`, fundo `color.surface-variant` | Aplicável em mouse/web | - |
| Pressionado | Escala `0.98`, raio reduzido para `radius.sm` (`8 dp`) | Resposta elástica com `motion.spring.spatial` | - |
| Foco | Anel externo de `3 dp` em `color.focus` | Visível na navegação por teclado | Ordem sequencial de `A` até `D` |
| Correta | Fundo `color.success`, texto e ícone `color.on-success`, ícone `check-circle`, raio `16 dp` | Soma pontos ao placar da equipe ativa | Anuncia `"Alternativa B: Correta"` |
| Incorreta | Fundo `color.error`, texto e ícone `color.on-error`, ícone `close-circle`, raio `8 dp` | Bloqueia novas escolhas na mesma pergunta | Anuncia `"Alternativa escolhida: Incorreta"` |
| Desabilitado | Opacidade reduzida e toque bloqueado após resposta revelada | Mantém leitura do texto para discussão do grupo | `accessibilityState={{ disabled: true, selected }}` |

## Acessibilidade

- **Alvo de toque mínimo:** altura mínima de `56 dp` ocupando `100%` da largura útil da tela, separado das demais opções por `space.sm` (`8 dp`).
- **Contraste:** estado padrão com razão superior a **14,4:1**; estado correto com **5,02:1** (claro) e **11,15:1** (escuro); estado incorreto com **6,47:1** (claro) e **8,90:1** (escuro) (ver [06-acessibilidade.md](../06-acessibilidade.md)).
- **Leitor de tela:** anuncia a letra identificadora, o texto completo da alternativa e o resultado (`Correta` ou `Incorreta`) sem depender de percepção de cor.

## Faça e evite

- **Faça:** exiba sempre a letra (`A`, `B`, `C`, `D`) dentro do emblema circular e revele qual era a alternativa correta mesmo quando a equipe errar.
- **Evite:** truncar o texto da alternativa com reticências (`...`); permita que o container cresça verticalmente se o texto tiver mais de uma linha.

## Código

```tsx
import React from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { tokens } from '../theme/tokens';

type OptionStatus = 'default' | 'selected' | 'correct' | 'wrong';

interface QuizOptionProps {
  letter: 'A' | 'B' | 'C' | 'D';
  text: string;
  status?: OptionStatus;
  disabled?: boolean;
  onPress: () => void;
}

export function QuizOption({
  letter,
  text,
  status = 'default',
  disabled = false,
  onPress,
}: QuizOptionProps) {
  const getBackgroundColor = () => {
    if (status === 'correct') return tokens.component.quiz.optionCorrectBg;
    if (status === 'wrong') return tokens.component.quiz.optionWrongBg;
    if (status === 'selected') return tokens.semantic.color.actionContainer;
    return tokens.component.quiz.optionBg;
  };

  const getTextColor = () => {
    if (status === 'correct') return tokens.semantic.color.onSuccess;
    if (status === 'wrong') return tokens.semantic.color.onError;
    if (status === 'selected') return tokens.semantic.color.onActionContainer;
    return tokens.semantic.color.onSurface;
  };

  const statusLabel =
    status === 'correct'
      ? ', resposta correta'
      : status === 'wrong'
      ? ', resposta incorreta'
      : '';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={`Alternativa ${letter}: ${text}${statusLabel}`}
      accessibilityState={{
        disabled,
        selected: status !== 'default',
      }}
      style={[
        styles.container,
        {
          backgroundColor: getBackgroundColor(),
          borderColor:
            status === 'default'
              ? tokens.component.quiz.optionBorder
              : getBackgroundColor(),
          borderRadius:
            status === 'wrong'
              ? tokens.semantic.radius.sm
              : tokens.component.quiz.optionRadius,
        },
      ]}
    >
      <View style={styles.leftGroup}>
        <View style={styles.letterBadge}>
          <Text allowFontScaling style={styles.letterText}>
            {letter}
          </Text>
        </View>
        <Text
          allowFontScaling
          style={[styles.optionText, { color: getTextColor() }]}
        >
          {text}
        </Text>
      </View>

      {status === 'correct' && (
        <MaterialCommunityIcons
          name="check-circle"
          size={tokens.semantic.icon.md}
          color={getTextColor()}
        />
      )}
      {status === 'wrong' && (
        <MaterialCommunityIcons
          name="close-circle"
          size={tokens.semantic.icon.md}
          color={getTextColor()}
        />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: tokens.primitive.space.space56,
    paddingHorizontal: tokens.semantic.space.md,
    paddingVertical: tokens.semantic.space.sm,
    borderWidth: tokens.semantic.border.thin,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.semantic.space.sm,
  },
  leftGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.semantic.space.sm,
  },
  letterBadge: {
    width: tokens.semantic.space.xl,
    height: tokens.semantic.space.xl,
    borderRadius: tokens.semantic.radius.full,
    backgroundColor: tokens.semantic.color.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  letterText: {
    fontFamily: tokens.semantic.font.label.family,
    fontSize: tokens.semantic.font.label.size,
    fontWeight: tokens.semantic.font.label.weight,
    color: tokens.semantic.color.onSurface,
  },
  optionText: {
    flex: 1,
    fontFamily: tokens.semantic.font.label.family,
    fontSize: tokens.semantic.font.label.size,
    fontWeight: tokens.semantic.font.label.weight,
  },
});
```
