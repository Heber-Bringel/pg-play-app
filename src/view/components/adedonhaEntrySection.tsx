import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ExpressiveButton } from '@/view/components/expressiveButton';
import { ExpressiveChip } from '@/view/components/expressiveChip';
import { ExpressiveTag } from '@/view/components/expressiveTag';
import { ExpressiveTextField } from '@/view/components/expressiveTextField';
import { GameCard } from '@/view/components/gameCard';
import { useTheme, type AppTokens } from '@/view/theme';

type EntryMode = 'create' | 'join';

export type AdedonhaEntrySectionProps = {
  isRealtimeEnabled: boolean;
  loading?: boolean;
  error: string | null;
  onExitArena: () => void;
  onCreateRoom: (nickname: string) => Promise<boolean>;
  onJoinRoom: (code: string, nickname: string) => Promise<boolean>;
  onJoinDemoRoom: () => Promise<boolean>;
};

export const AdedonhaEntrySection = ({
  isRealtimeEnabled,
  loading = false,
  error,
  onExitArena,
  onCreateRoom,
  onJoinRoom,
  onJoinDemoRoom,
}: AdedonhaEntrySectionProps) => {
  const activeTokens = useTheme();
  const styles = useMemo(() => createStyles(activeTokens), [activeTokens]);
  const [entryMode, setEntryMode] = useState<EntryMode>('create');
  const [nicknameInput, setNicknameInput] = useState<string>('');
  const [roomCodeInput, setRoomCodeInput] = useState<string>('');

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <ExpressiveButton
          label="Voltar"
          variant="outlined"
          icon="arrow-left"
          onPress={onExitArena}
        />
        <ExpressiveTag
          label={isRealtimeEnabled ? 'Realtime Ativo' : 'Modo Offline'}
          icon={isRealtimeEnabled ? 'cloud-check-outline' : 'lan'}
          tone="action"
          accessibilityLabel={
            isRealtimeEnabled
              ? 'Modo Multiplayer Supabase Realtime'
              : 'Modo Local Offline'
          }
        />
      </View>

      <GameCard
        title="Adedonha Bíblica · Sala Multiplayer"
        description="Informe seu apelido para criar uma nova sala como Moderador ou entrar em uma sala existente com código PIN."
        playersTag="2 a 16 jogadores"
        icon="alphabetical-variant"
      />

      {error && (
        <View style={styles.errorBanner} accessibilityLiveRegion="assertive">
          <MaterialCommunityIcons
            name="alert-circle"
            size={activeTokens.semantic.icon.md}
            color={activeTokens.component.banner.error.text}
          />
          <Text allowFontScaling style={styles.errorBannerText}>
            {error}
          </Text>
        </View>
      )}

      <View style={styles.entryCard}>
        <Text allowFontScaling style={styles.sectionTitle}>
          Identificação na Sala
        </Text>

        <ExpressiveTextField
          label="Seu Apelido"
          value={nicknameInput}
          placeholder="Ex.: Heber ou Ana"
          helperText="Mínimo de 2 letras para aparecer no placar"
          icon="account-outline"
          maxLength={20}
          onChangeText={setNicknameInput}
        />

        <View style={styles.segmentedRow}>
          <ExpressiveChip
            label="Criar Sala"
            icon="plus-box-outline"
            role="tab"
            accessibilityLabel="Modo Criar Sala"
            selected={entryMode === 'create'}
            flexGrow
            onPress={() => setEntryMode('create')}
          />
          <ExpressiveChip
            label="Entrar com PIN"
            icon="login"
            role="tab"
            accessibilityLabel="Modo Entrar com Código PIN"
            selected={entryMode === 'join'}
            flexGrow
            onPress={() => setEntryMode('join')}
          />
        </View>

        {entryMode === 'create' ? (
          <ExpressiveButton
            label={loading ? 'Conectando...' : 'Criar Sala (Moderador)'}
            variant="primaryJumbo"
            icon="crown-outline"
            disabled={loading}
            onPress={() => {
              void onCreateRoom(nicknameInput);
            }}
          />
        ) : (
          <View style={styles.joinFields}>
            <ExpressiveTextField
              label="Código PIN da Sala"
              value={roomCodeInput}
              placeholder="Ex.: PG2026"
              helperText="Peça o código exibido na tela do Moderador"
              icon="pound"
              maxLength={6}
              onChangeText={setRoomCodeInput}
            />
            <ExpressiveButton
              label={loading ? 'Entrando...' : 'Entrar na Sala'}
              variant="primaryJumbo"
              icon="account-arrow-right"
              disabled={loading}
              onPress={() => {
                void onJoinRoom(roomCodeInput, nicknameInput);
              }}
            />
          </View>
        )}
      </View>

      {!isRealtimeEnabled && (
        <View style={styles.demoFooter}>
          <Text allowFontScaling style={styles.demoHint}>
            Quer testar a partida rapidamente sem criar sala?
          </Text>
          <ExpressiveButton
            label="Entrar na Sala Demo Offline (PG2026)"
            variant="outlined"
            icon="play-circle-outline"
            onPress={() => {
              void onJoinDemoRoom();
            }}
          />
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
    topBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: space.sm,
      flexWrap: 'wrap',
    },
    errorBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.sm,
      padding: space.md,
      borderRadius: radius.md,
      borderWidth: border.thin,
      borderColor: banner.error.border,
      backgroundColor: banner.error.bg,
    },
    errorBannerText: {
      flexShrink: 1,
      fontFamily: font.body.family,
      fontSize: font.body.size,
      fontWeight: font.body.weight,
      lineHeight: font.body.lineHeight,
      color: banner.error.text,
    },
    entryCard: {
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
    segmentedRow: {
      flexDirection: 'row',
      gap: space.sm,
    },
    joinFields: {
      gap: space.md,
    },
    demoFooter: {
      gap: space.sm,
      paddingTop: space.xs,
    },
    demoHint: {
      fontFamily: font.body.family,
      fontSize: font.body.size,
      lineHeight: font.body.lineHeight,
      fontWeight: font.body.weight,
      color: color.onSurfaceMuted,
    },
  });
};
