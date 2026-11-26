import React, { useMemo } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ConfirmModal } from '@/view/components/confirmModal';
import { ExpressiveButton } from '@/view/components/expressiveButton';
import { ExpressiveChip } from '@/view/components/expressiveChip';
import { ExpressiveTag } from '@/view/components/expressiveTag';
import { ExpressiveTimer } from '@/view/components/expressiveTimer';
import {
  getFocusRingStyle,
  useKeyboardFocus,
} from '@/view/components/useKeyboardFocus';
import { useReduceMotion } from '@/view/components/useReduceMotion';
import { useTheme, type AppTokens } from '@/view/theme';
import {
  ALL_VERSE_PACKS,
  useVersiculoViewModel,
  VERSE_DURATION_OPTIONS,
  VERSE_ROUNDS_OPTIONS,
} from '@/viewmodel/useVersiculoViewModel';

const OPTION_LETTERS = ['A', 'B', 'C', 'D'] as const;

type VersiculoOptionTileProps = {
  letter: string;
  option: string;
  isSelected: boolean;
  isEliminated: boolean;
  activeTokens: AppTokens;
  styles: ReturnType<typeof createStyles>;
  onPress: () => void;
};

const VersiculoOptionTile = ({
  letter,
  option,
  isSelected,
  isEliminated,
  activeTokens,
  styles,
  onPress,
}: VersiculoOptionTileProps) => {
  const keyboardFocus = useKeyboardFocus();
  const focusRingStyle = getFocusRingStyle(
    activeTokens,
    keyboardFocus.focusVisible
  );

  return (
    <Pressable
      style={[
        styles.optionTile,
        isSelected ? styles.optionTileSelected : null,
        isEliminated ? styles.optionTileEliminated : null,
        focusRingStyle,
      ]}
      disabled={isEliminated}
      onPressIn={keyboardFocus.onPressIn}
      onPressOut={keyboardFocus.onPressOut}
      onFocus={keyboardFocus.onFocus}
      onBlur={keyboardFocus.onBlur}
      accessibilityRole="button"
      accessibilityState={{
        selected: isSelected,
        disabled: isEliminated,
      }}
      accessibilityLabel={`Opção ${letter}: ${option}`}
      onPress={onPress}
    >
      <View
        style={[
          styles.optionBadge,
          isSelected ? styles.optionBadgeSelected : null,
        ]}
      >
        <Text
          allowFontScaling
          style={[
            styles.optionLetter,
            isSelected ? styles.optionLetterSelected : null,
          ]}
        >
          {letter}
        </Text>
      </View>
      <Text
        allowFontScaling
        numberOfLines={2}
        style={[
          styles.optionText,
          isEliminated ? styles.optionTextEliminated : null,
        ]}
      >
        {option}
      </Text>
    </Pressable>
  );
};

const VersiculoScreen = () => {
  const [state, actions] = useVersiculoViewModel();
  useReduceMotion(actions.setReduceMotion);
  const activeTokens = useTheme();
  const styles = useMemo(() => createStyles(activeTokens), [activeTokens]);

  const hasEnoughTeams = state.teams.length >= 2;
  const activeBlank =
    state.currentPassage?.blanks.find(
      (b) => b.index === state.activeBlankIndex
    ) ??
    state.currentPassage?.blanks[0] ??
    null;
  const activeHint =
    state.hints.find((h) => h.index === activeBlank?.index) ?? null;

  return (
    <View style={styles.root}>
      <View style={styles.topBar}>
        <ExpressiveButton
          label="Sair"
          icon="arrow-left"
          variant="outlined"
          onPress={actions.requestExit}
        />
        <ExpressiveTag
          label="Complete o Versículo"
          icon="book-open-variant"
          tone="action"
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {state.error ? (
          <View
            style={styles.errorBanner}
            accessible
            accessibilityRole="alert"
            accessibilityLabel={state.error}
          >
            <MaterialCommunityIcons
              name="alert-circle"
              size={activeTokens.semantic.icon.md}
              color={activeTokens.component.banner.error.text}
            />
            <Text allowFontScaling style={styles.errorText}>
              {state.error}
            </Text>
          </View>
        ) : null}

        {state.loading ? (
          <View
            style={styles.centerBox}
            accessible
            accessibilityLabel="Carregando Complete o Versículo"
          >
            <MaterialCommunityIcons
              name="book-open-variant"
              size={activeTokens.semantic.icon.lg}
              color={activeTokens.semantic.color.action}
            />
            <Text allowFontScaling style={styles.helperText}>
              Carregando passagens bíblicas...
            </Text>
          </View>
        ) : null}

        {!state.loading && state.phase === 'setup' ? (
          <View style={styles.sectionStack}>
            <View style={styles.card}>
              <Text allowFontScaling style={styles.cardTitle}>
                Preparar Partida
              </Text>
              <Text allowFontScaling style={styles.bodyText}>
                Cada equipe lê a passagem com lacunas e digita as palavras-chave
                antes do tempo zerar. (+10 pts por lacuna, +5 pts com dica)
              </Text>

              {!hasEnoughTeams ? (
                <View style={styles.warningBox}>
                  <MaterialCommunityIcons
                    name="account-group"
                    size={activeTokens.semantic.icon.md}
                    color={activeTokens.component.banner.error.text}
                  />
                  <Text allowFontScaling style={styles.warningText}>
                    Cadastre pelo menos 2 equipes para jogar Complete o
                    Versículo.
                  </Text>
                  <ExpressiveButton
                    label="Gerenciar Equipes"
                    icon="account-multiple-plus"
                    variant="secondary"
                    onPress={actions.goToTeams}
                  />
                </View>
              ) : null}
            </View>

            <View style={styles.card}>
              <Text allowFontScaling style={styles.sectionLabel}>
                Pacotes de Passagens
              </Text>
              <View style={styles.chipWrap}>
                {ALL_VERSE_PACKS.map((pack) => (
                  <ExpressiveChip
                    key={pack}
                    label={pack}
                    selected={state.selectedPacks.includes(pack)}
                    onPress={() => actions.togglePack(pack)}
                  />
                ))}
              </View>

              <Text allowFontScaling style={styles.sectionLabel}>
                Tempo por Passagem
              </Text>
              <View style={styles.chipWrap}>
                {VERSE_DURATION_OPTIONS.map((seconds) => (
                  <ExpressiveChip
                    key={seconds}
                    label={`${seconds}s`}
                    selected={state.durationSeconds === seconds}
                    onPress={() => actions.selectDuration(seconds)}
                  />
                ))}
              </View>

              <Text allowFontScaling style={styles.sectionLabel}>
                Passagens por Equipe
              </Text>
              <View style={styles.chipWrap}>
                {VERSE_ROUNDS_OPTIONS.map((count) => (
                  <ExpressiveChip
                    key={count}
                    label={`${count}`}
                    selected={state.passagesPerTeam === count}
                    onPress={() => actions.selectPassagesPerTeam(count)}
                  />
                ))}
              </View>

              <ExpressiveButton
                label="Iniciar Partida"
                icon="play-circle"
                variant="primary"
                disabled={!hasEnoughTeams}
                onPress={() => {
                  void actions.startMatch();
                }}
              />
            </View>
          </View>
        ) : null}

        {!state.loading &&
        state.phase === 'handoff' &&
        state.currentTeam &&
        state.currentPassage ? (
          <View style={styles.card}>
            <Text allowFontScaling style={styles.eyebrow}>
              {`Passagem ${state.currentPassageIndex + 1} de ${state.passages.length}`}
            </Text>
            <Text allowFontScaling style={styles.heroTitle}>
              {`Vez da Equipe ${state.currentTeam.name}`}
            </Text>
            <Text allowFontScaling style={styles.bodyText}>
              {`Pacote: ${state.currentPassage.pack} · Tempo: ${state.durationSeconds}s`}
            </Text>
            <ExpressiveButton
              label="Estou Pronto!"
              icon="check-bold"
              variant="primary"
              onPress={actions.startTurn}
            />
          </View>
        ) : null}

        {!state.loading &&
        state.phase === 'playing' &&
        state.currentTeam &&
        state.currentPassage ? (
          <View style={styles.sectionStack}>
            <View style={styles.timerRow}>
              <ExpressiveTag
                label={`Equipe ${state.currentTeam.name} · ${state.currentPassageIndex + 1}/${state.passages.length}`}
                tone="action"
              />
              <ExpressiveTimer
                secondsRemaining={state.secondsRemaining}
                reduceMotion={state.reduceMotion}
              />
            </View>

            <View
              style={styles.card}
              accessible
              accessibilityLabel={`Passagem bíblica: ${state.currentPassage.textWithBlanks}`}
            >
              <Text allowFontScaling style={styles.eyebrow}>
                {`${state.currentPassage.pack} · Referência oculta`}
              </Text>
              <Text allowFontScaling style={styles.passageText}>
                {state.currentPassage.textWithBlanks}
              </Text>
            </View>

            {activeBlank ? (
              <View style={styles.card}>
                {state.currentPassage.blanks.length > 1 ? (
                  <View style={styles.chipWrap}>
                    {state.currentPassage.blanks.map((blank) => {
                      const chosen = state.answersByIndex[blank.index];
                      return (
                        <ExpressiveChip
                          key={blank.index}
                          label={
                            chosen
                              ? `Lacuna ${blank.index}: ${chosen}`
                              : `Lacuna ${blank.index}`
                          }
                          icon={chosen ? 'check-circle' : undefined}
                          selected={activeBlank.index === blank.index}
                          onPress={() => actions.selectBlank(blank.index)}
                        />
                      );
                    })}
                  </View>
                ) : (
                  <Text allowFontScaling style={styles.sectionLabel}>
                    Escolha a palavra correta (A–D)
                  </Text>
                )}

                <View style={styles.optionsGrid}>
                  {activeBlank.options.map((option, idx) => {
                    const letter = OPTION_LETTERS[idx] ?? 'A';
                    const isSelected =
                      state.answersByIndex[activeBlank.index] === option;
                    const isEliminated =
                      state.usedHint &&
                      Boolean(activeHint?.eliminatedOptions.includes(option));

                    return (
                      <VersiculoOptionTile
                        key={`${activeBlank.index}-${option}`}
                        letter={letter}
                        option={option}
                        isSelected={isSelected}
                        isEliminated={isEliminated}
                        activeTokens={activeTokens}
                        styles={styles}
                        onPress={() =>
                          actions.setAnswer(activeBlank.index, option)
                        }
                      />
                    );
                  })}
                </View>

                <View style={styles.compactActionsRow}>
                  <View style={styles.compactActionItem}>
                    <ExpressiveButton
                      label={state.usedHint ? 'Dica (+5)' : 'Dica 50/50'}
                      icon="lightbulb-outline"
                      variant="secondary"
                      disabled={state.usedHint}
                      onPress={actions.revealHint}
                    />
                  </View>
                  <View style={styles.compactActionItem}>
                    <ExpressiveButton
                      label="Conferir"
                      icon="check-circle"
                      variant="primary"
                      onPress={actions.submitAnswers}
                    />
                  </View>
                </View>
              </View>
            ) : null}
          </View>
        ) : null}

        {!state.loading &&
        state.phase === 'review' &&
        state.currentTeam &&
        state.currentPassage ? (
          <View style={styles.sectionStack}>
            <View
              style={styles.card}
              accessible
              accessibilityLabel={`Referência revelada: ${state.currentPassage.reference}, tradução ${state.currentPassage.translation}. ${state.currentPassage.fullText}`}
            >
              <Text allowFontScaling style={styles.eyebrow}>
                {`${state.currentPassage.reference} · ${state.currentPassage.translation}`}
              </Text>
              <Text allowFontScaling style={styles.passageText}>
                {state.currentPassage.fullText}
              </Text>
              <ExpressiveTag
                label={`Pontuação da rodada (${state.currentTeam.name}): +${state.turnPoints} pts`}
                tone="highlight"
              />
            </View>

            <View style={styles.sectionStack}>
              {state.results.map((item) => (
                <View
                  key={item.index}
                  style={[
                    styles.resultCard,
                    item.isCorrect
                      ? styles.resultCardCorrect
                      : styles.resultCardWrong,
                  ]}
                  accessible
                  accessibilityLabel={`Lacuna ${item.index}: ${
                    item.isCorrect ? 'correta' : 'errada'
                  }. Esperado ${item.expectedAnswer}.`}
                >
                  <View style={styles.resultHeader}>
                    <MaterialCommunityIcons
                      name={item.isCorrect ? 'check-circle' : 'close-circle'}
                      size={activeTokens.semantic.icon.md}
                      color={
                        item.isCorrect
                          ? activeTokens.semantic.color.success
                          : activeTokens.semantic.color.error
                      }
                    />
                    <Text allowFontScaling style={styles.resultTitle}>
                      {`Lacuna ${item.index} · +${item.pointsAwarded} pts`}
                    </Text>
                  </View>

                  <Text allowFontScaling style={styles.bodyText}>
                    {`Sua resposta: ${item.userAnswer || '(em branco)'}`}
                  </Text>
                  <Text allowFontScaling style={styles.expectedText}>
                    {`Palavra correta: ${item.expectedAnswer}`}
                  </Text>
                </View>
              ))}
            </View>

            <ExpressiveButton
              label={
                state.currentPassageIndex + 1 >= state.passages.length
                  ? 'Finalizar Partida'
                  : 'Próxima Passagem'
              }
              icon="arrow-right-circle"
              variant="primary"
              onPress={() => {
                void actions.nextTurn();
              }}
            />
          </View>
        ) : null}

        {!state.loading && state.phase === 'finished' ? (
          <View style={styles.card}>
            <Text allowFontScaling style={styles.heroTitle}>
              Partida Concluída!
            </Text>
            <Text allowFontScaling style={styles.bodyText}>
              Os pontos conquistados foram somados ao Placar Geral do PG.
            </Text>

            <View style={styles.summaryList}>
              {state.teams.map((team) => (
                <View key={team.id} style={styles.summaryRow}>
                  <Text allowFontScaling style={styles.summaryTeamName}>
                    {team.name}
                  </Text>
                  <Text allowFontScaling style={styles.summaryPoints}>
                    {`+${state.sessionScoresByTeamId[team.id] ?? 0} pts na partida`}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.actionStack}>
              <ExpressiveButton
                label="Ir para o Placar Final"
                icon="trophy"
                variant="primary"
                onPress={actions.goToScoreboard}
              />
              <ExpressiveButton
                label="Jogar Novamente"
                icon="refresh"
                variant="secondary"
                onPress={actions.restartMatch}
              />
            </View>
          </View>
        ) : null}
      </ScrollView>

      <ConfirmModal
        visible={state.exitConfirmVisible}
        title="Sair de Complete o Versículo?"
        description="O cronômetro está pausado. Se sair agora, a partida atual será encerrada."
        confirmLabel="Sair para o Hub"
        cancelLabel="Continuar Jogando"
        confirmIcon="exit-to-app"
        icon="alert-circle-outline"
        onConfirm={actions.confirmExit}
        onCancel={actions.cancelExit}
      />
    </View>
  );
};

const createStyles = (activeTokens: AppTokens) => {
  const { color, font, radius, space, border, elevation } = activeTokens.semantic;
  const { card, option, banner } = activeTokens.component;
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: color.surface,
      paddingHorizontal: space.lg,
      paddingTop: space.md,
    },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: space.md,
      marginBottom: space.md,
    },
    scrollContent: {
      paddingBottom: space['3xl'],
      gap: space.lg,
    },
    sectionStack: {
      gap: space.lg,
    },
    centerBox: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: space['2xl'],
      gap: space.md,
    },
    card: {
      backgroundColor: card.bg,
      borderRadius: card.radius,
      borderWidth: border.thin,
      borderColor: card.border,
      padding: card.padding,
      gap: space.md,
      elevation: elevation.card,
    },
    errorBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.sm,
      backgroundColor: banner.error.bg,
      borderColor: banner.error.border,
      borderWidth: border.thin,
      borderRadius: radius.md,
      padding: space.md,
    },
    errorText: {
      flex: 1,
      fontFamily: font.body.family,
      fontSize: font.body.size,
      lineHeight: font.body.lineHeight,
      fontWeight: font.body.weight,
      color: banner.error.text,
    },
    warningBox: {
      backgroundColor: banner.error.bg,
      borderColor: banner.error.border,
      borderWidth: border.thin,
      borderRadius: radius.md,
      padding: space.md,
      gap: space.sm,
    },
    warningText: {
      fontFamily: font.body.family,
      fontSize: font.body.size,
      lineHeight: font.body.lineHeight,
      fontWeight: font.body.weight,
      color: banner.error.text,
    },
    cardTitle: {
      fontFamily: font.title.family,
      fontSize: font.title.size,
      lineHeight: font.title.lineHeight,
      fontWeight: font.title.weight,
      color: color.onSurface,
    },
    heroTitle: {
      fontFamily: font.display.family,
      fontSize: font.display.size,
      lineHeight: font.display.lineHeight,
      fontWeight: font.display.weight,
      color: color.onSurface,
    },
    eyebrow: {
      fontFamily: font.label.family,
      fontSize: font.label.size,
      lineHeight: font.label.lineHeight,
      fontWeight: font.label.weight,
      color: color.action,
    },
    sectionLabel: {
      fontFamily: font.subtitle.family,
      fontSize: font.subtitle.size,
      lineHeight: font.subtitle.lineHeight,
      fontWeight: font.subtitle.weight,
      color: color.onSurface,
    },
    bodyText: {
      fontFamily: font.body.family,
      fontSize: font.body.size,
      lineHeight: font.body.lineHeight,
      fontWeight: font.body.weight,
      color: color.onSurfaceMuted,
    },
    helperText: {
      fontFamily: font.body.family,
      fontSize: font.body.size,
      lineHeight: font.body.lineHeight,
      fontWeight: font.body.weight,
      color: color.onSurfaceMuted,
    },
    chipWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: space.sm,
    },
    timerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: space.md,
      flexWrap: 'wrap',
    },
    passageText: {
      fontFamily: font.title.family,
      fontSize: font.title.size,
      lineHeight: font.title.lineHeight,
      fontWeight: font.title.weight,
      color: color.onSurface,
    },
    optionsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: space.sm,
    },
    optionTile: {
      width: '48%',
      flexGrow: 1,
      minHeight: space['2xl'],
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.sm,
      backgroundColor: option.bg.default,
      borderWidth: border.thin,
      borderColor: option.border.default,
      borderRadius: radius.md,
      paddingHorizontal: space.sm,
      paddingVertical: space.sm,
    },
    optionTileSelected: {
      backgroundColor: option.bg.selected,
      borderColor: option.border.selected,
    },
    optionTileEliminated: {
      backgroundColor: option.bg.disabled,
      borderColor: option.border.disabled,
    },
    optionBadge: {
      width: space.lg,
      height: space.lg,
      borderRadius: radius.full,
      backgroundColor: color.surfaceVariant,
      alignItems: 'center',
      justifyContent: 'center',
    },
    optionBadgeSelected: {
      backgroundColor: color.action,
    },
    optionLetter: {
      fontFamily: font.label.family,
      fontSize: font.label.size,
      lineHeight: font.label.lineHeight,
      fontWeight: font.label.weight,
      color: color.onSurface,
    },
    optionLetterSelected: {
      color: color.onAction,
    },
    optionText: {
      flex: 1,
      fontFamily: font.label.family,
      fontSize: font.label.size,
      lineHeight: font.label.lineHeight,
      fontWeight: font.label.weight,
      color: color.onSurface,
    },
    optionTextEliminated: {
      color: color.disabledText,
    },
    compactActionsRow: {
      flexDirection: 'row',
      gap: space.sm,
    },
    compactActionItem: {
      flex: 1,
    },
    actionStack: {
      gap: space.md,
    },
    resultCard: {
      backgroundColor: card.bg,
      borderWidth: border.thin,
      padding: space.md,
      gap: space.sm,
    },
    resultCardCorrect: {
      borderColor: banner.success.border,
      borderRadius: radius.lg,
    },
    resultCardWrong: {
      borderColor: banner.error.border,
      borderRadius: radius.sm,
    },
    resultHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.sm,
    },
    resultTitle: {
      fontFamily: font.subtitle.family,
      fontSize: font.subtitle.size,
      lineHeight: font.subtitle.lineHeight,
      fontWeight: font.subtitle.weight,
      color: color.onSurface,
    },
    expectedText: {
      fontFamily: font.label.family,
      fontSize: font.label.size,
      lineHeight: font.label.lineHeight,
      fontWeight: font.label.weight,
      color: color.onSurface,
    },
    summaryList: {
      gap: space.sm,
    },
    summaryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: card.bg,
      borderRadius: radius.md,
      padding: space.md,
    },
    summaryTeamName: {
      fontFamily: font.subtitle.family,
      fontSize: font.subtitle.size,
      lineHeight: font.subtitle.lineHeight,
      fontWeight: font.subtitle.weight,
      color: color.onSurface,
    },
    summaryPoints: {
      fontFamily: font.label.family,
      fontSize: font.label.size,
      lineHeight: font.label.lineHeight,
      fontWeight: font.label.weight,
      color: color.action,
    },
  });
};

export default VersiculoScreen;
