import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ConfirmModal } from '@/view/components/confirmModal';
import { DrawingCanvas } from '@/view/components/drawingCanvas';
import { ExpressiveButton } from '@/view/components/expressiveButton';
import { ExpressiveChip } from '@/view/components/expressiveChip';
import { ExpressiveTag } from '@/view/components/expressiveTag';
import { ExpressiveTimer } from '@/view/components/expressiveTimer';
import { GameCard } from '@/view/components/gameCard';
import { useReduceMotion } from '@/view/components/useReduceMotion';
import { useTheme, type AppTokens } from '@/view/theme';
import {
  ALL_DESENHO_CATEGORIES,
  useDesenhoViewModel,
  type DesenhoDurationOption,
} from '@/viewmodel/useDesenhoViewModel';

const DESENHO_DURATIONS: DesenhoDurationOption[] = [60, 90, 120];
const DESENHO_ROUNDS = [1, 2, 3, 4, 5];

export const DesenhoScreen = () => {
  const [state, actions] = useDesenhoViewModel();
  useReduceMotion(actions.handleSetReduceMotion);
  const activeTokens = useTheme();
  const styles = useMemo(() => createStyles(activeTokens), [activeTokens]);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);

  const canvasDisabled =
    state.phase !== 'drawing' || state.confirmingExit || state.secondsRemaining === 0;

  useEffect(() => {
    if (canvasDisabled) {
      setIsDrawing(false);
    }
  }, [canvasDisabled]);

  if (state.loading) {
    return (
      <View
        style={styles.screen}
        accessibilityRole="progressbar"
        accessibilityLabel="Carregando Arena de Desenho Relâmpago"
      >
        <Text allowFontScaling style={styles.titleText}>
          Preparando a Arena de Desenho Relâmpago...
        </Text>
      </View>
    );
  }

  if (state.error) {
    return (
      <View style={styles.screen} accessibilityLiveRegion="assertive">
        <GameCard
          title="Atenção na Arena"
          description={state.error}
          playersTag="Erro"
          playersTagTone="error"
          icon="alert-circle"
        />
        <ExpressiveButton
          label="Tentar Novamente"
          variant="primary"
          icon="play"
          onPress={() => {
            void actions.handleRetry();
          }}
        />
      </View>
    );
  }

  if (state.teams.length < 2) {
    return (
      <View style={styles.screen}>
        <GameCard
          title="Equipes Insuficientes"
          description="Cadastre pelo menos 2 equipes para iniciar uma partida de Desenho Relâmpago."
          playersTag="Mínimo 2 equipes"
          icon="account-multiple-plus"
        />
        <ExpressiveButton
          label="Voltar ao Início"
          variant="outlined"
          onPress={actions.handleConfirmExit}
        />
      </View>
    );
  }

  const teamName = state.currentTeam?.name ?? 'Equipe';
  const teamScore = state.currentTeam?.score ?? 0;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.screen}
      keyboardShouldPersistTaps="handled"
      scrollEnabled={!isDrawing}
    >
      <View style={styles.topBar}>
        <ExpressiveButton
          label="Sair"
          variant="outlined"
          icon="arrow-left"
          onPress={actions.handleRequestExit}
        />
        <ExpressiveTag
          label={`Rodada ${state.currentRound}/${state.totalRounds}`}
          tone="neutral"
        />
      </View>

      <ConfirmModal
        visible={state.confirmingExit}
        title="Deseja encerrar a partida de Desenho Relâmpago?"
        description="O progresso desta rodada será encerrado para o grupo."
        onCancel={actions.handleCancelExit}
        onConfirm={actions.handleConfirmExit}
      />

      <View
        style={styles.teamHeader}
        accessible
        accessibilityLabel={`Vez da equipe ${teamName}, ${teamScore} pontos`}
        accessibilityLiveRegion="polite"
      >
        <View style={styles.teamInfo}>
          <Text allowFontScaling style={styles.teamCaption}>
            Vez da equipe
          </Text>
          <Text allowFontScaling numberOfLines={2} style={styles.teamLabel}>
            {teamName}
          </Text>
        </View>
        <Text allowFontScaling numberOfLines={1} style={styles.scoreLabel}>
          {`${teamScore} pts`}
        </Text>
      </View>

      {state.phase === 'pass-turn' && (
        <View style={styles.phaseContainer}>
          {state.currentRound === 1 && state.currentTeamIndex === 0 && (
            <View style={styles.packsCard}>
              <Text allowFontScaling style={styles.packsTitle}>
                Pacotes Desenháveis
              </Text>
              <Text allowFontScaling style={styles.packsCaption}>
                Toque nos chips para combinar os temas desta partida (mínimo 1 pacote).
              </Text>
              <View style={styles.chipsWrap}>
                {ALL_DESENHO_CATEGORIES.map((category) => {
                  const isSelected = state.selectedCategories.includes(category);
                  return (
                    <ExpressiveChip
                      key={category}
                      label={category}
                      icon={isSelected ? 'check' : undefined}
                      selected={isSelected}
                      accessibilityLabel={`Pacote ${category}`}
                      onPress={() => {
                        void actions.handleToggleCategory(category);
                      }}
                    />
                  );
                })}
              </View>
              {state.categoryWarning && (
                <View style={styles.warningBanner} accessibilityLiveRegion="polite">
                  <Text allowFontScaling style={styles.warningText}>
                    {state.categoryWarning}
                  </Text>
                </View>
              )}
            </View>
          )}

          <GameCard
            title="Passe o celular ao desenhista"
            description="A palavra secreta e a folha de desenho só aparecerão após tocar no botão abaixo!"
            playersTag={`${state.turnDurationSeconds}s por turno`}
            icon="palette"
          />

          {state.currentRound === 1 && state.currentTeamIndex === 0 ? (
            <View style={styles.settingsCard}>
              <Text allowFontScaling style={styles.settingsTitle}>
                Parâmetros da Partida
              </Text>
              <Text allowFontScaling style={styles.settingsLabel}>
                Tempo por turno
              </Text>
              <View style={styles.chipRow}>
                {DESENHO_DURATIONS.map((seconds) => (
                  <ExpressiveChip
                    key={seconds}
                    label={`${seconds}s`}
                    accessibilityLabel={`${seconds} segundos por turno`}
                    selected={state.turnDurationSeconds === seconds}
                    onPress={() => {
                      void actions.handleSelectDuration(seconds);
                    }}
                  />
                ))}
              </View>
              <Text allowFontScaling style={styles.settingsLabel}>
                Rodadas
              </Text>
              <View style={styles.chipRow}>
                {DESENHO_ROUNDS.map((rounds) => (
                  <ExpressiveChip
                    key={rounds}
                    label={`${rounds}`}
                    accessibilityLabel={`${rounds} ${rounds === 1 ? 'rodada' : 'rodadas'}`}
                    selected={state.totalRounds === rounds}
                    onPress={() => {
                      void actions.handleSelectRounds(rounds);
                    }}
                  />
                ))}
              </View>
            </View>
          ) : null}

          <ExpressiveButton
            label="Estou Pronto!"
            variant="primaryJumbo"
            icon="play"
            onPress={actions.handleStartTurn}
          />
        </View>
      )}

      {state.phase === 'drawing' && (
        <View style={styles.phaseContainer}>
          <ExpressiveTimer
            secondsRemaining={state.secondsRemaining}
            reduceMotion={state.reduceMotion}
          />

          <View
            style={styles.wordCard}
            accessible
            accessibilityLabel={
              state.wordVisible && state.currentCard
                ? `Palavra secreta: ${state.currentCard.word}. Categoria: ${state.currentCard.category}. Regra de honra: Sem letras nem números.`
                : 'Palavra oculta — só o desenhista sabe. Regra de honra: Sem letras nem números.'
            }
          >
            <ExpressiveTag
              label={state.currentCard?.category ?? 'Desenho'}
              tone="secondary"
            />
            <Text
              allowFontScaling
              maxFontSizeMultiplier={activeTokens.semantic.typography.maxScale}
              style={styles.secretWord}
            >
              {state.wordVisible && state.currentCard
                ? state.currentCard.word
                : 'Palavra oculta — só o desenhista sabe'}
            </Text>
            <View style={styles.honorRuleBanner}>
              <MaterialCommunityIcons
                name="pencil-off-outline"
                size={activeTokens.semantic.icon.sm}
                color={activeTokens.component.banner.warning.text}
              />
              <Text allowFontScaling style={styles.honorRuleText}>
                Sem letras nem números
              </Text>
            </View>
          </View>

          <ExpressiveButton
            label={state.wordVisible ? 'Esconder do Grupo' : 'Mostrar Palavra'}
            variant="tonal"
            icon={state.wordVisible ? 'eye-off-outline' : 'eye-outline'}
            onPress={actions.handleToggleWordVisibility}
          />

          <DrawingCanvas
            strokes={state.strokes}
            selectedColor={state.selectedColor}
            selectedWidth={state.selectedWidth}
            disabled={canvasDisabled}
            reduceMotion={state.reduceMotion}
            onStrokeComplete={actions.handleAddStroke}
            onSelectColor={actions.handleSelectColor}
            onSelectWidth={actions.handleSelectWidth}
            onUndo={actions.handleUndoStroke}
            onClear={actions.handleClearCanvas}
            onDrawingStart={() => setIsDrawing(true)}
            onDrawingEnd={() => setIsDrawing(false)}
          />

          <View style={styles.actionGroup}>
            <ExpressiveButton
              label="Acertaram! (+20 pts)"
              variant="successJumbo"
              icon="check"
              disabled={canvasDisabled}
              onPress={() => {
                void actions.handleHit();
              }}
            />
            <ExpressiveButton
              label="Pular (-5 pts)"
              variant="secondary"
              icon="skip-next"
              disabled={canvasDisabled}
              onPress={() => {
                void actions.handleSkip();
              }}
            />
          </View>
        </View>
      )}

      {state.phase === 'turn-summary' && (
        <View style={styles.phaseContainer} accessibilityLiveRegion="assertive">
          <GameCard
            title={`Fim do Turno — ${teamName}`}
            description={`Acertos: ${state.turnHits} | Pulos: ${state.turnSkips} | Saldo do turno: ${
              state.turnPointsDelta >= 0 ? `+${state.turnPointsDelta}` : state.turnPointsDelta
            } pts${
              state.lastTurnCard
                ? ` | Última palavra: ${state.lastTurnCard.word}`
                : ''
            }`}
            playersTag={`Total: ${teamScore} pts`}
            icon="timer-outline"
          />
          <ExpressiveButton
            label={state.isLastTurn ? 'Ver Resumo Final' : 'Próxima Equipe'}
            variant="primaryJumbo"
            icon={state.isLastTurn ? 'flag-checkered' : 'play'}
            onPress={actions.handleNextTurn}
          />
        </View>
      )}

      {state.phase === 'finished' && (
        <View style={styles.phaseContainer} accessibilityLiveRegion="polite">
          <GameCard
            title="Partida de Desenho Relâmpago Concluída!"
            description="Todas as rodadas ou palavras do pacote atual foram finalizadas. Confira a classificação geral do PG!"
            playersTag="Concluído"
            playersTagTone="success"
            highlightLeader
            icon="party-popper"
          />
          <ExpressiveButton
            label="Ir para o Placar Final"
            variant="primaryJumbo"
            icon="trophy"
            onPress={actions.handleGoToScoreboard}
          />
        </View>
      )}
    </ScrollView>
  );
};

const createStyles = (activeTokens: AppTokens) => {
  const { color, font, radius, space, border, elevation } = activeTokens.semantic;
  const { card, banner } = activeTokens.component;
  return StyleSheet.create({
    scroll: {
      flex: 1,
      backgroundColor: color.surface,
    },
    screen: {
      flexGrow: 1,
      backgroundColor: color.surface,
      padding: space.md,
      gap: space.md,
    },
    topBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: space.sm,
    },
    teamHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: space.md,
      backgroundColor: color.actionContainer,
      paddingHorizontal: space.md,
      paddingVertical: space.sm,
      borderRadius: radius.lg,
    },
    teamInfo: {
      flex: 1,
    },
    teamCaption: {
      fontFamily: font.caption.family,
      fontSize: font.caption.size,
      fontWeight: font.caption.weight,
      lineHeight: font.caption.lineHeight,
      color: color.onActionContainer,
    },
    teamLabel: {
      fontFamily: font.subtitle.family,
      fontSize: font.subtitle.size,
      fontWeight: font.subtitle.weight,
      lineHeight: font.subtitle.lineHeight,
      color: color.onActionContainer,
    },
    scoreLabel: {
      fontFamily: font.title.family,
      fontSize: font.title.size,
      fontWeight: font.title.weight,
      lineHeight: font.title.lineHeight,
      color: color.onActionContainer,
      flexShrink: 0,
    },
    phaseContainer: {
      flex: 1,
      gap: space.md,
      justifyContent: 'center',
    },
    packsCard: {
      backgroundColor: card.bg,
      borderColor: card.border,
      borderWidth: border.thin,
      borderRadius: radius.lg,
      padding: space.md,
      gap: space.sm,
    },
    packsTitle: {
      fontFamily: font.subtitle.family,
      fontSize: font.subtitle.size,
      fontWeight: font.subtitle.weight,
      lineHeight: font.subtitle.lineHeight,
      color: color.onSurface,
    },
    packsCaption: {
      fontFamily: font.caption.family,
      fontSize: font.caption.size,
      fontWeight: font.caption.weight,
      lineHeight: font.caption.lineHeight,
      color: color.onSurfaceMuted,
    },
    chipsWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: space.sm,
    },
    warningBanner: {
      backgroundColor: banner.error.bg,
      borderColor: banner.error.border,
      borderWidth: border.thin,
      borderRadius: banner.radius,
      paddingHorizontal: space.md,
      paddingVertical: space.sm,
    },
    warningText: {
      fontFamily: font.caption.family,
      fontSize: font.caption.size,
      fontWeight: font.caption.weight,
      lineHeight: font.caption.lineHeight,
      color: banner.error.text,
    },
    wordCard: {
      backgroundColor: card.bg,
      borderColor: card.border,
      borderWidth: border.thin,
      borderRadius: card.radius,
      padding: space.md,
      elevation: elevation.card,
      alignItems: 'center',
      gap: space.sm,
    },
    secretWord: {
      fontFamily: font.display.family,
      fontSize: font.display.size,
      fontWeight: font.display.weight,
      lineHeight: font.display.lineHeight,
      color: color.onSurface,
      textAlign: 'center',
    },
    honorRuleBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.xs,
      backgroundColor: banner.warning.bg,
      borderColor: banner.warning.border,
      borderWidth: border.thin,
      borderRadius: banner.radius,
      paddingHorizontal: space.md,
      paddingVertical: space.xs,
    },
    honorRuleText: {
      fontFamily: font.tag.family,
      fontSize: font.tag.size,
      fontWeight: font.tag.weight,
      lineHeight: font.tag.lineHeight,
      color: banner.warning.text,
    },
    actionGroup: {
      gap: space.sm,
    },
    titleText: {
      fontFamily: font.title.family,
      fontSize: font.title.size,
      fontWeight: font.title.weight,
      lineHeight: font.title.lineHeight,
      color: color.onSurface,
      textAlign: 'center',
    },
    settingsCard: {
      backgroundColor: card.bg,
      borderColor: card.border,
      borderWidth: border.thin,
      borderRadius: card.radius,
      padding: card.padding,
      gap: space.sm,
    },
    settingsTitle: {
      fontFamily: font.subtitle.family,
      fontSize: font.subtitle.size,
      fontWeight: font.subtitle.weight,
      lineHeight: font.subtitle.lineHeight,
      color: color.onSurface,
    },
    settingsLabel: {
      fontFamily: font.label.family,
      fontSize: font.label.size,
      fontWeight: font.label.weight,
      lineHeight: font.label.lineHeight,
      color: color.onSurfaceMuted,
    },
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: space.sm,
    },
  });
};

export default DesenhoScreen;
