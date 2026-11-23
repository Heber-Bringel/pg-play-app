import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type {
  CidadeDormePlayer,
  CidadeDormeRole,
  CidadeDormeRoom,
} from '@/model/entities/multiplayerSession';
import { ExpressiveButton } from '@/view/components/expressiveButton';
import { ExpressiveTag } from '@/view/components/expressiveTag';
import { GameCard } from '@/view/components/gameCard';
import { useTheme, type AppTokens } from '@/view/theme';

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
  onToggleRoleVisibility: () => void;
  onConfirmRoleReady: () => Promise<void>;
};

export const CidadeDormeRoleSection = ({
  room,
  currentPlayer,
  roleInfo,
  isRoleVisible,
  onToggleRoleVisibility,
  onConfirmRoleReady,
}: CidadeDormeRoleSectionProps) => {
  const activeTokens = useTheme();
  const styles = useMemo(() => createStyles(activeTokens), [activeTokens]);

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
          size={activeTokens.semantic.icon.md}
          color={activeTokens.component.banner.info.text}
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
              size={activeTokens.semantic.icon.lg}
              color={activeTokens.semantic.color.onActionContainer}
            />
          </View>
          <Text
            allowFontScaling
            maxFontSizeMultiplier={activeTokens.semantic.typography.maxScale}
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
          <ExpressiveTag
            label={roleInfo?.alignmentLabel ?? 'Cidade (Bem)'}
            icon={isAssassin ? 'alert-octagon' : 'shield-check'}
            tone={isAssassin ? 'error' : 'success'}
          />

          <Text
            allowFontScaling
            maxFontSizeMultiplier={activeTokens.semantic.typography.maxScale}
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
            size={activeTokens.semantic.icon.md}
            color={activeTokens.component.banner.success.text}
          />
          <Text allowFontScaling style={styles.readyNoticeText}>
            Papel ocultado e confirmado! Aguardando todos os jogadores confirmarem para iniciar a primeira noite.
          </Text>
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
    narratorBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.sm,
      padding: space.md,
      borderRadius: banner.radius,
      backgroundColor: banner.info.bg,
      borderWidth: border.thin,
      borderColor: banner.info.border,
    },
    narratorText: {
      flex: 1,
      fontFamily: font.body.family,
      fontSize: font.body.size,
      lineHeight: font.body.lineHeight,
      fontWeight: font.label.weight,
      color: banner.info.text,
    },
    secretCard: {
      backgroundColor: card.bg,
      borderColor: card.border,
      borderWidth: border.thin,
      borderRadius: card.radius,
      padding: card.padding,
      alignItems: 'center',
      gap: space.md,
      elevation: elevation.card,
    },
    lockBadge: {
      width: card.badgeSize,
      height: card.badgeSize,
      borderRadius: radius.full,
      backgroundColor: color.actionContainer,
      alignItems: 'center',
      justifyContent: 'center',
    },
    secretTitle: {
      fontFamily: font.title.family,
      fontSize: font.title.size,
      lineHeight: font.title.lineHeight,
      fontWeight: font.title.weight,
      color: color.onSurface,
      textAlign: 'center',
    },
    secretSubtitle: {
      fontFamily: font.body.family,
      fontSize: font.body.size,
      lineHeight: font.body.lineHeight,
      color: color.onSurfaceMuted,
      textAlign: 'center',
    },
    revealedCard: {
      backgroundColor: card.bg,
      borderWidth: border.focus,
      padding: card.padding,
      gap: space.md,
      elevation: elevation.card,
    },
    revealedCardCity: {
      borderColor: banner.success.border,
      borderRadius: radius.xl,
    },
    revealedCardAssassin: {
      borderColor: banner.error.border,
      borderRadius: radius.md,
    },
    roleTitle: {
      fontFamily: font.display.family,
      fontSize: font.display.size,
      lineHeight: font.display.lineHeight,
      fontWeight: font.display.weight,
      color: color.onSurface,
    },
    roleDescription: {
      fontFamily: font.body.family,
      fontSize: font.body.size,
      lineHeight: font.body.lineHeight,
      color: color.onSurface,
    },
    readyNotice: {
      backgroundColor: banner.success.bg,
      borderColor: banner.success.border,
      borderWidth: border.thin,
      borderRadius: banner.radius,
      padding: space.md,
      gap: space.sm,
    },
    readyNoticeText: {
      fontFamily: font.body.family,
      fontSize: font.body.size,
      lineHeight: font.body.lineHeight,
      color: banner.success.text,
    },
  });
};
