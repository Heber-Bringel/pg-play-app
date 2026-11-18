import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type {
  CidadeDormePlayer,
  CidadeDormeRole,
  CidadeDormeRoom,
} from '@/model/entities/multiplayerSession';
import { ExpressiveButton } from '@/view/components/expressiveButton';
import { GameCard } from '@/view/components/gameCard';
import { tokens } from '@/view/theme';

export type CidadeDormeRoleViewInfo = {
  role: CidadeDormeRole;
  title: string;
  alignmentLabel: string;
  description: string;
  icon: string;
};

export type CidadeDormeRoleSectionProps = {
  room: CidadeDormeRoom;
  currentPlayer: CidadeDormePlayer | null;
  roleInfo: CidadeDormeRoleViewInfo | null;
  isRoleVisible: boolean;
  isCurrentPlayerHost: boolean;
  onToggleRoleVisibility: () => void;
  onConfirmRoleReady: (markAllReady?: boolean) => Promise<void>;
};

export const CidadeDormeRoleSection = ({
  room,
  currentPlayer,
  roleInfo,
  isRoleVisible,
  isCurrentPlayerHost,
  onToggleRoleVisibility,
  onConfirmRoleReady,
}: CidadeDormeRoleSectionProps) => {
  const readyCount = room.players.filter((p) => p.isReady).length;
  const totalCount = room.players.length;
  const isPlayerAlreadyReady = Boolean(currentPlayer?.isReady);
  const isAssassin = roleInfo?.role === 'assassino';

  return (
    <View style={styles.container}>
      <View
        style={styles.narratorBanner}
        accessibilityRole="text"
        accessibilityLabel={`Legenda do Narrador: ${room.narratorCaption}`}
      >
        <MaterialCommunityIcons
          name="volume-high"
          size={tokens.semantic.icon.md}
          color={tokens.semantic.color.onActionContainer}
        />
        <Text allowFontScaling style={styles.narratorText}>
          {room.narratorCaption}
        </Text>
      </View>

      <GameCard
        title="Fase 0 · Revelação Secreta de Papel"
        description="Apenas você deve olhar para a tela agora. Proteja o celular dos jogadores ao lado antes de tocar para revelar."
        playersTag={`Prontos: ${readyCount}/${totalCount}`}
        icon="weather-night"
      />

      {!isRoleVisible ? (
        <View style={styles.secretCard}>
          <View style={styles.lockBadge}>
            <MaterialCommunityIcons
              name="shield-lock-outline"
              size={tokens.semantic.icon.lg}
              color={tokens.semantic.color.onActionContainer}
            />
          </View>
          <Text
            allowFontScaling
            maxFontSizeMultiplier={tokens.semantic.typography.maxScale}
            style={styles.secretTitle}
          >
            {`Carta Secreta de ${currentPlayer?.nickname ?? 'Jogador'}`}
          </Text>
          <Text allowFontScaling style={styles.secretSubtitle}>
            Toque no botão abaixo para ver seu personagem e sua missão na cidade.
          </Text>

          <ExpressiveButton
            label="Revelar Meu Papel"
            variant="primaryJumbo"
            icon="eye-outline"
            onPress={onToggleRoleVisibility}
          />
        </View>
      ) : (
        <View
          style={[
            styles.revealedCard,
            isAssassin ? styles.revealedCardAssassin : styles.revealedCardCity,
          ]}
        >
          <View
            style={[
              styles.alignmentBadge,
              isAssassin
                ? styles.alignmentBadgeAssassin
                : styles.alignmentBadgeCity,
            ]}
          >
            <MaterialCommunityIcons
              name={isAssassin ? 'alert-octagon' : 'shield-check'}
              size={tokens.semantic.icon.sm}
              color={
                isAssassin
                  ? tokens.semantic.color.onErrorContainer
                  : tokens.semantic.color.onSuccess
              }
            />
            <Text allowFontScaling style={styles.alignmentBadgeText}>
              {roleInfo?.alignmentLabel ?? 'Cidade (Bem)'}
            </Text>
          </View>

          <Text
            allowFontScaling
            maxFontSizeMultiplier={tokens.semantic.typography.maxScale}
            style={styles.roleTitle}
          >
            {roleInfo?.title ?? 'Cidadão'}
          </Text>

          <Text allowFontScaling style={styles.roleDescription}>
            {roleInfo?.description ?? ''}
          </Text>

          <ExpressiveButton
            label="Esconder e Estou Pronto"
            variant="successJumbo"
            icon="eye-off-outline"
            onPress={() => {
              void onConfirmRoleReady();
            }}
          />
        </View>
      )}

      {isPlayerAlreadyReady && (
        <View style={styles.readyNotice}>
          <MaterialCommunityIcons
            name="check-circle"
            size={tokens.semantic.icon.md}
            color={tokens.semantic.color.success}
          />
          <Text allowFontScaling style={styles.readyNoticeText}>
            Papel ocultado e confirmado! Aguardando o início da primeira noite.
          </Text>
          {isCurrentPlayerHost && readyCount < totalCount && (
            <ExpressiveButton
              label="Iniciar Primeira Noite Agora"
              variant="tonal"
              icon="weather-night"
              onPress={() => {
                void onConfirmRoleReady(true);
              }}
            />
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
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
  narratorText: {
    flex: 1,
    fontFamily: tokens.semantic.font.body.family,
    fontSize: tokens.semantic.font.body.size,
    lineHeight: tokens.semantic.font.body.lineHeight,
    fontWeight: tokens.semantic.font.label.weight,
    color: tokens.semantic.color.onActionContainer,
  },
  secretCard: {
    backgroundColor: tokens.component.card.bg,
    borderColor: tokens.component.card.border,
    borderWidth: tokens.semantic.border.thin,
    borderRadius: tokens.component.card.radius,
    padding: tokens.component.card.padding,
    alignItems: 'center',
    gap: tokens.semantic.space.md,
    elevation: tokens.semantic.elevation.card,
  },
  lockBadge: {
    width: tokens.component.card.badgeSize,
    height: tokens.component.card.badgeSize,
    borderRadius: tokens.semantic.radius.full,
    backgroundColor: tokens.semantic.color.actionContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secretTitle: {
    fontFamily: tokens.semantic.font.title.family,
    fontSize: tokens.semantic.font.title.size,
    lineHeight: tokens.semantic.font.title.lineHeight,
    fontWeight: tokens.semantic.font.title.weight,
    color: tokens.semantic.color.onSurface,
    textAlign: 'center',
  },
  secretSubtitle: {
    fontFamily: tokens.semantic.font.body.family,
    fontSize: tokens.semantic.font.body.size,
    lineHeight: tokens.semantic.font.body.lineHeight,
    color: tokens.semantic.color.onSurfaceMuted,
    textAlign: 'center',
  },
  revealedCard: {
    backgroundColor: tokens.component.card.bg,
    borderWidth: tokens.semantic.border.focus,
    padding: tokens.component.card.padding,
    gap: tokens.semantic.space.md,
    elevation: tokens.semantic.elevation.card,
  },
  revealedCardCity: {
    borderColor: tokens.semantic.color.success,
    borderRadius: tokens.semantic.radius.xl,
  },
  revealedCardAssassin: {
    borderColor: tokens.semantic.color.error,
    borderRadius: tokens.semantic.radius.md,
  },
  alignmentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: tokens.semantic.space.xs,
    paddingHorizontal: tokens.semantic.space.md,
    paddingVertical: tokens.semantic.space.xs,
  },
  alignmentBadgeCity: {
    backgroundColor: tokens.semantic.color.success,
    borderRadius: tokens.semantic.radius.full,
  },
  alignmentBadgeAssassin: {
    backgroundColor: tokens.semantic.color.errorContainer,
    borderRadius: tokens.semantic.radius.sm,
  },
  alignmentBadgeText: {
    fontFamily: tokens.semantic.font.caption.family,
    fontSize: tokens.semantic.font.caption.size,
    lineHeight: tokens.semantic.font.caption.lineHeight,
    fontWeight: tokens.semantic.font.caption.weight,
    color: tokens.semantic.color.onSurface,
  },
  roleTitle: {
    fontFamily: tokens.semantic.font.display.family,
    fontSize: tokens.semantic.font.display.size,
    lineHeight: tokens.semantic.font.display.lineHeight,
    fontWeight: tokens.semantic.font.display.weight,
    color: tokens.semantic.color.onSurface,
  },
  roleDescription: {
    fontFamily: tokens.semantic.font.body.family,
    fontSize: tokens.semantic.font.body.size,
    lineHeight: tokens.semantic.font.body.lineHeight,
    color: tokens.semantic.color.onSurface,
  },
  readyNotice: {
    backgroundColor: tokens.component.card.bg,
    borderColor: tokens.semantic.color.success,
    borderWidth: tokens.semantic.border.thin,
    borderRadius: tokens.semantic.radius.lg,
    padding: tokens.semantic.space.md,
    gap: tokens.semantic.space.sm,
  },
  readyNoticeText: {
    fontFamily: tokens.semantic.font.body.family,
    fontSize: tokens.semantic.font.body.size,
    lineHeight: tokens.semantic.font.body.lineHeight,
    color: tokens.semantic.color.onSurface,
  },
});
