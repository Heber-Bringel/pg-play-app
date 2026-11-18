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
import { CidadeDormeDaySection } from '@/view/components/cidadeDormeDaySection';
import { CidadeDormeEntrySection } from '@/view/components/cidadeDormeEntrySection';
import { CidadeDormeLobbySection } from '@/view/components/cidadeDormeLobbySection';
import { CidadeDormeNightSection } from '@/view/components/cidadeDormeNightSection';
import { CidadeDormeRoleSection } from '@/view/components/cidadeDormeRoleSection';
import { ConfirmModal } from '@/view/components/confirmModal';
import { ExpressiveButton } from '@/view/components/expressiveButton';
import { darkTokens, tokens } from '@/view/theme';
import { useCidadeDormeViewModel } from '@/viewmodel/useCidadeDormeViewModel';

export const CidadeDormeScreen = () => {
  const [state, actions] = useCidadeDormeViewModel();

  if (state.loading) {
    return (
      <View
        style={styles.centerScreen}
        accessibilityRole="progressbar"
        accessibilityLabel="Conectando à Sala Multiplayer do Cidade Dorme"
      >
        <Text
          allowFontScaling
          maxFontSizeMultiplier={tokens.semantic.typography.maxScale}
          style={styles.title}
        >
          Conectando à Sala do Cidade Dorme...
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
          <CidadeDormeEntrySection
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
  const activeTokens = state.isNightPhase ? darkTokens : tokens;

  return (
    <KeyboardAvoidingView
      style={[
        styles.scroll,
        state.isNightPhase && styles.scrollNight,
      ]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={[
          styles.scroll,
          state.isNightPhase && styles.scrollNight,
        ]}
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
            style={[
              styles.roomBadge,
              state.isNightPhase && styles.roomBadgeNight,
            ]}
            accessibilityRole="text"
            accessibilityLabel={`Sala ${room.code}, Ciclo ${room.currentRound}, ${
              state.isNightPhase ? 'A Noite' : 'O Dia'
            }`}
          >
            <MaterialCommunityIcons
              name={state.isNightPhase ? 'weather-night' : 'weather-sunny'}
              size={activeTokens.semantic.icon.sm}
              color={activeTokens.semantic.color.onActionContainer}
            />
            <Text
              allowFontScaling
              maxFontSizeMultiplier={activeTokens.semantic.typography.maxScale}
              style={[
                styles.roomBadgeText,
                state.isNightPhase && styles.roomBadgeTextNight,
              ]}
            >
              {`PIN ${room.code} · ${
                state.isNightPhase ? 'A Noite' : 'O Dia'
              } ${room.currentRound}`}
            </Text>
          </View>
        </View>

        <ConfirmModal
          visible={state.confirmingExit}
          title="Deseja sair da partida de Cidade Dorme?"
          description="A sessão continua para os demais jogadores da roda."
          onCancel={actions.handleCancelExit}
          onConfirm={actions.handleExitArena}
        />

        {state.error && (
          <View
            style={[
              styles.errorBanner,
              state.isNightPhase && styles.errorBannerNight,
            ]}
            accessibilityLiveRegion="assertive"
          >
            <MaterialCommunityIcons
              name="alert-circle"
              size={activeTokens.semantic.icon.md}
              color={activeTokens.semantic.color.error}
            />
            <Text
              allowFontScaling
              style={[
                styles.errorBannerText,
                state.isNightPhase && styles.errorBannerTextNight,
              ]}
            >
              {state.error}
            </Text>
          </View>
        )}

        {room.phase === 'lobby' && (
          <CidadeDormeLobbySection
            room={room}
            currentPlayerId={state.currentPlayerId}
            isCurrentPlayerHost={state.isCurrentPlayerHost}
            onStartMatch={actions.handleStartMatch}
            onAddPlayer={actions.handleAddPlayer}
            onRemovePlayer={actions.handleRemovePlayer}
            onUpdateConfig={actions.handleUpdateConfig}
          />
        )}

        {room.phase === 'role_reveal' && (
          <CidadeDormeRoleSection
            room={room}
            currentPlayer={state.currentPlayer}
            roleInfo={state.currentRoleMeta}
            isRoleVisible={state.isRoleVisible}
            isCurrentPlayerHost={state.isCurrentPlayerHost}
            onToggleRoleVisibility={actions.handleToggleRoleVisibility}
            onConfirmRoleReady={actions.handleConfirmRoleReady}
          />
        )}

        {state.isNightPhase && (
          <CidadeDormeNightSection
            room={room}
            currentPlayer={state.currentPlayer}
            isCurrentPlayerHost={state.isCurrentPlayerHost}
            selectedNightTargetId={state.selectedNightTargetId}
            secondsRemaining={state.secondsRemaining}
            onSelectNightTarget={actions.handleSelectNightTarget}
            onConfirmAssassinTarget={actions.handleConfirmAssassinTarget}
            onConfirmAngelProtection={actions.handleConfirmAngelProtection}
            onConfirmDetectiveInvestigation={
              actions.handleConfirmDetectiveInvestigation
            }
            onAdvanceToDawn={actions.handleAdvanceToDawn}
            onAutoAdvanceNightTurn={actions.handleAutoAdvanceNightTurn}
          />
        )}

        {(room.phase === 'day_debate' ||
          room.phase === 'day_voting' ||
          room.phase === 'vote_result' ||
          room.phase === 'finished') && (
          <CidadeDormeDaySection
            room={room}
            currentPlayer={state.currentPlayer}
            isCurrentPlayerHost={state.isCurrentPlayerHost}
            selectedVoteTargetId={state.selectedVoteTargetId}
            secondsRemaining={state.secondsRemaining}
            onStartVotingPhase={actions.handleStartVotingPhase}
            onSelectVoteTarget={actions.handleSelectVoteTarget}
            onCastVote={actions.handleCastVote}
            onTallyVotes={actions.handleTallyVotes}
            onStartNextNight={actions.handleStartNextNight}
            onRestartMatch={actions.handleRestartMatch}
            onExitArena={actions.handleExitArena}
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
  scrollNight: {
    backgroundColor: darkTokens.semantic.color.surface,
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
  roomBadgeNight: {
    backgroundColor: darkTokens.semantic.color.actionContainer,
  },
  roomBadgeText: {
    fontFamily: tokens.semantic.font.caption.family,
    fontSize: tokens.semantic.font.caption.size,
    lineHeight: tokens.semantic.font.caption.lineHeight,
    fontWeight: tokens.semantic.font.caption.weight,
    color: tokens.semantic.color.onActionContainer,
  },
  roomBadgeTextNight: {
    color: darkTokens.semantic.color.onActionContainer,
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
  errorBannerNight: {
    borderColor: darkTokens.semantic.color.error,
    backgroundColor: darkTokens.semantic.color.errorContainer,
  },
  errorBannerText: {
    flexShrink: 1,
    fontFamily: tokens.semantic.font.body.family,
    fontSize: tokens.semantic.font.body.size,
    fontWeight: tokens.semantic.font.body.weight,
    lineHeight: tokens.semantic.font.body.lineHeight,
    color: tokens.semantic.color.onErrorContainer,
  },
  errorBannerTextNight: {
    color: darkTokens.semantic.color.onErrorContainer,
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

export default CidadeDormeScreen;
