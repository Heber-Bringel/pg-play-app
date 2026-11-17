import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { GameModalityFilter } from '@/model/entities/minigame';
import { ExpressiveButton } from '@/view/components/expressiveButton';
import { ExpressiveTextField } from '@/view/components/expressiveTextField';
import { GameCard } from '@/view/components/gameCard';
import {
  border,
  color,
  font,
  icon,
  radius,
  space,
  typography,
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
              size={icon.md}
              color={color.onActionContainer}
            />
          </View>
          <View style={styles.countPill}>
            <Text allowFontScaling style={styles.countText}>
              {`${state.games.length} de ${state.allGamesCount} jogos`}
            </Text>
          </View>
        </View>

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

      <ExpressiveTextField
        label="Buscar minigame"
        value={state.searchQuery}
        placeholder="Ex.: Mímica, Quiz, Bíblico..."
        helperText="Filtra instantaneamente por nome, tema ou modalidade"
        icon="magnify"
        maxLength={40}
        onChangeText={(text) => {
          void actions.setSearchQuery(text);
        }}
      />

      <View style={styles.filterSection}>
        <Text allowFontScaling style={styles.sectionTitle}>
          Modalidade
        </Text>
        <View style={styles.chipsRow}>
          {MODALITY_OPTIONS.map((option) => {
            const selected = state.selectedModality === option.value;
            return (
              <Pressable
                key={option.value}
                onPress={() => {
                  void actions.setSelectedModality(option.value);
                }}
                accessibilityRole="button"
                accessibilityLabel={`Filtrar por ${option.label}`}
                accessibilityState={{ selected }}
                style={[
                  styles.chip,
                  selected ? styles.chipSelected : styles.chipDefault,
                ]}
              >
                <MaterialCommunityIcons
                  name={selected ? 'check-circle' : option.iconName}
                  size={icon.sm}
                  color={selected ? color.onActionContainer : color.onSurfaceMuted}
                />
                <Text
                  allowFontScaling
                  maxFontSizeMultiplier={typography.maxScale}
                  style={[
                    styles.chipLabel,
                    selected ? styles.chipLabelSelected : styles.chipLabelDefault,
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
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
              size={icon.lg}
              color={color.onSurfaceMuted}
            />
            <Text allowFontScaling style={styles.emptyTitle}>
              Nenhum minigame encontrado
            </Text>
            <Text allowFontScaling style={styles.emptyDescription}>
              Tente outro termo de busca ou restaure o catálogo completo de jogos do PG.
            </Text>
            <ExpressiveButton
              label="Limpar busca"
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

const styles = StyleSheet.create({
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
    marginBottom: space.xs,
  },
  brandBadge: {
    width: space['2xl'],
    height: space['2xl'],
    borderRadius: radius.lg,
    backgroundColor: color.actionContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countPill: {
    backgroundColor: color.surfaceVariant,
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
    borderRadius: radius.full,
  },
  countText: {
    fontFamily: font.caption.family,
    fontSize: font.caption.size,
    fontWeight: font.caption.weight,
    lineHeight: font.caption.lineHeight,
    color: color.onSurfaceMuted,
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
  chip: {
    minHeight: space['2xl'],
    paddingHorizontal: space.md,
    borderRadius: radius.full,
    borderWidth: border.thin,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
  },
  chipDefault: {
    backgroundColor: color.surfaceContainer,
    borderColor: color.outline,
  },
  chipSelected: {
    backgroundColor: color.actionContainer,
    borderColor: color.action,
  },
  chipLabel: {
    fontFamily: font.label.family,
    fontSize: font.label.size,
    fontWeight: font.label.weight,
    lineHeight: font.label.lineHeight,
  },
  chipLabelDefault: {
    color: color.onSurface,
  },
  chipLabelSelected: {
    color: color.onActionContainer,
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
    borderColor: color.outline,
    backgroundColor: color.surfaceContainer,
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

export default HubScreen;
