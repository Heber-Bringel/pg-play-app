import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { AdedonhaRoom } from '@/model/entities/multiplayerSession';
import { ExpressiveButton } from '@/view/components/expressiveButton';
import { ExpressiveTextField } from '@/view/components/expressiveTextField';
import { ExpressiveTimer } from '@/view/components/expressiveTimer';
import { useTheme, type AppTokens } from '@/view/theme';

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
  const activeTokens = useTheme();
  const styles = useMemo(() => createStyles(activeTokens), [activeTokens]);
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
            maxFontSizeMultiplier={activeTokens.semantic.typography.maxScale}
            style={styles.heroLetterCaption}
          >
            LETRA
          </Text>
          <Text
            allowFontScaling
            maxFontSizeMultiplier={activeTokens.semantic.typography.maxScale}
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
            size={activeTokens.semantic.icon.md}
            color={activeTokens.component.banner.error.text}
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

const createStyles = (activeTokens: AppTokens) => {
  const { color, font, radius, space, border, elevation } = activeTokens.semantic;
  const { banner } = activeTokens.component;
  return StyleSheet.create({
    container: {
      gap: space.lg,
    },
    roundHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: space.md,
    },
    heroLetterBadge: {
      minWidth: space['3xl'],
      minHeight: space['3xl'],
      paddingHorizontal: space.lg,
      paddingVertical: space.sm,
      borderRadius: radius.xl,
      backgroundColor: color.action,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: elevation.card,
    },
    heroLetterCaption: {
      fontFamily: font.caption.family,
      fontSize: font.caption.size,
      lineHeight: font.caption.lineHeight,
      fontWeight: font.caption.weight,
      color: color.onAction,
    },
    heroLetterText: {
      fontFamily: font.display.family,
      fontSize: font.display.size,
      lineHeight: font.display.lineHeight,
      fontWeight: font.display.weight,
      color: color.onAction,
    },
    stopAlertBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.sm,
      padding: space.md,
      borderRadius: radius.md,
      borderWidth: border.thin,
      borderColor: banner.error.border,
      backgroundColor: banner.error.bg,
    },
    stopAlertText: {
      flex: 1,
      fontFamily: font.label.family,
      fontSize: font.body.size,
      lineHeight: font.body.lineHeight,
      fontWeight: font.label.weight,
      color: banner.error.text,
    },
    fieldsList: {
      gap: space.md,
    },
    actionsContainer: {
      gap: space.lg,
      paddingTop: space.sm,
    },
    moderatorDivider: {
      borderTopWidth: border.thin,
      borderTopColor: activeTokens.component.card.border,
      paddingTop: space.md,
      gap: space.sm,
    },
    moderatorHint: {
      fontFamily: font.caption.family,
      fontSize: font.caption.size,
      lineHeight: font.caption.lineHeight,
      fontWeight: font.caption.weight,
      color: color.onSurfaceMuted,
    },
  });
};
