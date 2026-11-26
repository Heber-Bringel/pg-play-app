import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { DesenhoTurnDuration } from '@/model/entities/multiplayerSession';
import { ConfirmModal } from '@/view/components/confirmModal';
import { DrawingCanvas } from '@/view/components/drawingCanvas';
import { ExpressiveButton } from '@/view/components/expressiveButton';
import { ExpressiveChip } from '@/view/components/expressiveChip';
import { ExpressiveTag } from '@/view/components/expressiveTag';
import { ExpressiveTextField } from '@/view/components/expressiveTextField';
import { ExpressiveTimer } from '@/view/components/expressiveTimer';
import { GameCard } from '@/view/components/gameCard';
import { useReduceMotion } from '@/view/components/useReduceMotion';
import { useTheme, type AppTokens } from '@/view/theme';
import {
  ALL_DESENHO_CATEGORIES,
  useDesenhoViewModel,
} from '@/viewmodel/useDesenhoViewModel';

const DESENHO_DURATIONS: DesenhoTurnDuration[] = [60, 90, 120];
const DESENHO_ROUNDS = [1, 2, 3, 4, 5];

export const DesenhoScreen = () => {
  const [state, actions] = useDesenhoViewModel();
  useReduceMotion(actions.handleSetReduceMotion);
  const activeTokens = useTheme();
  const styles = useMemo(() => createStyles(activeTokens), [activeTokens]);

  const [nickname, setNickname] = useState<string>('');
  const [roomCode, setRoomCode] = useState<string>('');
  const [isDrawing, setIsDrawing] = useState<boolean>(false);

  const canvasDisabled =
    !state.room ||
    state.room.phase !== 'drawing' ||
    !state.isCurrentPlayerDrawer ||
    state.confirmingExit ||
    state.secondsRemaining === 0;

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
        accessibilityLabel="Carregando Sala de Desenho Relâmpago"
      >
        <Text allowFontScaling style={styles.titleText}>
          Preparando a Sala de Desenho Relâmpago...
        </Text>
      </View>
    );
  }

  if (!state.room) {
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
            onPress={() => {
              void actions.handleConfirmExit();
            }}
          />
          <ExpressiveTag
            label={
              state.isRealtimeEnabled
                ? 'Multiplayer Online'
                : 'Multiplayer Local'
            }
            tone="action"
          />
        </View>

        <GameCard
          title="Desenho Relâmpago"
          description="Desenhe com pincel e formas geométricas em tempo real enquanto os demais jogadores da sala tentam adivinhar pelo próprio celular!"
          playersTag="2 a 16 jogadores"
          icon="palette"
        />

        {state.error && (
          <View style={styles.errorBanner} accessibilityLiveRegion="assertive">
            <Text allowFontScaling style={styles.errorText}>
              {state.error}
            </Text>
          </View>
        )}

        <View style={styles.sectionCard}>
          <Text allowFontScaling style={styles.sectionTitle}>
            Seu Apelido na Sala
          </Text>
          <ExpressiveTextField
            label="Apelido do jogador"
            placeholder="Ex.: Ana, Lucas, Líder..."
            value={nickname}
            maxLength={20}
            onChangeText={setNickname}
          />
          <ExpressiveButton
            label="Criar Nova Sala"
            variant="primaryJumbo"
            icon="plus-circle-outline"
            onPress={() => {
              void actions.handleCreateRoom(nickname);
            }}
          />
        </View>

        <View style={styles.sectionCard}>
          <Text allowFontScaling style={styles.sectionTitle}>
            Entrar com Código PIN
          </Text>
          <ExpressiveTextField
            label="Código PIN da sala"
            placeholder="Ex.: DR2026"
            value={roomCode}
            maxLength={10}
            onChangeText={setRoomCode}
          />
          <ExpressiveButton
            label="Entrar na Sala"
            variant="secondary"
            icon="login"
            onPress={() => {
              void actions.handleJoinRoom(roomCode, nickname);
            }}
          />
        </View>

        <ExpressiveButton
          label="Abrir Sala de Demonstração"
          variant="tonal"
          icon="play"
          onPress={() => {
            void actions.handleJoinDemoRoom();
          }}
        />
      </ScrollView>
    );
  }

  const { room } = state;
  const drawerName = state.currentDrawer?.nickname ?? 'Desenhista';
  const showInitialThemeCard =
    room.phase === 'drawing' &&
    state.isThemeBannerVisible &&
    !state.isPeekingTheme;
  const themeOverlay =
    room.phase === 'drawing' &&
    state.isThemeBannerVisible &&
    state.isPeekingTheme &&
    room.currentSecretWord
      ? {
          word: room.currentSecretWord,
          category: room.currentCardCategory ?? 'Desenho',
          secondsLeft: state.themeBannerSecondsLeft,
        }
      : null;

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
        <View style={styles.topMeta}>
          <ExpressiveTag label={`PIN ${room.code}`} tone="action" />
          <ExpressiveTag
            label={`Rodada ${room.currentRound}/${room.config.totalRounds}`}
            tone="neutral"
          />
        </View>
      </View>

      <ConfirmModal
        visible={state.confirmingExit}
        title="Deseja sair da sala de Desenho Relâmpago?"
        description="Você será desconectado desta partida multiplayer."
        onCancel={actions.handleCancelExit}
        onConfirm={() => {
          void actions.handleConfirmExit();
        }}
      />

      {state.error && (
        <View style={styles.errorBanner} accessibilityLiveRegion="assertive">
          <Text allowFontScaling style={styles.errorText}>
            {state.error}
          </Text>
          <ExpressiveButton
            label="Tentar Novamente"
            variant="outlined"
            onPress={() => {
              void actions.handleRetry();
            }}
          />
        </View>
      )}

      {room.phase === 'lobby' && (
        <View style={styles.phaseContainer}>
          <GameCard
            title={`Sala ${room.code} — Lobby`}
            description="Compartilhe o código PIN com o grupo. Cada participante desenha e adivinha no próprio celular!"
            playersTag={`${room.players.length} conectados`}
            icon="palette"
          />

          <View style={styles.sectionCard}>
            <Text allowFontScaling style={styles.sectionTitle}>
              Jogadores Conectados
            </Text>
            <View style={styles.playersWrap}>
              {room.players.map((player) => (
                <ExpressiveTag
                  key={player.id}
                  label={
                    player.isHost
                      ? `${player.nickname} (Anfitrião)`
                      : player.nickname
                  }
                  tone={player.id === state.currentPlayerId ? 'action' : 'neutral'}
                />
              ))}
            </View>
          </View>

          {state.isCurrentPlayerHost && (
            <View style={styles.sectionCard}>
              <Text allowFontScaling style={styles.sectionTitle}>
                Pacotes Desenháveis
              </Text>
              <Text allowFontScaling style={styles.sectionCaption}>
                Escolha os temas desta partida (mínimo 1 pacote ativo).
              </Text>
              <View style={styles.chipsWrap}>
                {ALL_DESENHO_CATEGORIES.map((category) => {
                  const isSelected = room.config.categories.includes(category);
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
                <View style={styles.errorBanner} accessibilityLiveRegion="polite">
                  <Text allowFontScaling style={styles.errorText}>
                    {state.categoryWarning}
                  </Text>
                </View>
              )}

              <Text allowFontScaling style={styles.settingsLabel}>
                Tempo por turno
              </Text>
              <View style={styles.chipsWrap}>
                {DESENHO_DURATIONS.map((seconds) => (
                  <ExpressiveChip
                    key={seconds}
                    label={`${seconds}s`}
                    accessibilityLabel={`${seconds} segundos por turno`}
                    selected={room.config.turnDurationSeconds === seconds}
                    onPress={() => {
                      void actions.handleSelectDuration(seconds);
                    }}
                  />
                ))}
              </View>

              <Text allowFontScaling style={styles.settingsLabel}>
                Rodadas (todos desenham por rodada)
              </Text>
              <View style={styles.chipsWrap}>
                {DESENHO_ROUNDS.map((rounds) => (
                  <ExpressiveChip
                    key={rounds}
                    label={`${rounds}`}
                    accessibilityLabel={`${rounds} ${rounds === 1 ? 'rodada' : 'rodadas'}`}
                    selected={room.config.totalRounds === rounds}
                    onPress={() => {
                      void actions.handleSelectRounds(rounds);
                    }}
                  />
                ))}
              </View>
            </View>
          )}

          {state.isCurrentPlayerHost ? (
            <ExpressiveButton
              label="Começar Partida!"
              variant="primaryJumbo"
              icon="play"
              disabled={room.players.length < 2}
              onPress={() => {
                void actions.handleStartMatch();
              }}
            />
          ) : (
            <View style={styles.infoBanner} accessibilityLiveRegion="polite">
              <Text allowFontScaling style={styles.infoText}>
                Aguardando o Anfitrião iniciar a partida...
              </Text>
            </View>
          )}
        </View>
      )}

      {room.phase === 'drawing' && (
        <View style={styles.phaseContainer}>
          <View style={styles.turnHeader}>
            <View style={styles.turnInfo}>
              <Text allowFontScaling style={styles.turnCaption}>
                {state.isCurrentPlayerDrawer
                  ? 'Sua vez de desenhar!'
                  : `Desenhando agora: ${drawerName}`}
              </Text>
              <ExpressiveTag
                label={room.currentCardCategory ?? 'Desenho'}
                tone="secondary"
              />
            </View>

            {state.isCurrentPlayerDrawer && !state.isThemeBannerVisible && (
              <ExpressiveButton
                label="Espiar palavra"
                variant="tonal"
                icon="eye-outline"
                onPress={actions.handlePeekWord}
              />
            )}
          </View>

          <ExpressiveTimer
            secondsRemaining={state.secondsRemaining}
            reduceMotion={state.reduceMotion}
          />

          {showInitialThemeCard && room.currentSecretWord && (
            <View
              testID="desenho-initial-theme-card"
              style={styles.wordCard}
              accessible
              accessibilityLiveRegion="polite"
              accessibilityLabel={`Tema do desenho: ${room.currentSecretWord}. Categoria: ${room.currentCardCategory ?? 'Desenho'}. Desaparece em ${state.themeBannerSecondsLeft} segundos. Regra de honra: Sem letras nem números.`}
            >
              <View style={styles.wordCardHeader}>
                <ExpressiveTag
                  label={room.currentCardCategory ?? 'Desenho'}
                  tone="secondary"
                />
                <ExpressiveTag
                  label={`Some em ${state.themeBannerSecondsLeft}s`}
                  tone="action"
                />
              </View>
              <Text
                allowFontScaling
                maxFontSizeMultiplier={activeTokens.semantic.typography.maxScale}
                style={styles.secretWord}
              >
                {room.currentSecretWord}
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
          )}

          <DrawingCanvas
            elements={room.elements}
            selectedTool={state.selectedTool}
            selectedFillMode={state.selectedFillMode}
            selectedColor={state.selectedColor}
            selectedWidth={state.selectedWidth}
            expanded={state.isCanvasExpanded}
            readOnly={!state.isCurrentPlayerDrawer}
            disabled={canvasDisabled}
            reduceMotion={state.reduceMotion}
            themeOverlay={themeOverlay}
            onElementComplete={(draft) => {
              void actions.handleCompleteElement(draft);
            }}
            onSelectTool={actions.handleSelectTool}
            onSelectFillMode={actions.handleSelectFillMode}
            onSelectColor={actions.handleSelectColor}
            onSelectWidth={actions.handleSelectWidth}
            onUndo={() => {
              void actions.handleUndoElement();
            }}
            onClear={() => {
              void actions.handleClearCanvas();
            }}
            onDrawingStart={() => setIsDrawing(true)}
            onDrawingEnd={() => setIsDrawing(false)}
          />

          {!state.isCurrentPlayerDrawer && (
            <View style={styles.sectionCard}>
              {state.currentPlayer?.hasGuessedCurrentTurn ? (
                <View
                  style={styles.successBanner}
                  accessibilityLiveRegion="polite"
                >
                  <Text allowFontScaling style={styles.successText}>
                    Você já acertou! Aguarde os colegas ou o fim do tempo.
                  </Text>
                </View>
              ) : (
                <View style={styles.guessForm}>
                  <ExpressiveTextField
                    label="Qual é o desenho?"
                    placeholder="Digite seu palpite..."
                    value={state.guessDraft}
                    maxLength={40}
                    onChangeText={actions.handleChangeGuessDraft}
                  />
                  <ExpressiveButton
                    label="Enviar Palpite"
                    variant="primaryJumbo"
                    icon="send"
                    onPress={() => {
                      void actions.handleSubmitGuess();
                    }}
                  />
                </View>
              )}

              {state.guessFeedback && (
                <View style={styles.infoBanner} accessibilityLiveRegion="polite">
                  <Text allowFontScaling style={styles.infoText}>
                    {state.guessFeedback}
                  </Text>
                </View>
              )}
            </View>
          )}

          {room.guesses.length > 0 && (
            <View style={styles.sectionCard}>
              <Text allowFontScaling style={styles.sectionTitle}>
                Palpites da Sala
              </Text>
              <View style={styles.guessList}>
                {room.guesses.slice(-6).map((guess) => (
                  <View
                    key={guess.id}
                    style={[
                      styles.guessRow,
                      guess.isCorrect && styles.guessRowCorrect,
                    ]}
                  >
                    <Text allowFontScaling style={styles.guessAuthor}>
                      {guess.playerNickname}
                    </Text>
                    <Text
                      allowFontScaling
                      style={[
                        styles.guessText,
                        guess.isCorrect && styles.guessTextCorrect,
                      ]}
                    >
                      {guess.isCorrect
                        ? `Acertou! (+${guess.pointsAwarded} pts)`
                        : guess.text}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      )}

      {room.phase === 'turn_summary' && (
        <View style={styles.phaseContainer} accessibilityLiveRegion="assertive">
          <GameCard
            title={`Fim do Turno — ${drawerName}`}
            description={`A palavra era: ${room.currentSecretWord ?? '—'}. Acertos neste turno: ${
              room.guesses.filter((g) => g.isCorrect).length
            }.`}
            playersTag={room.currentCardCategory ?? 'Desenho'}
            playersTagTone="success"
            icon="check-decagram"
          />

          <DrawingCanvas elements={room.elements} readOnly expanded={false} />

          <View style={styles.sectionCard}>
            <Text allowFontScaling style={styles.sectionTitle}>
              Placar da Sala
            </Text>
            {state.rankedPlayers.map((player, index) => (
              <View key={player.id} style={styles.rankRow}>
                <Text allowFontScaling style={styles.rankName}>
                  {`${index + 1}º · ${player.nickname}`}
                </Text>
                <ExpressiveTag
                  label={`${player.score} pts`}
                  tone={index === 0 ? 'highlight' : 'neutral'}
                />
              </View>
            ))}
          </View>

          {state.isCurrentPlayerHost ? (
            <ExpressiveButton
              label="Próximo Desenhista"
              variant="primaryJumbo"
              icon="play"
              onPress={() => {
                void actions.handleAdvanceTurn();
              }}
            />
          ) : (
            <View style={styles.infoBanner}>
              <Text allowFontScaling style={styles.infoText}>
                Aguardando o Anfitrião iniciar o próximo turno...
              </Text>
            </View>
          )}
        </View>
      )}

      {room.phase === 'finished' && (
        <View style={styles.phaseContainer} accessibilityLiveRegion="polite">
          <GameCard
            title="Pódio Final — Desenho Relâmpago"
            description={
              state.awards.generalChampion
                ? `Campeão Geral: ${state.awards.generalChampion.nickname} (${state.awards.generalChampion.score} pts)!`
                : 'Partida concluída com sucesso!'
            }
            playersTag="Concluído"
            playersTagTone="success"
            highlightLeader
            icon="trophy"
          />

          <View style={styles.sectionCard}>
            <Text allowFontScaling style={styles.sectionTitle}>
              Destaques da Sala
            </Text>
            <View style={styles.playersWrap}>
              {state.awards.generalChampion && (
                <ExpressiveTag
                  label={`Campeão: ${state.awards.generalChampion.nickname}`}
                  tone="highlight"
                />
              )}
              {state.awards.bestArtist && (
                <ExpressiveTag
                  label={`Melhor Artista: ${state.awards.bestArtist.nickname}`}
                  tone="secondary"
                />
              )}
              {state.awards.eagleEye && (
                <ExpressiveTag
                  label={`Olho de Águia: ${state.awards.eagleEye.nickname}`}
                  tone="success"
                />
              )}
            </View>
            {state.rankedPlayers.map((player, index) => (
              <View key={player.id} style={styles.rankRow}>
                <Text allowFontScaling style={styles.rankName}>
                  {`${index + 1}º · ${player.nickname}`}
                </Text>
                <ExpressiveTag
                  label={`${player.score} pts`}
                  tone={index === 0 ? 'highlight' : 'neutral'}
                />
              </View>
            ))}
          </View>

          {state.isCurrentPlayerHost && (
            <ExpressiveButton
              label="Jogar Novamente"
              variant="primaryJumbo"
              icon="replay"
              onPress={() => {
                void actions.handleRestartLobby();
              }}
            />
          )}

          <ExpressiveButton
            label="Voltar ao Hub"
            variant="outlined"
            icon="home-outline"
            onPress={() => {
              void actions.handleConfirmExit();
            }}
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
      flexWrap: 'wrap',
    },
    topMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.xs,
    },
    phaseContainer: {
      flex: 1,
      gap: space.md,
    },
    sectionCard: {
      backgroundColor: card.bg,
      borderColor: card.border,
      borderWidth: border.thin,
      borderRadius: card.radius,
      padding: space.md,
      gap: space.sm,
    },
    sectionTitle: {
      fontFamily: font.subtitle.family,
      fontSize: font.subtitle.size,
      fontWeight: font.subtitle.weight,
      lineHeight: font.subtitle.lineHeight,
      color: color.onSurface,
    },
    sectionCaption: {
      fontFamily: font.caption.family,
      fontSize: font.caption.size,
      fontWeight: font.caption.weight,
      lineHeight: font.caption.lineHeight,
      color: color.onSurfaceMuted,
    },
    settingsLabel: {
      fontFamily: font.label.family,
      fontSize: font.label.size,
      fontWeight: font.label.weight,
      lineHeight: font.label.lineHeight,
      color: color.onSurfaceMuted,
    },
    playersWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: space.sm,
    },
    chipsWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: space.sm,
    },
    turnHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: space.sm,
      backgroundColor: color.actionContainer,
      paddingHorizontal: space.md,
      paddingVertical: space.sm,
      borderRadius: radius.lg,
      flexWrap: 'wrap',
    },
    turnInfo: {
      flex: 1,
      gap: space.xs,
    },
    turnCaption: {
      fontFamily: font.subtitle.family,
      fontSize: font.subtitle.size,
      fontWeight: font.subtitle.weight,
      lineHeight: font.subtitle.lineHeight,
      color: color.onActionContainer,
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
    wordCardHeader: {
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'space-between',
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
    guessForm: {
      gap: space.sm,
    },
    guessList: {
      gap: space.xs,
    },
    guessRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: space.sm,
      paddingHorizontal: space.sm,
      paddingVertical: space.xs,
      borderRadius: radius.sm,
      backgroundColor: color.surfaceVariant,
    },
    guessRowCorrect: {
      backgroundColor: banner.success.bg,
      borderColor: banner.success.border,
      borderWidth: border.thin,
    },
    guessAuthor: {
      fontFamily: font.label.family,
      fontSize: font.label.size,
      fontWeight: font.label.weight,
      lineHeight: font.label.lineHeight,
      color: color.onSurface,
    },
    guessText: {
      fontFamily: font.body.family,
      fontSize: font.body.size,
      fontWeight: font.body.weight,
      lineHeight: font.body.lineHeight,
      color: color.onSurfaceMuted,
      flexShrink: 1,
    },
    guessTextCorrect: {
      color: banner.success.text,
      fontWeight: font.label.weight,
    },
    rankRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: space.sm,
      paddingVertical: space.xs,
    },
    rankName: {
      fontFamily: font.subtitle.family,
      fontSize: font.subtitle.size,
      fontWeight: font.subtitle.weight,
      lineHeight: font.subtitle.lineHeight,
      color: color.onSurface,
    },
    errorBanner: {
      backgroundColor: banner.error.bg,
      borderColor: banner.error.border,
      borderWidth: border.thin,
      borderRadius: banner.radius,
      padding: space.md,
      gap: space.sm,
    },
    errorText: {
      fontFamily: font.caption.family,
      fontSize: font.caption.size,
      fontWeight: font.caption.weight,
      lineHeight: font.caption.lineHeight,
      color: banner.error.text,
    },
    infoBanner: {
      backgroundColor: banner.info.bg,
      borderColor: banner.info.border,
      borderWidth: border.thin,
      borderRadius: banner.radius,
      padding: space.md,
    },
    infoText: {
      fontFamily: font.caption.family,
      fontSize: font.caption.size,
      fontWeight: font.caption.weight,
      lineHeight: font.caption.lineHeight,
      color: banner.info.text,
      textAlign: 'center',
    },
    successBanner: {
      backgroundColor: banner.success.bg,
      borderColor: banner.success.border,
      borderWidth: border.thin,
      borderRadius: banner.radius,
      padding: space.md,
    },
    successText: {
      fontFamily: font.label.family,
      fontSize: font.label.size,
      fontWeight: font.label.weight,
      lineHeight: font.label.lineHeight,
      color: banner.success.text,
      textAlign: 'center',
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

export default DesenhoScreen;
