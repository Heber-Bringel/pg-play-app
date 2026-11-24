import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type {
  CidadeDormePlayer,
  CidadeDormeRole,
  CidadeDormeRoom,
} from '@/model/entities/multiplayerSession';
import { ExpressiveButton } from '@/view/components/expressiveButton';
import { ExpressiveTag } from '@/view/components/expressiveTag';
import { ExpressiveTimer } from '@/view/components/expressiveTimer';
import { GameCard } from '@/view/components/gameCard';
import { SelectableOptionItem } from '@/view/components/selectableOptionItem';
import { useTheme, type AppTokens } from '@/view/theme';

const ROLE_LABELS: Record<CidadeDormeRole, string> = {
  cidadao: 'Cidadão',
  assassino: 'Assassino',
  anjo: 'Anjo',
  detetive: 'Detetive',
};

const ROLE_ICONS: Record<
  CidadeDormeRole,
  keyof typeof MaterialCommunityIcons.glyphMap
> = {
  assassino: 'incognito',
  anjo: 'shield-check',
  detetive: 'magnify',
  cidadao: 'home-account',
};

export type CidadeDormeDaySectionProps = {
  room: CidadeDormeRoom;
  currentPlayer: CidadeDormePlayer | null;
  isCurrentPlayerHost: boolean;
  selectedVoteTargetId: string | null;
  secondsRemaining: number;
  reduceMotion?: boolean;
  onStartVotingPhase: () => Promise<void>;
  onSelectVoteTarget: (targetIdOrSkip: string) => void;
  onCastVote: () => Promise<void>;
  onTallyVotes: () => Promise<void>;
  onStartNextNight: () => Promise<void>;
  onRestartMatch: () => Promise<void>;
  onExitArena: () => void;
};

export const CidadeDormeDaySection = ({
  room,
  currentPlayer,
  isCurrentPlayerHost,
  selectedVoteTargetId,
  secondsRemaining,
  reduceMotion = false,
  onStartVotingPhase,
  onSelectVoteTarget,
  onCastVote,
  onTallyVotes,
  onStartNextNight,
  onRestartMatch,
  onExitArena,
}: CidadeDormeDaySectionProps) => {
  const activeTokens = useTheme();
  const styles = useMemo(() => createStyles(activeTokens), [activeTokens]);

  const narratorFadeAnim = useRef(new Animated.Value(1)).current;
  const dawnSlideAnim = useRef(new Animated.Value(0)).current;
  const dawnOpacityAnim = useRef(new Animated.Value(1)).current;
  const voteBarAnim = useRef(new Animated.Value(1)).current;
  const winnerScaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (reduceMotion) {
      narratorFadeAnim.setValue(1);
      return;
    }
    narratorFadeAnim.setValue(0.6);
    Animated.timing(narratorFadeAnim, {
      toValue: 1,
      duration: activeTokens.semantic.motion.duration.short,
      useNativeDriver: true,
    }).start();
  }, [
    activeTokens.semantic.motion.duration.short,
    narratorFadeAnim,
    reduceMotion,
    room.narratorCaption,
  ]);

  useEffect(() => {
    if (room.phase !== 'day_debate' || reduceMotion) {
      dawnSlideAnim.setValue(0);
      dawnOpacityAnim.setValue(1);
      return;
    }
    dawnSlideAnim.setValue(-16);
    dawnOpacityAnim.setValue(0);
    Animated.spring(dawnSlideAnim, {
      toValue: 0,
      damping: activeTokens.semantic.motion.spring.spatial.damping,
      stiffness: activeTokens.semantic.motion.spring.spatial.stiffness,
      useNativeDriver: true,
    }).start();
    Animated.timing(dawnOpacityAnim, {
      toValue: 1,
      duration: activeTokens.semantic.motion.duration.medium,
      useNativeDriver: true,
    }).start();
  }, [
    activeTokens.semantic.motion.duration.medium,
    activeTokens.semantic.motion.spring.spatial.damping,
    activeTokens.semantic.motion.spring.spatial.stiffness,
    dawnOpacityAnim,
    dawnSlideAnim,
    reduceMotion,
    room.currentRound,
    room.phase,
  ]);

  useEffect(() => {
    if (room.phase !== 'vote_result' || reduceMotion) {
      voteBarAnim.setValue(1);
      return;
    }
    voteBarAnim.setValue(0);
    Animated.timing(voteBarAnim, {
      toValue: 1,
      duration: activeTokens.semantic.motion.duration.medium,
      useNativeDriver: false,
    }).start();
  }, [
    activeTokens.semantic.motion.duration.medium,
    reduceMotion,
    room.currentRound,
    room.phase,
    voteBarAnim,
  ]);

  useEffect(() => {
    if (room.phase !== 'finished' || reduceMotion) {
      winnerScaleAnim.setValue(1);
      return;
    }
    winnerScaleAnim.setValue(0.92);
    Animated.spring(winnerScaleAnim, {
      toValue: 1,
      damping: activeTokens.semantic.motion.spring.spatial.damping,
      stiffness: activeTokens.semantic.motion.spring.spatial.stiffness,
      useNativeDriver: true,
    }).start();
  }, [
    activeTokens.semantic.motion.spring.spatial.damping,
    activeTokens.semantic.motion.spring.spatial.stiffness,
    reduceMotion,
    room.phase,
    winnerScaleAnim,
  ]);

  const alivePlayers = room.players.filter((p) => p.isAlive);
  const votingCandidates = alivePlayers.filter(
    (player) => !currentPlayer || player.id !== currentPlayer.id
  );
  const isAlive = Boolean(currentPlayer?.isAlive);
  const hasVoted = Boolean(currentPlayer?.hasVoted);
  const votedPlayersCount = room.players.filter((p) => p.hasVoted).length;
  const totalVotesCast = Math.max(
    votedPlayersCount,
    Object.keys(room.votesByPlayerId).length
  );

  const dawnTitle = room.dawnReport?.savedByAngel
    ? 'Boletim do Amanhecer · O Anjo Salvou a Vítima!'
    : room.dawnReport?.eliminatedNickname
      ? `Boletim do Amanhecer · ${room.dawnReport.eliminatedNickname} foi Eliminado`
      : 'Boletim do Amanhecer · A Cidade Acorda';

  const dawnDescription = room.dawnReport?.savedByAngel
    ? 'A madrugada foi tensa, mas o Anjo protegeu a vítima a tempo! Ninguém foi eliminado.'
    : room.dawnReport?.eliminatedNickname
      ? `Triste notícia na cidade: ${room.dawnReport.eliminatedNickname} foi eliminado durante a noite${
          room.dawnReport.eliminatedRole
            ? ` (${ROLE_LABELS[room.dawnReport.eliminatedRole]})`
            : ''
        }.`
      : 'Todos podem abrir os olhos para iniciar o debate do dia.';

  return (
    <View style={styles.container}>
      <Animated.View
        style={[styles.narratorBanner, { opacity: narratorFadeAnim }]}
        accessibilityRole="text"
        accessibilityLabel={`Legenda do Narrador: ${room.narratorCaption}`}
      >
        <MaterialCommunityIcons
          name="weather-sunny"
          size={activeTokens.semantic.icon.md}
          color={activeTokens.component.banner.info.text}
        />
        <View style={styles.narratorTextWrap}>
          <ExpressiveTag
            label={`NARRADOR (${room.config.narratorVoice.toUpperCase()}) · DIA ${room.currentRound}`}
            tone="action"
          />
          <Text allowFontScaling style={styles.narratorText}>
            {room.narratorCaption}
          </Text>
        </View>
      </Animated.View>

      {!isAlive && room.phase !== 'finished' && (
        <View
          style={styles.spectatorBanner}
          accessibilityRole="alert"
          accessibilityLabel="Você foi eliminado — Acompanhe em silêncio"
        >
          <MaterialCommunityIcons
            name="ghost-outline"
            size={activeTokens.semantic.icon.md}
            color={activeTokens.component.banner.error.text}
          />
          <Text allowFontScaling style={styles.spectatorText}>
            Você foi eliminado — Acompanhe em silêncio (Modo Espectador).
          </Text>
        </View>
      )}

      {room.phase === 'day_debate' && (
        <View style={styles.sectionBlock}>
          <View style={styles.timerRow}>
            <ExpressiveTimer
              secondsRemaining={secondsRemaining}
              reduceMotion={reduceMotion}
            />
          </View>

          <Animated.View
            style={{
              opacity: dawnOpacityAnim,
              transform: [{ translateY: dawnSlideAnim }],
            }}
          >
            <GameCard
              title={dawnTitle}
              description={dawnDescription}
              playersTag={`${alivePlayers.length} vivos · Debate Presencial`}
              icon="weather-sunny"
            />
          </Animated.View>

          {room.dawnReport?.savedByAngel && (
            <View
              style={styles.angelShieldBanner}
              accessibilityRole="text"
              accessibilityLabel="Proteção do Anjo: ninguém foi eliminado"
            >
              <MaterialCommunityIcons
                name="shield-check"
                size={activeTokens.semantic.icon.md}
                color={activeTokens.component.banner.success.text}
              />
              <Text allowFontScaling style={styles.angelShieldText}>
                Escudo do Anjo ativado: ninguém foi eliminado nesta noite!
              </Text>
            </View>
          )}

          <View style={styles.cardBox}>
            <Text allowFontScaling style={styles.sectionTitle}>
              Debate Presencial na Roda
            </Text>
            <Text allowFontScaling style={styles.sectionSubtitle}>
              Conversem, apresentem argumentos e descubram quem está blefando antes de abrir a votação secreta.
            </Text>

            {isCurrentPlayerHost ? (
              <ExpressiveButton
                label="Iniciar Votação Secreta"
                variant="primaryJumbo"
                icon="vote-outline"
                onPress={() => {
                  void onStartVotingPhase();
                }}
              />
            ) : (
              <View style={styles.waitingCard}>
                <MaterialCommunityIcons
                  name="clock-outline"
                  size={activeTokens.semantic.icon.md}
                  color={activeTokens.component.banner.info.text}
                />
                <Text allowFontScaling style={styles.waitingText}>
                  Aguardando o Moderador encerrar o debate e abrir a votação secreta.
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      {room.phase === 'day_voting' && (
        <View style={styles.sectionBlock}>
          <GameCard
            title="Fase 3 · Votação Secreta da Cidade"
            description="Vote em quem você acredita ser o Assassino ou escolha Abster-se / Pular Voto."
            playersTag={`Votos registrados: ${totalVotesCast}/${alivePlayers.length}`}
            icon="vote-outline"
          />

          {isAlive ? (
            <View style={styles.cardBox}>
              <Text allowFontScaling style={styles.sectionTitle}>
                Selecione seu Voto Secreto
              </Text>

              <View style={styles.optionsList}>
                {votingCandidates.map((player, index) => (
                  <SelectableOptionItem
                    key={player.id}
                    index={index + 1}
                    label={player.nickname}
                    reduceMotion={reduceMotion}
                    selected={selectedVoteTargetId === player.id}
                    onPress={() => onSelectVoteTarget(player.id)}
                  />
                ))}

                <SelectableOptionItem
                  icon="hand-back-left-outline"
                  label="Abster-se / Pular Voto"
                  accessibilityLabel="Abster-se / Pular Voto"
                  reduceMotion={reduceMotion}
                  selected={selectedVoteTargetId === 'skip'}
                  onPress={() => onSelectVoteTarget('skip')}
                />
              </View>

              <ExpressiveButton
                label={
                  hasVoted ? 'Atualizar Meu Voto Secreto' : 'Confirmar Meu Voto'
                }
                variant="primaryJumbo"
                icon="check-decagram-outline"
                disabled={!selectedVoteTargetId}
                onPress={() => {
                  void onCastVote();
                }}
              />
            </View>
          ) : null}

          {isCurrentPlayerHost && (
            <View style={styles.cardBox}>
              <Text allowFontScaling style={styles.sectionTitle}>
                Apuração da Cidade (Moderador)
              </Text>
              <ExpressiveButton
                label="Encerrar e Apurar Votos da Cidade"
                variant="tonal"
                icon="gavel"
                disabled={totalVotesCast === 0 && !selectedVoteTargetId}
                onPress={() => {
                  void onTallyVotes();
                }}
              />
            </View>
          )}
        </View>
      )}

      {room.phase === 'vote_result' && (
        <View style={styles.sectionBlock}>
          <GameCard
            title={
              room.voteReport?.eliminatedNickname
                ? `Resultado da Votação · ${room.voteReport.eliminatedNickname} Eliminado`
                : 'Resultado da Votação · Sem Consenso na Cidade'
            }
            description={
              room.voteReport?.eliminatedNickname
                ? `A maioria simples votou pela eliminação de ${room.voteReport.eliminatedNickname}${
                    room.voteReport.eliminatedRole
                      ? ` (${ROLE_LABELS[room.voteReport.eliminatedRole]})`
                      : ''
                  }.`
                : 'Houve empate ou maioria em Pular Voto. Ninguém foi eliminado hoje!'
            }
            playersTag={`${alivePlayers.length} permanecem vivos`}
            icon="vote-outline"
          />

          {room.voteReport && (
            <View style={styles.cardBox}>
              <Text allowFontScaling style={styles.sectionTitle}>
                Contagem de Votos (Sigilo Preservado)
              </Text>
              <View style={styles.tallyBarsList}>
                {Object.entries(room.voteReport.voteCounts).map(
                  ([playerId, count]) => {
                    const target = room.players.find((p) => p.id === playerId);
                    const maxCount = Math.max(
                      1,
                      room.voteReport?.skipCount ?? 0,
                      ...Object.values(room.voteReport?.voteCounts ?? {})
                    );
                    const pct = Math.round((count / maxCount) * 100);
                    const barWidth = voteBarAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', `${pct}%`],
                    });
                    return (
                      <View
                        key={playerId}
                        style={styles.tallyBarItem}
                        accessibilityRole="text"
                        accessibilityLabel={`${target?.nickname ?? 'Jogador'}: ${count} voto(s)`}
                      >
                        <View style={styles.tallyBarHeader}>
                          <Text allowFontScaling style={styles.tallyBarName}>
                            {target?.nickname ?? 'Jogador'}
                          </Text>
                          <Text allowFontScaling style={styles.tallyBarCount}>
                            {`${count} voto(s)`}
                          </Text>
                        </View>
                        <View style={styles.tallyTrack}>
                          <Animated.View
                            style={[styles.tallyFill, { width: barWidth }]}
                          />
                        </View>
                      </View>
                    );
                  }
                )}
                <View
                  style={styles.tallyBarItem}
                  accessibilityRole="text"
                  accessibilityLabel={`Abster-se / Pular Voto: ${room.voteReport.skipCount} voto(s)`}
                >
                  <View style={styles.tallyBarHeader}>
                    <Text allowFontScaling style={styles.tallyBarName}>
                      Abster-se / Pular Voto
                    </Text>
                    <Text allowFontScaling style={styles.tallyBarCount}>
                      {`${room.voteReport.skipCount} voto(s)`}
                    </Text>
                  </View>
                  <View style={styles.tallyTrack}>
                    <Animated.View
                      style={[
                        styles.tallyFillSkip,
                        {
                          width: voteBarAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [
                              '0%',
                              `${Math.round(
                                (room.voteReport.skipCount /
                                  Math.max(
                                    1,
                                    room.voteReport.skipCount,
                                    ...Object.values(room.voteReport.voteCounts)
                                  )) *
                                  100
                              )}%`,
                            ],
                          }),
                        },
                      ]}
                    />
                  </View>
                </View>
              </View>
            </View>
          )}

          <View style={styles.cardBox}>
            {isCurrentPlayerHost ? (
              <ExpressiveButton
                label="Iniciar Próxima Noite"
                variant="primaryJumbo"
                icon="weather-night"
                onPress={() => {
                  void onStartNextNight();
                }}
              />
            ) : (
              <View style={styles.waitingCard}>
                <MaterialCommunityIcons
                  name="clock-outline"
                  size={activeTokens.semantic.icon.md}
                  color={activeTokens.component.banner.info.text}
                />
                <Text allowFontScaling style={styles.waitingText}>
                  Aguardando o Moderador iniciar a próxima noite.
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      {room.phase === 'finished' && (
        <View style={styles.sectionBlock}>
          <Animated.View
            style={[
              styles.winnerBanner,
              room.winner === 'cidade'
                ? styles.winnerBannerCity
                : styles.winnerBannerAssassins,
              { transform: [{ scale: winnerScaleAnim }] },
            ]}
          >
            <MaterialCommunityIcons
              name={room.winner === 'cidade' ? 'trophy' : 'incognito'}
              size={activeTokens.semantic.icon.lg}
              color={
                room.winner === 'cidade'
                  ? activeTokens.semantic.color.onHighlight
                  : activeTokens.component.banner.error.text
              }
            />
            <View style={styles.winnerTextWrap}>
              <Text
                allowFontScaling
                maxFontSizeMultiplier={activeTokens.semantic.typography.maxScale}
                style={[
                  styles.winnerTitle,
                  room.winner === 'cidade'
                    ? styles.winnerTitleCity
                    : styles.winnerTitleAssassins,
                ]}
              >
                {room.winner === 'cidade'
                  ? 'Vitória da Cidade!'
                  : 'Vitória dos Assassinos!'}
              </Text>
              <Text
                allowFontScaling
                style={[
                  styles.winnerSubtitle,
                  room.winner === 'cidade'
                    ? styles.winnerTitleCity
                    : styles.winnerTitleAssassins,
                ]}
              >
                {room.winner === 'cidade'
                  ? 'Todos os Assassinos infiltrados foram descobertos e eliminados!'
                  : 'Os Assassinos atingiram paridade numérica com os cidadãos inocentes!'}
              </Text>
            </View>
          </Animated.View>

          <View style={styles.cardBox}>
            <Text allowFontScaling style={styles.sectionTitle}>
              Revelação Completa dos Papéis Secretos
            </Text>

            <View style={styles.rolesSummaryList}>
              {room.players.map((player) => {
                const roleKey: CidadeDormeRole = player.role ?? 'cidadao';
                const isAssassin = roleKey === 'assassino';
                return (
                  <View
                    key={player.id}
                    style={[
                      styles.roleSummaryRow,
                      isAssassin && styles.roleSummaryRowAssassin,
                    ]}
                  >
                    <View style={styles.roleSummaryLeft}>
                      <MaterialCommunityIcons
                        name={ROLE_ICONS[roleKey]}
                        size={activeTokens.semantic.icon.md}
                        color={
                          isAssassin
                            ? activeTokens.semantic.color.error
                            : activeTokens.semantic.color.success
                        }
                      />
                      <View>
                        <Text allowFontScaling style={styles.playerName}>
                          {player.nickname}
                        </Text>
                        <Text allowFontScaling style={styles.playerStatusText}>
                          {player.isAlive ? 'Sobreviveu' : 'Eliminado'}
                        </Text>
                      </View>
                    </View>
                    <ExpressiveTag
                      label={player.role ? ROLE_LABELS[player.role] : 'Cidadão'}
                      tone={isAssassin ? 'error' : 'action'}
                    />
                  </View>
                );
              })}
            </View>

            {isCurrentPlayerHost ? (
              <ExpressiveButton
                label="Jogar Novamente (Revanche)"
                variant="primaryJumbo"
                icon="refresh"
                onPress={() => {
                  void onRestartMatch();
                }}
              />
            ) : (
              <View style={styles.waitingCard}>
                <MaterialCommunityIcons
                  name="clock-outline"
                  size={activeTokens.semantic.icon.md}
                  color={activeTokens.component.banner.info.text}
                />
                <Text allowFontScaling style={styles.waitingText}>
                  Aguardando o Moderador iniciar uma revanche ou toque em Trocar de Jogo abaixo.
                </Text>
              </View>
            )}

            <ExpressiveButton
              label="Trocar de Jogo"
              variant="outlined"
              icon="view-grid-outline"
              onPress={onExitArena}
            />
          </View>
        </View>
      )}
    </View>
  );
};

const createStyles = (activeTokens: AppTokens) => {
  const { color, font, radius, space, border, elevation } = activeTokens.semantic;
  const { card, banner } = activeTokens.component;
  return StyleSheet.create({
    container: {
      gap: space.lg,
    },
    sectionBlock: {
      gap: space.lg,
    },
    narratorBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.sm,
      padding: space.md,
      borderRadius: banner.radius,
      backgroundColor: banner.info.bg,
      borderWidth: border.thin,
      borderColor: banner.info.border,
    },
    narratorTextWrap: {
      flex: 1,
      gap: space.xs,
    },
    narratorText: {
      fontFamily: font.body.family,
      fontSize: font.body.size,
      lineHeight: font.body.lineHeight,
      fontWeight: font.label.weight,
      color: banner.info.text,
    },
    spectatorBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.sm,
      padding: space.md,
      borderRadius: radius.sm,
      backgroundColor: banner.error.bg,
      borderWidth: border.thin,
      borderColor: banner.error.border,
    },
    spectatorText: {
      flex: 1,
      fontFamily: font.label.family,
      fontSize: font.label.size,
      lineHeight: font.label.lineHeight,
      fontWeight: font.label.weight,
      color: banner.error.text,
    },
    timerRow: {
      alignItems: 'center',
    },
    cardBox: {
      backgroundColor: card.bg,
      borderColor: card.border,
      borderWidth: border.thin,
      borderRadius: card.radius,
      padding: card.padding,
      gap: space.md,
      elevation: elevation.card,
    },
    sectionTitle: {
      fontFamily: font.subtitle.family,
      fontSize: font.subtitle.size,
      lineHeight: font.subtitle.lineHeight,
      fontWeight: font.subtitle.weight,
      color: color.onSurface,
    },
    sectionSubtitle: {
      fontFamily: font.body.family,
      fontSize: font.body.size,
      lineHeight: font.body.lineHeight,
      color: color.onSurfaceMuted,
    },
    optionsList: {
      gap: space.sm,
    },
    winnerBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.md,
      padding: card.padding,
      borderWidth: border.focus,
      elevation: elevation.card,
    },
    winnerBannerCity: {
      backgroundColor: color.highlight,
      borderColor: card.borderLeader,
      borderRadius: radius.xl,
    },
    winnerBannerAssassins: {
      backgroundColor: banner.error.bg,
      borderColor: banner.error.border,
      borderRadius: radius.sm,
    },
    winnerTextWrap: {
      flex: 1,
      gap: space.xs,
    },
    winnerTitle: {
      fontFamily: font.title.family,
      fontSize: font.title.size,
      lineHeight: font.title.lineHeight,
      fontWeight: font.title.weight,
    },
    winnerTitleCity: {
      color: color.onHighlight,
    },
    winnerTitleAssassins: {
      color: banner.error.text,
    },
    winnerSubtitle: {
      fontFamily: font.body.family,
      fontSize: font.body.size,
      lineHeight: font.body.lineHeight,
    },
    rolesSummaryList: {
      gap: space.sm,
    },
    roleSummaryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: space.md,
      borderRadius: radius.md,
      borderWidth: border.thin,
      borderColor: card.border,
      backgroundColor: color.surface,
    },
    roleSummaryRowAssassin: {
      borderColor: banner.error.border,
      borderRadius: radius.sm,
    },
    roleSummaryLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.sm,
      flex: 1,
    },
    playerName: {
      fontFamily: font.label.family,
      fontSize: font.label.size,
      lineHeight: font.label.lineHeight,
      fontWeight: font.label.weight,
      color: color.onSurface,
    },
    playerStatusText: {
      fontFamily: font.caption.family,
      fontSize: font.caption.size,
      lineHeight: font.caption.lineHeight,
      color: color.onSurfaceMuted,
    },
    waitingCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.sm,
      padding: space.md,
      borderRadius: banner.radius,
      backgroundColor: banner.info.bg,
    },
    waitingText: {
      flex: 1,
      fontFamily: font.body.family,
      fontSize: font.body.size,
      lineHeight: font.body.lineHeight,
      color: banner.info.text,
    },
    angelShieldBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.sm,
      padding: space.md,
      borderRadius: banner.radius,
      backgroundColor: banner.success.bg,
      borderWidth: border.thin,
      borderColor: banner.success.border,
    },
    angelShieldText: {
      flex: 1,
      fontFamily: font.label.family,
      fontSize: font.label.size,
      lineHeight: font.label.lineHeight,
      fontWeight: font.label.weight,
      color: banner.success.text,
    },
    tallyBarsList: {
      gap: space.sm,
    },
    tallyBarItem: {
      gap: space.xs,
    },
    tallyBarHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    tallyBarName: {
      fontFamily: font.label.family,
      fontSize: font.label.size,
      lineHeight: font.label.lineHeight,
      fontWeight: font.label.weight,
      color: color.onSurface,
    },
    tallyBarCount: {
      fontFamily: font.caption.family,
      fontSize: font.caption.size,
      lineHeight: font.caption.lineHeight,
      fontWeight: font.caption.weight,
      color: color.onSurfaceMuted,
    },
    tallyTrack: {
      height: space.sm,
      borderRadius: radius.full,
      backgroundColor: color.surfaceVariant,
      overflow: 'hidden',
    },
    tallyFill: {
      height: space.sm,
      borderRadius: radius.full,
      backgroundColor: color.action,
    },
    tallyFillSkip: {
      height: space.sm,
      borderRadius: radius.full,
      backgroundColor: color.onSurfaceMuted,
    },
  });
};
