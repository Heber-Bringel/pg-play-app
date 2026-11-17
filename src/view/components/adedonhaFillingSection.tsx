import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { AdedonhaRoom } from '@/model/entities/multiplayerSession';
import { ExpressiveButton } from '@/view/components/expressiveButton';
import { ExpressiveTextField } from '@/view/components/expressiveTextField';
import { ExpressiveTimer } from '@/view/components/expressiveTimer';
import { tokens } from '@/view/theme';

export type AdedonhaFillingSectionProps = {
  room: AdedonhaRoom;
  answers: Record<string, string>;
  fieldErrors: Record<string, string | null>;
  canTriggerAdedonha: boolean;
  secondsRemaining: number;
  isCurrentPlayerHost: boolean;
  onChangeAnswer: (columnName: string, value: string) => void;
  onTriggerAdedonha: () => Promise<void>;
  onFinalizeStopNow: () => Promise<void>;
  onTimeOut: () => Promise<void>;
};

export const AdedonhaFillingSection = ({
  room,
  answers,
  fieldErrors,
  canTriggerAdedonha,
  secondsRemaining,
  isCurrentPlayerHost,
  onChangeAnswer,
  onTriggerAdedonha,
  onFinalizeStopNow,
  onTimeOut,
}: AdedonhaFillingSectionProps) => {
  const isStopCountdown = room.phase === 'stop_countdown';

  return (
    <View style={styles.container}>
      <View style={styles.roundHeader}>
        <View
          style={styles.heroLetterBadge}
          accessibilityLiveRegion="polite"
          accessibilityLabel={`Letra sorteada: ${room.currentLetter}`}
        >
          <Text
            allowFontScaling
            maxFontSizeMultiplier={tokens.semantic.typography.maxScale}
            style={styles.heroLetterCaption}
          >
            LETRA
          </Text>
          <Text
            allowFontScaling
            maxFontSizeMultiplier={tokens.semantic.typography.maxScale}
            style={styles.heroLetterText}
          >
            {room.currentLetter ?? '?'}
          </Text>
        </View>
        <ExpressiveTimer secondsRemaining={secondsRemaining} />
      </View>

      {isStopCountdown && (
        <View style={styles.stopAlertBanner} accessibilityLiveRegion="assertive">
          <MaterialCommunityIcons
            name="alert"
            size={tokens.semantic.icon.md}
            color={tokens.semantic.color.onErrorContainer}
          />
          <Text allowFontScaling style={styles.stopAlertText}>
            {`${room.stopTriggeredBy ?? 'Um jogador'} pediu ADEDONHA! Enviando respostas em ${secondsRemaining}s...`}
          </Text>
        </View>
      )}

      <View style={styles.fieldsList}>
        {room.config.columns.map((columnName) => (
          <ExpressiveTextField
            key={columnName}
            label={columnName}
            value={answers[columnName] ?? ''}
            placeholder={`Começa com ${room.currentLetter ?? ''}...`}
            helperText={`Digite uma resposta iniciada por ${room.currentLetter ?? ''}`}
            errorText={fieldErrors[columnName] ?? undefined}
            icon="pencil-outline"
            maxLength={40}
            onChangeText={(text) => onChangeAnswer(columnName, text)}
          />
        ))}
      </View>

      <View style={styles.actionsContainer}>
        {isStopCountdown ? (
          isCurrentPlayerHost && (
            <ExpressiveButton
              label="Ir para Apuração Agora"
              variant="primaryJumbo"
              icon="scale-balance"
              onPress={() => {
                void onFinalizeStopNow();
              }}
            />
          )
        ) : (
          <ExpressiveButton
            label="ADEDONHA! (Parar Rodada)"
            variant="primaryJumbo"
            icon="hand-back-right"
            disabled={!canTriggerAdedonha}
            onPress={() => {
              void onTriggerAdedonha();
            }}
          />
        )}

        {isCurrentPlayerHost && !isStopCountdown && (
          <View style={styles.moderatorDivider}>
            <Text allowFontScaling style={styles.moderatorHint}>
              Controle do Moderador
            </Text>
            <ExpressiveButton
              label="Encerrar Tempo da Rodada"
              variant="outlined"
              icon="timer-off-outline"
              onPress={() => {
                void onTimeOut();
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
  roundHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: tokens.semantic.space.md,
  },
  heroLetterBadge: {
    minWidth: tokens.semantic.space['3xl'],
    minHeight: tokens.semantic.space['3xl'],
    paddingHorizontal: tokens.semantic.space.lg,
    paddingVertical: tokens.semantic.space.sm,
    borderRadius: tokens.semantic.radius.xl,
    backgroundColor: tokens.semantic.color.action,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: tokens.semantic.elevation.card,
  },
  heroLetterCaption: {
    fontFamily: tokens.semantic.font.caption.family,
    fontSize: tokens.semantic.font.caption.size,
    lineHeight: tokens.semantic.font.caption.lineHeight,
    fontWeight: tokens.semantic.font.caption.weight,
    color: tokens.semantic.color.onAction,
  },
  heroLetterText: {
    fontFamily: tokens.semantic.font.display.family,
    fontSize: tokens.semantic.font.display.size,
    lineHeight: tokens.semantic.font.display.lineHeight,
    fontWeight: tokens.semantic.font.display.weight,
    color: tokens.semantic.color.onAction,
  },
  stopAlertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.semantic.space.sm,
    padding: tokens.semantic.space.md,
    borderRadius: tokens.semantic.radius.md,
    borderWidth: tokens.semantic.border.thin,
    borderColor: tokens.semantic.color.error,
    backgroundColor: tokens.semantic.color.errorContainer,
  },
  stopAlertText: {
    flex: 1,
    fontFamily: tokens.semantic.font.label.family,
    fontSize: tokens.semantic.font.body.size,
    lineHeight: tokens.semantic.font.body.lineHeight,
    fontWeight: tokens.semantic.font.label.weight,
    color: tokens.semantic.color.onErrorContainer,
  },
  fieldsList: {
    gap: tokens.semantic.space.md,
  },
  actionsContainer: {
    gap: tokens.semantic.space.lg,
    paddingTop: tokens.semantic.space.sm,
  },
  moderatorDivider: {
    borderTopWidth: tokens.semantic.border.thin,
    borderTopColor: tokens.semantic.color.outline,
    paddingTop: tokens.semantic.space.md,
    gap: tokens.semantic.space.sm,
  },
  moderatorHint: {
    fontFamily: tokens.semantic.font.caption.family,
    fontSize: tokens.semantic.font.caption.size,
    lineHeight: tokens.semantic.font.caption.lineHeight,
    fontWeight: tokens.semantic.font.caption.weight,
    color: tokens.semantic.color.onSurfaceMuted,
  },
});
