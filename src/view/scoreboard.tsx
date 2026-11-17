import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ExpressiveButton } from '@/view/components/expressiveButton';
import { GameCard } from '@/view/components/gameCard';
import { border, color, font, icon, radius, space } from '@/view/theme';
import { useScoreboardViewModel } from '@/viewmodel/useScoreboardViewModel';

export const ScoreboardScreen = () => {
  const [state, actions] = useScoreboardViewModel();

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
      <View style={styles.screen}>
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
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.trophyBadge}>
          <MaterialCommunityIcons
            name="trophy-award"
            size={icon.lg}
            color={color.onHighlight}
          />
        </View>
        <Text allowFontScaling style={styles.title}>
          Ranking do Encontro
        </Text>
        <Text allowFontScaling style={styles.subtitle}>
          Pontuação oficial das dinâmicas de hoje!
        </Text>
      </View>

      <View style={styles.list}>
        {state.teams.map((team, index) => {
          const isLeader = state.leaderTeam?.id === team.id;
          return (
            <View key={team.id} style={styles.teamItem}>
              <GameCard
                title={`${index + 1}º · ${team.name} — ${team.score} pts`}
                playersTag={isLeader ? 'Líder' : `${index + 1}º lugar`}
                description={
                  isLeader ? 'Equipe na liderança do encontro' : 'Equipe participante'
                }
                icon={isLeader ? 'crown' : 'account-group'}
                highlightLeader={isLeader}
              />
              <ExpressiveButton
                label={`Bônus +10 pts · ${team.name}`}
                variant="tonal"
                icon="star-circle"
                onPress={() => {
                  void actions.handleAwardBonus(team.id);
                }}
              />
            </View>
          );
        })}
      </View>

      <View style={styles.actions}>
        <ExpressiveButton
          label="Escolher Outro Jogo"
          icon="gamepad-variant"
          variant="primaryJumbo"
          onPress={actions.handleChooseAnotherGame}
        />
        {state.confirmingReset ? (
          <View style={styles.resetBanner} accessibilityLiveRegion="polite">
            <Text allowFontScaling style={styles.resetTitle}>
              Zerar o placar do PG?
            </Text>
            <Text allowFontScaling style={styles.resetDescription}>
              Todas as equipes voltam a 0 pts. Essa ação não pode ser desfeita.
            </Text>
            <View style={styles.resetActions}>
              <ExpressiveButton
                label="Cancelar"
                variant="outlined"
                onPress={actions.handleCancelReset}
              />
              <ExpressiveButton
                label="Confirmar e Zerar"
                variant="secondary"
                icon="refresh"
                onPress={() => {
                  void actions.handleResetScoreboard();
                }}
              />
            </View>
          </View>
        ) : (
          <ExpressiveButton
            label="Zerar Placar do PG"
            icon="refresh"
            variant="outlined"
            onPress={actions.handleRequestReset}
          />
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: color.surface,
    padding: space.md,
    gap: space.lg,
  },
  header: {
    alignItems: 'center',
    gap: space.xs,
  },
  trophyBadge: {
    width: space['3xl'],
    height: space['3xl'],
    borderRadius: radius.full,
    backgroundColor: color.highlight,
    justifyContent: 'center',
    alignItems: 'center',
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
  resetBanner: {
    backgroundColor: color.errorContainer,
    borderColor: color.error,
    borderWidth: border.thin,
    borderRadius: radius.lg,
    padding: space.md,
    gap: space.sm,
  },
  resetTitle: {
    fontFamily: font.subtitle.family,
    fontSize: font.subtitle.size,
    fontWeight: font.subtitle.weight,
    lineHeight: font.subtitle.lineHeight,
    color: color.onErrorContainer,
  },
  resetDescription: {
    fontFamily: font.body.family,
    fontSize: font.body.size,
    fontWeight: font.body.weight,
    lineHeight: font.body.lineHeight,
    color: color.onErrorContainer,
  },
  resetActions: {
    gap: space.sm,
  },
  list: {
    gap: space.md,
  },
  teamItem: {
    gap: space.xs,
  },
  actions: {
    gap: space.sm,
  },
});

export default ScoreboardScreen;
