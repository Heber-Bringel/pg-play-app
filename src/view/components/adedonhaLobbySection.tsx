import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type {
  AdedonhaConfig,
  AdedonhaRoom,
  AdedonhaRoundDuration,
  AdedonhaTotalRounds,
} from '@/model/entities/multiplayerSession';
import { ExpressiveButton } from '@/view/components/expressiveButton';
import { ExpressiveChip } from '@/view/components/expressiveChip';
import { ExpressiveTextField } from '@/view/components/expressiveTextField';
import { GameCard } from '@/view/components/gameCard';
import { LetterKey } from '@/view/components/letterKey';
import { tokens } from '@/view/theme';

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

const DURATION_OPTIONS: AdedonhaRoundDuration[] = [60, 90, 120];
const ROUNDS_OPTIONS: AdedonhaTotalRounds[] = [5, 7, 10];

type LobbyTab = 'play' | 'config';

export type AdedonhaLobbySectionProps = {
  room: AdedonhaRoom;
  currentPlayerId: string | null;
  isCurrentPlayerHost: boolean;
  suggestedColumns: string[];
  onSpinRoulette: (preferredLetter?: string) => Promise<void>;
  onAddColumn: (columnName: string) => Promise<boolean>;
  onRemoveColumn: (columnName: string) => Promise<void>;
  onUpdateConfig: (
    partialConfig: Partial<Omit<AdedonhaConfig, 'columns'>>
  ) => Promise<void>;
};

export const AdedonhaLobbySection = ({
  room,
  currentPlayerId,
  isCurrentPlayerHost,
  suggestedColumns,
  onSpinRoulette,
  onAddColumn,
  onRemoveColumn,
  onUpdateConfig,
}: AdedonhaLobbySectionProps) => {
  const [activeTab, setActiveTab] = useState<LobbyTab>('play');
  const [showManualLetters, setShowManualLetters] = useState<boolean>(false);
  const [newColumnInput, setNewColumnInput] = useState<string>('');
  const [focusedColumn, setFocusedColumn] = useState<string | null>(null);

  const unusedSuggestions = suggestedColumns.filter(
    (s) => !room.config.columns.includes(s)
  );

  const onAddCustomColumn = async () => {
    const added = await onAddColumn(newColumnInput);
    if (added) {
      setNewColumnInput('');
    }
  };

  return (
    <View style={styles.container}>
      <GameCard
        title={`Sala ${room.code} · Lobby Multiplayer`}
        description={
          isCurrentPlayerHost
            ? 'Você é o Moderador. Compartilhe o PIN acima e gire a Roleta Expressiva ou ajuste as colunas.'
            : 'Conectado à sala! Aguarde o Moderador configurar as colunas e girar a Roleta Expressiva.'
        }
        playersTag={`${room.players.length} jogador(es)`}
        icon="alphabetical-variant"
      />

      <View style={styles.tabsRow}>
        <ExpressiveChip
          label="Jogar & Roleta"
          icon="play-circle-outline"
          role="tab"
          accessibilityLabel="Aba Jogar e Roleta"
          selected={activeTab === 'play'}
          flexGrow
          onPress={() => setActiveTab('play')}
        />
        <ExpressiveChip
          label={`Colunas (${room.config.columns.length})`}
          icon="tune-variant"
          role="tab"
          accessibilityLabel="Aba Configurar Colunas e Regras"
          selected={activeTab === 'config'}
          flexGrow
          onPress={() => setActiveTab('config')}
        />
      </View>

      {activeTab === 'play' ? (
        <View style={styles.tabContent}>
          <View style={styles.cardBox}>
            <Text allowFontScaling style={styles.sectionTitle}>
              Participantes na Sala
            </Text>
            <View style={styles.chipsWrap}>
              {room.players.map((player) => {
                const isMe = player.id === currentPlayerId;
                return (
                  <View
                    key={player.id}
                    style={[
                      styles.playerChip,
                      player.isHost && styles.playerChipHost,
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={player.isHost ? 'crown' : 'account'}
                      size={tokens.semantic.icon.sm}
                      color={
                        player.isHost
                          ? tokens.semantic.color.onActionContainer
                          : tokens.semantic.color.onSurface
                      }
                    />
                    <Text
                      allowFontScaling
                      maxFontSizeMultiplier={tokens.semantic.typography.maxScale}
                      style={[
                        styles.playerChipText,
                        player.isHost && styles.playerChipHostText,
                      ]}
                    >
                      {`${player.nickname}${isMe ? ' (Você)' : ''}`}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          {isCurrentPlayerHost ? (
            <View style={styles.cardBox}>
              <Text allowFontScaling style={styles.sectionTitle}>
                Roleta Expressiva do Alfabeto
              </Text>
              <Text allowFontScaling style={styles.sectionSubtitle}>
                {`Partida com ${room.config.columns.length} coluna(s) · ${room.config.roundDurationSeconds}s por rodada.`}
              </Text>

              <ExpressiveButton
                label="Girar Roleta Expressiva"
                variant="primaryJumbo"
                icon="rotate-3d-variant"
                onPress={() => {
                  void onSpinRoulette();
                }}
              />

              <ExpressiveChip
                label={
                  showManualLetters
                    ? 'Ocultar Escolha Manual'
                    : 'Escolher Letra Manualmente'
                }
                icon="alphabetical"
                selected={showManualLetters}
                onPress={() => setShowManualLetters((prev) => !prev)}
              />

              {showManualLetters && (
                <View style={styles.letterGrid}>
                  {ROULETTE_PREVIEW_LETTERS.map((letter) => {
                    const isUsed = room.usedLetters.includes(letter);
                    return (
                      <LetterKey
                        key={letter}
                        letter={letter}
                        status={isUsed ? 'miss' : 'available'}
                        onPress={(chosen) => {
                          void onSpinRoulette(chosen);
                        }}
                      />
                    );
                  })}
                </View>
              )}
            </View>
          ) : (
            <View style={styles.waitingCard}>
              <MaterialCommunityIcons
                name="clock-outline"
                size={tokens.semantic.icon.md}
                color={tokens.semantic.color.onActionContainer}
              />
              <Text allowFontScaling style={styles.waitingText}>
                Aguardando o Moderador girar a Roleta Expressiva para iniciar a rodada.
              </Text>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.tabContent}>
          {isCurrentPlayerHost && (
            <View style={styles.cardBox}>
              <Text allowFontScaling style={styles.sectionTitle}>
                Parâmetros da Partida
              </Text>

              <Text allowFontScaling style={styles.sectionSubtitle}>
                Tempo por rodada
              </Text>
              <View style={styles.chipsWrap}>
                {DURATION_OPTIONS.map((sec) => (
                  <ExpressiveChip
                    key={sec}
                    label={`${sec}s`}
                    accessibilityLabel={`Tempo de ${sec} segundos`}
                    selected={room.config.roundDurationSeconds === sec}
                    onPress={() => {
                      void onUpdateConfig({ roundDurationSeconds: sec });
                    }}
                  />
                ))}
              </View>

              <Text allowFontScaling style={styles.sectionSubtitle}>
                Quantidade de rodadas
              </Text>
              <View style={styles.chipsWrap}>
                {ROUNDS_OPTIONS.map((total) => (
                  <ExpressiveChip
                    key={total}
                    label={`${total} rodadas`}
                    accessibilityLabel={`${total} rodadas`}
                    selected={room.config.totalRounds === total}
                    onPress={() => {
                      void onUpdateConfig({ totalRounds: total });
                    }}
                  />
                ))}
              </View>
            </View>
          )}

          <View style={styles.cardBox}>
            <Text allowFontScaling style={styles.sectionTitle}>
              {`Colunas Bíblicas da Rodada (${room.config.columns.length})`}
            </Text>

            {isCurrentPlayerHost && (
              <>
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

                {unusedSuggestions.length > 0 && (
                  <View style={styles.chipsWrap}>
                    {unusedSuggestions.map((suggestion) => (
                      <ExpressiveChip
                        key={suggestion}
                        label={suggestion}
                        icon="plus"
                        tone="action"
                        accessibilityLabel={`Sugestão: ${suggestion}`}
                        onPress={() => {
                          void onAddColumn(suggestion);
                        }}
                      />
                    ))}
                  </View>
                )}
              </>
            )}

            <View style={styles.columnList}>
              {room.config.columns.map((col, idx) => (
                <View key={col} style={styles.columnItem}>
                  <View style={styles.columnInfo}>
                    <View style={styles.columnAvatar}>
                      <Text allowFontScaling style={styles.columnAvatarText}>
                        {idx + 1}
                      </Text>
                    </View>
                    <Text allowFontScaling style={styles.columnName}>
                      {col}
                    </Text>
                  </View>
                  {isCurrentPlayerHost && room.config.columns.length > 1 && (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Remover coluna ${col}`}
                      onFocus={() => setFocusedColumn(col)}
                      onBlur={() => setFocusedColumn(null)}
                      style={({ pressed }) => [
                        styles.removeColumnButton,
                        pressed && styles.removeColumnButtonPressed,
                        focusedColumn === col &&
                          styles.removeColumnButtonFocused,
                      ]}
                      onPress={() => {
                        void onRemoveColumn(col);
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
              ))}
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
  playerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.semantic.space.xs,
    paddingHorizontal: tokens.semantic.space.md,
    paddingVertical: tokens.semantic.space.sm,
    borderRadius: tokens.semantic.radius.full,
    backgroundColor: tokens.semantic.color.surfaceVariant,
    borderWidth: tokens.semantic.border.thin,
    borderColor: tokens.semantic.color.outline,
  },
  playerChipHost: {
    backgroundColor: tokens.semantic.color.actionContainer,
    borderColor: tokens.semantic.color.action,
  },
  playerChipText: {
    fontFamily: tokens.semantic.font.caption.family,
    fontSize: tokens.semantic.font.caption.size,
    lineHeight: tokens.semantic.font.caption.lineHeight,
    fontWeight: tokens.semantic.font.caption.weight,
    color: tokens.semantic.color.onSurface,
  },
  playerChipHostText: {
    color: tokens.semantic.color.onActionContainer,
  },
  letterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.semantic.space.sm,
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
  columnList: {
    gap: tokens.semantic.space.sm,
  },
  columnItem: {
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
  columnInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.semantic.space.sm,
    flex: 1,
  },
  columnAvatar: {
    width: tokens.semantic.space.xl,
    height: tokens.semantic.space.xl,
    borderRadius: tokens.semantic.radius.full,
    backgroundColor: tokens.semantic.color.actionContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  columnAvatarText: {
    fontFamily: tokens.semantic.font.label.family,
    fontSize: tokens.semantic.font.label.size,
    lineHeight: tokens.semantic.font.label.lineHeight,
    fontWeight: tokens.semantic.font.label.weight,
    color: tokens.semantic.color.onActionContainer,
  },
  columnName: {
    flex: 1,
    fontFamily: tokens.semantic.font.label.family,
    fontSize: tokens.semantic.font.label.size,
    lineHeight: tokens.semantic.font.label.lineHeight,
    fontWeight: tokens.semantic.font.label.weight,
    color: tokens.semantic.color.onSurface,
  },
  removeColumnButton: {
    width: tokens.semantic.space['2xl'],
    height: tokens.semantic.space['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: tokens.semantic.radius.full,
    borderWidth: tokens.semantic.border.thin,
    borderColor: tokens.semantic.color.transparent,
  },
  removeColumnButtonPressed: {
    backgroundColor: tokens.semantic.color.errorContainer,
  },
  removeColumnButtonFocused: {
    borderWidth: tokens.semantic.border.focus,
    borderColor: tokens.semantic.color.focus,
  },
});
