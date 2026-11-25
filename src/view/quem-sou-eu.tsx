import React, { useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ConfirmModal } from '@/view/components/confirmModal';
import { ExpressiveButton } from '@/view/components/expressiveButton';
import { ExpressiveChip } from '@/view/components/expressiveChip';
import { ExpressiveTag } from '@/view/components/expressiveTag';
import { ExpressiveTimer } from '@/view/components/expressiveTimer';
import { useReduceMotion } from '@/view/components/useReduceMotion';
import { useTheme, type AppTokens } from '@/view/theme';
import {
  ALL_QUEM_SOU_EU_PACKS,
  QUEM_SOU_EU_DURATION_OPTIONS,
  QUEM_SOU_EU_ROUNDS_OPTIONS,
  useQuemSouEuViewModel,
} from '@/viewmodel/useQuemSouEuViewModel';

const QuemSouEuScreen = () => {
  const [state, actions] = useQuemSouEuViewModel();
  const activeTokens = useTheme();
  const styles = useMemo(() => createStyles(activeTokens), [activeTokens]);
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  useReduceMotion(actions.setReduceMotion);

  const hasEnoughTeams = state.teams.length >= 2;
  const hitResults = state.turnResults.filter((item) => item.outcome === 'hit');
  const passResults = state.turnResults.filter(
    (item) => item.outcome === 'pass'
  );
  const isHitFeedback = state.lastFeedback?.outcome === 'hit';
  const isPassFeedback = state.lastFeedback?.outcome === 'pass';

  const isPlayingActive =
    !state.loading && state.phase === 'playing' && Boolean(state.currentCard);
  const isCompactStage =
    !state.loading &&
    isLandscape &&
    (state.phase === 'handoff' || state.phase === 'countdown');

  return (
    <View
      style={[
        styles.root,
        isHitFeedback ? styles.rootHitFlash : null,
        isPassFeedback ? styles.rootPassFlash : null,
      ]}
    >
      {isPlayingActive && state.currentCard ? (
        <View
          style={[
            styles.playingStage,
            isLandscape ? styles.playingStageLandscape : null,
          ]}
        >
          <View style={styles.playingTopBar}>
            <ExpressiveButton
              label="Sair"
              icon="arrow-left"
              variant="outlined"
              onPress={actions.requestExit}
            />
            <View style={styles.playingMetaRow}>
              <View style={styles.tagSlot}>
                <ExpressiveTag
                  label={state.currentTeam?.name ?? 'Equipe'}
                  icon="account-group"
                  tone="secondary"
                />
              </View>
              {isLandscape ? (
                <View style={styles.tagSlot}>
                  <ExpressiveTag
                    label={state.currentCard.pack}
                    icon="tag-outline"
                    tone="action"
                  />
                </View>
              ) : null}
            </View>
            <ExpressiveTimer
              secondsRemaining={state.secondsRemaining}
              reduceMotion={state.reduceMotion}
            />
          </View>

          <View
            style={[
              styles.foreheadCard,
              isLandscape ? styles.foreheadCardLandscape : null,
              isHitFeedback ? styles.foreheadCardHit : null,
              isPassFeedback ? styles.foreheadCardPass : null,
            ]}
            accessible
            accessibilityLabel={`Carta atual: ${state.currentCard.name}. Tema: ${state.currentCard.pack}`}
          >
            {!isLandscape ? (
              <View
                style={[
                  styles.centeredTagWrap,
                  state.lastFeedback ? styles.hiddenTag : null,
                ]}
              >
                <ExpressiveTag
                  label={state.currentCard.pack}
                  icon="tag-outline"
                  tone="action"
                />
              </View>
            ) : null}

            {state.lastFeedback ? (
              <View
                style={styles.feedbackOverlay}
                accessible
                accessibilityLiveRegion="polite"
                accessibilityLabel={
                  isHitFeedback ? 'Acertou! Mais 10 pontos' : 'Passou a carta'
                }
              >
                <MaterialCommunityIcons
                  name={isHitFeedback ? 'check-circle' : 'skip-next'}
                  size={activeTokens.semantic.icon.lg}
                  color={
                    isHitFeedback
                      ? activeTokens.semantic.color.onSuccess
                      : activeTokens.semantic.color.onHighlight
                  }
                />
                <Text
                  allowFontScaling
                  style={[
                    styles.feedbackText,
                    isHitFeedback
                      ? styles.feedbackTextHit
                      : styles.feedbackTextPass,
                  ]}
                >
                  {isHitFeedback ? 'ACERTOU! +10 pts' : 'PASSOU'}
                </Text>
              </View>
            ) : null}

            <Text
              allowFontScaling
              style={[
                styles.foreheadWord,
                isHitFeedback ? styles.feedbackTextHit : null,
                isPassFeedback ? styles.feedbackTextPass : null,
              ]}
            >
              {state.currentCard.name}
            </Text>

            <Text
              allowFontScaling
              style={[
                styles.turnScoreLine,
                isHitFeedback ? styles.feedbackTextHit : null,
                isPassFeedback ? styles.feedbackTextPass : null,
              ]}
            >
              Pontos no turno: +{state.turnPoints} pts · Acertos:{' '}
              {hitResults.length}
            </Text>
          </View>

          {state.tiltEnabled ? (
            <View
              style={styles.jumboActions}
              accessible
              accessibilityLabel="Modo inclinação: incline para baixo para acertar ou para cima para passar"
            >
              <Text allowFontScaling style={styles.helperText}>
                Incline para baixo: Acertou! (+10 pts) · Incline para cima:
                Passar
              </Text>
            </View>
          ) : (
            <View
              style={[
                styles.jumboActions,
                isLandscape ? styles.jumboActionsRow : null,
              ]}
            >
              {isLandscape ? (
                <>
                  <View style={styles.actionSlot}>
                    <ExpressiveButton
                      label="Passar"
                      icon="skip-next"
                      variant="tonalJumbo"
                      onPress={actions.registerPass}
                    />
                  </View>
                  <View style={styles.actionSlot}>
                    <ExpressiveButton
                      label="Acertou! (+10 pts)"
                      icon="check-circle"
                      variant="successJumbo"
                      onPress={actions.registerHit}
                    />
                  </View>
                </>
              ) : (
                <>
                  <ExpressiveButton
                    label="Acertou! (+10 pts)"
                    icon="check-circle"
                    variant="successJumbo"
                    onPress={actions.registerHit}
                  />
                  <ExpressiveButton
                    label="Passar"
                    icon="skip-next"
                    variant="tonalJumbo"
                    onPress={actions.registerPass}
                  />
                </>
              )}
            </View>
          )}
        </View>
      ) : (
        <>
          <View style={styles.topBar}>
            <ExpressiveButton
              label="Sair"
              icon="arrow-left"
              variant="outlined"
              onPress={actions.requestExit}
            />
            <View style={styles.tagSlot}>
              <ExpressiveTag
                label="Quem Sou Eu?"
                icon="account-question-outline"
                tone="action"
              />
            </View>
          </View>

          {isCompactStage ? (
            <View style={styles.compactStage}>
              {state.phase === 'handoff' && state.currentTeam ? (
                <View style={styles.handoffCardLandscape}>
                  <View style={styles.centeredTagWrap}>
                    <ExpressiveTag
                      label={`Rodada ${state.currentRound} de ${state.roundsPerTeam}`}
                      icon="flag-checkered"
                      tone="secondary"
                    />
                  </View>
                  <Text allowFontScaling style={styles.handoffTitle}>
                    Vez da Equipe {state.currentTeam.name}
                  </Text>
                  <Text allowFontScaling style={styles.handoffSubtitle}>
                    Representante, segure o celular na testa com a tela virada
                    para a equipe.
                  </Text>
                  <View style={styles.fullWidthAction}>
                    <ExpressiveButton
                      label="Estou Pronto!"
                      icon="check-bold"
                      variant="primaryJumbo"
                      onPress={actions.startTurn}
                    />
                  </View>
                </View>
              ) : null}

              {state.phase === 'countdown' ? (
                <View
                  style={styles.countdownCardLandscape}
                  accessible
                  accessibilityLiveRegion="assertive"
                  accessibilityLabel={`Posicione o celular na testa. Começando em ${state.countdownSeconds} segundos`}
                >
                  <Text allowFontScaling style={styles.countdownCaption}>
                    Posicione o celular na testa!
                  </Text>
                  <Text allowFontScaling style={styles.countdownNumber}>
                    {state.countdownSeconds}
                  </Text>
                  <Text allowFontScaling style={styles.helperText}>
                    A equipe já pode se preparar para dar dicas sem falar o
                    nome.
                  </Text>
                </View>
              ) : null}
            </View>
          ) : (
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
                  accessibilityLabel="Carregando Quem Sou Eu?"
                >
                  <MaterialCommunityIcons
                    name="account-question-outline"
                    size={activeTokens.semantic.icon.lg}
                    color={activeTokens.semantic.color.action}
                  />
                  <Text allowFontScaling style={styles.helperText}>
                    Preparando cartas temáticas...
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
                      Um representante segura o celular na testa enquanto a
                      equipe dá dicas sem dizer o nome. Escolha o modo de
                      controle: Inclinação (para baixo acerta +10 pts, para cima
                      passa) ou Botões na tela.
                    </Text>

                    {!hasEnoughTeams ? (
                      <View style={styles.warningBox}>
                        <MaterialCommunityIcons
                          name="account-group"
                          size={activeTokens.semantic.icon.md}
                          color={activeTokens.component.banner.error.text}
                        />
                        <Text allowFontScaling style={styles.warningText}>
                          Cadastre pelo menos 2 equipes para jogar Quem Sou Eu?.
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
                      Pacotes de Temas
                    </Text>
                    <View style={styles.chipWrap}>
                      {ALL_QUEM_SOU_EU_PACKS.map((pack) => (
                        <ExpressiveChip
                          key={pack}
                          label={pack}
                          selected={state.selectedPacks.includes(pack)}
                          onPress={() => actions.togglePack(pack)}
                        />
                      ))}
                    </View>

                    <Text allowFontScaling style={styles.sectionLabel}>
                      Tempo por Turno
                    </Text>
                    <View style={styles.chipWrap}>
                      {QUEM_SOU_EU_DURATION_OPTIONS.map((seconds) => (
                        <ExpressiveChip
                          key={seconds}
                          label={`${seconds}s`}
                          selected={state.durationSeconds === seconds}
                          onPress={() => actions.selectDuration(seconds)}
                        />
                      ))}
                    </View>

                    <Text allowFontScaling style={styles.sectionLabel}>
                      Rodadas por Equipe
                    </Text>
                    <View style={styles.chipWrap}>
                      {QUEM_SOU_EU_ROUNDS_OPTIONS.map((count) => (
                        <ExpressiveChip
                          key={count}
                          label={`${count}`}
                          selected={state.roundsPerTeam === count}
                          onPress={() => actions.selectRoundsPerTeam(count)}
                        />
                      ))}
                    </View>

                    <Text allowFontScaling style={styles.sectionLabel}>
                      Modo de Controle
                    </Text>
                    <View style={styles.chipWrap}>
                      {state.tiltAvailable ? (
                        <ExpressiveChip
                          label="Inclinação"
                          icon="screen-rotation"
                          selected={state.tiltEnabled}
                          onPress={() => actions.setTiltEnabled(true)}
                        />
                      ) : null}
                      <ExpressiveChip
                        label="Botões"
                        icon="gesture-tap-button"
                        selected={!state.tiltEnabled}
                        onPress={() => actions.setTiltEnabled(false)}
                      />
                    </View>

                    {!state.tiltAvailable ? (
                      <Text allowFontScaling style={styles.helperText}>
                        Sensor de inclinação indisponível neste aparelho. Use o
                        modo Botões.
                      </Text>
                    ) : null}

                    <ExpressiveButton
                      label="Iniciar Partida"
                      icon="play"
                      variant="primaryJumbo"
                      disabled={
                        !hasEnoughTeams || state.selectedPacks.length === 0
                      }
                      onPress={() => {
                        void actions.startMatch();
                      }}
                    />
                  </View>
                </View>
              ) : null}

              {!state.loading &&
              state.phase === 'handoff' &&
              state.currentTeam ? (
                <View style={styles.sectionStack}>
                  <View style={styles.handoffCard}>
                    <View style={styles.centeredTagWrap}>
                      <ExpressiveTag
                        label={`Rodada ${state.currentRound} de ${state.roundsPerTeam}`}
                        icon="flag-checkered"
                        tone="secondary"
                      />
                    </View>
                    <Text allowFontScaling style={styles.handoffTitle}>
                      Vez da Equipe {state.currentTeam.name}
                    </Text>
                    <Text allowFontScaling style={styles.handoffSubtitle}>
                      Representante, segure o celular na testa com a tela virada
                      para a equipe.
                    </Text>
                    <Text allowFontScaling style={styles.helperText}>
                      {state.tiltEnabled
                        ? 'Modo Inclinação: incline para baixo ao acertar (+10 pts) ou para cima para passar.'
                        : 'Modo Botões: use os botões Acertou! e Passar na tela.'}
                    </Text>
                    <View style={styles.fullWidthAction}>
                      <ExpressiveButton
                        label="Estou Pronto!"
                        icon="check-bold"
                        variant="primaryJumbo"
                        onPress={actions.startTurn}
                      />
                    </View>
                  </View>
                </View>
              ) : null}

              {!state.loading && state.phase === 'countdown' ? (
                <View style={styles.sectionStack}>
                  <View
                    style={styles.countdownCard}
                    accessible
                    accessibilityLiveRegion="assertive"
                    accessibilityLabel={`Posicione o celular na testa. Começando em ${state.countdownSeconds} segundos`}
                  >
                    <Text allowFontScaling style={styles.countdownCaption}>
                      Posicione o celular na testa!
                    </Text>
                    <Text allowFontScaling style={styles.countdownNumber}>
                      {state.countdownSeconds}
                    </Text>
                    <Text allowFontScaling style={styles.helperText}>
                      A equipe já pode se preparar para dar dicas sem falar o
                      nome.
                    </Text>
                  </View>
                </View>
              ) : null}

              {!state.loading && state.phase === 'summary' ? (
                <View style={styles.sectionStack}>
                  <View style={styles.card}>
                    <ExpressiveTag
                      label="Fim do Turno"
                      icon="timer-off-outline"
                      tone="secondary"
                    />
                    <Text allowFontScaling style={styles.cardTitle}>
                      Resumo — {state.currentTeam?.name ?? 'Equipe'}
                    </Text>
                    <Text allowFontScaling style={styles.summaryPoints}>
                      +{state.turnPoints} pontos no turno
                    </Text>
                    <Text allowFontScaling style={styles.bodyText}>
                      Acertos: {hitResults.length} · Passes:{' '}
                      {passResults.length}
                    </Text>

                    {state.deckExhausted ? (
                      <Text allowFontScaling style={styles.helperText}>
                        Todas as cartas dos pacotes escolhidos foram utilizadas!
                      </Text>
                    ) : null}
                  </View>

                  <View style={styles.card}>
                    <Text allowFontScaling style={styles.sectionLabel}>
                      Cartas do Turno
                    </Text>
                    {state.turnResults.length === 0 ? (
                      <Text allowFontScaling style={styles.helperText}>
                        Nenhuma carta registrada neste turno.
                      </Text>
                    ) : (
                      <View style={styles.resultList}>
                        {state.turnResults.map((item) => {
                          const isHit = item.outcome === 'hit';
                          return (
                            <View
                              key={item.card.id}
                              style={[
                                styles.resultRow,
                                isHit
                                  ? styles.resultRowHit
                                  : styles.resultRowPass,
                              ]}
                            >
                              <MaterialCommunityIcons
                                name={isHit ? 'check-circle' : 'skip-next'}
                                size={activeTokens.semantic.icon.md}
                                color={
                                  isHit
                                    ? activeTokens.semantic.color.success
                                    : activeTokens.semantic.color.onSurfaceMuted
                                }
                              />
                              <View style={styles.resultInfo}>
                                <Text
                                  allowFontScaling
                                  style={styles.resultWord}
                                >
                                  {item.card.name}
                                </Text>
                                <Text
                                  allowFontScaling
                                  style={styles.resultMeta}
                                >
                                  {item.card.pack} ·{' '}
                                  {isHit
                                    ? 'Acertou (+10 pts)'
                                    : 'Passou (0 pts)'}
                                </Text>
                                {item.card.hint ? (
                                  <Text
                                    allowFontScaling
                                    style={styles.resultHint}
                                  >
                                    {item.card.hint}
                                  </Text>
                                ) : null}
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    )}

                    <ExpressiveButton
                      label="Próxima Equipe"
                      icon="arrow-right"
                      variant="primaryJumbo"
                      onPress={() => {
                        void actions.nextTurn();
                      }}
                    />
                  </View>
                </View>
              ) : null}

              {!state.loading && state.phase === 'finished' ? (
                <View style={styles.sectionStack}>
                  <View style={styles.card}>
                    <ExpressiveTag
                      label="Partida Concluída"
                      icon="trophy"
                      tone="success"
                    />
                    <Text allowFontScaling style={styles.cardTitle}>
                      Quem Sou Eu? Encerrado!
                    </Text>
                    <Text allowFontScaling style={styles.bodyText}>
                      {state.deckExhausted
                        ? 'O banco de cartas dos pacotes selecionados chegou ao fim. Os pontos foram somados ao placar geral!'
                        : 'Todas as rodadas foram concluídas e os pontos foram somados ao placar geral!'}
                    </Text>

                    <View style={styles.resultList}>
                      {state.teams.map((team) => (
                        <View key={team.id} style={styles.scoreSummaryRow}>
                          <Text allowFontScaling style={styles.resultWord}>
                            {team.name}
                          </Text>
                          <Text
                            allowFontScaling
                            style={styles.scoreSummaryPoints}
                          >
                            +{state.sessionScoresByTeamId[team.id] ?? 0} pts
                          </Text>
                        </View>
                      ))}
                    </View>

                    <View style={styles.jumboActions}>
                      <ExpressiveButton
                        label="Ir para o Placar Final"
                        icon="trophy"
                        variant="primaryJumbo"
                        onPress={actions.goToScoreboard}
                      />
                      <ExpressiveButton
                        label="Jogar Novamente"
                        icon="replay"
                        variant="tonal"
                        onPress={actions.restartMatch}
                      />
                    </View>
                  </View>
                </View>
              ) : null}
            </ScrollView>
          )}
        </>
      )}

      <ConfirmModal
        visible={state.exitConfirmVisible}
        title="Sair de Quem Sou Eu?"
        description="O cronômetro está pausado. Se sair agora, o turno em andamento será encerrado."
        confirmLabel="Sair para o Hub"
        cancelLabel="Continuar Jogando"
        onConfirm={actions.confirmExit}
        onCancel={actions.cancelExit}
      />
    </View>
  );
};

const createStyles = (activeTokens: AppTokens) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: activeTokens.semantic.color.surface,
    },
    rootHitFlash: {
      backgroundColor: activeTokens.semantic.color.successContainer,
    },
    rootPassFlash: {
      backgroundColor: activeTokens.semantic.color.highlightContainer,
    },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: activeTokens.semantic.space.md,
      paddingTop: activeTokens.semantic.space.md,
      paddingBottom: activeTokens.semantic.space.sm,
      gap: activeTokens.semantic.space.sm,
    },
    playingStage: {
      flex: 1,
      paddingHorizontal: activeTokens.semantic.space.md,
      paddingTop: activeTokens.semantic.space.md,
      paddingBottom: activeTokens.semantic.space.lg,
      gap: activeTokens.semantic.space.md,
      justifyContent: 'space-between',
    },
    playingStageLandscape: {
      paddingBottom: activeTokens.semantic.space.md,
      gap: activeTokens.semantic.space.md,
    },
    playingTopBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: activeTokens.semantic.space.sm,
    },
    playingMetaRow: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      flexWrap: 'wrap',
      gap: activeTokens.semantic.space.sm,
    },
    compactStage: {
      flex: 1,
      paddingHorizontal: activeTokens.semantic.space.md,
      paddingBottom: activeTokens.semantic.space.md,
      justifyContent: 'center',
    },
    scrollContent: {
      padding: activeTokens.semantic.space.md,
      paddingBottom: activeTokens.semantic.space.xl,
      gap: activeTokens.semantic.space.md,
    },
    sectionStack: {
      gap: activeTokens.semantic.space.md,
    },
    card: {
      backgroundColor: activeTokens.component.card.bg,
      borderRadius: activeTokens.component.card.radius,
      borderWidth: activeTokens.semantic.border.thin,
      borderColor: activeTokens.component.card.border,
      padding: activeTokens.component.card.padding,
      gap: activeTokens.semantic.space.md,
    },
    cardTitle: {
      fontFamily: activeTokens.semantic.font.title.family,
      fontSize: activeTokens.semantic.font.title.size,
      fontWeight: activeTokens.semantic.font.title.weight,
      lineHeight: activeTokens.semantic.font.title.lineHeight,
      color: activeTokens.semantic.color.onSurface,
    },
    sectionLabel: {
      fontFamily: activeTokens.semantic.font.subtitle.family,
      fontSize: activeTokens.semantic.font.subtitle.size,
      fontWeight: activeTokens.semantic.font.subtitle.weight,
      lineHeight: activeTokens.semantic.font.subtitle.lineHeight,
      color: activeTokens.semantic.color.onSurface,
    },
    bodyText: {
      fontFamily: activeTokens.semantic.font.body.family,
      fontSize: activeTokens.semantic.font.body.size,
      fontWeight: activeTokens.semantic.font.body.weight,
      lineHeight: activeTokens.semantic.font.body.lineHeight,
      color: activeTokens.semantic.color.onSurfaceMuted,
    },
    helperText: {
      fontFamily: activeTokens.semantic.font.body.family,
      fontSize: activeTokens.semantic.font.body.size,
      fontWeight: activeTokens.semantic.font.body.weight,
      lineHeight: activeTokens.semantic.font.body.lineHeight,
      color: activeTokens.semantic.color.onSurfaceMuted,
      textAlign: 'center',
    },
    chipWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: activeTokens.semantic.space.sm,
    },
    centerBox: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: activeTokens.semantic.space.xl,
      gap: activeTokens.semantic.space.md,
    },
    centeredTagWrap: {
      alignItems: 'center',
    },
    tagSlot: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    fullWidthAction: {
      width: '100%',
    },
    errorBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: activeTokens.semantic.space.sm,
      backgroundColor: activeTokens.component.banner.error.bg,
      borderColor: activeTokens.component.banner.error.border,
      borderWidth: activeTokens.semantic.border.thin,
      borderRadius: activeTokens.semantic.radius.md,
      padding: activeTokens.semantic.space.md,
    },
    errorText: {
      flex: 1,
      fontFamily: activeTokens.semantic.font.body.family,
      fontSize: activeTokens.semantic.font.body.size,
      fontWeight: activeTokens.semantic.font.subtitle.weight,
      lineHeight: activeTokens.semantic.font.body.lineHeight,
      color: activeTokens.component.banner.error.text,
    },
    warningBox: {
      backgroundColor: activeTokens.component.banner.error.bg,
      borderColor: activeTokens.component.banner.error.border,
      borderWidth: activeTokens.semantic.border.thin,
      borderRadius: activeTokens.semantic.radius.md,
      padding: activeTokens.semantic.space.md,
      gap: activeTokens.semantic.space.sm,
      alignItems: 'flex-start',
    },
    warningText: {
      fontFamily: activeTokens.semantic.font.body.family,
      fontSize: activeTokens.semantic.font.body.size,
      fontWeight: activeTokens.semantic.font.subtitle.weight,
      lineHeight: activeTokens.semantic.font.body.lineHeight,
      color: activeTokens.component.banner.error.text,
    },
    handoffCard: {
      backgroundColor: activeTokens.component.card.bg,
      borderRadius: activeTokens.semantic.radius.xl,
      borderWidth: activeTokens.semantic.border.thin,
      borderColor: activeTokens.component.card.border,
      padding: activeTokens.semantic.space.lg,
      alignItems: 'center',
      gap: activeTokens.semantic.space.md,
    },
    handoffCardLandscape: {
      flex: 1,
      backgroundColor: activeTokens.component.card.bg,
      borderRadius: activeTokens.semantic.radius.xl,
      borderWidth: activeTokens.semantic.border.thin,
      borderColor: activeTokens.component.card.border,
      padding: activeTokens.semantic.space.md,
      alignItems: 'center',
      justifyContent: 'center',
      gap: activeTokens.semantic.space.sm,
    },
    handoffTitle: {
      fontFamily: activeTokens.semantic.font.title.family,
      fontSize: activeTokens.semantic.font.title.size,
      fontWeight: activeTokens.semantic.font.title.weight,
      lineHeight: activeTokens.semantic.font.title.lineHeight,
      color: activeTokens.semantic.color.onSurface,
      textAlign: 'center',
    },
    handoffSubtitle: {
      fontFamily: activeTokens.semantic.font.subtitle.family,
      fontSize: activeTokens.semantic.font.subtitle.size,
      fontWeight: activeTokens.semantic.font.subtitle.weight,
      lineHeight: activeTokens.semantic.font.subtitle.lineHeight,
      color: activeTokens.semantic.color.onSurface,
      textAlign: 'center',
    },
    countdownCard: {
      backgroundColor: activeTokens.semantic.color.actionContainer,
      borderRadius: activeTokens.semantic.radius.xl,
      padding: activeTokens.semantic.space.xl,
      alignItems: 'center',
      gap: activeTokens.semantic.space.md,
    },
    countdownCardLandscape: {
      flex: 1,
      backgroundColor: activeTokens.semantic.color.actionContainer,
      borderRadius: activeTokens.semantic.radius.xl,
      padding: activeTokens.semantic.space.md,
      alignItems: 'center',
      justifyContent: 'center',
      gap: activeTokens.semantic.space.sm,
    },
    countdownCaption: {
      fontFamily: activeTokens.semantic.font.subtitle.family,
      fontSize: activeTokens.semantic.font.subtitle.size,
      fontWeight: activeTokens.semantic.font.subtitle.weight,
      lineHeight: activeTokens.semantic.font.subtitle.lineHeight,
      color: activeTokens.semantic.color.onActionContainer,
      textAlign: 'center',
    },
    countdownNumber: {
      fontFamily: activeTokens.semantic.font.display.family,
      fontSize: activeTokens.semantic.font.display.size,
      fontWeight: activeTokens.semantic.font.display.weight,
      lineHeight: activeTokens.semantic.font.display.lineHeight,
      color: activeTokens.semantic.color.onActionContainer,
    },
    hiddenTag: {
      opacity: 0,
    },
    feedbackOverlay: {
      position: 'absolute',
      top: activeTokens.semantic.space.md,
      left: activeTokens.semantic.space.md,
      right: activeTokens.semantic.space.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: activeTokens.semantic.space.sm,
    },
    feedbackText: {
      fontFamily: activeTokens.semantic.font.title.family,
      fontSize: activeTokens.semantic.font.title.size,
      fontWeight: activeTokens.semantic.font.title.weight,
      lineHeight: activeTokens.semantic.font.title.lineHeight,
    },
    feedbackTextHit: {
      color: activeTokens.semantic.color.onSuccess,
    },
    feedbackTextPass: {
      color: activeTokens.semantic.color.onHighlight,
    },
    foreheadCard: {
      flex: 1,
      backgroundColor: activeTokens.component.card.bg,
      borderRadius: activeTokens.semantic.radius.xl,
      borderWidth: activeTokens.semantic.border.focus,
      borderColor: activeTokens.semantic.color.action,
      paddingVertical: activeTokens.semantic.space.lg,
      paddingHorizontal: activeTokens.semantic.space.lg,
      alignItems: 'center',
      justifyContent: 'center',
      gap: activeTokens.semantic.space.md,
    },
    foreheadCardHit: {
      backgroundColor: activeTokens.semantic.color.success,
      borderColor: activeTokens.semantic.color.success,
    },
    foreheadCardPass: {
      backgroundColor: activeTokens.semantic.color.highlight,
      borderColor: activeTokens.semantic.color.highlightBorder,
    },
    foreheadCardLandscape: {
      paddingVertical: activeTokens.semantic.space.md,
      gap: activeTokens.semantic.space.sm,
    },
    foreheadWord: {
      fontFamily: activeTokens.semantic.font.display.family,
      fontSize: activeTokens.semantic.font.display.size,
      fontWeight: activeTokens.semantic.font.display.weight,
      lineHeight: activeTokens.semantic.font.display.lineHeight,
      color: activeTokens.semantic.color.onSurface,
      textAlign: 'center',
    },
    turnScoreLine: {
      fontFamily: activeTokens.semantic.font.body.family,
      fontSize: activeTokens.semantic.font.body.size,
      fontWeight: activeTokens.semantic.font.subtitle.weight,
      lineHeight: activeTokens.semantic.font.body.lineHeight,
      color: activeTokens.semantic.color.onSurfaceMuted,
    },
    jumboActions: {
      gap: activeTokens.semantic.space.md,
    },
    jumboActionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    actionSlot: {
      flex: 1,
    },
    summaryPoints: {
      fontFamily: activeTokens.semantic.font.title.family,
      fontSize: activeTokens.semantic.font.title.size,
      fontWeight: activeTokens.semantic.font.title.weight,
      lineHeight: activeTokens.semantic.font.title.lineHeight,
      color: activeTokens.semantic.color.success,
    },
    resultList: {
      gap: activeTokens.semantic.space.sm,
    },
    resultRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: activeTokens.semantic.space.sm,
      padding: activeTokens.semantic.space.md,
      borderRadius: activeTokens.semantic.radius.md,
      borderWidth: activeTokens.semantic.border.thin,
    },
    resultRowHit: {
      backgroundColor: activeTokens.semantic.color.successContainer,
      borderColor: activeTokens.semantic.color.success,
    },
    resultRowPass: {
      backgroundColor: activeTokens.semantic.color.surfaceVariant,
      borderColor: activeTokens.semantic.color.outline,
    },
    resultInfo: {
      flex: 1,
      gap: activeTokens.semantic.space.xs,
    },
    resultWord: {
      fontFamily: activeTokens.semantic.font.subtitle.family,
      fontSize: activeTokens.semantic.font.subtitle.size,
      fontWeight: activeTokens.semantic.font.subtitle.weight,
      lineHeight: activeTokens.semantic.font.subtitle.lineHeight,
      color: activeTokens.semantic.color.onSurface,
    },
    resultMeta: {
      fontFamily: activeTokens.semantic.font.tag.family,
      fontSize: activeTokens.semantic.font.tag.size,
      fontWeight: activeTokens.semantic.font.tag.weight,
      lineHeight: activeTokens.semantic.font.tag.lineHeight,
      color: activeTokens.semantic.color.onSurfaceMuted,
    },
    resultHint: {
      fontFamily: activeTokens.semantic.font.body.family,
      fontSize: activeTokens.semantic.font.body.size,
      fontWeight: activeTokens.semantic.font.body.weight,
      lineHeight: activeTokens.semantic.font.body.lineHeight,
      color: activeTokens.semantic.color.onSurfaceMuted,
    },
    scoreSummaryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: activeTokens.semantic.space.md,
      backgroundColor: activeTokens.semantic.color.surfaceVariant,
      borderRadius: activeTokens.semantic.radius.md,
    },
    scoreSummaryPoints: {
      fontFamily: activeTokens.semantic.font.subtitle.family,
      fontSize: activeTokens.semantic.font.subtitle.size,
      fontWeight: activeTokens.semantic.font.subtitle.weight,
      lineHeight: activeTokens.semantic.font.subtitle.lineHeight,
      color: activeTokens.semantic.color.action,
    },
  });

export default QuemSouEuScreen;
