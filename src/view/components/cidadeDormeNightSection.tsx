import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type {
  CidadeDormePlayer,
  CidadeDormeRoom,
} from '@/model/entities/multiplayerSession';
import { ExpressiveButton } from '@/view/components/expressiveButton';
import { ExpressiveTag } from '@/view/components/expressiveTag';
import { ExpressiveTimer } from '@/view/components/expressiveTimer';
import { GameCard } from '@/view/components/gameCard';
import { SelectableOptionItem } from '@/view/components/selectableOptionItem';
import { useTheme, type AppTokens } from '@/view/theme';

export type CidadeDormeNightSectionProps = {
  room: CidadeDormeRoom;
  currentPlayer: CidadeDormePlayer | null;
  selectedNightTargetId: string | null;
  hasSubmittedNightAction?: boolean;
  secondsRemaining: number;
  onSelectNightTarget: (targetPlayerId: string) => void;
  onConfirmAssassinTarget: () => Promise<void>;
  onConfirmAngelProtection: () => Promise<void>;
  onConfirmDetectiveInvestigation: () => Promise<void>;
};

export const CidadeDormeNightSection = ({
  room,
  currentPlayer,
  selectedNightTargetId,
  hasSubmittedNightAction = false,
  secondsRemaining,
  onSelectNightTarget,
  onConfirmAssassinTarget,
  onConfirmAngelProtection,
  onConfirmDetectiveInvestigation,
}: CidadeDormeNightSectionProps) => {
  const activeTokens = useTheme('dark');
  const styles = useMemo(() => createStyles(activeTokens), [activeTokens]);

  const alivePlayers = room.players.filter((p) => p.isAlive);
  const isAlive = Boolean(currentPlayer?.isAlive);
  const myRole = currentPlayer?.role ?? null;

  const isMyActiveTurn =
    isAlive &&
    ((room.phase === 'night_assassin' && myRole === 'assassino') ||
      (room.phase === 'night_angel' && myRole === 'anjo') ||
      (room.phase === 'night_detective' && myRole === 'detetive'));

  const hasVerdictThisRound = Boolean(
    room.phase === 'night_detective' &&
      room.detectiveVerdict &&
      room.detectiveVerdict.roundNumber === room.currentRound &&
      myRole === 'detetive' &&
      isAlive
  );

  const allyAssassinSet = new Set(room.allyAssassinIds ?? []);
  const eligibleTargets = alivePlayers.filter((player) => {
    if (room.phase === 'night_assassin') {
      if (currentPlayer && player.id === currentPlayer.id) return false;
      if (player.role === 'assassino') return false;
      if (allyAssassinSet.has(player.id)) return false;
      return true;
    }
    if (room.phase === 'night_detective') {
      if (currentPlayer && player.id === currentPlayer.id) return false;
      return true;
    }
    return true;
  });

  const turnTitle =
    room.phase === 'night_assassin'
      ? 'A Noite · Turno do Assassino'
      : room.phase === 'night_angel'
        ? 'A Noite · Turno do Anjo'
        : 'A Noite · Turno do Detetive';

  const turnDescription =
    room.phase === 'night_assassin'
      ? 'Assassino, acorde em silêncio e escolha uma vítima viva na roda.'
      : room.phase === 'night_angel'
        ? 'Anjo, acorde em silêncio e escolha um jogador vivo para proteger esta noite.'
        : 'Detetive, acorde em silêncio e aponte um suspeito para receber o veredito secreto na tela.';

  const confirmActionLabel =
    room.phase === 'night_assassin'
      ? 'Confirmar Alvo'
      : room.phase === 'night_angel'
        ? 'Proteger Jogador'
        : 'Investigar Suspeito';

  const handleConfirmNightAction = async () => {
    if (room.phase === 'night_assassin') {
      await onConfirmAssassinTarget();
      return;
    }
    if (room.phase === 'night_angel') {
      await onConfirmAngelProtection();
      return;
    }
    await onConfirmDetectiveInvestigation();
  };

  return (
    <View style={styles.container}>
      <View
        style={styles.narratorBanner}
        accessibilityRole="text"
        accessibilityLabel={`Legenda do Narrador: ${room.narratorCaption}`}
      >
        <MaterialCommunityIcons
          name="weather-night"
          size={activeTokens.semantic.icon.md}
          color={activeTokens.component.banner.info.text}
        />
        <View style={styles.narratorTextWrap}>
          <ExpressiveTag
            label={`NARRADOR (${room.config.narratorVoice.toUpperCase()}) · NOITE ${room.currentRound}`}
            tone="action"
            themeMode="dark"
          />
          <Text allowFontScaling style={styles.narratorText}>
            {room.narratorCaption}
          </Text>
        </View>
      </View>

      {!isAlive && (
        <View
          style={styles.spectatorBanner}
          accessibilityRole="alert"
          accessibilityLabel="Você foi eliminado — Acompanhe em silêncio"
        >
          <MaterialCommunityIcons
            name="ghost-outline"
            size={activeTokens.semantic.icon.md}
            color={activeTokens.component.banner.error.text}
          />
          <Text allowFontScaling style={styles.spectatorText}>
            Você foi eliminado — Acompanhe em silêncio (Modo Espectador).
          </Text>
        </View>
      )}

      <View style={styles.timerRow}>
        <ExpressiveTimer secondsRemaining={secondsRemaining} themeMode="dark" />
      </View>

      <GameCard
        title={turnTitle}
        description={turnDescription}
        playersTag={`${alivePlayers.length} vivos na cidade`}
        icon="weather-night"
        themeMode="dark"
      />

      {hasVerdictThisRound && room.detectiveVerdict ? (
        <View
          style={[
            styles.verdictCard,
            room.detectiveVerdict.isAssassin
              ? styles.verdictCardAssassin
              : styles.verdictCardInnocent,
          ]}
          accessibilityRole="alert"
          accessibilityLabel={
            room.detectiveVerdict.isAssassin
              ? `Suspeito Confirmado: ${room.detectiveVerdict.targetNickname} é Assassino`
              : `Cidadão Inocente: ${room.detectiveVerdict.targetNickname} não é Assassino`
          }
        >
          <View style={styles.verdictHeader}>
            <MaterialCommunityIcons
              name={
                room.detectiveVerdict.isAssassin
                  ? 'alert-circle'
                  : 'check-circle'
              }
              size={activeTokens.semantic.icon.lg}
              color={
                room.detectiveVerdict.isAssassin
                  ? activeTokens.component.banner.error.text
                  : activeTokens.component.banner.success.text
              }
            />
            <Text
              allowFontScaling
              style={[
                styles.verdictTitle,
                room.detectiveVerdict.isAssassin
                  ? styles.verdictTitleAssassin
                  : styles.verdictTitleInnocent,
              ]}
            >
              {room.detectiveVerdict.isAssassin
                ? 'Suspeito Confirmado (Assassino)'
                : 'Cidadão Inocente'}
            </Text>
          </View>
          <Text
            allowFontScaling
            style={[
              styles.verdictBody,
              room.detectiveVerdict.isAssassin
                ? styles.verdictTitleAssassin
                : styles.verdictTitleInnocent,
            ]}
          >
            {room.detectiveVerdict.isAssassin
              ? `Alerta máximo! ${room.detectiveVerdict.targetNickname} faz parte dos Assassinos infiltrados.`
              : `${room.detectiveVerdict.targetNickname} pertence à Cidade (Inocente). Guarde este segredo até o debate!`}
          </Text>
          <View style={styles.verdictWaitRow}>
            <MaterialCommunityIcons
              name="clock-outline"
              size={activeTokens.semantic.icon.sm}
              color={
                room.detectiveVerdict.isAssassin
                  ? activeTokens.component.banner.error.text
                  : activeTokens.component.banner.success.text
              }
            />
            <Text
              allowFontScaling
              style={[
                styles.verdictWaitText,
                room.detectiveVerdict.isAssassin
                  ? styles.verdictTitleAssassin
                  : styles.verdictTitleInnocent,
              ]}
            >
              Investigação concluída — aguarde o término do cronômetro para o amanhecer.
            </Text>
          </View>
        </View>
      ) : isMyActiveTurn ? (
        <View style={styles.nightCard}>
          <Text allowFontScaling style={styles.sectionTitle}>
            Escolha um Jogador Vivo
          </Text>

          {hasSubmittedNightAction && (
            <View
              style={styles.submittedBanner}
              accessibilityRole="text"
              accessibilityLabel="Escolha registrada — aguarde o fim do turno."
            >
              <MaterialCommunityIcons
                name="check-circle"
                size={activeTokens.semantic.icon.md}
                color={activeTokens.component.banner.info.text}
              />
              <Text allowFontScaling style={styles.submittedBannerText}>
                Escolha registrada — aguarde o fim do turno.
              </Text>
            </View>
          )}

          <View style={styles.optionsList}>
            {eligibleTargets.map((player, index) => (
              <SelectableOptionItem
                key={player.id}
                index={index + 1}
                label={player.nickname}
                themeMode="dark"
                selected={selectedNightTargetId === player.id}
                onPress={() => onSelectNightTarget(player.id)}
              />
            ))}
          </View>

          <ExpressiveButton
            label={confirmActionLabel}
            variant="primaryJumbo"
            icon="check-circle-outline"
            disabled={!selectedNightTargetId}
            themeMode="dark"
            onPress={() => {
              void handleConfirmNightAction();
            }}
          />
        </View>
      ) : (
        <View style={styles.sleepingCard}>
          <MaterialCommunityIcons
            name="sleep"
            size={activeTokens.semantic.icon.lg}
            color={activeTokens.semantic.color.onSurface}
          />
          <Text allowFontScaling style={styles.sleepingTitle}>
            A Cidade Dorme... Mantenha os olhos fechados
          </Text>
          <Text allowFontScaling style={styles.sleepingSubtitle}>
            Aguarde o Narrador conduzir os turnos noturnos até o amanhecer.
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
    narratorTextWrap: {
      flex: 1,
      gap: space.xs,
    },
    narratorText: {
      fontFamily: font.body.family,
      fontSize: font.body.size,
      lineHeight: font.body.lineHeight,
      fontWeight: font.label.weight,
      color: banner.info.text,
    },
    spectatorBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.sm,
      padding: space.md,
      borderRadius: radius.sm,
      backgroundColor: banner.error.bg,
      borderWidth: border.thin,
      borderColor: banner.error.border,
    },
    spectatorText: {
      flex: 1,
      fontFamily: font.label.family,
      fontSize: font.label.size,
      lineHeight: font.label.lineHeight,
      fontWeight: font.label.weight,
      color: banner.error.text,
    },
    timerRow: {
      alignItems: 'center',
    },
    nightCard: {
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
    optionsList: {
      gap: space.sm,
    },
    verdictCard: {
      padding: card.padding,
      borderWidth: border.focus,
      gap: space.md,
      elevation: elevation.card,
    },
    verdictCardAssassin: {
      backgroundColor: banner.error.bg,
      borderColor: banner.error.border,
      borderRadius: radius.sm,
    },
    verdictCardInnocent: {
      backgroundColor: banner.success.bg,
      borderColor: banner.success.border,
      borderRadius: radius.md,
    },
    verdictHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.sm,
    },
    verdictTitle: {
      flex: 1,
      fontFamily: font.subtitle.family,
      fontSize: font.subtitle.size,
      lineHeight: font.subtitle.lineHeight,
      fontWeight: font.subtitle.weight,
    },
    verdictTitleAssassin: {
      color: banner.error.text,
    },
    verdictTitleInnocent: {
      color: banner.success.text,
    },
    verdictBody: {
      fontFamily: font.body.family,
      fontSize: font.body.size,
      lineHeight: font.body.lineHeight,
    },
    verdictWaitRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.xs,
    },
    verdictWaitText: {
      flex: 1,
      fontFamily: font.caption.family,
      fontSize: font.caption.size,
      lineHeight: font.caption.lineHeight,
      fontWeight: font.caption.weight,
    },
    submittedBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.sm,
      padding: space.md,
      borderRadius: banner.radius,
      backgroundColor: banner.info.bg,
    },
    submittedBannerText: {
      flex: 1,
      fontFamily: font.label.family,
      fontSize: font.label.size,
      lineHeight: font.label.lineHeight,
      fontWeight: font.label.weight,
      color: banner.info.text,
    },
    sleepingCard: {
      backgroundColor: card.bg,
      borderColor: card.border,
      borderWidth: border.thin,
      borderRadius: card.radius,
      padding: card.padding,
      alignItems: 'center',
      gap: space.sm,
    },
    sleepingTitle: {
      fontFamily: font.subtitle.family,
      fontSize: font.subtitle.size,
      lineHeight: font.subtitle.lineHeight,
      fontWeight: font.subtitle.weight,
      color: color.onSurface,
      textAlign: 'center',
    },
    sleepingSubtitle: {
      fontFamily: font.body.family,
      fontSize: font.body.size,
      lineHeight: font.body.lineHeight,
      color: color.onSurfaceMuted,
      textAlign: 'center',
    },
  });
};
