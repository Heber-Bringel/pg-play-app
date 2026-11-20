import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type {
  TermometroDurationMinutes,
  TermometroOrderMode,
  TermometroParticipantMode,
} from '@/model/entities/termometro';
import { ConfirmModal } from '@/view/components/confirmModal';
import { ExpressiveButton } from '@/view/components/expressiveButton';
import { ExpressiveChip } from '@/view/components/expressiveChip';
import { ExpressiveTextField } from '@/view/components/expressiveTextField';
import { ExpressiveTimer } from '@/view/components/expressiveTimer';
import { GameCard } from '@/view/components/gameCard';
import { border, color, font, radius, space } from '@/view/theme';
import { useTermometroViewModel } from '@/viewmodel/useTermometroViewModel';

const PARTICIPANT_MODES: { value: TermometroParticipantMode; label: string }[] = [
  { value: 'teams', label: 'Equipes cadastradas' },
  { value: 'custom', label: 'Lista de nomes' },
  { value: 'free', label: 'Modo livre (sem nomes)' },
];

const DURATION_OPTIONS: { value: TermometroDurationMinutes; label: string }[] = [
  { value: 1, label: '1 min' },
  { value: 2, label: '2 min' },
  { value: 3, label: '3 min' },
];

const ORDER_OPTIONS: { value: TermometroOrderMode; label: string }[] = [
  { value: 'list', label: 'Na ordem da lista' },
  { value: 'random', label: 'Ordem sorteada' },
];

export const TermometroScreen = () => {
  const [state, actions] = useTermometroViewModel();
  const [participantInput, setParticipantInput] = useState<string>('');

  if (state.loading) {
    return (
      <View
        style={styles.screen}
        accessibilityRole="progressbar"
        accessibilityLabel="Carregando Termômetro de Pedidos"
      >
        <Text allowFontScaling style={styles.titleText}>
          Preparando o Termômetro de Pedidos...
        </Text>
      </View>
    );
  }

  if (state.error) {
    return (
      <View style={styles.screen} accessibilityLiveRegion="assertive">
        <GameCard
          title="Atenção"
          description={state.error}
          playersTag="Aviso"
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

  const handleAddName = async () => {
    const added = await actions.handleAddCustomParticipant(participantInput);
    if (added) {
      setParticipantInput('');
    }
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.screen}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.topBar}>
        <ExpressiveButton
          label="Sair"
          variant="outlined"
          icon="arrow-left"
          onPress={actions.handleRequestExit}
        />
        <View style={styles.badgePill}>
          <Text allowFontScaling style={styles.badgeText}>
            1 Celular · Encerramento
          </Text>
        </View>
      </View>

      <ConfirmModal
        visible={state.confirmingExit}
        title="Deseja encerrar o Termômetro de Pedidos?"
        description="A lista temporária de participantes será descartada ao sair."
        onCancel={actions.handleCancelExit}
        onConfirm={() => {
          void actions.handleConfirmExit();
        }}
      />

      {state.stage === 'setup' && (
        <View style={styles.sectionStack}>
          <GameCard
            title="Momento de Pedidos"
            description={`Cada um tem até ${state.durationMinutes} minuto${
              state.durationMinutes > 1 ? 's' : ''
            } para compartilhar. Sem pontuação, sem registro e sem pressa.`}
            playersTag="1 Celular · Encerramento"
            icon="hand-heart"
          />

          <View style={styles.configCard}>
            <Text allowFontScaling style={styles.sectionTitle}>
              Quem participa
            </Text>
            <View style={styles.chipsWrap}>
              {PARTICIPANT_MODES.map((opt) => {
                const selected = state.participantMode === opt.value;
                return (
                  <ExpressiveChip
                    key={opt.value}
                    label={opt.label}
                    selected={selected}
                    icon={selected ? 'check' : undefined}
                    accessibilityLabel={`Modo ${opt.label}`}
                    onPress={() => {
                      void actions.handleSelectParticipantMode(opt.value);
                    }}
                  />
                );
              })}
            </View>

            {state.participantMode === 'custom' && (
              <View style={styles.customNamesBlock}>
                <ExpressiveTextField
                  label="Nome do participante"
                  placeholder="Ex.: Ana, Lucas..."
                  value={participantInput}
                  maxLength={24}
                  errorText={state.inputError ?? undefined}
                  onChangeText={setParticipantInput}
                />
                <ExpressiveButton
                  label="Adicionar Participante"
                  variant="tonal"
                  icon="account-plus"
                  onPress={() => {
                    void handleAddName();
                  }}
                />
              </View>
            )}

            {state.participantMode !== 'free' && (
              <View style={styles.participantsPreview}>
                <Text allowFontScaling style={styles.captionText}>
                  {`Participantes na roda (${state.participants.length}):`}
                </Text>
                {state.participants.length === 0 ? (
                  <Text allowFontScaling style={styles.captionText}>
                    Nenhum participante na lista ainda.
                  </Text>
                ) : (
                  <View style={styles.chipsWrap}>
                    {state.participants.map((name) => (
                      <ExpressiveChip
                        key={name}
                        label={name}
                        icon={
                          state.participantMode === 'custom' ? 'close' : 'account'
                        }
                        accessibilityLabel={
                          state.participantMode === 'custom'
                            ? `Remover ${name}`
                            : `Participante ${name}`
                        }
                        onPress={() => {
                          if (state.participantMode === 'custom') {
                            void actions.handleRemoveCustomParticipant(name);
                          }
                        }}
                      />
                    ))}
                  </View>
                )}
              </View>
            )}

            <Text allowFontScaling style={styles.sectionTitle}>
              Tempo de fala por pessoa
            </Text>
            <View style={styles.chipsWrap}>
              {DURATION_OPTIONS.map((opt) => {
                const selected = state.durationMinutes === opt.value;
                return (
                  <ExpressiveChip
                    key={opt.value}
                    label={opt.label}
                    selected={selected}
                    icon={selected ? 'check' : undefined}
                    accessibilityLabel={`Tempo ${opt.label}`}
                    onPress={() => {
                      void actions.handleSelectDuration(opt.value);
                    }}
                  />
                );
              })}
            </View>

            {state.participantMode !== 'free' && (
              <>
                <Text allowFontScaling style={styles.sectionTitle}>
                  Ordem da roda
                </Text>
                <View style={styles.chipsWrap}>
                  {ORDER_OPTIONS.map((opt) => {
                    const selected = state.orderMode === opt.value;
                    return (
                      <ExpressiveChip
                        key={opt.value}
                        label={opt.label}
                        selected={selected}
                        icon={selected ? 'check' : undefined}
                        accessibilityLabel={`Ordem ${opt.label}`}
                        onPress={() => {
                          void actions.handleSelectOrderMode(opt.value);
                        }}
                      />
                    );
                  })}
                </View>
              </>
            )}

            {state.inputError && state.participantMode !== 'custom' && (
              <View style={styles.warningBanner} accessibilityLiveRegion="assertive">
                <Text allowFontScaling style={styles.warningText}>
                  {state.inputError}
                </Text>
              </View>
            )}
          </View>

          <ExpressiveButton
            label="Começar"
            variant="primaryJumbo"
            icon="play"
            onPress={() => {
              void actions.handleStartMoment();
            }}
          />
        </View>
      )}

      {state.stage === 'turn' && (
        <View style={styles.sectionStack}>
          <GameCard
            title={
              state.participantMode === 'free'
                ? 'Próxima pessoa'
                : `Vez de ${state.currentSpeakerLabel}`
            }
            description={
              state.hasStartedSpeaking
                ? state.secondsRemaining === 0
                  ? 'Tempo concluído. Conclua seu pensamento com tranquilidade e toque em Próximo.'
                  : 'Compartilhe seu pedido de oração com o grupo.'
                : 'Toque em "Começar a falar" quando estiver pronto para iniciar o termômetro.'
            }
            playersTag={
              state.participantMode === 'free'
                ? `Pessoa ${state.currentIndex + 1}`
                : `${state.currentIndex + 1} de ${state.participants.length}`
            }
            icon="account-heart"
          />

          <ExpressiveTimer
            variant="thermometer"
            totalSeconds={state.durationSeconds}
            secondsRemaining={state.secondsRemaining}
            paused={state.isPaused}
          />

          <View style={styles.actionGroup}>
            {!state.hasStartedSpeaking ? (
              <ExpressiveButton
                label="Começar a falar"
                variant="primaryJumbo"
                icon="microphone-message"
                onPress={() => {
                  void actions.handleStartSpeaking();
                }}
              />
            ) : (
              <>
                <ExpressiveButton
                  label="Próximo"
                  variant="primaryJumbo"
                  icon="arrow-right"
                  onPress={() => {
                    void actions.handleNextSpeaker();
                  }}
                />
                <ExpressiveButton
                  label={state.isPaused ? 'Continuar' : 'Pausar'}
                  variant="tonal"
                  icon={state.isPaused ? 'play' : 'pause'}
                  onPress={() => {
                    void actions.handleTogglePause();
                  }}
                />
              </>
            )}

            <ExpressiveButton
              label="Pular minha vez"
              variant="secondary"
              icon="skip-next"
              onPress={() => {
                void actions.handleSkipSpeaker();
              }}
            />

            {state.participantMode === 'free' && (
              <ExpressiveButton
                label="Concluir Roda de Pedidos"
                variant="outlined"
                icon="check-all"
                onPress={() => {
                  void actions.handleFinishFreeMode();
                }}
              />
            )}
          </View>
        </View>
      )}

      {state.stage === 'summary' && (
        <View style={styles.sectionStack} accessibilityLiveRegion="polite">
          <GameCard
            title="Todos compartilharam"
            description={`Pessoas que compartilharam: ${state.sharedCount} · Preferiram não falar: ${state.skippedCount}. Nenhum pedido ou nome fica registrado.`}
            playersTag={`${state.sharedCount + state.skippedCount} participantes`}
            icon="heart-multiple"
          />

          <View style={styles.actionGroup}>
            <ExpressiveButton
              label="Momento de Oração"
              variant="primaryJumbo"
              icon="hands-pray"
              onPress={() => {
                void actions.handleOpenPrayerMoment();
              }}
            />
            <ExpressiveButton
              label="Encerrar Encontro"
              variant="outlined"
              icon="home"
              onPress={() => {
                void actions.handleEndEncounter();
              }}
            />
          </View>
        </View>
      )}

      {state.stage === 'prayer' && (
        <View style={styles.sectionStack} accessibilityLiveRegion="polite">
          <GameCard
            title="Momento de Oração"
            description="Reúnam o grupo em oração pelos pedidos compartilhados hoje. Não há cronômetro nesta etapa."
            playersTag="Sem tempo · Comunhão"
            icon="hands-pray"
          />

          <ExpressiveButton
            label="Encerrar Encontro"
            variant="primaryJumbo"
            icon="check-circle"
            onPress={() => {
              void actions.handleEndEncounter();
            }}
          />
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: color.surface,
  },
  screen: {
    flexGrow: 1,
    backgroundColor: color.surface,
    padding: space.md,
    gap: space.md,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: space.sm,
  },
  badgePill: {
    backgroundColor: color.surfaceVariant,
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
    borderRadius: radius.full,
  },
  badgeText: {
    fontFamily: font.caption.family,
    fontSize: font.caption.size,
    fontWeight: font.caption.weight,
    lineHeight: font.caption.lineHeight,
    color: color.onSurface,
  },
  sectionStack: {
    flex: 1,
    gap: space.md,
  },
  configCard: {
    backgroundColor: color.surfaceContainer,
    borderColor: color.outline,
    borderWidth: border.thin,
    borderRadius: radius.lg,
    padding: space.md,
    gap: space.sm,
  },
  sectionTitle: {
    fontFamily: font.subtitle.family,
    fontSize: font.subtitle.size,
    fontWeight: font.subtitle.weight,
    lineHeight: font.subtitle.lineHeight,
    color: color.onSurface,
  },
  captionText: {
    fontFamily: font.caption.family,
    fontSize: font.caption.size,
    fontWeight: font.caption.weight,
    lineHeight: font.caption.lineHeight,
    color: color.onSurfaceMuted,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
  },
  customNamesBlock: {
    gap: space.sm,
  },
  participantsPreview: {
    gap: space.xs,
    paddingVertical: space.xs,
  },
  warningBanner: {
    backgroundColor: color.errorContainer,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
  warningText: {
    fontFamily: font.caption.family,
    fontSize: font.caption.size,
    fontWeight: font.caption.weight,
    lineHeight: font.caption.lineHeight,
    color: color.onErrorContainer,
  },
  actionGroup: {
    gap: space.sm,
  },
  titleText: {
    fontFamily: font.title.family,
    fontSize: font.title.size,
    fontWeight: font.title.weight,
    lineHeight: font.title.lineHeight,
    color: color.onSurface,
    textAlign: 'center',
  },
});

export default TermometroScreen;
