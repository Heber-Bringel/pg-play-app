# Cronômetro Expressivo (ExpressiveTimer)

Origem no sistema base: Não existe no Material 3 base; construído com os subsistemas de *Shape Morphing* e *Motion Physics* do Material 3 Expressive (2025). Situação: **Novo**. Motivo da criação: minigames presenciais (Mímica e Quiz Relâmpago) exigem um indicador de tempo altamente visível à distância que comunique urgência nos segundos finais por meio de forma, cor, ícone e movimento elástico.

## Quando usar

- No topo das telas de Arena de Mímica e Arena de Quiz para exibir a contagem regressiva da rodada atual.

## Quando não usar

- Para exibir horários estáticos de encontros do PG (use texto simples com `font.body`).
- Em jogos sem limite de tempo por jogada, como o modo cooperativo livre do Jogo da Forca.

## Anatomia

1. **Container mutável:** altura mínima `space.2xl` (`48 dp`), padding horizontal `space.lg` (`24 dp`), fundo `timer.bg.normal` (`color.highlight`) e raio `timer.radius.normal` (`9999 dp`) que se transforma em `timer.radius.critical` (`16 dp`) com fundo `timer.bg.critical` (`color.error`) quando restam `10 segundos` ou menos.
2. **Ícone de estado:** tamanho `24 dp`; exibe `timer-outline` no estado normal e troca automaticamente para `alert` no estado crítico.
3. **Visor numérico:** tipografia `font.title` (`24 dp`, peso `800`) formatada como `MM:SS`, usando `timer.text.normal` (`color.on-highlight`) no estado normal e `timer.text.critical` (`color.on-error`) no estado crítico.

## Variantes

| Variante | Uso | Tokens |
| --- | --- | --- |
| `Normal (> 10s)` | Contagem regressiva padrão da rodada | `timer.bg.normal`, `timer.text.normal`, `timer.radius.normal` |
| `Crítico (≤ 10s)` | Alerta de últimos 10 segundos da rodada | `timer.bg.critical`, `timer.text.critical`, `timer.radius.critical`, `motion.duration.long` |
| `Pausado` | Partida temporariamente pausada pelo líder do PG | `color.surface-variant`, `color.on-surface-muted`, `timer.radius.normal` |

## Estados

| Estado | Aparência (tokens) | Comportamento | Acessibilidade |
| --- | --- | --- | --- |
| Padrão (Normal) | Fundo `timer.bg.normal` (`#FACC15`), texto `timer.text.normal` (`#1D1B20`), pílula `9999 dp`, ícone `timer-outline` | Atualiza os segundos a cada `1000 ms` | Anunciado como `accessibilityRole="timer"` |
| Crítico (≤ 10s) | Fundo `timer.bg.critical`, texto `timer.text.critical`, raio `16 dp`, ícone `alert` | Pulsa entre escala `1.0` e `1.08` com `motion.spring.spatial` (se reduzir movimento estiver desativado) | Anuncia `"Atenção: 10 segundos restantes"` via `accessibilityLiveRegion="assertive"` |
| Hover | Não se aplica (componente informativo ou de toque apenas para pausa) | - | - |
| Pressionado | Escala `0.96` quando tocado para pausar | Pausa ou retoma a contagem se habilitado | Anuncia estado pausado |
| Foco | Anel externo de `3 dp` em `color.focus` | Visível quando navegável por teclado | - |
| Esgotado (00:00) | Fundo `timer.bg.critical`, texto `"00:00"`, ícone `bell-ring` | Encerra a rodada e bloqueia novas respostas | Anuncia `"Tempo esgotado"` |

## Acessibilidade

- **Alvo de toque mínimo:** `48 dp` de altura por `136 dp` de largura mínima.
- **Contraste:** estado normal (`#1D1B20` sobre `#FACC15`) com razão de **11,30:1**; estado crítico com razão de **6,47:1** no claro e **8,90:1** no escuro (ver [06-acessibilidade.md](../06-acessibilidade.md)).
- **Leitor de tela e Movimento:** para não interromper o leitor de tela a cada segundo, o anúncio automático ocorre apenas no início da rodada, ao atingir `10 segundos` e ao chegar a `0 segundos`. Se `isReduceMotionEnabled` estiver ativo, a pulsação elástica é desativada mantendo a troca de cor, forma e ícone.

## Faça e evite

- **Faça:** combine sempre a mudança de cor com a mudança de forma (pílula para retângulo arredondado) e troca de ícone nos `10 segundos` finais.
- **Evite:** fazer o cronômetro piscar rapidamente (mais de 3 vezes por segundo), o que viola a diretriz WCAG 2.3.1 de prevenção contra convulsões.

## Código

```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { tokens } from '../theme/tokens';

interface ExpressiveTimerProps {
  secondsRemaining: number;
}

export function ExpressiveTimer({ secondsRemaining }: ExpressiveTimerProps) {
  const isCritical = secondsRemaining <= 10;
  const formattedSeconds =
    secondsRemaining < 10 ? `0${secondsRemaining}` : `${secondsRemaining}`;

  return (
    <View
       accessibilityRole="timer"
      accessibilityLabel={`Tempo restante: ${secondsRemaining} segundos`}
      accessibilityLiveRegion={isCritical ? 'assertive' : 'none'}
      style={[
        styles.container,
        {
          backgroundColor: isCritical
            ? tokens.component.timer.bgCritical
            : tokens.component.timer.bgNormal,
          borderRadius: isCritical
            ? tokens.component.timer.radiusCritical
            : tokens.component.timer.radiusNormal,
        },
      ]}
    >
      <MaterialCommunityIcons
        name={isCritical ? 'alert' : 'timer-outline'}
        size={tokens.semantic.icon.md}
        color={
          isCritical
            ? tokens.component.timer.textCritical
            : tokens.component.timer.textNormal
        }
      />
      <Text
        allowFontScaling
        maxFontSizeMultiplier={tokens.semantic.typography.maxScale}
        style={[
          styles.timeText,
          {
            color: isCritical
              ? tokens.component.timer.textCritical
              : tokens.component.timer.textNormal,
          },
        ]}
      >
        00:{formattedSeconds}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: tokens.semantic.space.xxl,
    paddingHorizontal: tokens.semantic.space.lg,
    paddingVertical: tokens.semantic.space.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.semantic.space.sm,
  },
  timeText: {
    fontFamily: tokens.semantic.font.title.family,
    fontSize: tokens.semantic.font.title.size,
    fontWeight: tokens.semantic.font.title.weight,
  },
});
```
