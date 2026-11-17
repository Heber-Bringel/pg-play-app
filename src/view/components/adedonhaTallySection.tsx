import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type {
  AdedonhaRoom,
  AdedonhaSubmission,
  AdedonhaSubmissionStatus,
  AdedonhaTallyVerdict,
} from '@/model/entities/multiplayerSession';
import { ExpressiveButton } from '@/view/components/expressiveButton';
import { ExpressiveChip, type ChipTone } from '@/view/components/expressiveChip';
import { GameCard } from '@/view/components/gameCard';
import { tokens } from '@/view/theme';

type VerdictOption = {
  verdict: AdedonhaTallyVerdict;
  label: string;
  tone: ChipTone;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  accessibilityPrefix: string;
};

const VERDICT_OPTIONS: VerdictOption[] = [
  {
    verdict: 'unique',
    label: 'Única (+10)',
    tone: 'success',
    icon: 'check-decagram',
    accessibilityPrefix: 'Validar Única (+10)',
  },
  {
    verdict: 'repeated',
    label: 'Repetida (+5)',
    tone: 'secondary',
    icon: 'account-multiple-check',
    accessibilityPrefix: 'Marcar Repetida (+5)',
  },
  {
    verdict: 'invalid',
    label: 'Inválida (0)',
    tone: 'error',
    icon: 'close-octagon-outline',
    accessibilityPrefix: 'Invalidar (0 pts)',
  },
];

function getStatusBadgeMeta(status: AdedonhaSubmissionStatus, points: number) {
  if (status === 'unique') {
    return {
      label: `Única (+${points} pts)`,
      icon: 'star-circle' as const,
      bgColor: tokens.semantic.color.success,
      textColor: tokens.semantic.color.onSuccess,
      borderColor: tokens.semantic.color.success,
      badgeRadius: tokens.semantic.radius.full,
    };
  }
  if (status === 'repeated') {
    return {
      label: `Repetida (+${points} pts)`,
      icon: 'handshake' as const,
      bgColor: tokens.semantic.color.secondaryContainer,
      textColor: tokens.semantic.color.onSecondaryContainer,
      borderColor: tokens.semantic.color.secondary,
      badgeRadius: tokens.semantic.radius.md,
    };
  }
  return {
    label: `Inválida (${points} pts)`,
    icon: 'close-circle' as const,
    bgColor: tokens.semantic.color.errorContainer,
    textColor: tokens.semantic.color.onErrorContainer,
    borderColor: tokens.semantic.color.error,
    badgeRadius: tokens.semantic.radius.sm,
  };
}

export type AdedonhaTallySectionProps = {
  room: AdedonhaRoom;
  currentTallyColumnName: string | null;
  submissions: AdedonhaSubmission[];
  isCurrentPlayerHost: boolean;
  onRaiseDoubt: (submissionId: string) => Promise<void>;
  onJudgeSubmission: (
    submissionId: string,
    verdict: AdedonhaTallyVerdict
  ) => Promise<void>;
  onAdvanceTallyColumn: () => Promise<void>;
};

export const AdedonhaTallySection = ({
  room,
  currentTallyColumnName,
  submissions,
  isCurrentPlayerHost,
  onRaiseDoubt,
  onJudgeSubmission,
  onAdvanceTallyColumn,
}: AdedonhaTallySectionProps) => {
  return (
    <View style={styles.container}>
      <GameCard
        title={`Coluna ${room.currentTallyColumnIndex + 1} de ${room.config.columns.length}: ${currentTallyColumnName ?? ''}`}
        description={`Apuração Assistida · Letra ${room.currentLetter ?? ''} · ${
          room.stopTriggeredBy
            ? `${room.stopTriggeredBy} pediu ADEDONHA!`
            : 'Tempo esgotado'
        }`}
        playersTag={`Letra ${room.currentLetter ?? ''}`}
        icon="scale-balance"
      />

      <View style={styles.submissionList}>
        {submissions.map((sub) => {
          const badge = getStatusBadgeMeta(sub.status, sub.points);

          return (
            <View key={sub.id} style={styles.submissionCard}>
              <View style={styles.submissionHeader}>
                <View style={styles.submissionPlayerInfo}>
                  <MaterialCommunityIcons
                    name="account-circle-outline"
                    size={tokens.semantic.icon.md}
                    color={tokens.semantic.color.action}
                  />
                  <Text allowFontScaling style={styles.submissionPlayerName}>
                    {sub.playerNickname}
                  </Text>
                </View>

                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor: badge.bgColor,
                      borderColor: badge.borderColor,
                      borderRadius: badge.badgeRadius,
                    },
                  ]}
                  accessibilityLabel={`Status: ${badge.label}`}
                >
                  <MaterialCommunityIcons
                    name={badge.icon}
                    size={tokens.semantic.icon.sm}
                    color={badge.textColor}
                  />
                  <Text
                    allowFontScaling
                    maxFontSizeMultiplier={tokens.semantic.typography.maxScale}
                    style={[styles.statusBadgeText, { color: badge.textColor }]}
                  >
                    {badge.label}
                  </Text>
                </View>
              </View>

              <View style={styles.answerBox}>
                <Text allowFontScaling style={styles.answerLabel}>
                  Resposta enviada:
                </Text>
                <Text allowFontScaling style={styles.answerText}>
                  {sub.answerText.trim() ? sub.answerText : '(Em branco)'}
                </Text>
              </View>

              {sub.doubtCount > 0 && (
                <View
                  style={styles.doubtBanner}
                  accessibilityLiveRegion="polite"
                >
                  <MaterialCommunityIcons
                    name="hand-pointing-up"
                    size={tokens.semantic.icon.sm}
                    color={tokens.semantic.color.onErrorContainer}
                  />
                  <Text allowFontScaling style={styles.doubtBannerText}>
                    {`${sub.doubtCount} jogador(es) levantaram dúvida sobre esta resposta`}
                  </Text>
                </View>
              )}

              <View style={styles.submissionDivider} />

              <ExpressiveChip
                label="Levantar Dúvida"
                icon="hand-pointing-up"
                tone="action"
                fullWidth
                accessibilityLabel={`Levantar Dúvida · ${sub.playerNickname}`}
                onPress={() => {
                  void onRaiseDoubt(sub.id);
                }}
              />

              {isCurrentPlayerHost && (
                <View style={styles.verdictSection}>
                  <Text allowFontScaling style={styles.verdictSectionLabel}>
                    Veredito do Moderador
                  </Text>
                  <View style={styles.verdictRow}>
                    {VERDICT_OPTIONS.map((opt) => (
                      <ExpressiveChip
                        key={opt.verdict}
                        label={opt.label}
                        icon={opt.icon}
                        tone={opt.tone}
                        selected={sub.status === opt.verdict}
                        flexGrow
                        accessibilityLabel={`${opt.accessibilityPrefix} · ${sub.playerNickname}`}
                        onPress={() => {
                          void onJudgeSubmission(sub.id, opt.verdict);
                        }}
                      />
                    ))}
                  </View>
                </View>
              )}
            </View>
          );
        })}
      </View>

      {isCurrentPlayerHost ? (
        <View style={styles.tallyFooter}>
          <ExpressiveButton
            label="Confirmar e Próxima Coluna"
            variant="primaryJumbo"
            icon="check-all"
            onPress={() => {
              void onAdvanceTallyColumn();
            }}
          />
        </View>
      ) : (
        <View style={styles.waitingBanner}>
          <MaterialCommunityIcons
            name="clock-outline"
            size={tokens.semantic.icon.md}
            color={tokens.semantic.color.onActionContainer}
          />
          <Text allowFontScaling style={styles.waitingBannerText}>
            Aguardando o Moderador confirmar os vereditos e avançar a coluna.
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: tokens.semantic.space.lg,
  },
  submissionList: {
    gap: tokens.semantic.space.lg,
  },
  submissionCard: {
    backgroundColor: tokens.component.card.bg,
    borderColor: tokens.component.card.border,
    borderWidth: tokens.semantic.border.thin,
    borderRadius: tokens.component.card.radius,
    padding: tokens.component.card.padding,
    gap: tokens.semantic.space.md,
    elevation: tokens.semantic.elevation.card,
  },
  submissionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: tokens.semantic.space.sm,
  },
  submissionPlayerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.semantic.space.sm,
    flexShrink: 1,
  },
  submissionPlayerName: {
    fontFamily: tokens.semantic.font.subtitle.family,
    fontSize: tokens.semantic.font.subtitle.size,
    lineHeight: tokens.semantic.font.subtitle.lineHeight,
    fontWeight: tokens.semantic.font.subtitle.weight,
    color: tokens.semantic.color.onSurface,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.semantic.space.xs,
    paddingHorizontal: tokens.semantic.space.sm,
    paddingVertical: tokens.semantic.space.xs,
    borderWidth: tokens.semantic.border.thin,
  },
  statusBadgeText: {
    fontFamily: tokens.semantic.font.caption.family,
    fontSize: tokens.semantic.font.caption.size,
    lineHeight: tokens.semantic.font.caption.lineHeight,
    fontWeight: tokens.semantic.font.caption.weight,
  },
  answerBox: {
    backgroundColor: tokens.semantic.color.surfaceVariant,
    borderRadius: tokens.semantic.radius.md,
    padding: tokens.semantic.space.md,
    gap: tokens.semantic.space.xs,
  },
  answerLabel: {
    fontFamily: tokens.semantic.font.caption.family,
    fontSize: tokens.semantic.font.caption.size,
    lineHeight: tokens.semantic.font.caption.lineHeight,
    fontWeight: tokens.semantic.font.caption.weight,
    color: tokens.semantic.color.onSurfaceMuted,
  },
  answerText: {
    fontFamily: tokens.semantic.font.subtitle.family,
    fontSize: tokens.semantic.font.subtitle.size,
    lineHeight: tokens.semantic.font.subtitle.lineHeight,
    fontWeight: tokens.semantic.font.subtitle.weight,
    color: tokens.semantic.color.onSurface,
  },
  doubtBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.semantic.space.sm,
    padding: tokens.semantic.space.sm,
    borderRadius: tokens.semantic.radius.md,
    backgroundColor: tokens.semantic.color.errorContainer,
    borderWidth: tokens.semantic.border.thin,
    borderColor: tokens.semantic.color.error,
  },
  doubtBannerText: {
    flex: 1,
    fontFamily: tokens.semantic.font.caption.family,
    fontSize: tokens.semantic.font.caption.size,
    lineHeight: tokens.semantic.font.caption.lineHeight,
    fontWeight: tokens.semantic.font.caption.weight,
    color: tokens.semantic.color.onErrorContainer,
  },
  submissionDivider: {
    height: tokens.semantic.border.thin,
    backgroundColor: tokens.semantic.color.surfaceVariant,
  },
  verdictSection: {
    gap: tokens.semantic.space.sm,
  },
  verdictSectionLabel: {
    fontFamily: tokens.semantic.font.caption.family,
    fontSize: tokens.semantic.font.caption.size,
    lineHeight: tokens.semantic.font.caption.lineHeight,
    fontWeight: tokens.semantic.font.caption.weight,
    color: tokens.semantic.color.onSurfaceMuted,
  },
  verdictRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.semantic.space.sm,
  },
  tallyFooter: {
    paddingTop: tokens.semantic.space.sm,
  },
  waitingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.semantic.space.sm,
    padding: tokens.semantic.space.md,
    borderRadius: tokens.semantic.radius.lg,
    backgroundColor: tokens.semantic.color.actionContainer,
  },
  waitingBannerText: {
    flex: 1,
    fontFamily: tokens.semantic.font.body.family,
    fontSize: tokens.semantic.font.body.size,
    lineHeight: tokens.semantic.font.body.lineHeight,
    color: tokens.semantic.color.onActionContainer,
  },
});
