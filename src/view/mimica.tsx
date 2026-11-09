import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ExpressiveButton } from '@/view/components/expressiveButton';
import { ExpressiveTimer } from '@/view/components/expressiveTimer';
import { GameCard } from '@/view/components/gameCard';
import { border, color, font, radius, space, typography } from '@/view/theme';
import { useMimicaViewModel } from '@/viewmodel/useMimicaViewModel';

export const MimicaScreen = () => {
  const [state, actions] = useMimicaViewModel();

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
    <View style={styles.screen}>
      <View style={styles.topBar}>
        <ExpressiveButton
          label="Sair"
          variant="outlined"
          icon="close-circle"
          onPress={actions.handleRequestExit}
        />
        <View style={styles.roundBadge}>
          <Text allowFontScaling style={styles.roundText}>
            {`Rodada ${state.currentRound}/${state.totalRounds}`}
          </Text>
        </View>
      </View>

      {state.confirmingExit && (
        <View style={styles.exitBanner} accessibilityLiveRegion="polite">
          <Text allowFontScaling style={styles.exitTitle}>
            Deseja encerrar a partida de Mímica?
          </Text>
          <View style={styles.exitActions}>
            <ExpressiveButton
              label="Continuar Jogando"
              variant="tonal"
              onPress={actions.handleCancelExit}
            />
            <ExpressiveButton
              label="Confirmar Saída"
              variant="secondary"
              onPress={actions.handleConfirmExit}
            />
          </View>
        </View>
      )}

      <View style={styles.teamHeader} accessibilityLiveRegion="polite">
        <Text allowFontScaling style={styles.teamLabel}>
          {`Vez da Equipe: ${teamName}`}
        </Text>
        <Text allowFontScaling style={styles.scoreLabel}>
          {`${teamScore} pts`}
        </Text>
      </View>

      {state.phase === 'pass-turn' && (
        <View style={styles.phaseContainer}>
          <GameCard
            title={`Vez da Equipe ${teamName}`}
            description="Passe o celular ao representante da vez. A palavra secreta só aparecerá após tocar no botão abaixo!"
            playersTag={`${state.turnDurationSeconds}s por turno`}
            icon="drama-masks"
            highlightLeader
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
            <Text allowFontScaling style={styles.categoryTag}>
              {state.currentCard?.category ?? 'Misto'}
            </Text>
            <Text
              allowFontScaling
              maxFontSizeMultiplier={typography.maxScale}
              style={styles.secretWord}
            >
              {state.wordVisible && state.currentCard
                ? state.currentCard.word
                : '🤫 Palavra escondida'}
            </Text>
          </View>

          <ExpressiveButton
            label={state.wordVisible ? 'Esconder do Grupo' : 'Revelar Palavra'}
            variant="tonal"
            icon="eye"
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
            icon="trophy"
            highlightLeader
          />
          <ExpressiveButton
            label="Ir para o Placar Final"
            variant="primaryJumbo"
            icon="trophy"
            onPress={actions.handleGoToScoreboard}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
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
  roundBadge: {
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
    borderRadius: radius.full,
    backgroundColor: color.surfaceVariant,
  },
  roundText: {
    fontFamily: font.caption.family,
    fontSize: font.caption.size,
    fontWeight: font.caption.weight,
    color: color.onSurface,
  },
  exitBanner: {
    backgroundColor: color.errorContainer,
    borderColor: color.error,
    borderWidth: border.thin,
    borderRadius: radius.lg,
    padding: space.md,
    gap: space.sm,
  },
  exitTitle: {
    fontFamily: font.subtitle.family,
    fontSize: font.subtitle.size,
    fontWeight: font.subtitle.weight,
    color: color.onErrorContainer,
  },
  exitActions: {
    flexDirection: 'row',
    gap: space.sm,
    flexWrap: 'wrap',
  },
  teamHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: color.actionContainer,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.lg,
  },
  teamLabel: {
    fontFamily: font.subtitle.family,
    fontSize: font.subtitle.size,
    fontWeight: font.subtitle.weight,
    color: color.onActionContainer,
  },
  scoreLabel: {
    fontFamily: font.title.family,
    fontSize: font.title.size,
    fontWeight: font.title.weight,
    color: color.onActionContainer,
  },
  phaseContainer: {
    flex: 1,
    gap: space.md,
    justifyContent: 'center',
  },
  wordCard: {
    backgroundColor: color.surfaceContainer,
    borderColor: color.outline,
    borderWidth: border.thin,
    borderRadius: radius.xl,
    padding: space.lg,
    alignItems: 'center',
    gap: space.sm,
  },
  categoryTag: {
    fontFamily: font.caption.family,
    fontSize: font.caption.size,
    fontWeight: font.caption.weight,
    color: color.onSurfaceMuted,
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
    color: color.onSurface,
    textAlign: 'center',
  },
});

export default MimicaScreen;
