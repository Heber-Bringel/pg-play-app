import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ConfirmModal } from '@/view/components/confirmModal';
import { ExpressiveButton } from '@/view/components/expressiveButton';
import { ExpressiveChip } from '@/view/components/expressiveChip';
import { GameCard } from '@/view/components/gameCard';
import { LetterKey } from '@/view/components/letterKey';
import { border, card, color, font, icon, key, radius, space } from '@/view/theme';
import {
  normalizeChar,
  useForcaViewModel,
  type ForcaAttemptsOption,
} from '@/viewmodel/useForcaViewModel';

const FORCA_ATTEMPTS: ForcaAttemptsOption[] = [5, 6, 8];
const FORCA_ROUNDS = [1, 2, 3, 4, 5];

const ALL_LETTERS = [
  'A', 'B', 'C', 'D', 'E', 'F',
  'G', 'H', 'I', 'J', 'K', 'L',
  'M', 'N', 'O', 'P', 'Q', 'R',
  'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
];

export const ForcaScreen = () => {
  const [state, actions] = useForcaViewModel();
  const { width } = useWindowDimensions();

  const availableWidth = width - space.md * 2;
  const keyUnitWidth = key.size + space.sm;
  const keysPerRow = Math.max(1, Math.floor((availableWidth + space.sm) / keyUnitWidth));

  const keyboardRows = useMemo(() => {
    const rows: string[][] = [];
    for (let i = 0; i < ALL_LETTERS.length; i += keysPerRow) {
      rows.push(ALL_LETTERS.slice(i, i + keysPerRow));
    }
    return rows;
  }, [keysPerRow]);

  if (state.loading) {
    return (
      <View
        style={styles.screen}
        accessibilityRole="progressbar"
        accessibilityLabel="Carregando Arena do Jogo da Forca"
      >
        <Text allowFontScaling style={styles.titleText}>
          Preparando a Arena da Forca...
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
          description="Cadastre pelo menos 2 equipes para iniciar o Jogo da Forca."
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
          <View style={styles.teamBadge}>
            <Text allowFontScaling style={styles.teamBadgeText}>
              {teamName}
            </Text>
          </View>
          <View
            style={styles.attemptsBadge}
            accessible
            accessibilityLabel={`${state.remainingAttempts} tentativas restantes`}
          >
            <MaterialCommunityIcons
              name="heart"
              size={icon.sm}
              color={color.onSecondaryContainer}
            />
            <Text allowFontScaling style={styles.attemptsText}>
              {`${state.remainingAttempts} tentativas`}
            </Text>
          </View>
        </View>
      </View>

      <ConfirmModal
        visible={state.confirmingExit}
        title="Deseja encerrar a partida do Jogo da Forca?"
        description="O progresso desta palavra será perdido se você sair agora."
        onCancel={actions.handleCancelExit}
        onConfirm={actions.handleConfirmExit}
      />

      {state.phase === 'pass-turn' && (
        <View style={styles.contentSection}>
          <GameCard
            title={`Vez da Equipe ${teamName}`}
            description={`Palavra ${state.currentRound} de ${state.totalRounds}. A equipe possui ${teamScore} pts. Reúnam o grupo e preparem-se para adivinhar!`}
            playersTag="Passa-Celular"
            icon="account-group"
          />
          {state.currentRound === 1 && state.currentTeamIndex === 0 ? (
            <View style={styles.settingsCard}>
              <Text allowFontScaling style={styles.settingsTitle}>
                Parâmetros da Partida
              </Text>
              <Text allowFontScaling style={styles.settingsLabel}>
                Tentativas por palavra
              </Text>
              <View style={styles.chipRow}>
                {FORCA_ATTEMPTS.map((attempts) => (
                  <ExpressiveChip
                    key={attempts}
                    label={`${attempts}`}
                    accessibilityLabel={`${attempts} tentativas por palavra`}
                    selected={state.maxAttempts === attempts}
                    onPress={() => actions.handleSelectAttempts(attempts)}
                  />
                ))}
              </View>
              <Text allowFontScaling style={styles.settingsLabel}>
                Palavras por equipe
              </Text>
              <View style={styles.chipRow}>
                {FORCA_ROUNDS.map((rounds) => (
                  <ExpressiveChip
                    key={rounds}
                    label={`${rounds}`}
                    accessibilityLabel={`${rounds} ${rounds === 1 ? 'palavra' : 'palavras'} por equipe`}
                    selected={state.totalRounds === rounds}
                    onPress={() => actions.handleSelectRounds(rounds)}
                  />
                ))}
              </View>
            </View>
          ) : null}
          <View style={styles.actionBlock}>
            <ExpressiveButton
              label="Estou Pronto!"
              variant="primaryJumbo"
              icon="play"
              onPress={actions.handleStartTurn}
            />
          </View>
        </View>
      )}

      {state.phase === 'playing' && state.currentPuzzle && (
        <View style={styles.contentSection}>
          <View style={styles.cardContainer}>
            <Text allowFontScaling style={styles.hintLabel}>
              {`DICA: ${state.currentPuzzle.hint}`}
            </Text>
            <View style={styles.slotsRow}>
              {state.maskedWord.map((letter, index) => {
                if (letter.original === ' ') {
                  return <View key={`slot-${index}`} style={styles.spaceSlot} />;
                }
                return (
                  <View key={`slot-${index}`} style={styles.slotWrapper}>
                    <View style={styles.letterSlot}>
                      <Text allowFontScaling style={styles.slotText}>
                        {letter.revealed ? letter.original : ' '}
                      </Text>
                    </View>
                    <View style={styles.slotUnderline} />
                  </View>
                );
              })}
            </View>
          </View>

          <View style={styles.keyboardContainer}>
            {keyboardRows.map((row, rowIndex) => (
              <View key={`row-${rowIndex}`} style={styles.keyboardRow}>
                {row.map((char) => {
                  const norm = normalizeChar(char);
                  const isGuessed = state.guessedLetters.some(
                    (l) => normalizeChar(l) === norm
                  );
                  let keyStatus: 'available' | 'hit' | 'miss' = 'available';
                  if (isGuessed) {
                    const isHit = state.currentPuzzle?.word
                      .split('')
                      .some((c) => normalizeChar(c) === norm);
                    keyStatus = isHit ? 'hit' : 'miss';
                  }

                  return (
                    <LetterKey
                      key={char}
                      letter={char}
                      status={keyStatus}
                      onPress={(l) => {
                        void actions.handleGuessLetter(l);
                      }}
                    />
                  );
                })}
              </View>
            ))}
          </View>

          <View style={styles.resetButtonContainer}>
            <ExpressiveButton
              label="Reiniciar Palavra"
              variant="tonal"
              icon="refresh"
              onPress={actions.handleResetWord}
            />
          </View>
        </View>
      )}

      {state.phase === 'word-result' && (
        <View style={styles.contentSection}>
          {state.wordWon ? (
            <GameCard
              title="Palavra Descoberta!"
              description={`A equipe ${teamName} acertou "${state.currentPuzzle?.word}" e somou +${state.earnedPoints} pts (+30 pts + bônus de ${state.bonusPoints} pts por tentativas restantes)!`}
              playersTag={`+${state.earnedPoints} pts`}
              icon="trophy"
            />
          ) : (
            <GameCard
              title="Tentativas Esgotadas!"
              description={`A palavra secreta era "${state.currentPuzzle?.word}". A equipe não pontuou nesta rodada.`}
              playersTag="0 pts"
              icon="close-circle"
            />
          )}

          <View style={styles.actionBlock}>
            <ExpressiveButton
              label="Próxima Palavra"
              variant="primaryJumbo"
              icon="play"
              onPress={actions.handleNextWord}
            />
          </View>
        </View>
      )}

      {state.phase === 'finished' && (
        <View style={styles.contentSection}>
          <GameCard
            title="Fim da Partida da Forca!"
            description="Todas as rodadas do Jogo da Forca foram concluídas pelas equipes participantes."
            playersTag="Partida Concluída"
            icon="trophy"
          />
          <View style={styles.actionBlock}>
            <ExpressiveButton
              label="Ir para o Placar Final"
              variant="successJumbo"
              icon="trophy"
              onPress={actions.handleGoToScoreboard}
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
  },
  scrollContent: {
    padding: space.md,
    gap: space.md,
    paddingBottom: space.xxl,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: space.sm,
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: space.xs,
    flexShrink: 1,
  },
  teamBadge: {
    backgroundColor: color.actionContainer,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.full,
  },
  teamBadgeText: {
    color: color.onActionContainer,
    fontFamily: font.label.family,
    fontSize: font.label.size,
    fontWeight: font.label.weight,
    lineHeight: font.label.lineHeight,
  },
  attemptsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    backgroundColor: color.secondaryContainer,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.full,
  },
  attemptsText: {
    color: color.onSecondaryContainer,
    fontFamily: font.label.family,
    fontSize: font.label.size,
    fontWeight: font.label.weight,
    lineHeight: font.label.lineHeight,
  },
  contentSection: {
    gap: space.md,
  },
  cardContainer: {
    backgroundColor: color.surfaceContainer,
    borderRadius: radius.lg,
    padding: space.md,
    borderWidth: border.thin,
    borderColor: color.outline,
    gap: space.md,
    alignItems: 'center',
  },
  hintLabel: {
    fontFamily: font.subtitle.family,
    fontSize: font.subtitle.size,
    fontWeight: font.subtitle.weight,
    lineHeight: font.subtitle.lineHeight,
    color: color.onSurface,
    textAlign: 'center',
  },
  slotsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: space.xs,
  },
  slotWrapper: {
    alignItems: 'center',
    gap: space.xs,
  },
  letterSlot: {
    minWidth: space.xl,
    minHeight: space['2xl'],
    backgroundColor: color.surfaceVariant,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.xs,
  },
  slotText: {
    fontFamily: font.title.family,
    fontSize: font.title.size,
    fontWeight: font.title.weight,
    lineHeight: font.title.lineHeight,
    color: color.onSurface,
  },
  slotUnderline: {
    height: space.xs,
    width: '100%',
    backgroundColor: color.action,
    borderRadius: radius.sm,
  },
  spaceSlot: {
    width: space.md,
  },
  keyboardContainer: {
    gap: space.sm,
    alignItems: 'center',
  },
  keyboardRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: space.sm,
  },
  resetButtonContainer: {
    alignItems: 'center',
    marginTop: space.sm,
  },
  actionBlock: {
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

export default ForcaScreen;
