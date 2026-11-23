import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type {
  AdedonhaConfig,
  AdedonhaRoom,
  AdedonhaRoundDuration,
  AdedonhaTotalRounds,
} from '@/model/entities/multiplayerSession';
import { ExpressiveButton } from '@/view/components/expressiveButton';
import { ExpressiveChip } from '@/view/components/expressiveChip';
import { ExpressiveTag } from '@/view/components/expressiveTag';
import { ExpressiveTextField } from '@/view/components/expressiveTextField';
import { GameCard } from '@/view/components/gameCard';
import { LetterKey } from '@/view/components/letterKey';
import { useTheme, type AppTokens } from '@/view/theme';

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
  const activeTokens = useTheme();
  const styles = useMemo(() => createStyles(activeTokens), [activeTokens]);
  const [activeTab, setActiveTab] = useState<LobbyTab>('play');
  const [showManualLetters, setShowManualLetters] = useState<boolean>(false);
  const [newColumnInput, setNewColumnInput] = useState<string>('');

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
                  <ExpressiveTag
                    key={player.id}
                    label={`${player.nickname}${isMe ? ' (Você)' : ''}`}
                    icon={player.isHost ? 'crown' : 'account'}
                    tone={player.isHost ? 'action' : 'neutral'}
                  />
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
                size={activeTokens.semantic.icon.md}
                color={activeTokens.component.banner.info.text}
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
                    <ExpressiveButton
                      variant="icon"
                      tone="danger"
                      icon="trash-can-outline"
                      accessibilityLabel={`Remover coluna ${col}`}
                      onPress={() => {
                        void onRemoveColumn(col);
                      }}
                    />
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
    letterGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: space.sm,
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
    columnList: {
      gap: space.sm,
    },
    columnItem: {
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
    columnInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.sm,
      flex: 1,
    },
    columnAvatar: {
      width: space.xl,
      height: space.xl,
      borderRadius: radius.full,
      backgroundColor: color.actionContainer,
      alignItems: 'center',
      justifyContent: 'center',
    },
    columnAvatarText: {
      fontFamily: font.label.family,
      fontSize: font.label.size,
      lineHeight: font.label.lineHeight,
      fontWeight: font.label.weight,
      color: color.onActionContainer,
    },
    columnName: {
      flex: 1,
      fontFamily: font.label.family,
      fontSize: font.label.size,
      lineHeight: font.label.lineHeight,
      fontWeight: font.label.weight,
      color: color.onSurface,
    },
  });
};
