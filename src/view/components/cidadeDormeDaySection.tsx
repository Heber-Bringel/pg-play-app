import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type {
  CidadeDormePlayer,
  CidadeDormeRole,
  CidadeDormeRoom,
} from '@/model/entities/multiplayerSession';
import { ExpressiveButton } from '@/view/components/expressiveButton';
import { ExpressiveTimer } from '@/view/components/expressiveTimer';
import { GameCard } from '@/view/components/gameCard';
import { SelectableOptionItem } from '@/view/components/selectableOptionItem';
import { tokens } from '@/view/theme';

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
      duration: tokens.semantic.motion.duration.short,
      useNativeDriver: true,
    }).start();
  }, [narratorFadeAnim, reduceMotion, room.narratorCaption]);

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
      damping: tokens.semantic.motion.spring.spatial.damping,
      stiffness: tokens.semantic.motion.spring.spatial.stiffness,
      useNativeDriver: true,
    }).start();
    Animated.timing(dawnOpacityAnim, {
      toValue: 1,
      duration: tokens.semantic.motion.duration.medium,
      useNativeDriver: true,
    }).start();
  }, [dawnOpacityAnim, dawnSlideAnim, reduceMotion, room.currentRound, room.phase]);

  useEffect(() => {
    if (room.phase !== 'vote_result' || reduceMotion) {
      voteBarAnim.setValue(1);
      return;
    }
    voteBarAnim.setValue(0);
    Animated.timing(voteBarAnim, {
      toValue: 1,
      duration: tokens.semantic.motion.duration.medium,
      useNativeDriver: false,
    }).start();
  }, [reduceMotion, room.currentRound, room.phase, voteBarAnim]);

  useEffect(() => {
    if (room.phase !== 'finished' || reduceMotion) {
      winnerScaleAnim.setValue(1);
      return;
    }
    winnerScaleAnim.setValue(0.92);
    Animated.spring(winnerScaleAnim, {
      toValue: 1,
      damping: tokens.semantic.motion.spring.spatial.damping,
      stiffness: tokens.semantic.motion.spring.spatial.stiffness,
      useNativeDriver: true,
    }).start();
  }, [reduceMotion, room.phase, winnerScaleAnim]);
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
          size={tokens.semantic.icon.md}
          color={tokens.semantic.color.onActionContainer}
        />
        <View style={styles.narratorTextWrap}>
          <Text allowFontScaling style={styles.narratorVoiceTag}>
            {`NARRADOR (${room.config.narratorVoice.toUpperCase()}) · DIA ${room.currentRound}`}
          </Text>
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
            size={tokens.semantic.icon.md}
            color={tokens.semantic.color.onErrorContainer}
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
                size={tokens.semantic.icon.md}
                color={tokens.semantic.color.onSuccess}
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
                  size={tokens.semantic.icon.md}
                  color={tokens.semantic.color.onActionContainer}
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
            icon="weather-night"
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
                  size={tokens.semantic.icon.md}
                  color={tokens.semantic.color.onActionContainer}
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
              size={tokens.semantic.icon.lg}
              color={
                room.winner === 'cidade'
                  ? tokens.semantic.color.onHighlight
                  : tokens.semantic.color.onErrorContainer
              }
            />
            <View style={styles.winnerTextWrap}>
              <Text
                allowFontScaling
                maxFontSizeMultiplier={tokens.semantic.typography.maxScale}
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
                        size={tokens.semantic.icon.md}
                        color={
                          isAssassin
                            ? tokens.semantic.color.error
                            : tokens.semantic.color.success
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
                    <View
                      style={[
                        styles.rolePill,
                        isAssassin
                          ? styles.rolePillAssassin
                          : styles.rolePillCity,
                      ]}
                    >
                      <Text allowFontScaling style={styles.rolePillText}>
                        {player.role ? ROLE_LABELS[player.role] : 'Cidadão'}
                      </Text>
                    </View>
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
                  size={tokens.semantic.icon.md}
                  color={tokens.semantic.color.onActionContainer}
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

const styles = StyleSheet.create({
  container: {
    gap: tokens.semantic.space.lg,
  },
  sectionBlock: {
    gap: tokens.semantic.space.lg,
  },
  narratorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.semantic.space.sm,
    padding: tokens.semantic.space.md,
    borderRadius: tokens.semantic.radius.lg,
    backgroundColor: tokens.semantic.color.actionContainer,
    borderWidth: tokens.semantic.border.thin,
    borderColor: tokens.semantic.color.action,
  },
  narratorTextWrap: {
    flex: 1,
    gap: tokens.semantic.space.xs,
  },
  narratorVoiceTag: {
    fontFamily: tokens.semantic.font.caption.family,
    fontSize: tokens.semantic.font.caption.size,
    lineHeight: tokens.semantic.font.caption.lineHeight,
    fontWeight: tokens.semantic.font.caption.weight,
    color: tokens.semantic.color.onActionContainer,
  },
  narratorText: {
    fontFamily: tokens.semantic.font.body.family,
    fontSize: tokens.semantic.font.body.size,
    lineHeight: tokens.semantic.font.body.lineHeight,
    fontWeight: tokens.semantic.font.label.weight,
    color: tokens.semantic.color.onActionContainer,
  },
  spectatorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.semantic.space.sm,
    padding: tokens.semantic.space.md,
    borderRadius: tokens.semantic.radius.sm,
    backgroundColor: tokens.semantic.color.errorContainer,
    borderWidth: tokens.semantic.border.thin,
    borderColor: tokens.semantic.color.error,
  },
  spectatorText: {
    flex: 1,
    fontFamily: tokens.semantic.font.label.family,
    fontSize: tokens.semantic.font.label.size,
    lineHeight: tokens.semantic.font.label.lineHeight,
    fontWeight: tokens.semantic.font.label.weight,
    color: tokens.semantic.color.onErrorContainer,
  },
  timerRow: {
    alignItems: 'center',
  },
  cardBox: {
    backgroundColor: tokens.component.card.bg,
    borderColor: tokens.component.card.border,
    borderWidth: tokens.semantic.border.thin,
    borderRadius: tokens.component.card.radius,
    padding: tokens.component.card.padding,
    gap: tokens.semantic.space.md,
    elevation: tokens.semantic.elevation.card,
  },
  sectionTitle: {
    fontFamily: tokens.semantic.font.subtitle.family,
    fontSize: tokens.semantic.font.subtitle.size,
    lineHeight: tokens.semantic.font.subtitle.lineHeight,
    fontWeight: tokens.semantic.font.subtitle.weight,
    color: tokens.semantic.color.onSurface,
  },
  sectionSubtitle: {
    fontFamily: tokens.semantic.font.body.family,
    fontSize: tokens.semantic.font.body.size,
    lineHeight: tokens.semantic.font.body.lineHeight,
    color: tokens.semantic.color.onSurfaceMuted,
  },
  optionsList: {
    gap: tokens.semantic.space.sm,
  },
  winnerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.semantic.space.md,
    padding: tokens.component.card.padding,
    borderWidth: tokens.semantic.border.focus,
    elevation: tokens.semantic.elevation.card,
  },
  winnerBannerCity: {
    backgroundColor: tokens.semantic.color.highlight,
    borderColor: tokens.semantic.color.action,
    borderRadius: tokens.semantic.radius.xl,
  },
  winnerBannerAssassins: {
    backgroundColor: tokens.semantic.color.errorContainer,
    borderColor: tokens.semantic.color.error,
    borderRadius: tokens.semantic.radius.sm,
  },
  winnerTextWrap: {
    flex: 1,
    gap: tokens.semantic.space.xs,
  },
  winnerTitle: {
    fontFamily: tokens.semantic.font.title.family,
    fontSize: tokens.semantic.font.title.size,
    lineHeight: tokens.semantic.font.title.lineHeight,
    fontWeight: tokens.semantic.font.title.weight,
  },
  winnerTitleCity: {
    color: tokens.semantic.color.onHighlight,
  },
  winnerTitleAssassins: {
    color: tokens.semantic.color.onErrorContainer,
  },
  winnerSubtitle: {
    fontFamily: tokens.semantic.font.body.family,
    fontSize: tokens.semantic.font.body.size,
    lineHeight: tokens.semantic.font.body.lineHeight,
  },
  rolesSummaryList: {
    gap: tokens.semantic.space.sm,
  },
  roleSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: tokens.semantic.space.md,
    borderRadius: tokens.semantic.radius.md,
    borderWidth: tokens.semantic.border.thin,
    borderColor: tokens.semantic.color.outline,
    backgroundColor: tokens.semantic.color.surface,
  },
  roleSummaryRowAssassin: {
    borderColor: tokens.semantic.color.error,
    borderRadius: tokens.semantic.radius.sm,
  },
  roleSummaryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.semantic.space.sm,
    flex: 1,
  },
  playerName: {
    fontFamily: tokens.semantic.font.label.family,
    fontSize: tokens.semantic.font.label.size,
    lineHeight: tokens.semantic.font.label.lineHeight,
    fontWeight: tokens.semantic.font.label.weight,
    color: tokens.semantic.color.onSurface,
  },
  playerStatusText: {
    fontFamily: tokens.semantic.font.caption.family,
    fontSize: tokens.semantic.font.caption.size,
    lineHeight: tokens.semantic.font.caption.lineHeight,
    color: tokens.semantic.color.onSurfaceMuted,
  },
  rolePill: {
    paddingHorizontal: tokens.semantic.space.md,
    paddingVertical: tokens.semantic.space.xs,
  },
  rolePillCity: {
    backgroundColor: tokens.semantic.color.actionContainer,
    borderRadius: tokens.semantic.radius.full,
  },
  rolePillAssassin: {
    backgroundColor: tokens.semantic.color.errorContainer,
    borderRadius: tokens.semantic.radius.sm,
  },
  rolePillText: {
    fontFamily: tokens.semantic.font.caption.family,
    fontSize: tokens.semantic.font.caption.size,
    lineHeight: tokens.semantic.font.caption.lineHeight,
    fontWeight: tokens.semantic.font.caption.weight,
    color: tokens.semantic.color.onSurface,
  },
  waitingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.semantic.space.sm,
    padding: tokens.semantic.space.md,
    borderRadius: tokens.semantic.radius.lg,
    backgroundColor: tokens.semantic.color.actionContainer,
  },
  waitingText: {
    flex: 1,
    fontFamily: tokens.semantic.font.body.family,
    fontSize: tokens.semantic.font.body.size,
    lineHeight: tokens.semantic.font.body.lineHeight,
    color: tokens.semantic.color.onActionContainer,
  },
  angelShieldBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.semantic.space.sm,
    padding: tokens.semantic.space.md,
    borderRadius: tokens.semantic.radius.lg,
    backgroundColor: tokens.semantic.color.success,
  },
  angelShieldText: {
    flex: 1,
    fontFamily: tokens.semantic.font.label.family,
    fontSize: tokens.semantic.font.label.size,
    lineHeight: tokens.semantic.font.label.lineHeight,
    fontWeight: tokens.semantic.font.label.weight,
    color: tokens.semantic.color.onSuccess,
  },
  tallyBarsList: {
    gap: tokens.semantic.space.sm,
  },
  tallyBarItem: {
    gap: tokens.semantic.space.xs,
  },
  tallyBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tallyBarName: {
    fontFamily: tokens.semantic.font.label.family,
    fontSize: tokens.semantic.font.label.size,
    lineHeight: tokens.semantic.font.label.lineHeight,
    fontWeight: tokens.semantic.font.label.weight,
    color: tokens.semantic.color.onSurface,
  },
  tallyBarCount: {
    fontFamily: tokens.semantic.font.caption.family,
    fontSize: tokens.semantic.font.caption.size,
    lineHeight: tokens.semantic.font.caption.lineHeight,
    fontWeight: tokens.semantic.font.caption.weight,
    color: tokens.semantic.color.onSurfaceMuted,
  },
  tallyTrack: {
    height: tokens.semantic.space.sm,
    borderRadius: tokens.semantic.radius.full,
    backgroundColor: tokens.semantic.color.surfaceVariant,
    overflow: 'hidden',
  },
  tallyFill: {
    height: tokens.semantic.space.sm,
    borderRadius: tokens.semantic.radius.full,
    backgroundColor: tokens.semantic.color.action,
  },
  tallyFillSkip: {
    height: tokens.semantic.space.sm,
    borderRadius: tokens.semantic.radius.full,
    backgroundColor: tokens.semantic.color.onSurfaceMuted,
  },
});
