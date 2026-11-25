import React, { useMemo } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { Team } from '@/model/entities/team';
import { AppHeader } from '@/view/components/appHeader';
import { ExpressiveButton } from '@/view/components/expressiveButton';
import { ExpressiveTag } from '@/view/components/expressiveTag';
import { ExpressiveTextField } from '@/view/components/expressiveTextField';
import { ShortNavigationBar } from '@/view/components/shortNavigationBar';
import { useTheme, type AppTokens } from '@/view/theme';
import { useTeamsViewModel } from '@/viewmodel/useTeamsViewModel';

export const TeamsScreen = () => {
  const [state, actions] = useTeamsViewModel();
  const activeTokens = useTheme();
  const styles = useMemo(() => createStyles(activeTokens), [activeTokens]);

  if (state.loading) {
    return (
      <View
        style={styles.centerScreen}
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
    <View style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.screen}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
          showsVerticalScrollIndicator={false}
        >
          <AppHeader />

          <View style={styles.header}>
            <Text allowFontScaling style={styles.title}>
              Equipes do Encontro
            </Text>
            <Text allowFontScaling style={styles.subtitle}>
              Cadastre de 2 a 6 equipes para pontuar nas dinâmicas.
            </Text>
          </View>

          <View style={styles.formCard}>
            <ExpressiveTextField
              label="Nome da Equipe"
              placeholder="Ex.: Tribo de Judá"
              value={state.newTeamName}
              onChangeText={actions.setNewTeamName}
              onSubmitEditing={() => {
                void actions.handleAddTeam();
              }}
              maxLength={20}
              errorText={state.errorMessage ?? undefined}
              helperText="Mínimo de 2 letras e máximo de 20 caracteres"
              icon="account-multiple-plus"
              disabled={state.teams.length >= 6}
            />

            <ExpressiveButton
              label="Adicionar Equipe"
              variant="tonal"
              icon="plus"
              disabled={
                state.teams.length >= 6 || state.newTeamName.trim().length === 0
              }
              onPress={() => {
                void actions.handleAddTeam();
              }}
            />
          </View>

          <View style={styles.listSection}>
            <View style={styles.listHeader}>
              <Text allowFontScaling style={styles.sectionTitle}>
                Equipes Cadastradas
              </Text>
              <ExpressiveTag
                label={`${state.teams.length}/6`}
                tone="action"
                accessibilityLabel={`${state.teams.length} de 6 equipes cadastradas`}
              />
            </View>

            {state.teams.length === 0 ? (
              <View
                style={styles.emptyCard}
                accessible
                accessibilityRole="summary"
                accessibilityLabel="Nenhuma equipe cadastrada ainda. Adicione pelo menos 2 equipes acima para liberar o botão de escolher jogo."
              >
                <MaterialCommunityIcons
                  name="account-group-outline"
                  size={activeTokens.semantic.icon.lg}
                  color={activeTokens.semantic.color.onSurfaceMuted}
                />
                <Text allowFontScaling style={styles.emptyTitle}>
                  Nenhuma equipe cadastrada ainda
                </Text>
                <Text allowFontScaling style={styles.emptyDescription}>
                  Adicione pelo menos 2 equipes acima para liberar a escolha de
                  jogos.
                </Text>
              </View>
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

                  <ExpressiveButton
                    variant="icon"
                    tone="danger"
                    icon="trash-can-outline"
                    accessibilityLabel={`Remover equipe ${team.name}`}
                    onPress={() => {
                      void actions.handleRemoveTeam(team.id);
                    }}
                  />
                </View>
              ))
            )}
          </View>

          <View style={styles.footerSection}>
            <ExpressiveButton
              label="Escolher Jogo"
              variant="primaryJumbo"
              icon="gamepad-variant"
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
      </KeyboardAvoidingView>

      <ShortNavigationBar
        activeKey="teams"
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
    centerScreen: {
      flex: 1,
      backgroundColor: color.surface,
      padding: space.lg,
      justifyContent: 'center',
      alignItems: 'center',
    },
    scrollContent: {
      paddingHorizontal: space.lg,
      paddingTop: space.md,
      paddingBottom: space.xl,
      gap: space.md,
    },
    header: {
      gap: space.xs,
    },
    title: {
      fontSize: font.title.size,
      fontFamily: font.title.family,
      color: color.onSurface,
      fontWeight: font.title.weight,
      lineHeight: font.title.lineHeight,
    },
    subtitle: {
      fontSize: font.body.size,
      fontFamily: font.body.family,
      fontWeight: font.body.weight,
      color: color.onSurfaceMuted,
      lineHeight: font.body.lineHeight,
    },
    formCard: {
      backgroundColor: activeTokens.component.card.bg,
      padding: space.md,
      borderRadius: radius.lg,
      borderWidth: border.thin,
      borderColor: activeTokens.component.card.border,
      gap: space.sm,
    },
    listSection: {
      gap: space.sm,
    },
    listHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: space.sm,
    },
    sectionTitle: {
      fontSize: font.subtitle.size,
      fontFamily: font.subtitle.family,
      color: color.onSurface,
      fontWeight: font.subtitle.weight,
      lineHeight: font.subtitle.lineHeight,
    },
    emptyCard: {
      alignItems: 'center',
      gap: space.sm,
      padding: space.lg,
      borderRadius: radius.xl,
      borderWidth: border.thin,
      borderStyle: 'dashed',
      borderColor: activeTokens.component.card.border,
    },
    emptyTitle: {
      fontSize: font.subtitle.size,
      fontFamily: font.subtitle.family,
      fontWeight: font.subtitle.weight,
      lineHeight: font.subtitle.lineHeight,
      color: color.onSurface,
      textAlign: 'center',
    },
    emptyDescription: {
      fontSize: font.body.size,
      fontFamily: font.body.family,
      fontWeight: font.body.weight,
      lineHeight: font.body.lineHeight,
      color: color.onSurfaceMuted,
      textAlign: 'center',
    },
    teamCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: activeTokens.component.card.bg,
      borderRadius: radius.md,
      borderWidth: border.thin,
      borderColor: activeTokens.component.card.border,
      padding: space.sm,
      minHeight: space.container,
    },
    teamInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.sm,
      flex: 1,
    },
    avatarCircle: {
      width: space.xl,
      height: space.xl,
      borderRadius: radius.full,
      backgroundColor: color.actionContainer,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      fontFamily: font.label.family,
      fontSize: font.label.size,
      fontWeight: font.label.weight,
      lineHeight: font.label.lineHeight,
      color: color.onActionContainer,
    },
    teamTextWrapper: {
      flex: 1,
    },
    teamName: {
      fontFamily: font.label.family,
      fontSize: font.label.size,
      fontWeight: font.label.weight,
      lineHeight: font.label.lineHeight,
      color: color.onSurface,
    },
    teamScore: {
      fontSize: font.caption.size,
      fontFamily: font.caption.family,
      fontWeight: font.caption.weight,
      color: color.onSurfaceMuted,
      lineHeight: font.caption.lineHeight,
    },
    footerSection: {
      marginTop: space.sm,
      gap: space.xs,
    },
    helperNotice: {
      fontSize: font.caption.size,
      fontFamily: font.caption.family,
      fontWeight: font.caption.weight,
      lineHeight: font.caption.lineHeight,
      color: color.onSurfaceMuted,
      textAlign: 'center',
    },
  });
};

export default TeamsScreen;
