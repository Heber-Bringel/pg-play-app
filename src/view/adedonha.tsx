import React, { useMemo } from 'react';
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
import { ExpressiveTag } from '@/view/components/expressiveTag';
import { useTheme, type AppTokens } from '@/view/theme';
import { useAdedonhaViewModel } from '@/viewmodel/useAdedonhaViewModel';

export const AdedonhaScreen = () => {
  const [state, actions] = useAdedonhaViewModel();
  const activeTokens = useTheme();
  const styles = useMemo(() => createStyles(activeTokens), [activeTokens]);

  if (state.loading && state.room) {
    return (
      <View
        style={styles.centerScreen}
        accessibilityRole="progressbar"
        accessibilityLabel="Conectando à Sala Multiplayer da Adedonha Bíblica"
      >
        <Text
          allowFontScaling
          maxFontSizeMultiplier={activeTokens.semantic.typography.maxScale}
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
            loading={state.loading}
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
          <ExpressiveTag
            label={`PIN ${room.code} · Rodada ${room.currentRound}/${room.config.totalRounds}`}
            icon="access-point"
            tone="action"
            accessibilityLabel={`Sala ${room.code}, Rodada ${room.currentRound} de ${room.config.totalRounds}`}
          />
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
              size={activeTokens.semantic.icon.md}
              color={activeTokens.component.banner.error.text}
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

const createStyles = (activeTokens: AppTokens) => {
  const { color, font, radius, space, border } = activeTokens.semantic;
  const { banner } = activeTokens.component;
  return StyleSheet.create({
    scroll: {
      flex: 1,
      backgroundColor: color.surface,
    },
    screenContent: {
      padding: space.md,
      paddingBottom: space['3xl'],
      gap: space.lg,
    },
    centerScreen: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: color.surface,
      padding: space.lg,
    },
    topBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: space.sm,
      flexWrap: 'wrap',
    },
    errorBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.sm,
      padding: space.md,
      borderRadius: radius.md,
      borderWidth: border.thin,
      borderColor: banner.error.border,
      backgroundColor: banner.error.bg,
    },
    errorBannerText: {
      flexShrink: 1,
      fontFamily: font.body.family,
      fontSize: font.body.size,
      fontWeight: font.body.weight,
      lineHeight: font.body.lineHeight,
      color: banner.error.text,
    },
    title: {
      fontFamily: font.title.family,
      fontSize: font.title.size,
      lineHeight: font.title.lineHeight,
      fontWeight: font.title.weight,
      color: color.onSurface,
      textAlign: 'center',
    },
  });
};

export default AdedonhaScreen;
