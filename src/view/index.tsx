import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { GameModalityFilter } from '@/model/entities/minigame';
import { ExpressiveButton } from '@/view/components/expressiveButton';
import { ExpressiveChip } from '@/view/components/expressiveChip';
import { ExpressiveTag } from '@/view/components/expressiveTag';
import { GameCard } from '@/view/components/gameCard';
import {
  ThemeModePanel,
  ThemeModeToggleButton,
} from '@/view/components/themeModeSwitcher';
import {
  useTheme,
  useThemePreference,
  type AppTokens,
} from '@/view/theme';
import { useHubViewModel } from '@/viewmodel/useHubViewModel';

type ModalityOption = {
  value: GameModalityFilter;
  label: string;
  iconName: keyof typeof MaterialCommunityIcons.glyphMap;
};

const MODALITY_OPTIONS: ModalityOption[] = [
  { value: 'Todos', label: 'Todos', iconName: 'apps' },
  { value: '1 Celular', label: '1 Celular', iconName: 'cellphone' },
  {
    value: 'Multi-Celular',
    label: 'Multi-Celular',
    iconName: 'cellphone-link',
  },
];

export const HubScreen = () => {
  const [state, actions] = useHubViewModel();
  const activeTokens = useTheme();
  const { preference: themePreference, setPreference: setThemePreference } =
    useThemePreference();
  const [themePanelExpanded, setThemePanelExpanded] = useState<boolean>(false);
  const styles = useMemo(() => createStyles(activeTokens), [activeTokens]);

  if (state.loading) {
    return (
      <View
        style={styles.centerScreen}
        accessibilityRole="progressbar"
        accessibilityLabel="Carregando Catálogo de Jogos do PG"
      >
        <Text allowFontScaling style={styles.loadingTitle}>
          Carregando Hub de Jogos do PG...
        </Text>
      </View>
    );
  }

  if (state.error) {
    return (
      <View style={styles.centerScreen} accessibilityLiveRegion="assertive">
        <GameCard
          title="Erro ao Carregar Hub"
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

  const leaderDescription =
    state.leaderTeam && state.leaderTeam.score > 0
      ? `${state.leaderTeam.name} lidera o encontro com ${state.leaderTeam.score} pts!`
      : state.leaderTeam
        ? `${state.totalTeams} equipes prontas para começar. Toque para ver o placar do PG.`
        : 'Nenhuma equipe cadastrada ainda. Configure as equipes do encontro!';

  const leaderTag =
    state.leaderTeam && state.leaderTeam.score > 0
      ? `${state.leaderTeam.score} pts · Líder`
      : 'Placar do PG';

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <View style={styles.brandBadge}>
            <MaterialCommunityIcons
              name="gamepad-variant"
              size={activeTokens.semantic.icon.md}
              color={activeTokens.semantic.color.onActionContainer}
            />
          </View>
          <View style={styles.brandActions}>
            <ExpressiveTag
              label={`${state.games.length} de ${state.allGamesCount} jogos`}
              tone="neutral"
            />
            <ThemeModeToggleButton
              preference={themePreference}
              expanded={themePanelExpanded}
              onPress={() => setThemePanelExpanded((prev) => !prev)}
            />
          </View>
        </View>

        {themePanelExpanded && (
          <ThemeModePanel
            preference={themePreference}
            onSelectPreference={setThemePreference}
            onMinimize={() => setThemePanelExpanded(false)}
          />
        )}

        <Text allowFontScaling style={styles.title}>
          PG PLAY
        </Text>
        <Text allowFontScaling style={styles.subtitle}>
          Minigames presenciais para animar o seu Pequeno Grupo.
        </Text>
      </View>

      <GameCard
        title={
          state.leaderTeam && state.leaderTeam.score > 0
            ? `Líder: ${state.leaderTeam.name}`
            : 'Placar do Encontro'
        }
        description={leaderDescription}
        playersTag={leaderTag}
        icon="trophy"
        highlightLeader={Boolean(state.leaderTeam && state.leaderTeam.score > 0)}
        onPress={actions.handleOpenScoreboard}
      />

      <View style={styles.shortcutsRow}>
        <View style={styles.shortcutItem}>
          <ExpressiveButton
            label={`Equipes (${state.totalTeams})`}
            variant="tonal"
            icon="account-group"
            onPress={actions.handleOpenTeams}
          />
        </View>
        <View style={styles.shortcutItem}>
          <ExpressiveButton
            label="Ver Placar"
            variant="outlined"
            icon="podium-gold"
            onPress={actions.handleOpenScoreboard}
          />
        </View>
      </View>

      <View style={styles.filterSection}>
        <Text allowFontScaling style={styles.sectionTitle}>
          Modalidade
        </Text>
        <View style={styles.chipsRow}>
          {MODALITY_OPTIONS.map((option) => {
            const selected = state.selectedModality === option.value;
            return (
              <ExpressiveChip
                key={option.value}
                label={option.label}
                icon={selected ? 'check-circle' : option.iconName}
                selected={selected}
                accessibilityLabel={`Filtrar por ${option.label}`}
                onPress={() => {
                  void actions.setSelectedModality(option.value);
                }}
              />
            );
          })}
        </View>
      </View>

      <View style={styles.catalogSection}>
        <Text allowFontScaling style={styles.sectionTitle}>
          Catálogo de Dinâmicas
        </Text>

        {state.games.length === 0 ? (
          <View style={styles.emptyCard}>
            <MaterialCommunityIcons
              name="magnify-close"
              size={activeTokens.semantic.icon.lg}
              color={activeTokens.semantic.color.onSurfaceMuted}
            />
            <Text allowFontScaling style={styles.emptyTitle}>
              Nenhum minigame encontrado
            </Text>
            <Text allowFontScaling style={styles.emptyDescription}>
              Nenhum jogo disponível para esta modalidade.
            </Text>
            <ExpressiveButton
              label="Limpar filtros"
              variant="tonal"
              icon="filter-remove"
              onPress={() => {
                void actions.handleClearFilters();
              }}
            />
          </View>
        ) : (
          <View style={styles.gamesList}>
            {state.games.map((game) => (
              <GameCard
                key={game.id}
                title={game.title}
                description={game.description}
                playersTag={game.playersTag}
                icon={game.icon}
                disabled={!game.available}
                onPress={
                  game.available
                    ? () => actions.handleSelectGame(game)
                    : undefined
                }
              />
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const createStyles = (activeTokens: AppTokens) => {
  const { color, font, radius, space, border } = activeTokens.semantic;
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: color.surface,
    },
    scrollContent: {
      padding: space.lg,
      paddingBottom: space.xl,
      gap: space.md,
    },
    centerScreen: {
      flex: 1,
      backgroundColor: color.surface,
      padding: space.lg,
      justifyContent: 'center',
      gap: space.md,
    },
    loadingTitle: {
      fontFamily: font.subtitle.family,
      fontSize: font.subtitle.size,
      fontWeight: font.subtitle.weight,
      lineHeight: font.subtitle.lineHeight,
      color: color.onSurface,
      textAlign: 'center',
    },
    header: {
      gap: space.xs,
    },
    brandRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: space.sm,
      marginBottom: space.xs,
    },
    brandActions: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: space.sm,
    },
    brandBadge: {
      width: space['2xl'],
      height: space['2xl'],
      borderRadius: radius.lg,
      backgroundColor: color.actionContainer,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      fontFamily: font.display.family,
      fontSize: font.display.size,
      fontWeight: font.display.weight,
      lineHeight: font.display.lineHeight,
      color: color.onSurface,
    },
    subtitle: {
      fontFamily: font.body.family,
      fontSize: font.body.size,
      fontWeight: font.body.weight,
      lineHeight: font.body.lineHeight,
      color: color.onSurfaceMuted,
    },
    shortcutsRow: {
      flexDirection: 'row',
      gap: space.sm,
    },
    shortcutItem: {
      flex: 1,
    },
    filterSection: {
      gap: space.sm,
    },
    sectionTitle: {
      fontFamily: font.subtitle.family,
      fontSize: font.subtitle.size,
      fontWeight: font.subtitle.weight,
      lineHeight: font.subtitle.lineHeight,
      color: color.onSurface,
    },
    chipsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: space.sm,
    },
    catalogSection: {
      gap: space.sm,
    },
    gamesList: {
      gap: space.md,
    },
    emptyCard: {
      alignItems: 'center',
      gap: space.sm,
      padding: space.lg,
      borderRadius: radius.xl,
      borderWidth: border.thin,
      borderStyle: 'dashed',
      borderColor: activeTokens.component.card.border,
      backgroundColor: activeTokens.component.card.bg,
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
  });
};

export default HubScreen;
