import React, { useMemo } from 'react';
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
import { ExpressiveTag, type TagTone } from '@/view/components/expressiveTag';
import { GameCard } from '@/view/components/gameCard';
import { useTheme, type AppTokens } from '@/view/theme';

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

function getStatusTagMeta(status: AdedonhaSubmissionStatus, points: number): {
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  tone: TagTone;
} {
  if (status === 'unique') {
    return {
      label: `Única (+${points} pts)`,
      icon: 'star-circle',
      tone: 'success',
    };
  }
  if (status === 'repeated') {
    return {
      label: `Repetida (+${points} pts)`,
      icon: 'handshake',
      tone: 'secondary',
    };
  }
  return {
    label: `Inválida (${points} pts)`,
    icon: 'close-circle',
    tone: 'error',
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
  const activeTokens = useTheme();
  const styles = useMemo(() => createStyles(activeTokens), [activeTokens]);

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
          const badge = getStatusTagMeta(sub.status, sub.points);

          return (
            <View key={sub.id} style={styles.submissionCard}>
              <View style={styles.submissionHeader}>
                <View style={styles.submissionPlayerInfo}>
                  <MaterialCommunityIcons
                    name="account-circle-outline"
                    size={activeTokens.semantic.icon.md}
                    color={activeTokens.semantic.color.action}
                  />
                  <Text allowFontScaling style={styles.submissionPlayerName}>
                    {sub.playerNickname}
                  </Text>
                </View>

                <ExpressiveTag
                  label={badge.label}
                  icon={badge.icon}
                  tone={badge.tone}
                  accessibilityLabel={`Status: ${badge.label}`}
                />
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
                    size={activeTokens.semantic.icon.sm}
                    color={activeTokens.component.banner.error.text}
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
            size={activeTokens.semantic.icon.md}
            color={activeTokens.component.banner.info.text}
          />
          <Text allowFontScaling style={styles.waitingBannerText}>
            Aguardando o Moderador confirmar os vereditos e avançar a coluna.
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
    submissionList: {
      gap: space.lg,
    },
    submissionCard: {
      backgroundColor: card.bg,
      borderColor: card.border,
      borderWidth: border.thin,
      borderRadius: card.radius,
      padding: card.padding,
      gap: space.md,
      elevation: elevation.card,
    },
    submissionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: space.sm,
    },
    submissionPlayerInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.sm,
      flexShrink: 1,
    },
    submissionPlayerName: {
      fontFamily: font.subtitle.family,
      fontSize: font.subtitle.size,
      lineHeight: font.subtitle.lineHeight,
      fontWeight: font.subtitle.weight,
      color: color.onSurface,
    },
    answerBox: {
      backgroundColor: color.surfaceVariant,
      borderRadius: radius.md,
      padding: space.md,
      gap: space.xs,
    },
    answerLabel: {
      fontFamily: font.caption.family,
      fontSize: font.caption.size,
      lineHeight: font.caption.lineHeight,
      fontWeight: font.caption.weight,
      color: color.onSurfaceMuted,
    },
    answerText: {
      fontFamily: font.subtitle.family,
      fontSize: font.subtitle.size,
      lineHeight: font.subtitle.lineHeight,
      fontWeight: font.subtitle.weight,
      color: color.onSurface,
    },
    doubtBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.sm,
      padding: space.sm,
      borderRadius: radius.md,
      backgroundColor: banner.error.bg,
      borderWidth: border.thin,
      borderColor: banner.error.border,
    },
    doubtBannerText: {
      flex: 1,
      fontFamily: font.caption.family,
      fontSize: font.caption.size,
      lineHeight: font.caption.lineHeight,
      fontWeight: font.caption.weight,
      color: banner.error.text,
    },
    submissionDivider: {
      height: border.thin,
      backgroundColor: color.surfaceVariant,
    },
    verdictSection: {
      gap: space.sm,
    },
    verdictSectionLabel: {
      fontFamily: font.caption.family,
      fontSize: font.caption.size,
      lineHeight: font.caption.lineHeight,
      fontWeight: font.caption.weight,
      color: color.onSurfaceMuted,
    },
    verdictRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: space.sm,
    },
    tallyFooter: {
      paddingTop: space.sm,
    },
    waitingBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.sm,
      padding: space.md,
      borderRadius: banner.radius,
      backgroundColor: banner.info.bg,
    },
    waitingBannerText: {
      flex: 1,
      fontFamily: font.body.family,
      fontSize: font.body.size,
      lineHeight: font.body.lineHeight,
      color: banner.info.text,
    },
  });
};
