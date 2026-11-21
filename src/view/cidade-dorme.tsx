import React, { useEffect, useRef } from 'react';
import {
  AccessibilityInfo,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { CidadeDormeRoom } from '@/model/entities/multiplayerSession';
import { CidadeDormeCityPanel } from '@/view/components/cidadeDormeCityPanel';
import { CidadeDormeDaySection } from '@/view/components/cidadeDormeDaySection';
import { CidadeDormeEntrySection } from '@/view/components/cidadeDormeEntrySection';
import { CidadeDormeLobbySection } from '@/view/components/cidadeDormeLobbySection';
import { CidadeDormeNightSection } from '@/view/components/cidadeDormeNightSection';
import { CidadeDormePhaseTimeline } from '@/view/components/cidadeDormePhaseTimeline';
import { CidadeDormeRoleSection } from '@/view/components/cidadeDormeRoleSection';
import { ConfirmModal } from '@/view/components/confirmModal';
import { ExpressiveButton } from '@/view/components/expressiveButton';
import { darkTokens, tokens } from '@/view/theme';
import { useCidadeDormeViewModel } from '@/viewmodel/useCidadeDormeViewModel';

const resolvePhaseBadge = (
  room: CidadeDormeRoom
): {
  label: string;
  accessibilityLabel: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
} => {
  if (room.phase === 'lobby') {
    return {
      label: `PIN ${room.code} · Lobby`,
      accessibilityLabel: `Sala ${room.code}, Lobby`,
      icon: 'account-group-outline',
    };
  }
  if (room.phase === 'role_reveal') {
    return {
      label: `PIN ${room.code} · Revelação`,
      accessibilityLabel: `Sala ${room.code}, Revelação de Papéis`,
      icon: 'cards-playing-outline',
    };
  }
  if (
    room.phase === 'night_assassin' ||
    room.phase === 'night_angel' ||
    room.phase === 'night_detective'
  ) {
    return {
      label: `PIN ${room.code} · A Noite ${room.currentRound}`,
      accessibilityLabel: `Sala ${room.code}, Ciclo ${room.currentRound}, A Noite`,
      icon: 'weather-night',
    };
  }
  if (room.phase === 'finished') {
    return {
      label: `PIN ${room.code} · Fim de Jogo`,
      accessibilityLabel: `Sala ${room.code}, Fim de Jogo`,
      icon: 'trophy-outline',
    };
  }
  return {
    label: `PIN ${room.code} · O Dia ${room.currentRound}`,
    accessibilityLabel: `Sala ${room.code}, Ciclo ${room.currentRound}, O Dia`,
    icon: 'weather-sunny',
  };
};

export const CidadeDormeScreen = () => {
  const [state, actions] = useCidadeDormeViewModel();
  const { handleSetReduceMotion } = actions;

  const themeTransitionAnim = useRef(
    new Animated.Value(state.isNightPhase ? 1 : 0)
  ).current;

  useEffect(() => {
    let active = true;
    if (AccessibilityInfo?.isReduceMotionEnabled) {
      void AccessibilityInfo.isReduceMotionEnabled().then(
        (enabled) => {
          if (active) {
            handleSetReduceMotion(Boolean(enabled));
          }
        },
        () => {
          // Ignora falha de leitura de acessibilidade em ambientes sem suporte.
        }
      );
    }

    const subscription = AccessibilityInfo?.addEventListener?.(
      'reduceMotionChanged',
      (enabled: boolean) => {
        handleSetReduceMotion(Boolean(enabled));
      }
    );

    return () => {
      active = false;
      subscription?.remove?.();
    };
  }, [handleSetReduceMotion]);

  useEffect(() => {
    const target = state.isNightPhase ? 1 : 0;
    if (state.reduceMotion) {
      themeTransitionAnim.setValue(target);
      return;
    }
    Animated.spring(themeTransitionAnim, {
      toValue: target,
      damping: tokens.semantic.motion.spring.spatial.damping,
      stiffness: tokens.semantic.motion.spring.spatial.stiffness,
      useNativeDriver: false,
    }).start();
  }, [state.isNightPhase, state.reduceMotion, themeTransitionAnim]);

  const animatedSurfaceColor = themeTransitionAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [
      tokens.semantic.color.surface,
      darkTokens.semantic.color.surface,
    ],
  });

  if (state.loading && state.room) {
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
            loading={state.loading}
            error={state.error}
            onExitArena={actions.handleExitArena}
            onCreateRoom={actions.handleCreateRoom}
            onJoinRoom={actions.handleJoinRoom}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  const { room } = state;
  const activeTokens = state.isNightPhase ? darkTokens : tokens;
  const phaseBadge = resolvePhaseBadge(room);
  const showTimeline =
    room.phase !== 'lobby' &&
    room.phase !== 'role_reveal' &&
    room.phase !== 'finished';
  const showCityPanel = room.phase !== 'lobby' && room.phase !== 'finished';

  const readyCount = room.players.filter((p) => p.isReady).length;
  const totalVotesCast = Math.max(
    room.players.filter((p) => p.hasVoted).length,
    Object.keys(room.votesByPlayerId).length
  );
  const panelProgress =
    room.phase === 'role_reveal'
      ? { label: 'Prontos', current: readyCount, total: room.players.length }
      : room.phase === 'day_voting'
      ? {
          label: 'Votos',
          current: totalVotesCast,
          total: Math.max(1, state.aliveCount),
        }
      : null;

  return (
    <Animated.View
      style={[
        styles.animatedSurface,
        { backgroundColor: animatedSurfaceColor },
      ]}
    >
      <KeyboardAvoidingView
        style={styles.flexFill}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.flexFill}
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
              accessibilityLabel={phaseBadge.accessibilityLabel}
            >
              <MaterialCommunityIcons
                name={phaseBadge.icon}
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
                {phaseBadge.label}
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

          {showTimeline && (
            <CidadeDormePhaseTimeline
              steps={state.phaseTimeline}
              currentRound={room.currentRound}
              isNightPhase={state.isNightPhase}
              themeMode={state.isNightPhase ? 'dark' : 'light'}
            />
          )}

          {showCityPanel && (
            <CidadeDormeCityPanel
              players={room.players}
              aliveCount={state.aliveCount}
              eliminatedCount={state.eliminatedCount}
              themeMode={state.isNightPhase ? 'dark' : 'light'}
              reduceMotion={state.reduceMotion}
              progress={panelProgress}
            />
          )}

          {room.phase === 'lobby' && (
            <CidadeDormeLobbySection
              room={room}
              currentPlayerId={state.currentPlayerId}
              isCurrentPlayerHost={state.isCurrentPlayerHost}
              onStartMatch={actions.handleStartMatch}
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
              reduceMotion={state.reduceMotion}
              onToggleRoleVisibility={actions.handleToggleRoleVisibility}
              onConfirmRoleReady={actions.handleConfirmRoleReady}
            />
          )}

          {state.isNightPhase && (
            <CidadeDormeNightSection
              room={room}
              currentPlayer={state.currentPlayer}
              selectedNightTargetId={state.selectedNightTargetId}
              hasSubmittedNightAction={state.hasSubmittedNightAction}
              secondsRemaining={state.secondsRemaining}
              reduceMotion={state.reduceMotion}
              onSelectNightTarget={actions.handleSelectNightTarget}
              onConfirmAssassinTarget={actions.handleConfirmAssassinTarget}
              onConfirmAngelProtection={actions.handleConfirmAngelProtection}
              onConfirmDetectiveInvestigation={
                actions.handleConfirmDetectiveInvestigation
              }
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
              reduceMotion={state.reduceMotion}
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
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  animatedSurface: {
    flex: 1,
  },
  flexFill: {
    flex: 1,
  },
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
