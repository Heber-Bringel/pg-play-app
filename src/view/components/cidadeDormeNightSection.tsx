import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type {
  CidadeDormePlayer,
  CidadeDormeRoom,
} from '@/model/entities/multiplayerSession';
import { ExpressiveButton } from '@/view/components/expressiveButton';
import { ExpressiveTimer } from '@/view/components/expressiveTimer';
import { GameCard } from '@/view/components/gameCard';
import { QuizOption } from '@/view/components/quizOption';
import { darkTokens } from '@/view/theme';

const OPTION_KEYS: Array<'A' | 'B' | 'C' | 'D'> = ['A', 'B', 'C', 'D'];

export type CidadeDormeNightSectionProps = {
  room: CidadeDormeRoom;
  currentPlayer: CidadeDormePlayer | null;
  isCurrentPlayerHost: boolean;
  selectedNightTargetId: string | null;
  secondsRemaining: number;
  onSelectNightTarget: (targetPlayerId: string) => void;
  onConfirmAssassinTarget: () => Promise<void>;
  onConfirmAngelProtection: () => Promise<void>;
  onConfirmDetectiveInvestigation: () => Promise<void>;
  onAdvanceToDawn: () => Promise<void>;
  onAutoAdvanceNightTurn: () => Promise<void>;
};

export const CidadeDormeNightSection = ({
  room,
  currentPlayer,
  isCurrentPlayerHost,
  selectedNightTargetId,
  secondsRemaining,
  onSelectNightTarget,
  onConfirmAssassinTarget,
  onConfirmAngelProtection,
  onConfirmDetectiveInvestigation,
  onAdvanceToDawn,
  onAutoAdvanceNightTurn,
}: CidadeDormeNightSectionProps) => {
  const alivePlayers = room.players.filter((p) => p.isAlive);
  const isAlive = Boolean(currentPlayer?.isAlive);
  const myRole = currentPlayer?.role ?? 'cidadao';

  const isMyActiveTurn =
    isAlive &&
    ((room.phase === 'night_assassin' && myRole === 'assassino') ||
      (room.phase === 'night_angel' && myRole === 'anjo') ||
      (room.phase === 'night_detective' && myRole === 'detetive'));

  const canActOrSimulate = isMyActiveTurn || isCurrentPlayerHost;

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
          size={darkTokens.semantic.icon.md}
          color={darkTokens.semantic.color.onActionContainer}
        />
        <View style={styles.narratorTextWrap}>
          <Text allowFontScaling style={styles.narratorVoiceTag}>
            {`NARRADOR (${room.config.narratorVoice.toUpperCase()}) · NOITE ${room.currentRound}`}
          </Text>
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
            size={darkTokens.semantic.icon.md}
            color={darkTokens.semantic.color.onErrorContainer}
          />
          <Text allowFontScaling style={styles.spectatorText}>
            Você foi eliminado — Acompanhe em silêncio (Modo Espectador).
          </Text>
        </View>
      )}

      <View style={styles.timerRow}>
        <ExpressiveTimer secondsRemaining={secondsRemaining} />
      </View>

      <GameCard
        title={turnTitle}
        description={turnDescription}
        playersTag={`${alivePlayers.length} vivos na cidade`}
        icon="weather-night"
      />

      {room.phase === 'night_detective' && room.detectiveVerdict && (
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
              size={darkTokens.semantic.icon.lg}
              color={
                room.detectiveVerdict.isAssassin
                  ? darkTokens.semantic.color.onErrorContainer
                  : darkTokens.semantic.color.onSuccess
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

          <ExpressiveButton
            label="Concluir Noite e Amanhecer"
            variant="primaryJumbo"
            icon="weather-sunny"
            onPress={() => {
              void onAdvanceToDawn();
            }}
          />
        </View>
      )}

      {canActOrSimulate ? (
        <View style={styles.nightCard}>
          <Text allowFontScaling style={styles.sectionTitle}>
            Escolha um Jogador Vivo
          </Text>

          <View style={styles.optionsList}>
            {alivePlayers.map((player, index) => (
              <QuizOption
                key={player.id}
                letter={OPTION_KEYS[index % OPTION_KEYS.length]}
                text={player.nickname}
                status={
                  selectedNightTargetId === player.id ? 'selected' : 'default'
                }
                onPress={() => onSelectNightTarget(player.id)}
              />
            ))}
          </View>

          <ExpressiveButton
            label={confirmActionLabel}
            variant="primaryJumbo"
            icon="check-circle-outline"
            disabled={!selectedNightTargetId}
            onPress={() => {
              void handleConfirmNightAction();
            }}
          />

          {isCurrentPlayerHost && (
            <ExpressiveButton
              label="Simular Turno da Noite Automaticamente"
              variant="outlined"
              icon="fast-forward-outline"
              onPress={() => {
                void onAutoAdvanceNightTurn();
              }}
            />
          )}
        </View>
      ) : (
        <View style={styles.sleepingCard}>
          <MaterialCommunityIcons
            name="sleep"
            size={darkTokens.semantic.icon.lg}
            color={darkTokens.semantic.color.onSurface}
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

const styles = StyleSheet.create({
  container: {
    gap: darkTokens.semantic.space.lg,
  },
  narratorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: darkTokens.semantic.space.sm,
    padding: darkTokens.semantic.space.md,
    borderRadius: darkTokens.semantic.radius.lg,
    backgroundColor: darkTokens.semantic.color.actionContainer,
    borderWidth: darkTokens.semantic.border.thin,
    borderColor: darkTokens.semantic.color.action,
  },
  narratorTextWrap: {
    flex: 1,
    gap: darkTokens.semantic.space.xs,
  },
  narratorVoiceTag: {
    fontFamily: darkTokens.semantic.font.caption.family,
    fontSize: darkTokens.semantic.font.caption.size,
    lineHeight: darkTokens.semantic.font.caption.lineHeight,
    fontWeight: darkTokens.semantic.font.caption.weight,
    color: darkTokens.semantic.color.onActionContainer,
  },
  narratorText: {
    fontFamily: darkTokens.semantic.font.body.family,
    fontSize: darkTokens.semantic.font.body.size,
    lineHeight: darkTokens.semantic.font.body.lineHeight,
    fontWeight: darkTokens.semantic.font.label.weight,
    color: darkTokens.semantic.color.onActionContainer,
  },
  spectatorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: darkTokens.semantic.space.sm,
    padding: darkTokens.semantic.space.md,
    borderRadius: darkTokens.semantic.radius.sm,
    backgroundColor: darkTokens.semantic.color.errorContainer,
    borderWidth: darkTokens.semantic.border.thin,
    borderColor: darkTokens.semantic.color.error,
  },
  spectatorText: {
    flex: 1,
    fontFamily: darkTokens.semantic.font.label.family,
    fontSize: darkTokens.semantic.font.label.size,
    lineHeight: darkTokens.semantic.font.label.lineHeight,
    fontWeight: darkTokens.semantic.font.label.weight,
    color: darkTokens.semantic.color.onErrorContainer,
  },
  timerRow: {
    alignItems: 'center',
  },
  nightCard: {
    backgroundColor: darkTokens.component.card.bg,
    borderColor: darkTokens.component.card.border,
    borderWidth: darkTokens.semantic.border.thin,
    borderRadius: darkTokens.component.card.radius,
    padding: darkTokens.component.card.padding,
    gap: darkTokens.semantic.space.md,
    elevation: darkTokens.semantic.elevation.card,
  },
  sectionTitle: {
    fontFamily: darkTokens.semantic.font.subtitle.family,
    fontSize: darkTokens.semantic.font.subtitle.size,
    lineHeight: darkTokens.semantic.font.subtitle.lineHeight,
    fontWeight: darkTokens.semantic.font.subtitle.weight,
    color: darkTokens.semantic.color.onSurface,
  },
  optionsList: {
    gap: darkTokens.semantic.space.sm,
  },
  verdictCard: {
    padding: darkTokens.component.card.padding,
    borderWidth: darkTokens.semantic.border.focus,
    gap: darkTokens.semantic.space.md,
    elevation: darkTokens.semantic.elevation.card,
  },
  verdictCardAssassin: {
    backgroundColor: darkTokens.semantic.color.errorContainer,
    borderColor: darkTokens.semantic.color.error,
    borderRadius: darkTokens.semantic.radius.sm,
  },
  verdictCardInnocent: {
    backgroundColor: darkTokens.semantic.color.success,
    borderColor: darkTokens.semantic.color.success,
    borderRadius: darkTokens.semantic.radius.md,
  },
  verdictHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: darkTokens.semantic.space.sm,
  },
  verdictTitle: {
    flex: 1,
    fontFamily: darkTokens.semantic.font.subtitle.family,
    fontSize: darkTokens.semantic.font.subtitle.size,
    lineHeight: darkTokens.semantic.font.subtitle.lineHeight,
    fontWeight: darkTokens.semantic.font.subtitle.weight,
  },
  verdictTitleAssassin: {
    color: darkTokens.semantic.color.onErrorContainer,
  },
  verdictTitleInnocent: {
    color: darkTokens.semantic.color.onSuccess,
  },
  verdictBody: {
    fontFamily: darkTokens.semantic.font.body.family,
    fontSize: darkTokens.semantic.font.body.size,
    lineHeight: darkTokens.semantic.font.body.lineHeight,
  },
  sleepingCard: {
    backgroundColor: darkTokens.component.card.bg,
    borderColor: darkTokens.component.card.border,
    borderWidth: darkTokens.semantic.border.thin,
    borderRadius: darkTokens.component.card.radius,
    padding: darkTokens.component.card.padding,
    alignItems: 'center',
    gap: darkTokens.semantic.space.sm,
  },
  sleepingTitle: {
    fontFamily: darkTokens.semantic.font.subtitle.family,
    fontSize: darkTokens.semantic.font.subtitle.size,
    lineHeight: darkTokens.semantic.font.subtitle.lineHeight,
    fontWeight: darkTokens.semantic.font.subtitle.weight,
    color: darkTokens.semantic.color.onSurface,
    textAlign: 'center',
  },
  sleepingSubtitle: {
    fontFamily: darkTokens.semantic.font.body.family,
    fontSize: darkTokens.semantic.font.body.size,
    lineHeight: darkTokens.semantic.font.body.lineHeight,
    color: darkTokens.semantic.color.onSurfaceMuted,
    textAlign: 'center',
  },
});
