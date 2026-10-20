# Teclado da Forca (LetterKey)

Origem no sistema base: Não existe no Material 3 base; construído usando os tokens de forma e cor do Material 3 Expressive (2025). Situação: **Novo**. Motivo da criação: o teclado nativo do sistema operacional ocupa quase metade da tela e não exibe quais letras já foram tentadas (certas ou erradas). O `LetterKey` oferece uma grade dedicada para o Jogo da Forca com alvos de `48 dp × 48 dp` e memória visual da partida.

## Quando usar

- Exclusivamente na Arena do Jogo da Forca para permitir que os participantes escolham letras de `A` a `Z` e visualizem imediatamente quais letras já saíram.

## Quando não usar

- Para digitar textos livres como nomes de equipes ou termos de busca (use [Campo de Texto](campo-de-texto.md) com o teclado nativo do sistema).

## Anatomia

1. **Container da tecla:** largura e altura mínimas de `key.size` (`48 dp × 48 dp`), fundo `color.surface-container`, borda de `2 dp` em `color.outline` e raio `key.radius` (`16 dp` no estado disponível e `9999 dp` quando acertada).
2. **Caractere alfabético:** letra maiúscula centralizada usando `font.label` (`16 dp`, peso `700`), que recebe decoração riscada (`line-through`) quando a letra não existe na palavra secreta.

## Variantes

| Variante | Uso | Tokens |
| --- | --- | --- |
| `Disponível` | Letra ainda não escolhida na rodada | `color.surface-container`, `color.outline`, `color.on-surface`, `key.radius` (`16 dp`) |
| `Letra Certa (Hit)` | Letra presente na palavra secreta | `key.hit.bg` (`color.success`), `color.on-success`, `radius.full` (`9999 dp`) |
| `Letra Errada (Miss)` | Letra ausente na palavra secreta | `key.miss.bg` (`color.error-container`), `color.on-error-container`, `color.error`, texto riscado |

## Estados

| Estado | Aparência (tokens) | Comportamento | Acessibilidade |
| --- | --- | --- | --- |
| Padrão (Disponível) | Fundo `color.surface-container`, borda `color.outline`, raio `16 dp` | Aguarda o toque do jogador | Anunciado como `"Letra [X], disponível"` |
| Hover | Fundo `color.action-container`, borda `color.action` | Aplicável em mouse/web | - |
| Pressionado | Escala `0.90`, raio `radius.full` (`9999 dp`) | Transformação elástica com `motion.spring.spatial` | - |
| Foco | Anel externo de `3 dp` em `color.focus` | Visível na navegação por teclado externo | Ordem alfabética de `A` a `Z` |
| Acertada (Hit) | Fundo `key.hit.bg` (`color.success`), texto `color.on-success`, forma circular `radius.full` | Revela a letra nas lacunas da palavra e bloqueia novos toques | Anunciado como `"Letra [X], correta, já utilizada"` com `disabled: true` |
| Errada (Miss) | Fundo `key.miss.bg` (`color.error-container`), texto `color.on-error-container` riscado (`line-through`), borda `color.error` | Desconta 1 tentativa da equipe e bloqueia novos toques | Anunciado como `"Letra [X], incorreta, já utilizada"` com `disabled: true` |

## Acessibilidade

- **Alvo de toque mínimo:** cada tecla possui obrigatoriamente `48 dp × 48 dp` (`key.size`) com espaçamento `space.sm` (`8 dp`) entre teclas adjacentes.
- **Contraste:** letra disponível com razão superior a **14,4:1**; letra certa com **5,02:1** (claro) e **11,15:1** (escuro); letra errada com **8,90:1** (ver [06-acessibilidade.md](../06-acessibilidade.md)).
- **Diferenciação sem cor:** letras certas mudam a forma do container para círculo (`radius.full`), enquanto letras erradas mantêm o quadrado arredondado (`16 dp`) e aplicam risco tipográfico (`line-through`) sobre a letra.

## Faça e evite

- **Faça:** mantenha todas as teclas com no mínimo `48 dp × 48 dp` e desabilite a tecla imediatamente após ser escolhida para impedir perda dupla de vidas por toque esbarrado.
- **Evite:** espremer 10 ou 12 teclas na mesma linha em telas pequenas; organize a grade em até 6 ou 7 colunas com quebra automática (`flexWrap: 'wrap'`) para preservar o tamanho de toque.

## Código

```tsx
import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { tokens } from '../theme/tokens';

type KeyStatus = 'available' | 'hit' | 'miss';

interface LetterKeyProps {
  letter: string;
  status?: KeyStatus;
  onPress: (letter: string) => void;
}

export function LetterKey({
  letter,
  status = 'available',
  onPress,
}: LetterKeyProps) {
  const isUsed = status !== 'available';

  const getBackgroundColor = () => {
    if (status === 'hit') return tokens.component.key.hitBg;
    if (status === 'miss') return tokens.component.key.missBg;
    return tokens.semantic.color.surfaceContainer;
  };

  const getTextColor = () => {
    if (status === 'hit') return tokens.semantic.color.onSuccess;
    if (status === 'miss') return tokens.semantic.color.onErrorContainer;
    return tokens.semantic.color.onSurface;
  };

  const statusDescription =
    status === 'hit'
      ? 'correta, já utilizada'
      : status === 'miss'
      ? 'incorreta, já utilizada'
      : 'disponível';

  return (
    <Pressable
      onPress={() => onPress(letter)}
      disabled={isUsed}
      accessibilityRole="button"
      accessibilityLabel={`Letra ${letter}, ${statusDescription}`}
      accessibilityState={{ disabled: isUsed }}
      style={[
        styles.key,
        {
          backgroundColor: getBackgroundColor(),
          borderColor:
            status === 'hit'
              ? tokens.semantic.color.success
              : status === 'miss'
              ? tokens.semantic.color.error
              : tokens.semantic.color.outline,
          borderRadius:
            status === 'hit'
              ? tokens.semantic.radius.full
              : tokens.component.key.radius,
        },
      ]}
    >
      <Text
        allowFontScaling
        maxFontSizeMultiplier={tokens.semantic.typography.maxScale}
        style={[
          styles.letter,
          {
            color: getTextColor(),
            textDecorationLine: status === 'miss' ? 'line-through' : 'none',
          },
        ]}
      >
        {letter}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  key: {
    minWidth: tokens.component.key.size,
    minHeight: tokens.component.key.size,
    borderWidth: tokens.semantic.border.thin,
    justifyContent: 'center',
    alignItems: 'center',
  },
  letter: {
    fontFamily: tokens.semantic.font.label.family,
    fontSize: tokens.semantic.font.label.size,
    fontWeight: tokens.semantic.font.label.weight,
  },
});
```
