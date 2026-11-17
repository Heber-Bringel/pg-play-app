import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ExpressiveButton } from '@/view/components/expressiveButton';
import { tokens } from '@/view/theme';

export type ConfirmModalProps = {
  visible: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmIcon?: keyof typeof MaterialCommunityIcons.glyphMap;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  onConfirm: () => void;
  onCancel: () => void;
};

export const ConfirmModal = ({
  visible,
  title,
  description,
  confirmLabel = 'Confirmar Saída',
  cancelLabel = 'Continuar Jogando',
  confirmIcon,
  icon = 'exit-to-app',
  onConfirm,
  onCancel,
}: ConfirmModalProps) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.backdrop} accessibilityViewIsModal>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fechar janela de confirmação"
          onPress={onCancel}
          style={styles.backdropDismiss}
        />

        <View style={styles.dialogCard}>
          <View style={styles.headerRow}>
            <View style={styles.iconBadge}>
              <MaterialCommunityIcons
                name={icon}
                size={tokens.semantic.icon.lg}
                color={tokens.semantic.color.onSecondaryContainer}
              />
            </View>
            <Text
              allowFontScaling
              maxFontSizeMultiplier={tokens.semantic.typography.maxScale}
              style={styles.title}
            >
              {title}
            </Text>
          </View>

          {description && (
            <Text
              allowFontScaling
              maxFontSizeMultiplier={tokens.semantic.typography.maxScale}
              style={styles.description}
            >
              {description}
            </Text>
          )}

          <View style={styles.actions}>
            <ExpressiveButton
              label={cancelLabel}
              variant="tonal"
              onPress={onCancel}
            />
            <ExpressiveButton
              label={confirmLabel}
              icon={confirmIcon}
              variant="secondary"
              onPress={onConfirm}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: tokens.semantic.space.lg,
    backgroundColor: tokens.semantic.color.scrim,
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
    backgroundColor: tokens.component.card.bg,
    borderRadius: tokens.component.card.radius,
    borderWidth: tokens.semantic.border.thin,
    borderColor: tokens.component.card.border,
    padding: tokens.component.card.padding,
    gap: tokens.semantic.space.md,
    elevation: tokens.semantic.elevation.floating,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.semantic.space.md,
  },
  iconBadge: {
    width: tokens.component.card.badgeSize,
    height: tokens.component.card.badgeSize,
    borderRadius: tokens.semantic.radius.lg,
    backgroundColor: tokens.semantic.color.secondaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    flex: 1,
    fontFamily: tokens.semantic.font.subtitle.family,
    fontSize: tokens.semantic.font.subtitle.size,
    fontWeight: tokens.semantic.font.subtitle.weight,
    lineHeight: tokens.semantic.font.subtitle.lineHeight,
    color: tokens.semantic.color.onSurface,
  },
  description: {
    fontFamily: tokens.semantic.font.body.family,
    fontSize: tokens.semantic.font.body.size,
    fontWeight: tokens.semantic.font.body.weight,
    lineHeight: tokens.semantic.font.body.lineHeight,
    color: tokens.semantic.color.onSurfaceMuted,
  },
  actions: {
    gap: tokens.semantic.space.sm,
    paddingTop: tokens.semantic.space.xs,
  },
});
