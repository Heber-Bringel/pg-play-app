import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ExpressiveButton } from '@/view/components/expressiveButton';
import { ExpressiveChip } from '@/view/components/expressiveChip';
import { ExpressiveTextField } from '@/view/components/expressiveTextField';
import { GameCard } from '@/view/components/gameCard';
import { tokens } from '@/view/theme';

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
        <View
          style={styles.modeBadge}
          accessibilityRole="text"
          accessibilityLabel={
            isRealtimeEnabled
              ? 'Modo Multiplayer Supabase Realtime'
              : 'Servidor Multiplayer não configurado'
          }
        >
          <MaterialCommunityIcons
            name={isRealtimeEnabled ? 'cloud-check-outline' : 'cloud-off-outline'}
            size={tokens.semantic.icon.sm}
            color={tokens.semantic.color.onActionContainer}
          />
          <Text
            allowFontScaling
            maxFontSizeMultiplier={tokens.semantic.typography.maxScale}
            style={styles.modeBadgeText}
          >
            {isRealtimeEnabled ? 'Realtime Ativo' : 'Sem Conexão Realtime'}
          </Text>
        </View>
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
            size={tokens.semantic.icon.md}
            color={tokens.semantic.color.error}
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
              color={tokens.semantic.color.action}
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

const styles = StyleSheet.create({
  container: {
    gap: tokens.semantic.space.lg,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: tokens.semantic.space.sm,
  },
  modeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.semantic.space.xs,
    paddingHorizontal: tokens.semantic.space.md,
    paddingVertical: tokens.semantic.space.sm,
    borderRadius: tokens.semantic.radius.full,
    backgroundColor: tokens.semantic.color.actionContainer,
  },
  modeBadgeText: {
    fontFamily: tokens.semantic.font.caption.family,
    fontSize: tokens.semantic.font.caption.size,
    lineHeight: tokens.semantic.font.caption.lineHeight,
    fontWeight: tokens.semantic.font.caption.weight,
    color: tokens.semantic.color.onActionContainer,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.semantic.space.sm,
    padding: tokens.semantic.space.md,
    borderRadius: tokens.semantic.radius.md,
    borderWidth: tokens.semantic.border.thin,
    borderColor: tokens.semantic.color.error,
    backgroundColor: tokens.semantic.color.errorContainer,
  },
  errorBannerText: {
    flexShrink: 1,
    fontFamily: tokens.semantic.font.body.family,
    fontSize: tokens.semantic.font.body.size,
    fontWeight: tokens.semantic.font.body.weight,
    lineHeight: tokens.semantic.font.body.lineHeight,
    color: tokens.semantic.color.onErrorContainer,
  },
  entryCard: {
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
  segmentedRow: {
    flexDirection: 'row',
    gap: tokens.semantic.space.sm,
  },
  loadingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.semantic.space.sm,
    padding: tokens.semantic.space.md,
    borderRadius: tokens.semantic.radius.lg,
    backgroundColor: tokens.semantic.color.actionContainer,
  },
  loadingBannerText: {
    flex: 1,
    fontFamily: tokens.semantic.font.body.family,
    fontSize: tokens.semantic.font.body.size,
    lineHeight: tokens.semantic.font.body.lineHeight,
    color: tokens.semantic.color.onActionContainer,
  },
  joinFields: {
    gap: tokens.semantic.space.md,
  },
});
