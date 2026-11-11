import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ExpressiveButton } from '@/view/components/expressiveButton';
import { ExpressiveTextField } from '@/view/components/expressiveTextField';
import { ExpressiveTimer } from '@/view/components/expressiveTimer';
import { GameCard } from '@/view/components/gameCard';
import { LetterKey } from '@/view/components/letterKey';
import { border, color, font, icon, radius, space } from '@/view/theme';
import { useAdedonhaViewModel } from '@/viewmodel/useAdedonhaViewModel';

const ROULETTE_PREVIEW_LETTERS: string[] = [
  'A',
  'B',
  'C',
  'D',
  'E',
  'J',
  'M',
  'P',
  'S',
];

export const AdedonhaScreen = () => {
  const [state, actions] = useAdedonhaViewModel();
  const [newColumnInput, setNewColumnInput] = useState<string>('');

  if (state.loading) {
    return (
      <View
        style={styles.screen}
        accessibilityRole="progressbar"
        accessibilityLabel="Carregando Sala Multiplayer da Adedonha Bíblica"
      >
        <Text allowFontScaling style={styles.title}>
          Conectando à Sala da Adedonha Bíblica...
        </Text>
      </View>
    );
  }

  if (!state.room && state.error) {
    return (
      <View style={styles.screen} accessibilityLiveRegion="assertive">
        <GameCard
          title="Erro na Sala Multiplayer"
          description={state.error}
          playersTag="Erro"
          icon="alert-circle"
        />
        <ExpressiveButton
          label="Tentar Novamente"
          variant="primary"
          icon="refresh"
          onPress={() => {
            void actions.handleRetry();
          }}
        />
      </View>
    );
  }

  if (!state.room) {
    return (
      <View style={styles.screen}>
        <GameCard
          title="Nenhuma Sala Encontrada"
          description="Não há sala ativa de Adedonha Bíblica no momento."
          playersTag="0 jogadores"
          icon="account-group-outline"
        />
        <ExpressiveButton
          label="Voltar ao Hub"
          variant="primaryJumbo"
          icon="home"
          onPress={actions.handleExitArena}
        />
      </View>
    );
  }

  const { room } = state;

  const onAddCustomColumn = async () => {
    const added = await actions.handleAddColumn(newColumnInput);
    if (added) {
      setNewColumnInput('');
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.topBar}>
        <ExpressiveButton
          label="Sair"
          variant="outlined"
          icon="arrow-left"
          onPress={actions.handleExitArena}
        />
        <View
          style={styles.roomBadge}
          accessibilityRole="text"
          accessibilityLabel={`Sala ${room.code}, Rodada ${room.currentRound} de ${room.config.totalRounds}`}
        >
          <MaterialCommunityIcons
            name="access-point"
            size={icon.sm}
            color={color.onActionContainer}
          />
          <Text allowFontScaling style={styles.roomBadgeText}>
            {`Sala ${room.code} · Rodada ${room.currentRound}/${room.config.totalRounds}`}
          </Text>
        </View>
      </View>

      {state.error && (
        <View style={styles.errorBanner} accessibilityLiveRegion="assertive">
          <MaterialCommunityIcons
            name="alert-circle"
            size={icon.md}
            color={color.error}
          />
          <Text allowFontScaling style={styles.errorBannerText}>
            {state.error}
          </Text>
        </View>
      )}

      {room.phase === 'lobby' && (
        <View style={styles.section}>
          <GameCard
            title="Adedonha Bíblica · Lobby Multiplayer"
            description={`Moderador configura as colunas temáticas e gira a Roleta Expressiva do Alfabeto.`}
            playersTag={`${room.players.length} jogadores`}
            icon="alphabetical-variant"
            highlightLeader
          />

          <View style={styles.rouletteBox}>
            <Text allowFontScaling style={styles.sectionTitle}>
              Roleta Expressiva do Alfabeto
            </Text>
            <Text allowFontScaling style={styles.sectionSubtitle}>
              Toque em uma letra do anel ou sorteie automaticamente:
            </Text>
            <View style={styles.letterGrid}>
              {ROULETTE_PREVIEW_LETTERS.map((letter) => {
                const isUsed = room.usedLetters.includes(letter);
                return (
                  <LetterKey
                    key={letter}
                    letter={letter}
                    status={isUsed ? 'miss' : 'available'}
                    onPress={(chosen) => {
                      void actions.handleSpinRoulette(chosen);
                    }}
                  />
                );
              })}
            </View>
            <ExpressiveButton
              label="Girar Roleta Expressiva"
              variant="primaryJumbo"
              icon="rotate-3d-variant"
              onPress={() => {
                void actions.handleSpinRoulette();
              }}
            />
          </View>

          <View style={styles.columnsBox}>
            <Text allowFontScaling style={styles.sectionTitle}>
              {`Colunas Bíblicas da Rodada (${room.config.columns.length})`}
            </Text>
            <ExpressiveTextField
              label="Nova Coluna Bíblica"
              value={newColumnInput}
              placeholder="Ex.: Milagre ou Parábola"
              helperText="Mínimo de 2 caracteres"
              icon="view-column-outline"
              maxLength={40}
              onChangeText={setNewColumnInput}
            />
            <ExpressiveButton
              label="Adicionar Coluna"
              variant="tonal"
              icon="plus-circle-outline"
              onPress={() => {
                void onAddCustomColumn();
              }}
            />

            <View style={styles.columnList}>
              {room.config.columns.map((col, idx) => (
                <View key={col} style={styles.columnItem}>
                  <GameCard
                    title={`${idx + 1}. ${col}`}
                    description="Coluna ativa para todos os jogadores da sala"
                    playersTag="Ativa"
                    icon="book-open-page-variant"
                  />
                  {room.config.columns.length > 1 && (
                    <ExpressiveButton
                      label={`Remover · ${col}`}
                      variant="outlined"
                      icon="delete-outline"
                      onPress={() => {
                        void actions.handleRemoveColumn(col);
                      }}
                    />
                  )}
                </View>
              ))}
            </View>
          </View>
        </View>
      )}

      {(room.phase === 'filling' ||
        room.phase === 'roulette' ||
        room.phase === 'stop_countdown') && (
        <View style={styles.section}>
          <View style={styles.roundHeader}>
            <View
              style={styles.heroLetterBadge}
              accessibilityLiveRegion="polite"
              accessibilityLabel={`Letra sorteada: ${room.currentLetter}`}
            >
              <Text allowFontScaling style={styles.heroLetterCaption}>
                LETRA
              </Text>
              <Text allowFontScaling style={styles.heroLetterText}>
                {room.currentLetter ?? '?'}
              </Text>
            </View>
            <ExpressiveTimer secondsRemaining={state.secondsRemaining} />
          </View>

          <View style={styles.fieldsList}>
            {room.config.columns.map((columnName) => (
              <ExpressiveTextField
                key={columnName}
                label={columnName}
                value={state.answers[columnName] ?? ''}
                placeholder={`Começa com ${room.currentLetter ?? ''}...`}
                helperText={`Digite uma resposta iniciada por ${room.currentLetter ?? ''}`}
                errorText={state.fieldErrors[columnName] ?? undefined}
                icon="pencil-outline"
                maxLength={40}
                onChangeText={(text) =>
                  actions.handleChangeAnswer(columnName, text)
                }
              />
            ))}
          </View>

          <View style={styles.actionsStack}>
            <ExpressiveButton
              label="ADEDONHA! (Parar Rodada)"
              variant="primaryJumbo"
              icon="hand-back-right"
              disabled={!state.canTriggerAdedonha}
              onPress={() => {
                void actions.handleTriggerAdedonha();
              }}
            />
            <ExpressiveButton
              label="Encerrar Tempo da Rodada"
              variant="outlined"
              icon="timer-off-outline"
              onPress={() => {
                void actions.handleTimeOut();
              }}
            />
          </View>
        </View>
      )}

      {room.phase === 'tally' && (
        <View style={styles.section}>
          <GameCard
            title={`Coluna ${room.currentTallyColumnIndex + 1} de ${room.config.columns.length}: ${state.currentTallyColumnName ?? ''}`}
            description={`Apuração Assistida · Letra ${room.currentLetter ?? ''} · ${
              room.stopTriggeredBy
                ? `${room.stopTriggeredBy} pediu ADEDONHA!`
                : 'Tempo esgotado'
            }`}
            playersTag={`Letra ${room.currentLetter ?? ''}`}
            icon="scale-balance"
            highlightLeader
          />

          <View style={styles.submissionList}>
            {state.currentColumnSubmissions.map((sub) => {
              const statusLabel =
                sub.status === 'unique'
                  ? `Única (+${sub.points} pts)`
                  : sub.status === 'repeated'
                  ? `Repetida (+${sub.points} pts)`
                  : `Inválida (${sub.points} pts)`;

              const statusIcon =
                sub.status === 'unique'
                  ? 'star-circle'
                  : sub.status === 'repeated'
                  ? 'handshake'
                  : 'close-circle';

              return (
                <View key={sub.id} style={styles.submissionItem}>
                  <GameCard
                    title={`${sub.playerNickname}: "${sub.answerText || '(Em branco)'}"`}
                    description={
                      sub.doubtCount > 0
                        ? `⚠️ ${sub.doubtCount} jogador(es) levantaram dúvida sobre esta resposta`
                        : 'Pré-classificada automaticamente pelo sistema'
                    }
                    playersTag={statusLabel}
                    icon={statusIcon}
                    highlightLeader={sub.status === 'unique'}
                  />
                  <View style={styles.judgeActions}>
                    <ExpressiveButton
                      label={`Levantar Dúvida ✋ · ${sub.playerNickname}`}
                      variant="tonal"
                      icon="hand-pointing-up"
                      onPress={() => {
                        void actions.handleRaiseDoubt(sub.id);
                      }}
                    />
                    <ExpressiveButton
                      label={`Validar Única (+10) · ${sub.playerNickname}`}
                      variant="successJumbo"
                      icon="check-decagram"
                      onPress={() => {
                        void actions.handleJudgeSubmission(sub.id, 'unique');
                      }}
                    />
                    <ExpressiveButton
                      label={`Marcar Repetida (+5) · ${sub.playerNickname}`}
                      variant="secondary"
                      icon="account-multiple-check"
                      onPress={() => {
                        void actions.handleJudgeSubmission(sub.id, 'repeated');
                      }}
                    />
                    <ExpressiveButton
                      label={`Invalidar (0 pts) · ${sub.playerNickname}`}
                      variant="outlined"
                      icon="close-octagon-outline"
                      onPress={() => {
                        void actions.handleJudgeSubmission(sub.id, 'invalid');
                      }}
                    />
                  </View>
                </View>
              );
            })}
          </View>

          <ExpressiveButton
            label="Confirmar e Próxima Coluna"
            variant="primaryJumbo"
            icon="check-all"
            onPress={() => {
              void actions.handleAdvanceTallyColumn();
            }}
          />
        </View>
      )}

      {(room.phase === 'round_summary' || room.phase === 'finished') && (
        <View style={styles.section}>
          <GameCard
            title={
              room.phase === 'finished'
                ? 'Pódio Final da Adedonha Bíblica'
                : `Resumo da Rodada ${room.currentRound}`
            }
            description={`Letras já sorteadas: ${room.usedLetters.join(', ')}`}
            playersTag={`${room.players.length} jogadores`}
            icon="trophy-award"
            highlightLeader
          />

          {state.awards.generalChampion && (
            <GameCard
              title={`🥇 Campeão Geral: ${state.awards.generalChampion.nickname}`}
              description={`⚡ Mão Mais Rápida: ${state.awards.fastestHand?.nickname ?? '-'} · 🧠 Vocabulário Raro: ${state.awards.rareVocabulary?.nickname ?? '-'}`}
              playersTag={`${state.awards.generalChampion.score} pts`}
              icon="crown"
              highlightLeader
            />
          )}

          <View style={styles.rankingList}>
            {state.rankedPlayers.map((player, index) => (
              <GameCard
                key={player.id}
                title={`${index + 1}º · ${player.nickname}`}
                description={`Respostas únicas: ${player.uniqueAnswersCount} · Gritos de Adedonha: ${player.stopCount}`}
                playersTag={`${player.score} pts`}
                icon={index === 0 ? 'medal' : 'account'}
                highlightLeader={index === 0}
              />
            ))}
          </View>

          <View style={styles.actionsStack}>
            {room.phase === 'round_summary' && (
              <ExpressiveButton
                label="Girar Próxima Letra"
                variant="primaryJumbo"
                icon="rotate-right"
                onPress={() => {
                  void actions.handleAdvanceToNextRound();
                }}
              />
            )}
            <ExpressiveButton
              label="Ir para o Placar Final"
              variant="tonal"
              icon="podium-gold"
              onPress={actions.handleGoToScoreboard}
            />
          </View>
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
    gap: space.lg,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: space.sm,
  },
  roomBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.full,
    backgroundColor: color.actionContainer,
  },
  roomBadgeText: {
    fontFamily: font.caption.family,
    fontSize: font.caption.size,
    fontWeight: font.caption.weight,
    color: color.onActionContainer,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    padding: space.md,
    borderRadius: radius.md,
    borderWidth: border.thin,
    borderColor: color.error,
    backgroundColor: color.errorContainer,
  },
  errorBannerText: {
    flex: 1,
    fontFamily: font.body.family,
    fontSize: font.body.size,
    color: color.onErrorContainer,
  },
  section: {
    gap: space.lg,
  },
  sectionTitle: {
    fontFamily: font.subtitle.family,
    fontSize: font.subtitle.size,
    fontWeight: font.subtitle.weight,
    color: color.onSurface,
  },
  sectionSubtitle: {
    fontFamily: font.body.family,
    fontSize: font.body.size,
    color: color.onSurfaceMuted,
  },
  rouletteBox: {
    padding: space.lg,
    borderRadius: radius.xl,
    borderWidth: border.thin,
    borderColor: color.outline,
    backgroundColor: color.surfaceContainer,
    gap: space.md,
  },
  letterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
  },
  columnsBox: {
    gap: space.md,
  },
  columnList: {
    gap: space.md,
  },
  columnItem: {
    gap: space.xs,
  },
  roundHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: space.md,
  },
  heroLetterBadge: {
    minWidth: space.xxxl,
    minHeight: space.xxxl,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    borderRadius: radius.xl,
    backgroundColor: color.action,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroLetterCaption: {
    fontFamily: font.caption.family,
    fontSize: font.caption.size,
    fontWeight: font.caption.weight,
    color: color.onAction,
  },
  heroLetterText: {
    fontFamily: font.display.family,
    fontSize: font.display.size,
    fontWeight: font.display.weight,
    color: color.onAction,
  },
  fieldsList: {
    gap: space.md,
  },
  actionsStack: {
    gap: space.sm,
  },
  submissionList: {
    gap: space.lg,
  },
  submissionItem: {
    gap: space.xs,
  },
  judgeActions: {
    gap: space.xs,
  },
  rankingList: {
    gap: space.md,
  },
  title: {
    fontFamily: font.title.family,
    fontSize: font.title.size,
    fontWeight: font.title.weight,
    color: color.onSurface,
    textAlign: 'center',
  },
});

export default AdedonhaScreen;
