import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { ConfirmModal } from '@/view/components/confirmModal';
import { ExpressiveButton } from '@/view/components/expressiveButton';
import { ExpressiveChip } from '@/view/components/expressiveChip';
import { ExpressiveTag } from '@/view/components/expressiveTag';
import { ExpressiveTimer } from '@/view/components/expressiveTimer';
import { GameCard } from '@/view/components/gameCard';
import { useTheme, type AppTokens } from '@/view/theme';
import { ALL_MIMICA_CATEGORIES, useMimicaViewModel } from '@/viewmodel/useMimicaViewModel';

export const MimicaScreen = () => {
  const [state, actions] = useMimicaViewModel();
  const activeTokens = useTheme();
  const styles = useMemo(() => createStyles(activeTokens), [activeTokens]);

  if (state.loading) {
    return (
      <View
        style={styles.screen}
        accessibilityRole="progressbar"
        accessibilityLabel="Carregando Arena de Mímica Expressiva"
      >
        <Text allowFontScaling style={styles.titleText}>
          Preparando a Arena de Mímica...
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
          description="Cadastre pelo menos 2 equipes para iniciar uma partida de Mímica Expressiva."
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
        title="Deseja encerrar a partida de Mímica?"
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
                Pacotes de Conteúdo
              </Text>
              <Text allowFontScaling style={styles.packsCaption}>
                Toque nos chips para combinar os temas desta partida (mínimo 1 pacote).
              </Text>
              <View style={styles.chipsWrap}>
                {ALL_MIMICA_CATEGORIES.map((category) => {
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
            title="Passe o celular ao representante"
            description="A palavra secreta só aparecerá após tocar no botão abaixo!"
            playersTag={`${state.turnDurationSeconds}s por turno`}
            icon="drama-masks"
          />
          <ExpressiveButton
            label="Estou Pronto!"
            variant="primaryJumbo"
            icon="play"
            onPress={actions.handleStartTurn}
          />
        </View>
      )}

      {state.phase === 'playing' && (
        <View style={styles.phaseContainer}>
          <ExpressiveTimer secondsRemaining={state.secondsRemaining} />

          <View
            style={styles.wordCard}
            accessible
            accessibilityLabel={
              state.wordVisible && state.currentCard
                ? `Palavra secreta: ${state.currentCard.word}. Categoria: ${state.currentCard.category}`
                : 'Palavra secreta escondida do grupo'
            }
          >
            <ExpressiveTag
              label={state.currentCard?.category ?? 'Misto'}
              tone="secondary"
            />
            <Text
              allowFontScaling
              maxFontSizeMultiplier={activeTokens.semantic.typography.maxScale}
              style={styles.secretWord}
            >
              {state.wordVisible && state.currentCard
                ? state.currentCard.word
                : 'Palavra escondida'}
            </Text>
          </View>

          <ExpressiveButton
            label={state.wordVisible ? 'Esconder do Grupo' : 'Revelar Palavra'}
            variant="tonal"
            icon={state.wordVisible ? 'eye-off' : 'eye'}
            onPress={actions.handleToggleWordVisibility}
          />

          <View style={styles.actionGroup}>
            <ExpressiveButton
              label="Acertaram! (+20 pts)"
              variant="successJumbo"
              icon="check"
              onPress={() => {
                void actions.handleHit();
              }}
            />
            <ExpressiveButton
              label="Pular (-5 pts)"
              variant="secondary"
              icon="skip-next"
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
            } pts`}
            playersTag={`Total: ${teamScore} pts`}
            icon="timer-outline"
          />
          <ExpressiveButton
            label="Próxima Equipe"
            variant="primaryJumbo"
            icon="play"
            onPress={actions.handleNextTurn}
          />
        </View>
      )}

      {state.phase === 'finished' && (
        <View style={styles.phaseContainer} accessibilityLiveRegion="polite">
          <GameCard
            title="Partida de Mímica Concluída!"
            description="Todas as rodadas ou palavras do pacote atual foram finalizadas. Confira a classificação geral do PG!"
            playersTag="Concluído"
            playersTagTone="success"
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
  const { card } = activeTokens.component;
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
      backgroundColor: color.errorContainer,
      borderRadius: radius.md,
      paddingHorizontal: space.md,
      paddingVertical: space.sm,
    },
    warningText: {
      fontFamily: font.caption.family,
      fontSize: font.caption.size,
      fontWeight: font.caption.weight,
      lineHeight: font.caption.lineHeight,
      color: color.onErrorContainer,
    },
    wordCard: {
      backgroundColor: card.bg,
      borderColor: card.border,
      borderWidth: border.thin,
      borderRadius: card.radius,
      padding: card.padding,
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
  });
};

export default MimicaScreen;
