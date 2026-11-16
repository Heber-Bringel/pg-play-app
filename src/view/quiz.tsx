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
import { border, color, font, icon, radius, space } from '@/view/theme';
import { useQuizViewModel } from '@/viewmodel/useQuizViewModel';

export const QuizScreen = () => {
  const [state, actions] = useQuizViewModel();

  if (state.loading) {
    return (
      <View
        style={[styles.screen, styles.padded]}
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
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.stackContent}
        accessibilityLiveRegion="assertive"
      >
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
      </ScrollView>
    );
  }

  if (state.confirmingExit) {
    return (
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.stackContent}
      >
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
      </ScrollView>
    );
  }

  if (state.phase === 'finished') {
    return (
      <View style={styles.screen}>
        <ScrollView contentContainerStyle={styles.stackContent}>
          <View style={styles.finishedHeader}>
            <View style={styles.trophyCircle}>
              <MaterialCommunityIcons
                name="party-popper"
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
        </ScrollView>

        <View style={styles.fixedFooter}>
          <ExpressiveButton
            label="Ir para o Placar Final"
            variant="primaryJumbo"
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
        <ScrollView contentContainerStyle={styles.passTurnScroll}>
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
                  size={icon.lg}
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
        </ScrollView>

        <View style={styles.fixedFooter}>
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
    <View style={styles.screen}>
      <ScrollView
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
            title={currentQuestion.question}
            description="Toque na alternativa correta antes que o tempo acabe."
            playersTag={`${currentQuestion.category} · +10 pts`}
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
          <View
            style={[
              styles.feedbackCard,
              {
                backgroundColor: state.isCorrect
                  ? color.success
                  : color.errorContainer,
              },
            ]}
            accessibilityLiveRegion="polite"
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
        )}
      </ScrollView>

      {isAnswered && (
        <View style={styles.fixedFooter}>
          <ExpressiveButton
            label="Próxima Pergunta"
            variant="primaryJumbo"
            icon="arrow-right"
            onPress={actions.handleNextQuestion}
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
  },
  padded: {
    padding: space.md,
  },
  stackContent: {
    flexGrow: 1,
    padding: space.md,
    gap: space.md,
  },
  scrollContent: {
    padding: space.md,
    gap: space.md,
  },
  fixedFooter: {
    paddingHorizontal: space.md,
    paddingTop: space.sm,
    paddingBottom: space.md,
    backgroundColor: color.surface,
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
    borderWidth: border.thin,
    borderColor: color.outline,
  },
  badgeText: {
    fontSize: font.caption.size,
    fontFamily: font.caption.family,
    color: color.onSurfaceMuted,
    fontWeight: font.caption.weight,
    lineHeight: font.caption.lineHeight,
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
    fontWeight: font.caption.weight,
    lineHeight: font.caption.lineHeight,
  },
  title: {
    fontSize: font.title.size,
    fontFamily: font.title.family,
    color: color.onSurface,
    fontWeight: font.title.weight,
    lineHeight: font.title.lineHeight,
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
  feedbackCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.sm,
    padding: space.md,
    borderRadius: radius.md,
    marginTop: space.xs,
  },
  feedbackTextWrapper: {
    flex: 1,
    gap: space.xs,
  },
  feedbackTitle: {
    fontSize: font.subtitle.size,
    fontFamily: font.subtitle.family,
    fontWeight: font.subtitle.weight,
    lineHeight: font.subtitle.lineHeight,
  },
  feedbackExplanation: {
    fontSize: font.body.size,
    fontFamily: font.body.family,
    fontWeight: font.body.weight,
    lineHeight: font.body.lineHeight,
  },
  passTurnScroll: {
    flexGrow: 1,
    padding: space.md,
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
    borderWidth: border.thin,
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
    lineHeight: font.subtitle.lineHeight,
    color: color.onSurfaceMuted,
  },
  passTurnTeamName: {
    fontSize: font.display.size,
    fontFamily: font.display.family,
    color: color.onSurface,
    fontWeight: font.display.weight,
    lineHeight: font.display.lineHeight,
    textAlign: 'center',
  },
  passTurnScore: {
    fontSize: font.body.size,
    fontFamily: font.body.family,
    lineHeight: font.body.lineHeight,
    color: color.onSurfaceMuted,
  },
  instructionNotice: {
    fontSize: font.body.size,
    fontFamily: font.body.family,
    lineHeight: font.body.lineHeight,
    color: color.onSurface,
    textAlign: 'center',
    paddingHorizontal: space.md,
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
  exitActions: {
    gap: space.sm,
    marginTop: space.md,
  },
});

export default QuizScreen;
