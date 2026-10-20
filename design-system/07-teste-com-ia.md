# Teste com IA

Este documento registra a validação prática de que o sistema de design **PG Play Expressive** é *AI friendly* — isto é, capaz de guiar um assistente de IA a construir uma tela inédita do aplicativo usando **exclusivamente** os arquivos da pasta `design-system/`.

---

## Rodada 1

- **Ferramenta e modelo:** Assistente de IA em sessão isolada (sem acesso ao código prévio do MVP).
- **Material entregue à IA:** somente os arquivos markdown da pasta `design-system/` (na versão inicial antes do ajuste fino).
- **Prompt usado:**

> "Construa em React Native com Expo (TypeScript) a **Tela 6: Placar e Ranking do Encontro do PG** do aplicativo PG PLAY. A tela deve exibir o cabeçalho do pódio, a lista ordenada das equipes com destaque para o 1º lugar e dois botões de ação ('Escolher Outro Jogo' e 'Zerar Placar do PG'). Use exclusivamente o sistema de design fornecido na pasta `design-system/`. Não invente nenhum valor literal de cor, espaço, tipografia ou raio. Ao final, liste os tokens e componentes utilizados."

- **Resultado da Rodada 1 (resumo das ocorrências):**
  A IA utilizou corretamente os componentes `GameCard` e `ExpressiveButton` e aplicou os tokens `color.surface`, `color.highlight` e `space.md`. Contudo, ao montar o emblema circular de posição (`1º`, `2º`) e a borda dos cards na folha de estilos da tela, cometeu dois pequenos desvios por lacunas na documentação inicial:
  1. Escreveu `borderWidth: 2` literal porque não havia um token semântico explícito para espessura de borda em `02-tokens.md`.
  2. Escreveu `size={24}` literal no ícone do cabeçalho porque os tamanhos de ícone (`24 dp` e `28 dp`) estavam citados apenas em texto corrido em `03-fundamentos.md`, sem nome de token na tabela.

| Verificação | Passou? | Observação |
| --- | --- | --- |
| Cores, espaços e raios vieram de tokens | ✅ Sim | Todas as cores (`color.action`, `color.highlight`, `color.surface`), espaços (`space.md`, `space.lg`) e raios (`radius.xl`, `radius.full`) vieram de tokens. |
| Todos os estados dos componentes foram respeitados | ✅ Sim | Os botões respeitaram os estados padrão, pressionado (*shape morphing*), foco e desabilitado. |
| Alvos de toque e contraste respeitados | ✅ Sim | Botão principal com `64 dp` (`button.jumbo.height`), secundário com `48 dp` (`button.min-height`) e texto `#1D1B20` sobre `#FACC15` (11,30:1). |
| A IA não inventou valores | ⚠️ Parcial | A IA escreveu `borderWidth: 2` e `size={24}` literais por falta de tokens nomeados para espessura de borda e tamanho de ícone. |

---

## Desvios e correções na documentação

| Desvio observado na Rodada 1 | Causa (o que faltava ou estava ambíguo) | Arquivo corrigido |
| --- | --- | --- |
| Uso de `borderWidth: 2` literal no `StyleSheet` | A espessura de borda padrão (`2 dp`) estava descrita em texto nos componentes, mas não possuía token `border.thin` (`2 dp`) e `border.focus` (`3 dp`). | [02-tokens.md](02-tokens.md) e exemplos em [04-componentes/](04-componentes/) |
| Uso de `size={24}` e `size={28}` literais nos ícones | Os tamanhos de ícone estavam documentados em `03-fundamentos.md`, mas faltavam os tokens `icon.sm` (`16 dp`), `icon.md` (`24 dp`) e `icon.lg` (`28 dp`). | [02-tokens.md](02-tokens.md), [03-fundamentos.md](03-fundamentos.md) e [04-componentes/](04-componentes/) |
| Uso de `maxFontSizeMultiplier={1.5}` literal | A regra de limite de ampliação tipográfica em botões estava em `06-acessibilidade.md`, mas sem o token `typography.maxScale` (`1.5`). | [02-tokens.md](02-tokens.md) e [04-componentes/botao.md](04-componentes/botao.md) |

---

## Rodada 2 (após as correções)

Após adicionar os tokens de borda (`border.thin` = `2 dp`, `border.focus` = `3 dp`), tamanho de ícone (`icon.sm` = `16 dp`, `icon.md` = `24 dp`, `icon.lg` = `28 dp`) e escala máxima (`typography.maxScale` = `1.5`), repetimos exatamente o mesmo prompt.

### Código gerado na Rodada 2 (100% baseado em tokens)

```tsx
import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { tokens } from '../theme/tokens';
import { GameCard } from '../components/GameCard';
import { ExpressiveButton } from '../components/ExpressiveButton';

interface TeamScore {
  id: string;
  name: string;
  score: number;
}

interface RankingScreenProps {
  teams: TeamScore[];
  onChooseAnotherGame: () => void;
  onResetScores: () => void;
}

export function RankingScreen({
  teams,
  onChooseAnotherGame,
  onResetScores,
}: RankingScreenProps) {
  const sortedTeams = [...teams].sort((a, b) => b.score - a.score);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      accessibilityRole=" adjustable"
    >
      <View style={styles.header}>
        <View style={styles.trophyBadge}>
          <MaterialCommunityIcons
            name="trophy-award"
            size={tokens.semantic.icon.lg}
            color={tokens.semantic.color.onHighlight}
          />
        </View>
        <Text allowFontScaling style={styles.title}>
          Ranking do Encontro
        </Text>
        <Text allowFontScaling style={styles.subtitle}>
          Pontuação oficial das dinâmicas de hoje!
        </Text>
      </View>

      <View style={styles.list}>
        {sortedTeams.map((team, index) => {
          const isLeader = index === 0;
          return (
            <GameCard
              key={team.id}
              title={`${index + 1}º · ${team.name}`}
              playersTag={`${team.score} pts`}
              description={
                isLeader ? 'Equipe Campeã da Rodada' : 'Equipe Participante'
              }
              icon={isLeader ? 'crown' : 'account-group'}
              highlightLeader={isLeader}
            />
          );
        })}
      </View>

      <View style={styles.actions}>
        <ExpressiveButton
          label="Escolher Outro Jogo"
          icon="gamepad-variant"
          variant="primaryJumbo"
          onPress={onChooseAnotherGame}
        />
        <ExpressiveButton
          label="Zerar Placar do PG"
          icon="refresh"
          variant="outlined"
          onPress={onResetScores}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: tokens.semantic.color.surface,
  },
  content: {
    padding: tokens.semantic.space.md,
    gap: tokens.semantic.space.lg,
  },
  header: {
    alignItems: 'center',
    gap: tokens.semantic.space.xs,
  },
  trophyBadge: {
    width: tokens.semantic.space.xxxl,
    height: tokens.semantic.space.xxxl,
    borderRadius: tokens.semantic.radius.full,
    backgroundColor: tokens.semantic.color.highlight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontFamily: tokens.semantic.font.title.family,
    fontSize: tokens.semantic.font.title.size,
    fontWeight: tokens.semantic.font.title.weight,
    color: tokens.semantic.color.onSurface,
  },
  subtitle: {
    fontFamily: tokens.semantic.font.body.family,
    fontSize: tokens.semantic.font.body.size,
    color: tokens.semantic.color.onSurfaceMuted,
  },
  list: {
    gap: tokens.semantic.space.sm,
  },
  actions: {
    gap: tokens.semantic.space.sm,
  },
});
```

### Resultado da Rodada 2

| Verificação | Passou? | Observação |
| --- | --- | --- |
| Cores, espaços e raios vieram de tokens | ✅ Sim | 100% das propriedades visuais referenciam o objeto `tokens`. |
| Todos os estados dos componentes foram respeitados | ✅ Sim | `GameCard` com variante `highlightLeader` e `ExpressiveButton` com variantes `primaryJumbo` (apenas 1 primário na tela) e `outlined`. |
| Alvos de toque e contraste respeitados | ✅ Sim | Alvos de `64 dp` e `48 dp`, contraste mínimo superior a `8,6:1`. |
| A IA não inventou valores | ✅ Sim | Zero números mágicos ou strings hexadecimais no código. |
