import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppHeader } from '@/view/components/appHeader';
import { ConfirmModal } from '@/view/components/confirmModal';
import { EncounterPodium } from '@/view/components/encounterPodium';
import { ExpressiveButton } from '@/view/components/expressiveButton';
import { GameCard } from '@/view/components/gameCard';
import { ShortNavigationBar } from '@/view/components/shortNavigationBar';
import { WelcomeSplashOverlay } from '@/view/components/welcomeSplashOverlay';
import { useTheme, type AppTokens } from '@/view/theme';
import { useWelcomeViewModel } from '@/viewmodel/useWelcomeViewModel';

const WelcomeScreen = () => {
  const [state, actions] = useWelcomeViewModel();
  const activeTokens = useTheme();
  const styles = useMemo(() => createStyles(activeTokens), [activeTokens]);

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <AppHeader />

        {state.loading ? (
          <View
            style={styles.centerCard}
            accessibilityRole="progressbar"
            accessibilityLabel="Carregando Painel do Encontro"
          >
            <Text allowFontScaling style={styles.loadingText}>
              Preparando o Painel do Encontro...
            </Text>
          </View>
        ) : state.error ? (
          <View style={styles.errorBlock} accessibilityLiveRegion="assertive">
            <GameCard
              title="Erro ao Carregar Encontro"
              description={state.error}
              playersTag="Erro"
              playersTagTone="error"
              icon="alert-circle"
            />
            <ExpressiveButton
              label="Tentar Novamente"
              variant="primary"
              icon="refresh"
              onPress={() => {
                void actions.handleRetry();
              }}
            />
          </View>
        ) : state.teams.length === 0 ? (
          <View style={styles.emptySection}>
            <Text allowFontScaling style={styles.sectionTitle}>
              Ranking do PG
            </Text>
            <View style={styles.emptyOuterCard}>
              <View style={styles.emptyInnerBox}>
                <View style={styles.emptyIconCircle}>
                  <MaterialCommunityIcons
                    name="account-group"
                    size={activeTokens.semantic.icon.lg}
                    color={activeTokens.semantic.color.onActionContainer}
                  />
                </View>
                <Text allowFontScaling style={styles.emptyTitle}>
                  Monte as equipes do encontro
                </Text>
                <Text allowFontScaling style={styles.emptyDescription}>
                  Cadastre de 2 a 6 equipes para acompanhar o pódio ao vivo entre
                  as dinâmicas.
                </Text>
              </View>
              <ExpressiveButton
                label="Cadastrar Equipes"
                variant="tonal"
                icon="plus"
                onPress={actions.handleOpenTeams}
              />
            </View>
          </View>
        ) : (
          <EncounterPodium
            teams={state.podiumTeams}
            totalPoints={state.totalPoints}
            onOpenScoreboard={actions.handleOpenScoreboard}
            onRequestReset={actions.handleRequestReset}
          />
        )}

        <View style={styles.ctaGroup}>
          <ExpressiveButton
            label="Iniciar Jogos"
            variant="primaryJumbo"
            icon="play-circle"
            onPress={actions.handleStartGames}
          />
          <ExpressiveButton
            label="Sala Multiplayer (PIN)"
            variant="tonal"
            icon="cellphone-link"
            onPress={actions.handleOpenMultiplayer}
          />
        </View>
      </ScrollView>

      <ShortNavigationBar
        activeKey="welcome"
        onSelect={actions.handleSelectNav}
      />

      <ConfirmModal
        visible={state.confirmingReset}
        title="Zerar o placar do PG?"
        description="Todas as equipes voltam a 0 pts. Essa ação não pode ser desfeita."
        cancelLabel="Cancelar"
        confirmLabel="Confirmar e Zerar"
        confirmIcon="refresh"
        icon="refresh"
        onCancel={actions.handleCancelReset}
        onConfirm={() => {
          void actions.handleResetScoreboard();
        }}
      />

      <WelcomeSplashOverlay
        visible={state.splashVisible}
        onFinish={actions.handleDismissSplash}
      />
    </View>
  );
};

const createStyles = (activeTokens: AppTokens) => {
  const { color, font, radius, space, border } = activeTokens.semantic;
  const { card } = activeTokens.component;
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: color.surface,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'space-between',
      paddingHorizontal: space.lg,
      paddingTop: space.md,
      paddingBottom: space.lg,
      gap: space.lg,
    },
    centerCard: {
      padding: space.lg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    loadingText: {
      fontFamily: font.subtitle.family,
      fontSize: font.subtitle.size,
      fontWeight: font.subtitle.weight,
      lineHeight: font.subtitle.lineHeight,
      color: color.onSurfaceMuted,
      textAlign: 'center',
    },
    errorBlock: {
      gap: space.md,
    },
    emptySection: {
      gap: space.md,
      alignItems: 'center',
    },
    sectionTitle: {
      fontFamily: font.title.family,
      fontSize: font.title.size,
      fontWeight: font.title.weight,
      lineHeight: font.title.lineHeight,
      color: color.onSurface,
      textAlign: 'center',
    },
    emptyOuterCard: {
      width: '100%',
      backgroundColor: card.bg,
      borderColor: card.border,
      borderWidth: border.thin,
      borderRadius: card.radius,
      padding: space.md,
      gap: space.md,
    },
    emptyInnerBox: {
      backgroundColor: color.surfaceVariant,
      borderRadius: radius.lg,
      paddingHorizontal: space.md,
      paddingVertical: space.lg,
      alignItems: 'center',
      gap: space.sm,
    },
    emptyIconCircle: {
      width: space.container,
      height: space.container,
      borderRadius: radius.full,
      backgroundColor: color.actionContainer,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyTitle: {
      fontFamily: font.subtitle.family,
      fontSize: font.subtitle.size,
      fontWeight: font.subtitle.weight,
      lineHeight: font.subtitle.lineHeight,
      color: color.onSurface,
      textAlign: 'center',
    },
    emptyDescription: {
      fontFamily: font.body.family,
      fontSize: font.body.size,
      fontWeight: font.body.weight,
      lineHeight: font.body.lineHeight,
      color: color.onSurfaceMuted,
      textAlign: 'center',
    },
    ctaGroup: {
      gap: space.sm,
    },
  });
};

export default WelcomeScreen;
