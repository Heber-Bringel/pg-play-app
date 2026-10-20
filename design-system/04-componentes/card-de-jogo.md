# Card de Minigame (GameCard)

Origem no sistema base: Material 3 Expressive, Outlined + Elevated Card com *Shape Library Badges*. Situação: **Adaptado**. Motivo da adaptação: adoção de cantos Extra Large (`card.radius` = `radius.xl` = `28 dp`), combinação simultânea de borda `2 dp` e sombra `elevation.card` para contraste perfeito em ambientes escuros, e emblemas geométricos inspirados na biblioteca de formas do M3 Expressive.

## Quando usar

- No Hub de Jogos (Home) para apresentar cada minigame disponível (Mímica, Quiz, Forca) com ícone expressivo, quantidade recomendada de jogadores e descrição curta.
- Na Arena de Mímica ou Quiz para destacar a palavra secreta ou o enunciado da pergunta da rodada.
- Na tela de Placar do PG para listar cada equipe no pódio com sua pontuação.

## Quando não usar

- Para botões de ação isolados como *"Começar Rodada"* (use [Botão](botao.md)).
- Para listar as quatro opções clicáveis de uma pergunta de Quiz (use [Alternativa de Quiz](alternativa-quiz.md)).

## Anatomia

1. **Container principal:** fundo `card.bg` (`color.surface-container`), borda de `2 dp` em `card.border` (`color.outline`), raio `card.radius` (`28 dp`), padding interno `card.padding` (`24 dp`) e sombra `elevation.card`.
2. **Emblema geométrico (Expressive Shape Badge):** container de `56 dp × 56 dp` preenchido com `color.action-container`, `color.secondary-container` ou `color.highlight`, contendo um ícone de `28 dp`.
3. **Tag de metadados:** pílula (`radius.full`) com fundo `color.surface-variant` e tipografia `font.caption` indicando o número de jogadores ou o tema da rodada.
4. **Título e descrição:** título em `font.subtitle` (`18 dp`, peso `700`) ou `font.display` (`30 dp`, peso `800` na variante Palavra Secreta) e texto complementar em `font.body` (`16 dp`, `color.on-surface-muted`).

## Variantes

| Variante | Uso | Tokens |
| --- | --- | --- |
| `Catálogo (Interativo)` | Seleção de minigame na tela inicial | `card.bg`, `card.border`, `card.radius`, `card.padding`, `elevation.card` |
| `Arena (Palavra/Pergunta)` | Exibição da palavra da Mímica ou pergunta do Quiz | `card.bg`, `card.border`, `card.radius`, `font.display`, `color.action-container` |
| `Pódio Líder` | Destaque da equipe em 1º lugar no Placar do PG | `card.bg`, `color.highlight` (borda), `card.radius`, `font.subtitle` |

## Estados

| Estado | Aparência (tokens) | Comportamento | Acessibilidade |
| --- | --- | --- | --- |
| Padrão | Fundo `card.bg`, borda `card.border`, raio `card.radius` (`28 dp`) | Exibe o resumo do minigame ou conteúdo da rodada | Anunciado como botão (se interativo) ou região agrupada |
| Hover | Borda `color.action`, elevação `elevation.floating` | Aplicável apenas em web/mouse | - |
| Pressionado | Borda `color.action`, raio reduzido para `radius.md` (`16 dp`), escala `0.98` | Animação com `motion.spring.spatial` ao abrir o minigame | Dispara a navegação para a tela do jogo |
| Foco | Anel externo de `3 dp` em `color.focus` | Visível ao navegar por teclado/Switch Access | Agrupa título, jogadores e descrição em um único anúncio |
| Desabilitado | Fundo `color.disabled-bg`, texto `color.disabled-text`, elevação `elevation.none` | Jogo temporariamente indisponível | Anunciado com `accessibilityState={{ disabled: true }}` |

## Acessibilidade

- **Alvo de toque mínimo:** altura total mínima de `120 dp` na variante interativa, excedendo amplamente os `48 dp × 48 dp` exigidos.
- **Contraste:** título em `color.on-surface` sobre `color.surface-container` com razão de **16,20:1** no claro e **14,40:1** no escuro (ver [06-acessibilidade.md](../06-acessibilidade.md)).
- **Leitor de tela:** o container recebe `accessible={true}` para unir o título do jogo, a tag de jogadores e a descrição em uma única leitura contínua.

## Faça e evite

- **Faça:** limite o conteúdo do card a no máximo 3 informações (emblema/tag, título curto e descrição de até 2 linhas) para rápida leitura.
- **Evite:** colocar múltiplos botões clicáveis pequenos dentro de um card que já é inteiramente clicável.

## Código

```tsx
import React, { useState } from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { tokens } from '../theme/tokens';

interface GameCardProps {
  title: string;
  description: string;
  playersTag: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  highlightLeader?: boolean;
  disabled?: boolean;
  onPress?: () => void;
}

export function GameCard({
  title,
  description,
  playersTag,
  icon,
  highlightLeader = false,
  disabled = false,
  onPress,
}: GameCardProps) {
  const [pressed, setPressed] = useState(false);

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || !onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      accessible
      accessibilityRole={onPress ? 'button' : 'summary'}
      accessibilityLabel={`${title}. ${playersTag}. ${description}`}
      accessibilityState={{ disabled }}
      style={[
        styles.card,
        {
          backgroundColor: disabled
            ? tokens.semantic.color.disabledBg
            : tokens.component.card.bg,
          borderColor: highlightLeader
            ? tokens.semantic.color.highlight
            : pressed
            ? tokens.semantic.color.action
            : tokens.component.card.border,
          borderRadius: pressed
            ? tokens.semantic.radius.md
            : tokens.component.card.radius,
        },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.badge}>
          <MaterialCommunityIcons
            name={icon}
            size={tokens.semantic.icon.lg}
            color={tokens.semantic.color.onActionContainer}
          />
        </View>
        <View style={styles.tag}>
          <Text allowFontScaling style={styles.tagText}>
            {playersTag}
          </Text>
        </View>
      </View>

      <View style={styles.body}>
        <Text allowFontScaling style={styles.title}>
          {title}
        </Text>
        <Text allowFontScaling style={styles.description}>
          {description}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: tokens.component.card.padding,
    borderWidth: tokens.semantic.border.thin,
    gap: tokens.semantic.space.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    width: tokens.primitive.space.space56,
    height: tokens.primitive.space.space56,
    borderRadius: tokens.semantic.radius.lg,
    backgroundColor: tokens.semantic.color.actionContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tag: {
    paddingHorizontal: tokens.semantic.space.sm,
    paddingVertical: tokens.semantic.space.xs,
    borderRadius: tokens.semantic.radius.full,
    backgroundColor: tokens.semantic.color.surfaceVariant,
  },
  tagText: {
    fontFamily: tokens.semantic.font.caption.family,
    fontSize: tokens.semantic.font.caption.size,
    fontWeight: tokens.semantic.font.caption.weight,
    color: tokens.semantic.color.onSurface,
  },
  body: {
    gap: tokens.semantic.space.xs,
  },
  title: {
    fontFamily: tokens.semantic.font.subtitle.family,
    fontSize: tokens.semantic.font.subtitle.size,
    fontWeight: tokens.semantic.font.subtitle.weight,
    color: tokens.semantic.color.onSurface,
  },
  description: {
    fontFamily: tokens.semantic.font.body.family,
    fontSize: tokens.semantic.font.body.size,
    color: tokens.semantic.color.onSurfaceMuted,
  },
});
```
