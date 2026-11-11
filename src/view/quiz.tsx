import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ExpressiveButton } from '@/view/components/expressiveButton';
import { ExpressiveTimer } from '@/view/components/expressiveTimer';
import { GameCard } from '@/view/components/gameCard';
import { QuizOption } from '@/view/components/quizOption';
import { color, font, icon, radius, space } from '@/view/theme';
import { useQuizViewModel } from '@/viewmodel/useQuizViewModel';

export const QuizScreen = () => {
  const [state, actions] = useQuizViewModel();

  if (state.loading) {
    return (
      <View
        style={styles.screen}
        accessibilityRole="progressbar"
        accessibilityLabel="Carregando Arena de Quiz"
      >
        <Text allowFontScaling style={styles.title}>
          Carregando perguntas do Quiz Relâmpago...
        </Text>
      </View>
    );
  }

  if (state.error) {
    return (
      <View style={styles.screen} accessibilityLiveRegion="assertive">
        <GameCard
          title="Atenção"
          description={state.error}
          playersTag="Aviso"
          icon="alert-circle"
        />
        {state.teams.length < 2 ? (
          <ExpressiveButton
            label="Configurar Equipes"
            variant="primaryJumbo"
            icon="account-group"
            onPress={actions.handleGoToTeams}
          />
        ) : (
          <ExpressiveButton
            label="Tentar Novamente"
            variant="primary"
            icon="refresh"
            onPress={() => {
              void actions.handleRetry();
            }}
          />
        )}
      </View>
    );
  }

  if (state.confirmingExit) {
    return (
      <View style={styles.screen}>
        <GameCard
          title="Deseja realmente sair?"
          description="A partida atual de Quiz será encerrada e os pontos acumulados até aqui serão mantidos no placar do encontro."
          playersTag="Confirmação"
          icon="exit-to-app"
        />
        <View style={styles.exitActions}>
          <ExpressiveButton
            label="Continuar Jogando"
            variant="primaryJumbo"
            icon="play"
            onPress={actions.handleCancelExit}
          />
          <ExpressiveButton
            label="Sair da Partida"
            variant="outlined"
            icon="arrow-left"
            onPress={actions.handleConfirmExit}
          />
        </View>
      </View>
    );
  }

  if (state.phase === 'finished') {
    return (
      <View style={styles.screen}>
        <View style={styles.finishedHeader}>
          <View style={styles.trophyCircle}>
            <MaterialCommunityIcons
              name="trophy-outline"
              size={icon.lg}
              color={color.onHighlight}
            />
          </View>
          <Text allowFontScaling style={styles.title}>
            Quiz Relâmpago Concluído!
          </Text>
          <Text allowFontScaling style={styles.subtitle}>
            Todas as perguntas configuradas foram respondidas pelas equipes.
          </Text>
        </View>

        <GameCard
          title="Fim de Partida"
          description="Os pontos conquistados nesta rodada já foram creditados para cada equipe participante."
          playersTag={`${state.teams.length} equipes`}
          icon="check-decagram"
        />

        <View style={styles.finishedFooter}>
          <ExpressiveButton
            label="Ir para o Placar Final"
            variant="successJumbo"
            icon="trophy"
            onPress={actions.handleGoToScoreboard}
          />
        </View>
      </View>
    );
  }

  if (state.phase === 'pass-turn') {
    return (
      <View style={styles.screen}>
        <View style={styles.topBar}>
          <ExpressiveButton
            label="Sair"
            variant="outlined"
            icon="arrow-left"
            onPress={actions.handleRequestExit}
          />
          <View style={styles.badgePill}>
            <Text allowFontScaling style={styles.badgeText}>
              {`Pergunta ${state.currentQuestionIndex + 1} de ${state.totalQuestions}`}
            </Text>
          </View>
        </View>

        <View style={styles.passTurnContent}>
          <View style={styles.passTurnCard}>
            <View style={styles.avatarTeam}>
              <MaterialCommunityIcons
                name="account-group"
                size={icon.md}
                color={color.onActionContainer}
              />
            </View>
            <Text allowFontScaling style={styles.passTurnSubtitle}>
              Passe o celular para:
            </Text>
            <Text allowFontScaling style={styles.passTurnTeamName}>
              {state.currentTeam?.name ?? 'Equipe'}
            </Text>
            <Text allowFontScaling style={styles.passTurnScore}>
              {`${state.currentTeam?.score ?? 0} pts no placar`}
            </Text>
          </View>

          <Text allowFontScaling style={styles.instructionNotice}>
            A equipe terá 20 segundos para responder após tocar no botão abaixo.
          </Text>
        </View>

        <View style={styles.passTurnFooter}>
          <ExpressiveButton
            label="Estou Pronto!"
            variant="primaryJumbo"
            icon="play"
            onPress={actions.handleStartTurn}
          />
        </View>
      </View>
    );
  }

  // Fases: 'playing' ou 'answered'
  const isAnswered = state.phase === 'answered';
  const currentQuestion = state.currentQuestion;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.topBar}>
        <ExpressiveButton
          label="Sair"
          variant="outlined"
          icon="arrow-left"
          onPress={actions.handleRequestExit}
        />
        <View style={styles.headerInfo}>
          <View style={styles.badgePill}>
            <Text allowFontScaling style={styles.badgeText}>
              {`Pergunta ${state.currentQuestionIndex + 1}/${state.totalQuestions}`}
            </Text>
          </View>
          <View style={styles.teamBadgePill}>
            <Text allowFontScaling style={styles.teamBadgeText}>
              {state.currentTeam?.name ?? ''}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.timerWrapper}>
        <ExpressiveTimer secondsRemaining={state.secondsRemaining} />
      </View>

      {currentQuestion && (
        <GameCard
          title={currentQuestion.category}
          description={currentQuestion.question}
          playersTag={`+10 pts`}
          icon="help-circle-outline"
        />
      )}

      <View style={styles.optionsList}>
        {currentQuestion?.options.map((option) => {
          let status: 'default' | 'correct' | 'wrong' = 'default';
          if (isAnswered) {
            if (option.key === currentQuestion.correctKey) {
              status = 'correct';
            } else if (option.key === state.selectedOptionKey) {
              status = 'wrong';
            }
          }

          return (
            <QuizOption
              key={option.key}
              letter={option.key}
              text={option.text}
              status={status}
              disabled={isAnswered}
              onPress={() => {
                void actions.handleSelectOption(option.key);
              }}
            />
          );
        })}
      </View>

      {isAnswered && (
        <View style={styles.resultFeedback}>
          <View
            style={[
              styles.feedbackCard,
              {
                backgroundColor: state.isCorrect
                  ? color.success
                  : color.errorContainer,
              },
            ]}
          >
            <MaterialCommunityIcons
              name={state.isCorrect ? 'check-circle' : 'close-circle'}
              size={icon.md}
              color={state.isCorrect ? color.onSuccess : color.onErrorContainer}
            />
            <View style={styles.feedbackTextWrapper}>
              <Text
                allowFontScaling
                style={[
                  styles.feedbackTitle,
                  {
                    color: state.isCorrect
                      ? color.onSuccess
                      : color.onErrorContainer,
                  },
                ]}
              >
                {state.isCorrect
                  ? 'Resposta Correta! (+10 pts)'
                  : 'Resposta Incorreta! (0 pts)'}
              </Text>
              {currentQuestion?.explanation && (
                <Text
                  allowFontScaling
                  style={[
                    styles.feedbackExplanation,
                    {
                      color: state.isCorrect
                        ? color.onSuccess
                        : color.onErrorContainer,
                    },
                  ]}
                >
                  {currentQuestion.explanation}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.nextActionWrapper}>
            <ExpressiveButton
              label="Próxima Pergunta"
              variant="primaryJumbo"
              icon="arrow-right"
              onPress={actions.handleNextQuestion}
            />
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: color.surface,
    padding: space.md,
  },
  scrollContent: {
    paddingBottom: space.xxl,
    gap: space.md,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: space.sm,
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
  },
  badgePill: {
    backgroundColor: color.surfaceContainer,
    paddingHorizontal: space.sm,
    paddingVertical: space.xs,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: color.outline,
  },
  badgeText: {
    fontSize: font.caption.size,
    fontFamily: font.caption.family,
    color: color.onSurfaceMuted,
    fontWeight: font.caption.weight,
  },
  teamBadgePill: {
    backgroundColor: color.actionContainer,
    paddingHorizontal: space.sm,
    paddingVertical: space.xs,
    borderRadius: radius.full,
  },
  teamBadgeText: {
    fontSize: font.caption.size,
    fontFamily: font.caption.family,
    color: color.onActionContainer,
    fontWeight: '700',
  },
  title: {
    fontSize: font.title.size,
    fontFamily: font.title.family,
    color: color.onSurface,
    fontWeight: font.title.weight,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: font.body.size,
    fontFamily: font.body.family,
    color: color.onSurfaceMuted,
    lineHeight: font.body.lineHeight,
    textAlign: 'center',
  },
  timerWrapper: {
    alignItems: 'center',
    marginVertical: space.xs,
  },
  optionsList: {
    gap: space.sm,
  },
  resultFeedback: {
    gap: space.md,
    marginTop: space.xs,
  },
  feedbackCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.sm,
    padding: space.md,
    borderRadius: radius.md,
  },
  feedbackTextWrapper: {
    flex: 1,
    gap: space.xs,
  },
  feedbackTitle: {
    fontSize: font.subtitle.size,
    fontFamily: font.subtitle.family,
    fontWeight: font.subtitle.weight,
  },
  feedbackExplanation: {
    fontSize: font.caption.size,
    fontFamily: font.caption.family,
    lineHeight: font.body.lineHeight,
  },
  nextActionWrapper: {
    marginTop: space.xs,
  },
  passTurnContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: space.md,
  },
  passTurnCard: {
    backgroundColor: color.surfaceContainer,
    padding: space.xl,
    borderRadius: radius.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: color.outline,
    gap: space.sm,
    width: '100%',
  },
  avatarTeam: {
    width: space.xxxl,
    height: space.xxxl,
    borderRadius: radius.full,
    backgroundColor: color.actionContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  passTurnSubtitle: {
    fontSize: font.subtitle.size,
    fontFamily: font.subtitle.family,
    color: color.onSurfaceMuted,
  },
  passTurnTeamName: {
    fontSize: font.display.size,
    fontFamily: font.display.family,
    color: color.onSurface,
    fontWeight: font.display.weight,
    textAlign: 'center',
  },
  passTurnScore: {
    fontSize: font.caption.size,
    fontFamily: font.caption.family,
    color: color.onSurfaceMuted,
  },
  instructionNotice: {
    fontSize: font.caption.size,
    fontFamily: font.caption.family,
    color: color.onSurfaceMuted,
    textAlign: 'center',
    paddingHorizontal: space.md,
  },
  passTurnFooter: {
    paddingBottom: space.md,
  },
  finishedHeader: {
    alignItems: 'center',
    gap: space.sm,
    marginVertical: space.md,
  },
  trophyCircle: {
    width: space.xxxl,
    height: space.xxxl,
    borderRadius: radius.full,
    backgroundColor: color.highlight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  finishedFooter: {
    marginTop: space.md,
  },
  exitActions: {
    gap: space.sm,
    marginTop: space.md,
  },
});

export default QuizScreen;
