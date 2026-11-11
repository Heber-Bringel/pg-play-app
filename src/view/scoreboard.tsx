import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ExpressiveButton } from '@/view/components/expressiveButton';
import { GameCard } from '@/view/components/gameCard';
import { color, font, icon, radius, space } from '@/view/theme';
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
          const isLeader = index === 0;
          return (
            <View key={team.id} style={styles.teamItem}>
              <GameCard
                title={`${index + 1}º · ${team.name}`}
                playersTag={`${team.score} pts`}
                description={
                  isLeader ? 'Equipe Campeã da Rodada' : 'Equipe Participante'
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
        <ExpressiveButton
          label="Zerar Placar do PG"
          icon="refresh"
          variant="outlined"
          onPress={() => {
            void actions.handleResetScoreboard();
          }}
        />
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
    width: space.xxxl,
    height: space.xxxl,
    borderRadius: radius.full,
    backgroundColor: color.highlight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontFamily: font.title.family,
    fontSize: font.title.size,
    fontWeight: font.title.weight,
    color: color.onSurface,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: font.body.family,
    fontSize: font.body.size,
    color: color.onSurfaceMuted,
    textAlign: 'center',
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
