import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
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

export type CidadeDormeDaySectionProps = {
  room: CidadeDormeRoom;
  currentPlayer: CidadeDormePlayer | null;
  isCurrentPlayerHost: boolean;
  selectedVoteTargetId: string | null;
  secondsRemaining: number;
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
  onStartVotingPhase,
  onSelectVoteTarget,
  onCastVote,
  onTallyVotes,
  onStartNextNight,
  onRestartMatch,
  onExitArena,
}: CidadeDormeDaySectionProps) => {
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
      <View
        style={styles.narratorBanner}
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
      </View>

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
            <ExpressiveTimer secondsRemaining={secondsRemaining} />
          </View>

          <GameCard
            title={dawnTitle}
            description={dawnDescription}
            playersTag={`${alivePlayers.length} vivos · Debate Presencial`}
            icon="weather-sunny"
          />

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
                    selected={selectedVoteTargetId === player.id}
                    onPress={() => onSelectVoteTarget(player.id)}
                  />
                ))}

                <SelectableOptionItem
                  icon="hand-back-left-outline"
                  label="Abster-se / Pular Voto"
                  accessibilityLabel="Abster-se / Pular Voto"
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
          <View
            style={[
              styles.winnerBanner,
              room.winner === 'cidade'
                ? styles.winnerBannerCity
                : styles.winnerBannerAssassins,
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
          </View>

          <View style={styles.cardBox}>
            <Text allowFontScaling style={styles.sectionTitle}>
              Revelação Completa dos Papéis Secretos
            </Text>

            <View style={styles.rolesSummaryList}>
              {room.players.map((player) => {
                const isAssassin = player.role === 'assassino';
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
                        name={
                          isAssassin ? 'alert-octagon' : 'shield-check-outline'
                        }
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
});
