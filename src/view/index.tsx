import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { GameModalityFilter } from '@/model/entities/minigame';
import { AppHeader } from '@/view/components/appHeader';
import { ExpressiveButton } from '@/view/components/expressiveButton';
import { ExpressiveChip } from '@/view/components/expressiveChip';
import { GameCard } from '@/view/components/gameCard';
import { ShortNavigationBar } from '@/view/components/shortNavigationBar';
import { useTheme, type AppTokens } from '@/view/theme';
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

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <AppHeader />

        <Text allowFontScaling style={styles.pageTitle}>
          Jogos do Encontro
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
      </ScrollView>

      <ShortNavigationBar
        activeKey="games"
        onSelect={actions.handleSelectNav}
      />
    </View>
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
      paddingHorizontal: space.lg,
      paddingTop: space.md,
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
    pageTitle: {
      fontFamily: font.title.family,
      fontSize: font.title.size,
      fontWeight: font.title.weight,
      lineHeight: font.title.lineHeight,
      color: color.onSurface,
    },
    chipsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
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
