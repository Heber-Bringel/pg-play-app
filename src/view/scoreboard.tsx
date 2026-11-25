import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ConfirmModal } from '@/view/components/confirmModal';
import { ExpressiveButton } from '@/view/components/expressiveButton';
import { ExpressiveTag } from '@/view/components/expressiveTag';
import { GameCard } from '@/view/components/gameCard';
import { useTheme, type AppTokens } from '@/view/theme';
import { useScoreboardViewModel } from '@/viewmodel/useScoreboardViewModel';

export const ScoreboardScreen = () => {
  const [state, actions] = useScoreboardViewModel();
  const activeTokens = useTheme();
  const styles = useMemo(() => createStyles(activeTokens), [activeTokens]);

  if (state.loading) {
    return (
      <View
        style={styles.screen}
        accessibilityRole="progressbar"
        accessibilityLabel="Carregando Placar e Ranking do PG"
      >
        <Text allowFontScaling style={styles.title}>
          Calculando o Ranking do Encontro...
        </Text>
      </View>
    );
  }

  if (state.error) {
    return (
      <View style={styles.screen} accessibilityLiveRegion="assertive">
        <GameCard
          title="Erro no Placar"
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
    );
  }

  if (state.teams.length === 0) {
    return (
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <ExpressiveButton
            label="Voltar"
            variant="outlined"
            icon="arrow-left"
            onPress={actions.handleBack}
          />
          <ExpressiveTag label="0 equipes" tone="neutral" />
        </View>
        <GameCard
          title="Nenhuma Equipe no Placar"
          description="Cadastre equipes e jogue uma rodada para visualizar o ranking do PG."
          playersTag="0 equipes"
          icon="account-group-outline"
        />
        <ExpressiveButton
          label="Escolher Outro Jogo"
          variant="primaryJumbo"
          icon="gamepad-variant"
          onPress={actions.handleChooseAnotherGame}
        />
      </ScrollView>
    );
  }

  const teamsCountLabel =
    state.teams.length === 1 ? '1 equipe' : `${state.teams.length} equipes`;
  const summaryStatus = state.leaderTeam
    ? `Líder: ${state.leaderTeam.name}`
    : state.totalPoints > 0
      ? 'Empate na liderança'
      : 'Jogue uma dinâmica para começar a pontuar';

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.topSection}>
        <View style={styles.topBar}>
          <ExpressiveButton
            label="Voltar"
            variant="outlined"
            icon="arrow-left"
            onPress={actions.handleBack}
          />
          <ExpressiveTag
            label={`${teamsCountLabel} · ${state.totalPoints} pts`}
            tone="neutral"
          />
        </View>

        <View style={styles.header}>
          <View style={styles.trophyBadge}>
            <MaterialCommunityIcons
              name="trophy-award"
              size={activeTokens.semantic.icon.lg}
              color={activeTokens.semantic.color.onHighlight}
            />
          </View>
          <Text allowFontScaling style={styles.title}>
            Ranking do Encontro
          </Text>
          <Text allowFontScaling style={styles.subtitle}>
            Pontuação oficial das dinâmicas de hoje!
          </Text>
        </View>

        <View style={styles.summaryCard}>
          <Text allowFontScaling style={styles.summaryMetric}>
            {`${teamsCountLabel} · ${state.totalPoints} pts no encontro`}
          </Text>
          <Text allowFontScaling style={styles.summaryStatus}>
            {summaryStatus}
          </Text>
        </View>

        <View style={styles.list}>
          {state.teams.map((team, index) => {
            const isLeader = state.leaderTeam?.id === team.id;
            return (
              <GameCard
                key={team.id}
                title={`${index + 1}º · ${team.name} — ${team.score} pts`}
                playersTag={isLeader ? 'Líder' : `${index + 1}º lugar`}
                description={
                  isLeader ? 'Equipe na liderança do encontro' : 'Equipe participante'
                }
                icon={isLeader ? 'crown' : 'account-group'}
                highlightLeader={isLeader}
              />
            );
          })}
        </View>
      </View>

      <View style={styles.actions}>
        <ExpressiveButton
          label="Escolher Outro Jogo"
          icon="gamepad-variant"
          variant="primaryJumbo"
          onPress={actions.handleChooseAnotherGame}
        />
        <ExpressiveButton
          label="Zerar Placar do PG"
          icon="refresh"
          variant="outlined"
          disabled={state.totalPoints === 0}
          onPress={actions.handleRequestReset}
        />
      </View>

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
    </ScrollView>
  );
};

const createStyles = (activeTokens: AppTokens) => {
  const { color, font, radius, space } = activeTokens.semantic;
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: color.surface,
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: space.lg,
      paddingTop: space.lg,
      paddingBottom: space['3xl'],
      gap: space.xl,
    },
    topSection: {
      gap: space.lg,
    },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: space.sm,
    },
    header: {
      alignItems: 'center',
      gap: space.sm,
      paddingVertical: space.sm,
    },
    summaryCard: {
      backgroundColor: color.surfaceVariant,
      borderRadius: radius.lg,
      paddingVertical: space.md,
      paddingHorizontal: space.lg,
      alignItems: 'center',
      gap: space.xs,
    },
    summaryMetric: {
      fontFamily: font.label.family,
      fontSize: font.label.size,
      fontWeight: font.label.weight,
      lineHeight: font.label.lineHeight,
      color: color.onSurface,
      textAlign: 'center',
    },
    summaryStatus: {
      fontFamily: font.body.family,
      fontSize: font.body.size,
      fontWeight: font.body.weight,
      lineHeight: font.body.lineHeight,
      color: color.onSurfaceMuted,
      textAlign: 'center',
    },
    trophyBadge: {
      width: space['3xl'],
      height: space['3xl'],
      borderRadius: radius.full,
      backgroundColor: color.highlight,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: space.xs,
    },
    title: {
      fontFamily: font.title.family,
      fontSize: font.title.size,
      fontWeight: font.title.weight,
      lineHeight: font.title.lineHeight,
      color: color.onSurface,
      textAlign: 'center',
    },
    subtitle: {
      fontFamily: font.body.family,
      fontSize: font.body.size,
      fontWeight: font.body.weight,
      lineHeight: font.body.lineHeight,
      color: color.onSurfaceMuted,
      textAlign: 'center',
    },
    list: {
      gap: space.lg,
    },
    actions: {
      gap: space.md,
      paddingTop: space.md,
    },
  });
};

export default ScoreboardScreen;
