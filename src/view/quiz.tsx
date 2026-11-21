import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ConfirmModal } from '@/view/components/confirmModal';
import { ExpressiveButton } from '@/view/components/expressiveButton';
import { ExpressiveChip } from '@/view/components/expressiveChip';
import { ExpressiveTag } from '@/view/components/expressiveTag';
import { ExpressiveTimer } from '@/view/components/expressiveTimer';
import { GameCard } from '@/view/components/gameCard';
import { QuizOption } from '@/view/components/quizOption';
import { useTheme, type AppTokens } from '@/view/theme';
import {
  useQuizViewModel,
  type QuizDurationOption,
  type QuizQuestionCountOption,
} from '@/viewmodel/useQuizViewModel';

const QUIZ_DURATIONS: QuizDurationOption[] = [15, 20, 30];
const QUIZ_QUESTION_COUNTS: QuizQuestionCountOption[] = [5, 10, 15];

export const QuizScreen = () => {
  const [state, actions] = useQuizViewModel();
  const activeTokens = useTheme();
  const styles = useMemo(() => createStyles(activeTokens), [activeTokens]);

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
          playersTagTone="error"
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

  if (state.phase === 'finished') {
    return (
      <View style={styles.screen}>
        <ScrollView contentContainerStyle={styles.stackContent}>
          <View style={styles.finishedHeader}>
            <View style={styles.trophyCircle}>
              <MaterialCommunityIcons
                name="party-popper"
                size={activeTokens.semantic.icon.lg}
                color={activeTokens.semantic.color.onHighlight}
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
            <ExpressiveTag
              label={`Pergunta ${state.currentQuestionIndex + 1} de ${state.totalQuestions}`}
              tone="neutral"
            />
          </View>

          <ConfirmModal
            visible={state.confirmingExit}
            title="Deseja encerrar a partida do Quiz Relâmpago?"
            description="O progresso desta pergunta será perdido se você sair agora."
            onCancel={actions.handleCancelExit}
            onConfirm={actions.handleConfirmExit}
          />

          <View style={styles.passTurnContent}>
            <View style={styles.passTurnCard}>
              <View style={styles.avatarTeam}>
                <MaterialCommunityIcons
                  name="account-group"
                  size={activeTokens.semantic.icon.lg}
                  color={activeTokens.semantic.color.onActionContainer}
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

            {state.currentQuestionIndex === 0 ? (
              <View style={styles.settingsCard}>
                <Text allowFontScaling style={styles.settingsTitle}>
                  Parâmetros da Partida
                </Text>
                <Text allowFontScaling style={styles.settingsLabel}>
                  Tempo por pergunta
                </Text>
                <View style={styles.chipRow}>
                  {QUIZ_DURATIONS.map((seconds) => (
                    <ExpressiveChip
                      key={seconds}
                      label={`${seconds}s`}
                      accessibilityLabel={`${seconds} segundos por pergunta`}
                      selected={state.turnDurationSeconds === seconds}
                      onPress={() => actions.handleSelectDuration(seconds)}
                    />
                  ))}
                </View>
                <Text allowFontScaling style={styles.settingsLabel}>
                  Quantidade de perguntas
                </Text>
                <View style={styles.chipRow}>
                  {QUIZ_QUESTION_COUNTS.map((count) => (
                    <ExpressiveChip
                      key={count}
                      label={`${count}`}
                      accessibilityLabel={`${count} perguntas`}
                      selected={state.configuredQuestionCount === count}
                      onPress={() => actions.handleSelectQuestionCount(count)}
                    />
                  ))}
                </View>
                {state.questionCountNotice ? (
                  <Text
                    allowFontScaling
                    accessibilityLiveRegion="polite"
                    style={styles.settingsNotice}
                  >
                    {state.questionCountNotice}
                  </Text>
                ) : null}
              </View>
            ) : null}

            <Text allowFontScaling style={styles.instructionNotice}>
              {`A equipe terá ${state.turnDurationSeconds} segundos para responder após tocar no botão abaixo.`}
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

  const isAnswered = state.phase === 'answered';
  const currentQuestion = state.currentQuestion;
  const feedbackBanner = state.isCorrect
    ? activeTokens.component.banner.success
    : activeTokens.component.banner.error;

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
            <ExpressiveTag
              label={`Pergunta ${state.currentQuestionIndex + 1}/${state.totalQuestions}`}
              tone="neutral"
            />
            {Boolean(state.currentTeam?.name) && (
              <ExpressiveTag
                label={state.currentTeam?.name ?? ''}
                tone="action"
              />
            )}
          </View>
        </View>

        <ConfirmModal
          visible={state.confirmingExit}
          title="Deseja encerrar a partida do Quiz Relâmpago?"
          description="O progresso desta rodada será perdido se você sair agora."
          onCancel={actions.handleCancelExit}
          onConfirm={actions.handleConfirmExit}
        />

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
                backgroundColor: feedbackBanner.bg,
                borderColor: feedbackBanner.border,
              },
            ]}
            accessibilityLiveRegion="polite"
          >
            <MaterialCommunityIcons
              name={state.isCorrect ? 'check-circle' : 'close-circle'}
              size={activeTokens.semantic.icon.md}
              color={feedbackBanner.text}
            />
            <View style={styles.feedbackTextWrapper}>
              <Text
                allowFontScaling
                style={[styles.feedbackTitle, { color: feedbackBanner.text }]}
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
                    { color: feedbackBanner.text },
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

const createStyles = (activeTokens: AppTokens) => {
  const { color, font, radius, space, border } = activeTokens.semantic;
  return StyleSheet.create({
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
      gap: space.sm,
      marginBottom: space.sm,
    },
    headerInfo: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'flex-end',
      alignItems: 'center',
      gap: space.xs,
      flexShrink: 1,
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
      fontWeight: font.body.weight,
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
      borderWidth: border.thin,
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
      gap: space.md,
    },
    passTurnContent: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: space.md,
    },
    passTurnCard: {
      backgroundColor: activeTokens.component.card.bg,
      padding: space.xl,
      borderRadius: activeTokens.component.card.radius,
      alignItems: 'center',
      borderWidth: border.thin,
      borderColor: activeTokens.component.card.border,
      gap: space.sm,
      width: '100%',
    },
    avatarTeam: {
      width: space['3xl'],
      height: space['3xl'],
      borderRadius: radius.full,
      backgroundColor: color.actionContainer,
      justifyContent: 'center',
      alignItems: 'center',
    },
    passTurnSubtitle: {
      fontSize: font.subtitle.size,
      fontFamily: font.subtitle.family,
      fontWeight: font.subtitle.weight,
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
      fontWeight: font.body.weight,
      lineHeight: font.body.lineHeight,
      color: color.onSurfaceMuted,
    },
    instructionNotice: {
      fontSize: font.body.size,
      fontFamily: font.body.family,
      fontWeight: font.body.weight,
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
      width: space['3xl'],
      height: space['3xl'],
      borderRadius: radius.full,
      backgroundColor: color.highlight,
      justifyContent: 'center',
      alignItems: 'center',
    },
    settingsCard: {
      width: '100%',
      backgroundColor: activeTokens.component.card.bg,
      borderColor: activeTokens.component.card.border,
      borderWidth: border.thin,
      borderRadius: activeTokens.component.card.radius,
      padding: activeTokens.component.card.padding,
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
    settingsNotice: {
      fontFamily: font.body.family,
      fontSize: font.body.size,
      fontWeight: font.body.weight,
      lineHeight: font.body.lineHeight,
      color: color.onSurfaceMuted,
    },
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: space.sm,
    },
  });
};

export default QuizScreen;
