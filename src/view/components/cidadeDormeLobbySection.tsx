import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type {
  CidadeDormeAssassinCount,
  CidadeDormeConfig,
  CidadeDormeDayDebateDuration,
  CidadeDormeNightTurnDuration,
  CidadeDormeRoom,
  CidadeDormeVoiceProfile,
} from '@/model/entities/multiplayerSession';
import { ExpressiveButton } from '@/view/components/expressiveButton';
import { ExpressiveChip } from '@/view/components/expressiveChip';
import { GameCard } from '@/view/components/gameCard';
import { useTheme, type AppTokens } from '@/view/theme';

const VOICE_OPTIONS: Array<{
  value: CidadeDormeVoiceProfile;
  label: string;
  icon: 'account-tie-voice' | 'account-voice';
}> = [
  {
    value: 'masculina',
    label: 'Voz Masculina (Líder)',
    icon: 'account-tie-voice',
  },
  {
    value: 'feminina',
    label: 'Voz Feminina (Líder)',
    icon: 'account-voice',
  },
];

const ASSASSIN_OPTIONS: CidadeDormeAssassinCount[] = [1, 2, 3];
const DEBATE_DURATION_OPTIONS: CidadeDormeDayDebateDuration[] = [60, 120, 180];
const NIGHT_TURN_OPTIONS: CidadeDormeNightTurnDuration[] = [15, 20];

type LobbyTab = 'play' | 'config';

export type CidadeDormeLobbySectionProps = {
  room: CidadeDormeRoom;
  currentPlayerId: string | null;
  isCurrentPlayerHost: boolean;
  onStartMatch: () => Promise<void>;
  onRemovePlayer: (playerId: string) => Promise<void>;
  onUpdateConfig: (partialConfig: Partial<CidadeDormeConfig>) => Promise<void>;
};

export const CidadeDormeLobbySection = ({
  room,
  currentPlayerId,
  isCurrentPlayerHost,
  onStartMatch,
  onRemovePlayer,
  onUpdateConfig,
}: CidadeDormeLobbySectionProps) => {
  const activeTokens = useTheme();
  const styles = useMemo(() => createStyles(activeTokens), [activeTokens]);
  const [activeTab, setActiveTab] = useState<LobbyTab>('play');

  const canStart = room.players.length >= 5 && room.players.length <= 16;

  return (
    <View style={styles.container}>
      <GameCard
        title={`Sala ${room.code} · Lobby Cidade Dorme`}
        description={
          isCurrentPlayerHost
            ? 'Escolha a voz do Narrador por Áudio, confira a roda de jogadores (mín. 5) e distribua os papéis secretos.'
            : 'Conectado à roda! Aguarde o Moderador iniciar o sorteio secreto de papéis.'
        }
        playersTag={`${room.players.length} jogador(es) na roda`}
        icon="weather-night"
      />

      <View style={styles.tabsRow}>
        <ExpressiveChip
          label="Roda & Narrador"
          icon="account-group-outline"
          role="tab"
          accessibilityLabel="Aba Roda e Narrador"
          selected={activeTab === 'play'}
          flexGrow
          onPress={() => setActiveTab('play')}
        />
        <ExpressiveChip
          label="Parâmetros"
          icon="tune-variant"
          role="tab"
          accessibilityLabel="Aba Configurar Parâmetros da Partida"
          selected={activeTab === 'config'}
          flexGrow
          onPress={() => setActiveTab('config')}
        />
      </View>

      {activeTab === 'play' ? (
        <View style={styles.tabContent}>
          <View style={styles.cardBox}>
            <Text allowFontScaling style={styles.sectionTitle}>
              Voz do Narrador do App (RF19)
            </Text>
            <Text allowFontScaling style={styles.sectionSubtitle}>
              O áudio centralizado toca no aparelho do Anfitrião com legendas sincronizadas em todos os celulares.
            </Text>
            <View style={styles.chipsWrap}>
              {VOICE_OPTIONS.map((option) => (
                <ExpressiveChip
                  key={option.value}
                  label={option.label}
                  icon={option.icon}
                  accessibilityLabel={`Selecionar ${option.label}`}
                  selected={room.config.narratorVoice === option.value}
                  disabled={!isCurrentPlayerHost}
                  onPress={() => {
                    void onUpdateConfig({ narratorVoice: option.value });
                  }}
                />
              ))}
            </View>
          </View>

          <View style={styles.cardBox}>
            <Text allowFontScaling style={styles.sectionTitle}>
              {`Participantes na Roda (${room.players.length}/16)`}
            </Text>

            {isCurrentPlayerHost && (
              <View style={styles.waitingCard}>
                <MaterialCommunityIcons
                  name="cellphone-link"
                  size={activeTokens.semantic.icon.md}
                  color={activeTokens.component.banner.info.text}
                />
                <Text allowFontScaling style={styles.waitingText}>
                  {`Compartilhe o PIN ${room.code} para que cada participante entre pelo próprio celular (mínimo de 5 jogadores).`}
                </Text>
              </View>
            )}

            <View style={styles.playerList}>
              {room.players.map((player, index) => {
                const isMe = player.id === currentPlayerId;
                return (
                  <View key={player.id} style={styles.playerRow}>
                    <View style={styles.playerInfo}>
                      <View
                        style={[
                          styles.playerAvatar,
                          player.isHost && styles.playerAvatarHost,
                        ]}
                      >
                        <Text allowFontScaling style={styles.playerAvatarText}>
                          {index + 1}
                        </Text>
                      </View>
                      <View style={styles.playerNameWrap}>
                        <Text
                          allowFontScaling
                          maxFontSizeMultiplier={
                            activeTokens.semantic.typography.maxScale
                          }
                          style={styles.playerName}
                        >
                          {`${player.nickname}${isMe ? ' (Você)' : ''}`}
                        </Text>
                        <Text allowFontScaling style={styles.playerRoleHint}>
                          {player.isHost
                            ? 'Moderador / Anfitrião de Áudio'
                            : 'Jogador da Roda'}
                        </Text>
                      </View>
                    </View>

                    {isCurrentPlayerHost && !player.isHost && (
                      <ExpressiveButton
                        variant="icon"
                        tone="danger"
                        icon="trash-can-outline"
                        accessibilityLabel={`Remover participante ${player.nickname}`}
                        onPress={() => {
                          void onRemovePlayer(player.id);
                        }}
                      />
                    )}
                  </View>
                );
              })}
            </View>
          </View>

          {isCurrentPlayerHost ? (
            <View style={styles.cardBox}>
              <Text allowFontScaling style={styles.sectionTitle}>
                Começar Partida
              </Text>
              <Text allowFontScaling style={styles.sectionSubtitle}>
                {`Papéis na partida: ${room.config.assassinCount} Assassino(s), 1 Anjo, 1 Detetive e ${Math.max(0, room.players.length - room.config.assassinCount - 2)} Cidadão(s).`}
              </Text>
              <ExpressiveButton
                label="Distribuir Papéis e Iniciar"
                variant="primaryJumbo"
                icon="cards-playing-outline"
                disabled={!canStart}
                onPress={() => {
                  void onStartMatch();
                }}
              />
            </View>
          ) : (
            <View style={styles.waitingCard}>
              <MaterialCommunityIcons
                name="clock-outline"
                size={activeTokens.semantic.icon.md}
                color={activeTokens.component.banner.info.text}
              />
              <Text allowFontScaling style={styles.waitingText}>
                Aguardando o Moderador distribuir os papéis secretos da partida.
              </Text>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.tabContent}>
          <View style={styles.cardBox}>
            <Text allowFontScaling style={styles.sectionTitle}>
              Parâmetros da Partida
            </Text>

            {!isCurrentPlayerHost && (
              <View
                style={styles.guestNoticeBanner}
                accessibilityRole="text"
                accessibilityLabel="Somente o moderador altera os parâmetros da sala."
              >
                <MaterialCommunityIcons
                  name="information-outline"
                  size={activeTokens.semantic.icon.md}
                  color={activeTokens.component.banner.info.text}
                />
                <View style={styles.guestNoticeContent}>
                  <Text allowFontScaling style={styles.guestNoticeTitle}>
                    Somente o moderador altera os parâmetros da sala.
                  </Text>
                  <Text allowFontScaling style={styles.guestNoticeSummary}>
                    {`Configuração atual: ${room.config.assassinCount} Assassino(s) · Debate ${room.config.dayDebateSeconds}s · Noite ${room.config.nightTurnSeconds}s · ${
                      room.config.revealRoleOnDeath
                        ? 'Revela papel ao eliminar'
                        : 'Papel oculto ao eliminar (Modo Difícil)'
                    }`}
                  </Text>
                </View>
              </View>
            )}

            <Text allowFontScaling style={styles.sectionSubtitle}>
              Quantidade de Assassinos infiltrados
            </Text>
            <View style={styles.chipsWrap}>
              {ASSASSIN_OPTIONS.map((count) => (
                <ExpressiveChip
                  key={count}
                  label={`${count} Assassino(s)`}
                  accessibilityLabel={`${count} Assassinos`}
                  selected={room.config.assassinCount === count}
                  disabled={!isCurrentPlayerHost}
                  onPress={() => {
                    void onUpdateConfig({ assassinCount: count });
                  }}
                />
              ))}
            </View>

            <Text allowFontScaling style={styles.sectionSubtitle}>
              Tempo de Debate do Dia
            </Text>
            <View style={styles.chipsWrap}>
              {DEBATE_DURATION_OPTIONS.map((sec) => (
                <ExpressiveChip
                  key={sec}
                  label={`${sec}s`}
                  accessibilityLabel={`Debate de ${sec} segundos`}
                  selected={room.config.dayDebateSeconds === sec}
                  disabled={!isCurrentPlayerHost}
                  onPress={() => {
                    void onUpdateConfig({ dayDebateSeconds: sec });
                  }}
                />
              ))}
            </View>

            <Text allowFontScaling style={styles.sectionSubtitle}>
              Tempo por Turno da Noite
            </Text>
            <View style={styles.chipsWrap}>
              {NIGHT_TURN_OPTIONS.map((sec) => (
                <ExpressiveChip
                  key={sec}
                  label={`${sec}s`}
                  accessibilityLabel={`Turno noturno de ${sec} segundos`}
                  selected={room.config.nightTurnSeconds === sec}
                  disabled={!isCurrentPlayerHost}
                  onPress={() => {
                    void onUpdateConfig({ nightTurnSeconds: sec });
                  }}
                />
              ))}
            </View>

            <Text allowFontScaling style={styles.sectionSubtitle}>
              Revelar papel ao ser eliminado
            </Text>
            <View style={styles.chipsWrap}>
              <ExpressiveChip
                label="Ativado (Padrão)"
                icon="eye-outline"
                selected={room.config.revealRoleOnDeath}
                disabled={!isCurrentPlayerHost}
                onPress={() => {
                  void onUpdateConfig({ revealRoleOnDeath: true });
                }}
              />
              <ExpressiveChip
                label="Desativado (Modo Difícil)"
                icon="eye-off-outline"
                selected={!room.config.revealRoleOnDeath}
                disabled={!isCurrentPlayerHost}
                onPress={() => {
                  void onUpdateConfig({ revealRoleOnDeath: false });
                }}
              />
            </View>
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
    tabsRow: {
      flexDirection: 'row',
      gap: space.sm,
    },
    tabContent: {
      gap: space.lg,
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
      fontWeight: font.body.weight,
      color: color.onSurfaceMuted,
    },
    chipsWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: space.sm,
    },
    playerList: {
      gap: space.sm,
    },
    playerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: color.surface,
      borderRadius: radius.md,
      borderWidth: border.thin,
      borderColor: card.border,
      padding: space.sm,
      minHeight: space.container,
    },
    playerInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.sm,
      flex: 1,
    },
    playerAvatar: {
      width: space.xl,
      height: space.xl,
      borderRadius: radius.full,
      backgroundColor: color.surfaceVariant,
      alignItems: 'center',
      justifyContent: 'center',
    },
    playerAvatarHost: {
      backgroundColor: color.actionContainer,
    },
    playerAvatarText: {
      fontFamily: font.label.family,
      fontSize: font.label.size,
      lineHeight: font.label.lineHeight,
      fontWeight: font.label.weight,
      color: color.onActionContainer,
    },
    playerNameWrap: {
      flex: 1,
    },
    playerName: {
      fontFamily: font.label.family,
      fontSize: font.label.size,
      lineHeight: font.label.lineHeight,
      fontWeight: font.label.weight,
      color: color.onSurface,
    },
    playerRoleHint: {
      fontFamily: font.caption.family,
      fontSize: font.caption.size,
      lineHeight: font.caption.lineHeight,
      fontWeight: font.caption.weight,
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
    guestNoticeBanner: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: space.sm,
      padding: space.md,
      borderRadius: banner.radius,
      backgroundColor: banner.info.bg,
    },
    guestNoticeContent: {
      flex: 1,
      gap: space.xs,
    },
    guestNoticeTitle: {
      fontFamily: font.label.family,
      fontSize: font.label.size,
      lineHeight: font.label.lineHeight,
      fontWeight: font.label.weight,
      color: banner.info.text,
    },
    guestNoticeSummary: {
      fontFamily: font.caption.family,
      fontSize: font.caption.size,
      lineHeight: font.caption.lineHeight,
      color: banner.info.text,
    },
  });
};
