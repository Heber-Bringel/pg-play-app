import React, { useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ExpressiveButton } from '@/view/components/expressiveButton';
import { ExpressiveChip } from '@/view/components/expressiveChip';
import { ExpressiveTag } from '@/view/components/expressiveTag';
import { ExpressiveTextField } from '@/view/components/expressiveTextField';
import { GameCard } from '@/view/components/gameCard';
import { useTheme, type AppTokens } from '@/view/theme';

type EntryMode = 'create' | 'join';

export type CidadeDormeEntrySectionProps = {
  isRealtimeEnabled: boolean;
  loading?: boolean;
  error: string | null;
  onExitArena: () => void;
  onCreateRoom: (nickname: string) => Promise<boolean>;
  onJoinRoom: (code: string, nickname: string) => Promise<boolean>;
};

export const CidadeDormeEntrySection = ({
  isRealtimeEnabled,
  loading = false,
  error,
  onExitArena,
  onCreateRoom,
  onJoinRoom,
}: CidadeDormeEntrySectionProps) => {
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
          label={isRealtimeEnabled ? 'Realtime Ativo' : 'Sem Conexão Realtime'}
          icon={isRealtimeEnabled ? 'cloud-check-outline' : 'cloud-off-outline'}
          tone="action"
          accessibilityLabel={
            isRealtimeEnabled
              ? 'Modo Multiplayer Supabase Realtime'
              : 'Servidor Multiplayer não configurado'
          }
        />
      </View>

      <GameCard
        title="Cidade Dorme · Narrador por Áudio"
        description="Dedução social em Sala Multiplayer! O Narrador por áudio conduz A Noite e O Dia para que 100% da roda jogue."
        playersTag="5 a 16 jogadores"
        icon="weather-night"
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
          placeholder="Ex.: Héber ou Ana"
          helperText="Mínimo de 2 letras para entrar na roda"
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

        {loading && (
          <View
            style={styles.loadingBanner}
            accessibilityRole="progressbar"
            accessibilityLabel={
              entryMode === 'create'
                ? 'Criando sala e conectando ao servidor'
                : 'Conectando à sala informada'
            }
          >
            <ActivityIndicator
              size="small"
              color={activeTokens.semantic.color.action}
            />
            <Text allowFontScaling style={styles.loadingBannerText}>
              {entryMode === 'create'
                ? 'Criando sala no servidor... Aguarde alguns segundos.'
                : 'Conectando à sala... Aguarde alguns segundos.'}
            </Text>
          </View>
        )}

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
              placeholder="Ex.: CD2026"
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
    loadingBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.sm,
      padding: space.md,
      borderRadius: banner.radius,
      backgroundColor: banner.info.bg,
    },
    loadingBannerText: {
      flex: 1,
      fontFamily: font.body.family,
      fontSize: font.body.size,
      lineHeight: font.body.lineHeight,
      color: banner.info.text,
    },
    joinFields: {
      gap: space.md,
    },
  });
};
