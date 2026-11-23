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
import { ExpressiveButton } from '@/view/components/expressiveButton';
import { ExpressiveTag } from '@/view/components/expressiveTag';
import { ExpressiveTextField } from '@/view/components/expressiveTextField';
import { useTheme, type AppTokens } from '@/view/theme';
import { useTeamsViewModel } from '@/viewmodel/useTeamsViewModel';

export const TeamsScreen = () => {
  const [state, actions] = useTeamsViewModel();
  const activeTokens = useTheme();
  const styles = useMemo(() => createStyles(activeTokens), [activeTokens]);

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
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        <View style={styles.header}>
          <View style={styles.topBar}>
            <ExpressiveButton
              label="Voltar"
              variant="outlined"
              icon="arrow-left"
              onPress={actions.handleBack}
            />
            <ExpressiveTag
              label={`${state.teams.length}/6 equipes`}
              icon="account-group"
              tone="action"
            />
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
            onSubmitEditing={() => {
              void actions.handleAddTeam();
            }}
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
            <View
              style={styles.emptyCard}
              accessible
              accessibilityRole="summary"
              accessibilityLabel="Nenhuma equipe cadastrada ainda. Adicione pelo menos 2 equipes acima para liberar o botão de iniciar rodada."
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
                Adicione pelo menos 2 equipes acima para liberar o botão de iniciar rodada.
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
    </KeyboardAvoidingView>
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
      padding: space.md,
      paddingBottom: space['2xl'],
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
      marginTop: space.md,
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
