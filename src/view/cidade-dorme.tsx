import React, { useEffect, useMemo, useRef } from 'react';
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
import { ExpressiveTag } from '@/view/components/expressiveTag';
import {
  darkTokens,
  ThemeProvider,
  tokens,
  useTheme,
  type AppTokens,
} from '@/view/theme';
import {
  useCidadeDormeViewModel,
  type CidadeDormeActions,
  type CidadeDormeState,
} from '@/viewmodel/useCidadeDormeViewModel';

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

type CidadeDormeRoomContentProps = {
  state: CidadeDormeState;
  actions: CidadeDormeActions;
  room: CidadeDormeRoom;
};

const CidadeDormeRoomContent = ({
  state,
  actions,
  room,
}: CidadeDormeRoomContentProps) => {
  const activeTokens = useTheme();
  const styles = useMemo(() => createStyles(activeTokens), [activeTokens]);
  const themeTransitionAnim = useRef(
    new Animated.Value(state.isNightPhase ? 1 : 0)
  ).current;

  useEffect(() => {
    const target = state.isNightPhase ? 1 : 0;
    if (state.reduceMotion) {
      themeTransitionAnim.setValue(target);
      return;
    }
    Animated.spring(themeTransitionAnim, {
      toValue: target,
      damping: activeTokens.semantic.motion.spring.spatial.damping,
      stiffness: activeTokens.semantic.motion.spring.spatial.stiffness,
      useNativeDriver: false,
    }).start();
  }, [
    activeTokens.semantic.motion.spring.spatial.damping,
    activeTokens.semantic.motion.spring.spatial.stiffness,
    state.isNightPhase,
    state.reduceMotion,
    themeTransitionAnim,
  ]);

  const animatedSurfaceColor = themeTransitionAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [
      tokens.semantic.color.surface,
      darkTokens.semantic.color.surface,
    ],
  });

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
            <ExpressiveTag
              label={phaseBadge.label}
              icon={phaseBadge.icon}
              tone="action"
              accessibilityLabel={phaseBadge.accessibilityLabel}
            />
          </View>

          <ConfirmModal
            visible={state.confirmingExit}
            title="Deseja sair da partida de Cidade Dorme?"
            description="A sessão continua para os demais jogadores da roda."
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
              isNightCardRevealed={state.isNightCardRevealed}
              secondsRemaining={state.secondsRemaining}
              reduceMotion={state.reduceMotion}
              onToggleNightCardVisibility={actions.handleToggleNightCardVisibility}
              onHideNightCard={actions.handleHideNightCard}
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

export const CidadeDormeScreen = () => {
  const [state, actions] = useCidadeDormeViewModel();
  const { handleSetReduceMotion } = actions;
  const activeTokens = useTheme();
  const styles = useMemo(() => createStyles(activeTokens), [activeTokens]);

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

  if (state.loading && state.room) {
    return (
      <View
        style={styles.centerScreen}
        accessibilityRole="progressbar"
        accessibilityLabel="Conectando à Sala Multiplayer do Cidade Dorme"
      >
        <Text
          allowFontScaling
          maxFontSizeMultiplier={activeTokens.semantic.typography.maxScale}
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

  return (
    <ThemeProvider mode={state.isNightPhase ? 'dark' : undefined}>
      <CidadeDormeRoomContent
        state={state}
        actions={actions}
        room={state.room}
      />
    </ThemeProvider>
  );
};

const createStyles = (activeTokens: AppTokens) => {
  const { color, font, radius, space, border } = activeTokens.semantic;
  const { banner } = activeTokens.component;
  return StyleSheet.create({
    animatedSurface: {
      flex: 1,
    },
    flexFill: {
      flex: 1,
    },
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

export default CidadeDormeScreen;
