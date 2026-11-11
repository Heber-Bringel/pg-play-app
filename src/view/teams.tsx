import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { Team } from '@/model/entities/team';
import { ExpressiveButton } from '@/view/components/expressiveButton';
import { ExpressiveTextField } from '@/view/components/expressiveTextField';
import { GameCard } from '@/view/components/gameCard';
import { color, font, icon, radius, space } from '@/view/theme';
import { useTeamsViewModel } from '@/viewmodel/useTeamsViewModel';

export const TeamsScreen = () => {
  const [state, actions] = useTeamsViewModel();

  if (state.loading) {
    return (
      <View
        style={styles.screen}
        accessibilityRole="progressbar"
        accessibilityLabel="Carregando Equipes da Sessão"
      >
        <Text allowFontScaling style={styles.title}>
          Carregando equipes do Pequeno Grupo...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <View style={styles.topBar}>
          <ExpressiveButton
            label="Voltar"
            variant="outlined"
            icon="arrow-left"
            onPress={actions.handleBack}
          />
          <View style={styles.badgeCount}>
            <MaterialCommunityIcons
              name="account-group"
              size={icon.sm}
              color={color.action}
            />
            <Text allowFontScaling style={styles.badgeText}>
              {`${state.teams.length}/6 equipes`}
            </Text>
          </View>
        </View>

        <Text allowFontScaling style={styles.title}>
          Configuração de Equipes
        </Text>
        <Text allowFontScaling style={styles.subtitle}>
          Cadastre de 2 a 6 equipes para iniciar a dinâmica de minigames no Pequeno Grupo.
        </Text>
      </View>

      <View style={styles.formCard}>
        <ExpressiveTextField
          label="Nome da Equipe"
          placeholder="Ex.: Tribo de Judá"
          value={state.newTeamName}
          onChangeText={actions.setNewTeamName}
          maxLength={20}
          errorText={state.errorMessage ?? undefined}
          helperText="Mínimo de 2 letras e máximo de 20 caracteres"
          icon="account-multiple-plus"
          disabled={state.teams.length >= 6}
        />

        <View style={styles.addButtonWrapper}>
          <ExpressiveButton
            label="Adicionar Equipe"
            variant="tonal"
            icon="plus"
            disabled={state.teams.length >= 6 || state.newTeamName.trim().length === 0}
            onPress={() => {
              void actions.handleAddTeam();
            }}
          />
        </View>
      </View>

      <View style={styles.listSection}>
        <Text allowFontScaling style={styles.sectionTitle}>
          Equipes Cadastradas
        </Text>

        {state.teams.length === 0 ? (
          <GameCard
            title="Nenhuma equipe cadastrada ainda"
            description="Adicione pelo menos 2 equipes acima para liberar o botão de iniciar rodada."
            playersTag="0 equipes"
            icon="account-group-outline"
          />
        ) : (
          state.teams.map((team: Team, index: number) => (
            <View key={team.id} style={styles.teamCard}>
              <View style={styles.teamInfo}>
                <View style={styles.avatarCircle}>
                  <Text allowFontScaling style={styles.avatarText}>
                    {index + 1}
                  </Text>
                </View>
                <View style={styles.teamTextWrapper}>
                  <Text allowFontScaling style={styles.teamName}>
                    {team.name}
                  </Text>
                  <Text allowFontScaling style={styles.teamScore}>
                    {`${team.score} pts acumulados`}
                  </Text>
                </View>
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Remover equipe ${team.name}`}
                style={({ pressed }) => [
                  styles.removeButton,
                  pressed && styles.removeButtonPressed,
                ]}
                onPress={() => {
                  void actions.handleRemoveTeam(team.id);
                }}
              >
                <MaterialCommunityIcons
                  name="trash-can-outline"
                  size={icon.md}
                  color={color.error}
                />
              </Pressable>
            </View>
          ))
        )}
      </View>

      <View style={styles.footerSection}>
        <ExpressiveButton
          label="Começar Rodada!"
          variant="primaryJumbo"
          icon="play"
          disabled={!state.canStartRound}
          onPress={actions.handleStartRound}
        />
        {!state.canStartRound && (
          <Text allowFontScaling style={styles.helperNotice}>
            Cadastre pelo menos 2 equipes para habilitar a partida.
          </Text>
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
    padding: space.md,
    paddingBottom: space.xxl,
    gap: space.md,
  },
  header: {
    gap: space.sm,
    paddingTop: space.sm,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: space.sm,
  },
  badgeCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    backgroundColor: color.actionContainer,
    paddingHorizontal: space.sm,
    paddingVertical: space.xs,
    borderRadius: radius.full,
  },
  badgeText: {
    fontSize: font.caption.size,
    fontFamily: font.caption.family,
    color: color.onActionContainer,
    fontWeight: font.caption.weight,
  },
  title: {
    fontSize: font.title.size,
    fontFamily: font.title.family,
    color: color.onSurface,
    fontWeight: font.title.weight,
  },
  subtitle: {
    fontSize: font.body.size,
    fontFamily: font.body.family,
    color: color.onSurfaceMuted,
    lineHeight: font.body.lineHeight,
  },
  formCard: {
    backgroundColor: color.surfaceContainer,
    padding: space.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: color.outline,
    gap: space.sm,
  },
  addButtonWrapper: {
    alignSelf: 'flex-end',
  },
  listSection: {
    gap: space.sm,
  },
  sectionTitle: {
    fontSize: font.subtitle.size,
    fontFamily: font.subtitle.family,
    color: color.onSurface,
    fontWeight: font.subtitle.weight,
  },
  teamCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: color.surfaceContainer,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.outline,
    padding: space.sm,
    minHeight: 56,
  },
  teamInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    flex: 1,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: color.actionContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: font.body.size,
    fontFamily: font.body.family,
    color: color.onActionContainer,
    fontWeight: '700',
  },
  teamTextWrapper: {
    flex: 1,
  },
  teamName: {
    fontSize: font.body.size,
    fontFamily: font.body.family,
    color: color.onSurface,
    fontWeight: '700',
  },
  teamScore: {
    fontSize: font.caption.size,
    fontFamily: font.caption.family,
    color: color.onSurfaceMuted,
  },
  removeButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
  },
  removeButtonPressed: {
    backgroundColor: color.errorContainer,
  },
  footerSection: {
    marginTop: space.md,
    gap: space.xs,
  },
  helperNotice: {
    fontSize: font.caption.size,
    fontFamily: font.caption.family,
    color: color.onSurfaceMuted,
    textAlign: 'center',
  },
});

export default TeamsScreen;
