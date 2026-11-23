import React, { useMemo } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  ExpressiveButton,
  type ButtonVariant,
} from '@/view/components/expressiveButton';
import { useTheme, type AppTokens, type ThemeMode } from '@/view/theme';

export type ConfirmModalProps = {
  visible: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmIcon?: keyof typeof MaterialCommunityIcons.glyphMap;
  confirmVariant?: ButtonVariant;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  dismissable?: boolean;
  themeMode?: ThemeMode;
  onConfirm: () => void;
  onCancel?: () => void;
};

export const ConfirmModal = ({
  visible,
  title,
  description,
  confirmLabel = 'Confirmar Saída',
  cancelLabel,
  confirmIcon,
  confirmVariant,
  icon = 'exit-to-app',
  dismissable,
  themeMode,
  onConfirm,
  onCancel,
}: ConfirmModalProps) => {
  const activeTokens = useTheme(themeMode);
  const styles = useMemo(() => createStyles(activeTokens), [activeTokens]);

  const hasCancelAction = Boolean(onCancel);
  const canDismiss = dismissable ?? hasCancelAction;
  const resolvedCancelLabel = cancelLabel ?? 'Continuar Jogando';
  const resolvedConfirmVariant: ButtonVariant =
    confirmVariant ?? (hasCancelAction ? 'secondary' : 'primary');

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={canDismiss ? onCancel : onConfirm}
    >
      <View style={styles.backdrop} accessibilityViewIsModal>
        {canDismiss && onCancel && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Fechar janela de confirmação"
            onPress={onCancel}
            style={styles.backdropDismiss}
          />
        )}

        <View
          style={styles.dialogCard}
          accessibilityLiveRegion="polite"
        >
          <View style={styles.headerRow}>
            <View style={styles.iconBadge}>
              <MaterialCommunityIcons
                name={icon}
                size={activeTokens.semantic.icon.lg}
                color={activeTokens.semantic.color.onSecondaryContainer}
              />
            </View>
            <Text
              allowFontScaling
              maxFontSizeMultiplier={activeTokens.semantic.typography.maxScale}
              style={styles.title}
            >
              {title}
            </Text>
          </View>

          {description && (
            <Text
              allowFontScaling
              maxFontSizeMultiplier={activeTokens.semantic.typography.maxScale}
              style={styles.description}
            >
              {description}
            </Text>
          )}

          <View style={styles.actions}>
            {hasCancelAction && onCancel && (
              <ExpressiveButton
                label={resolvedCancelLabel}
                variant="tonal"
                themeMode={themeMode}
                onPress={onCancel}
              />
            )}
            <ExpressiveButton
              label={confirmLabel}
              icon={confirmIcon}
              variant={resolvedConfirmVariant}
              themeMode={themeMode}
              onPress={onConfirm}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (activeTokens: AppTokens) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: activeTokens.semantic.space.lg,
      backgroundColor: activeTokens.semantic.color.scrim,
    },
    backdropDismiss: {
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    },
    dialogCard: {
      width: '100%',
      maxWidth: 420,
      backgroundColor: activeTokens.component.card.bg,
      borderRadius: activeTokens.component.card.radius,
      borderWidth: activeTokens.semantic.border.thin,
      borderColor: activeTokens.component.card.border,
      padding: activeTokens.component.card.padding,
      gap: activeTokens.semantic.space.md,
      elevation: activeTokens.semantic.elevation.floating,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: activeTokens.semantic.space.md,
    },
    iconBadge: {
      width: activeTokens.component.card.badgeSize,
      height: activeTokens.component.card.badgeSize,
      borderRadius: activeTokens.semantic.radius.lg,
      backgroundColor: activeTokens.semantic.color.secondaryContainer,
      justifyContent: 'center',
      alignItems: 'center',
    },
    title: {
      flex: 1,
      fontFamily: activeTokens.semantic.font.subtitle.family,
      fontSize: activeTokens.semantic.font.subtitle.size,
      fontWeight: activeTokens.semantic.font.subtitle.weight,
      lineHeight: activeTokens.semantic.font.subtitle.lineHeight,
      color: activeTokens.semantic.color.onSurface,
    },
    description: {
      fontFamily: activeTokens.semantic.font.body.family,
      fontSize: activeTokens.semantic.font.body.size,
      fontWeight: activeTokens.semantic.font.body.weight,
      lineHeight: activeTokens.semantic.font.body.lineHeight,
      color: activeTokens.semantic.color.onSurfaceMuted,
    },
    actions: {
      gap: activeTokens.semantic.space.sm,
      paddingTop: activeTokens.semantic.space.xs,
    },
  });
