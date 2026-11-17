import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AdedonhaEntrySection } from '@/view/components/adedonhaEntrySection';
import { AdedonhaFillingSection } from '@/view/components/adedonhaFillingSection';
import { AdedonhaLobbySection } from '@/view/components/adedonhaLobbySection';
import { AdedonhaSummarySection } from '@/view/components/adedonhaSummarySection';
import { AdedonhaTallySection } from '@/view/components/adedonhaTallySection';
import { ConfirmModal } from '@/view/components/confirmModal';
import { ExpressiveButton } from '@/view/components/expressiveButton';
import { tokens } from '@/view/theme';
import { useAdedonhaViewModel } from '@/viewmodel/useAdedonhaViewModel';

export const AdedonhaScreen = () => {
  const [state, actions] = useAdedonhaViewModel();

  if (state.loading) {
    return (
      <View
        style={styles.centerScreen}
        accessibilityRole="progressbar"
        accessibilityLabel="Conectando à Sala Multiplayer da Adedonha Bíblica"
      >
        <Text
          allowFontScaling
          maxFontSizeMultiplier={tokens.semantic.typography.maxScale}
          style={styles.title}
        >
          Conectando à Sala da Adedonha Bíblica...
        </Text>
      </View>
    );
  }

  if (!state.room) {
    return (
      <KeyboardAvoidingView
        style={styles.scroll}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.screenContent}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
        >
          <AdedonhaEntrySection
            isRealtimeEnabled={state.isRealtimeEnabled}
            error={state.error}
            onExitArena={actions.handleExitArena}
            onCreateRoom={actions.handleCreateRoom}
            onJoinRoom={actions.handleJoinRoom}
            onJoinDemoRoom={actions.handleJoinDemoRoom}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  const { room } = state;

  return (
    <KeyboardAvoidingView
      style={styles.scroll}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.screenContent}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        <View style={styles.topBar}>
          <ExpressiveButton
            label="Sair"
            variant="outlined"
            icon="arrow-left"
            onPress={actions.handleRequestExit}
          />
          <View
            style={styles.roomBadge}
            accessibilityRole="text"
            accessibilityLabel={`Sala ${room.code}, Rodada ${room.currentRound} de ${room.config.totalRounds}`}
          >
            <MaterialCommunityIcons
              name="access-point"
              size={tokens.semantic.icon.sm}
              color={tokens.semantic.color.onActionContainer}
            />
            <Text
              allowFontScaling
              maxFontSizeMultiplier={tokens.semantic.typography.maxScale}
              style={styles.roomBadgeText}
            >
              {`PIN ${room.code} · Rodada ${room.currentRound}/${room.config.totalRounds}`}
            </Text>
          </View>
        </View>

        <ConfirmModal
          visible={state.confirmingExit}
          title="Deseja sair da sala da Adedonha?"
          description="A rodada continua para os outros jogadores da sala."
          onCancel={actions.handleCancelExit}
          onConfirm={actions.handleExitArena}
        />

        {state.error && (
          <View style={styles.errorBanner} accessibilityLiveRegion="assertive">
            <MaterialCommunityIcons
              name="alert-circle"
              size={tokens.semantic.icon.md}
              color={tokens.semantic.color.error}
            />
            <Text allowFontScaling style={styles.errorBannerText}>
              {state.error}
            </Text>
          </View>
        )}

        {room.phase === 'lobby' && (
          <AdedonhaLobbySection
            room={room}
            currentPlayerId={state.currentPlayerId}
            isCurrentPlayerHost={state.isCurrentPlayerHost}
            suggestedColumns={state.suggestedColumns}
            onSpinRoulette={actions.handleSpinRoulette}
            onAddColumn={actions.handleAddColumn}
            onRemoveColumn={actions.handleRemoveColumn}
            onUpdateConfig={actions.handleUpdateConfig}
          />
        )}

        {(room.phase === 'filling' ||
          room.phase === 'roulette' ||
          room.phase === 'stop_countdown') && (
          <AdedonhaFillingSection
            room={room}
            answers={state.answers}
            fieldErrors={state.fieldErrors}
            canTriggerAdedonha={state.canTriggerAdedonha}
            secondsRemaining={state.secondsRemaining}
            isCurrentPlayerHost={state.isCurrentPlayerHost}
            onChangeAnswer={actions.handleChangeAnswer}
            onTriggerAdedonha={actions.handleTriggerAdedonha}
            onFinalizeStopNow={actions.handleFinalizeStopNow}
            onTimeOut={actions.handleTimeOut}
          />
        )}

        {room.phase === 'tally' && (
          <AdedonhaTallySection
            room={room}
            currentTallyColumnName={state.currentTallyColumnName}
            submissions={state.currentColumnSubmissions}
            isCurrentPlayerHost={state.isCurrentPlayerHost}
            onRaiseDoubt={actions.handleRaiseDoubt}
            onJudgeSubmission={actions.handleJudgeSubmission}
            onAdvanceTallyColumn={actions.handleAdvanceTallyColumn}
          />
        )}

        {(room.phase === 'round_summary' || room.phase === 'finished') && (
          <AdedonhaSummarySection
            room={room}
            awards={state.awards}
            rankedPlayers={state.rankedPlayers}
            isCurrentPlayerHost={state.isCurrentPlayerHost}
            onAdvanceToNextRound={actions.handleAdvanceToNextRound}
            onGoToScoreboard={actions.handleGoToScoreboard}
          />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: tokens.semantic.color.surface,
  },
  screenContent: {
    padding: tokens.semantic.space.md,
    paddingBottom: tokens.semantic.space['3xl'],
    gap: tokens.semantic.space.lg,
  },
  centerScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: tokens.semantic.color.surface,
    padding: tokens.semantic.space.lg,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: tokens.semantic.space.sm,
  },
  roomBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.semantic.space.xs,
    paddingHorizontal: tokens.semantic.space.md,
    paddingVertical: tokens.semantic.space.sm,
    borderRadius: tokens.semantic.radius.full,
    backgroundColor: tokens.semantic.color.actionContainer,
  },
  roomBadgeText: {
    fontFamily: tokens.semantic.font.caption.family,
    fontSize: tokens.semantic.font.caption.size,
    lineHeight: tokens.semantic.font.caption.lineHeight,
    fontWeight: tokens.semantic.font.caption.weight,
    color: tokens.semantic.color.onActionContainer,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.semantic.space.sm,
    padding: tokens.semantic.space.md,
    borderRadius: tokens.semantic.radius.md,
    borderWidth: tokens.semantic.border.thin,
    borderColor: tokens.semantic.color.error,
    backgroundColor: tokens.semantic.color.errorContainer,
  },
  errorBannerText: {
    flexShrink: 1,
    fontFamily: tokens.semantic.font.body.family,
    fontSize: tokens.semantic.font.body.size,
    fontWeight: tokens.semantic.font.body.weight,
    lineHeight: tokens.semantic.font.body.lineHeight,
    color: tokens.semantic.color.onErrorContainer,
  },
  title: {
    fontFamily: tokens.semantic.font.title.family,
    fontSize: tokens.semantic.font.title.size,
    lineHeight: tokens.semantic.font.title.lineHeight,
    fontWeight: tokens.semantic.font.title.weight,
    color: tokens.semantic.color.onSurface,
    textAlign: 'center',
  },
});

export default AdedonhaScreen;
