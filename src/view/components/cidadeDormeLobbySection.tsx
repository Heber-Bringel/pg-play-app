import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
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
import { tokens } from '@/view/theme';

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
  const [activeTab, setActiveTab] = useState<LobbyTab>('play');
  const [focusedPlayerId, setFocusedPlayerId] = useState<string | null>(null);

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
                  size={tokens.semantic.icon.md}
                  color={tokens.semantic.color.onActionContainer}
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
                            tokens.semantic.typography.maxScale
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
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Remover participante ${player.nickname}`}
                        onFocus={() => setFocusedPlayerId(player.id)}
                        onBlur={() => setFocusedPlayerId(null)}
                        style={({ pressed }) => [
                          styles.removeButton,
                          pressed && styles.removeButtonPressed,
                          focusedPlayerId === player.id &&
                            styles.removeButtonFocused,
                        ]}
                        onPress={() => {
                          void onRemovePlayer(player.id);
                        }}
                      >
                        <MaterialCommunityIcons
                          name="trash-can-outline"
                          size={tokens.semantic.icon.md}
                          color={tokens.semantic.color.error}
                        />
                      </Pressable>
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
                size={tokens.semantic.icon.md}
                color={tokens.semantic.color.onActionContainer}
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

const styles = StyleSheet.create({
  container: {
    gap: tokens.semantic.space.lg,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: tokens.semantic.space.sm,
  },
  tabContent: {
    gap: tokens.semantic.space.lg,
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
    fontWeight: tokens.semantic.font.body.weight,
    color: tokens.semantic.color.onSurfaceMuted,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.semantic.space.sm,
  },
  playerList: {
    gap: tokens.semantic.space.sm,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: tokens.semantic.color.surface,
    borderRadius: tokens.semantic.radius.md,
    borderWidth: tokens.semantic.border.thin,
    borderColor: tokens.semantic.color.outline,
    padding: tokens.semantic.space.sm,
    minHeight: tokens.semantic.space.container,
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.semantic.space.sm,
    flex: 1,
  },
  playerAvatar: {
    width: tokens.semantic.space.xl,
    height: tokens.semantic.space.xl,
    borderRadius: tokens.semantic.radius.full,
    backgroundColor: tokens.semantic.color.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerAvatarHost: {
    backgroundColor: tokens.semantic.color.actionContainer,
  },
  playerAvatarText: {
    fontFamily: tokens.semantic.font.label.family,
    fontSize: tokens.semantic.font.label.size,
    lineHeight: tokens.semantic.font.label.lineHeight,
    fontWeight: tokens.semantic.font.label.weight,
    color: tokens.semantic.color.onActionContainer,
  },
  playerNameWrap: {
    flex: 1,
  },
  playerName: {
    fontFamily: tokens.semantic.font.label.family,
    fontSize: tokens.semantic.font.label.size,
    lineHeight: tokens.semantic.font.label.lineHeight,
    fontWeight: tokens.semantic.font.label.weight,
    color: tokens.semantic.color.onSurface,
  },
  playerRoleHint: {
    fontFamily: tokens.semantic.font.caption.family,
    fontSize: tokens.semantic.font.caption.size,
    lineHeight: tokens.semantic.font.caption.lineHeight,
    fontWeight: tokens.semantic.font.caption.weight,
    color: tokens.semantic.color.onSurfaceMuted,
  },
  removeButton: {
    width: tokens.semantic.space['2xl'],
    height: tokens.semantic.space['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: tokens.semantic.radius.full,
    borderWidth: tokens.semantic.border.thin,
    borderColor: tokens.semantic.color.transparent,
  },
  removeButtonPressed: {
    backgroundColor: tokens.semantic.color.errorContainer,
  },
  removeButtonFocused: {
    borderWidth: tokens.semantic.border.focus,
    borderColor: tokens.semantic.color.focus,
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
