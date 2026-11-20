import { MemoryTeamDataSource } from '@/infra/datasources/memoryTeamDataSource';
import { ValidationError } from '@/model/errors';
import { TermometroUseCases } from '@/usecase/termometroUseCases';

describe('TermometroUseCases — Regras de Negócio do Termômetro de Pedidos (UC11)', () => {
  it('deve iniciar na fase setup com equipes sugeridas, 1 minuto e ordem da lista (RF38)', async () => {
    const teamDs = new MemoryTeamDataSource();
    const useCases = new TermometroUseCases(teamDs);

    const session = await useCases.getSession();

    expect(session.stage).toBe('setup');
    expect(session.participantMode).toBe('teams');
    expect(session.durationMinutes).toBe(1);
    expect(session.durationSeconds).toBe(60);
    expect(session.orderMode).toBe('list');
    expect(session.participants).toEqual(['Tribo de Judá', 'Leões da Fé']);
  });

  it('deve configurar tempo (1, 2, 3 min), ordem (list, random) e nomes digitados (custom) (RF38)', async () => {
    const teamDs = new MemoryTeamDataSource();
    const useCases = new TermometroUseCases(teamDs, () => 0);

    await useCases.setDurationMinutes(2);
    await useCases.setOrderMode('random');
    await useCases.setParticipantMode('custom');
    await useCases.addCustomParticipant('Ana');
    await useCases.addCustomParticipant('Lucas');
    await useCases.addCustomParticipant('Pedro');

    let session = await useCases.removeCustomParticipant('Lucas');
    expect(session.participants).toEqual(['Ana', 'Pedro']);
    expect(session.durationMinutes).toBe(2);
    expect(session.durationSeconds).toBe(120);

    session = await useCases.startMoment();
    expect(session.stage).toBe('turn');
    expect(session.participants).toHaveLength(2);
    expect(session.hasStartedSpeaking).toBe(false);
    expect(session.secondsRemaining).toBe(120);
  });

  it('deve lançar ValidationError para parâmetros inválidos ou lista vazia (RF38)', async () => {
    const teamDs = new MemoryTeamDataSource([]);
    const useCases = new TermometroUseCases(teamDs);

    await expect(
      useCases.setParticipantMode('invalido' as never)
    ).rejects.toThrow(ValidationError);

    await expect(useCases.setDurationMinutes(5 as never)).rejects.toThrow(
      ValidationError
    );

    await expect(useCases.setOrderMode('invalida' as never)).rejects.toThrow(
      ValidationError
    );

    await expect(useCases.addCustomParticipant('A')).rejects.toThrow(
      ValidationError
    );

    await expect(
      useCases.addCustomParticipant('Nome Muito Longo Demais Para O Campo')
    ).rejects.toThrow(ValidationError);

    await useCases.addCustomParticipant('Mateus');
    await expect(useCases.addCustomParticipant('mateus')).rejects.toThrow(
      ValidationError
    );

    await expect(useCases.removeCustomParticipant('   ')).rejects.toThrow(
      ValidationError
    );

    await useCases.removeCustomParticipant('Mateus');
    await expect(useCases.startMoment()).rejects.toThrow(ValidationError);
  });

  it('só deve contar o tempo após startSpeaking e não deve cortar a fala quando o tempo chegar a 00:00 (RF39)', async () => {
    const teamDs = new MemoryTeamDataSource([
      { id: 't1', name: 'Ana', score: 50 },
      { id: 't2', name: 'Bruno', score: 30 },
    ]);
    const useCases = new TermometroUseCases(teamDs);

    await useCases.startMoment();

    // Antes de tocar em "Começar a falar", tickSecond não altera o tempo
    let session = await useCases.tickSecond();
    expect(session.secondsRemaining).toBe(60);
    expect(session.hasStartedSpeaking).toBe(false);

    // Não permite pausar antes de iniciar a fala
    await expect(useCases.togglePause()).rejects.toThrow(ValidationError);

    session = await useCases.startSpeaking();
    expect(session.hasStartedSpeaking).toBe(true);

    // Pausar congela a contagem
    session = await useCases.togglePause();
    expect(session.isPaused).toBe(true);
    session = await useCases.tickSecond();
    expect(session.secondsRemaining).toBe(60);

    // Continuar retoma a contagem
    session = await useCases.togglePause();
    expect(session.isPaused).toBe(false);

    for (let i = 0; i < 65; i += 1) {
      session = await useCases.tickSecond();
    }

    // Fim do tempo: fica em 0s, continua na vez de Ana e não avança sozinho
    expect(session.secondsRemaining).toBe(0);
    expect(session.stage).toBe('turn');
    expect(session.currentSpeakerLabel).toBe('Ana');
  });

  it('deve permitir avançar (Próximo), pular a vez, exibir resumo anônimo sem nomes, abrir Momento de Oração e encerrar sem alterar o placar (RF39, RF40, RNF12)', async () => {
    const teamDs = new MemoryTeamDataSource([
      { id: 't1', name: 'Ana', score: 50 },
      { id: 't2', name: 'Bruno', score: 30 },
    ]);
    const useCases = new TermometroUseCases(teamDs);

    await useCases.startMoment();
    await useCases.startSpeaking();

    // Ana compartilha e toca em "Próximo"
    let session = await useCases.nextSpeaker();
    expect(session.stage).toBe('turn');
    expect(session.currentSpeakerLabel).toBe('Bruno');
    expect(session.sharedCount).toBe(1);
    expect(session.skippedCount).toBe(0);

    // Bruno prefere não falar e toca em "Pular minha vez"
    session = await useCases.skipSpeaker();
    expect(session.stage).toBe('summary');
    expect(session.sharedCount).toBe(1);
    expect(session.skippedCount).toBe(1);
    // RNF12: nomes descartados ao entrar no resumo
    expect(session.participants).toEqual([]);
    expect(session.currentSpeakerLabel).toBe('');

    const summary = await useCases.getAnonymousSummary();
    expect(summary).toEqual({
      sharedCount: 1,
      skippedCount: 1,
      totalParticipants: 2,
    });

    // Abrir Momento de Oração (sem cronômetro)
    session = await useCases.openPrayerMoment();
    expect(session.stage).toBe('prayer');
    expect(session.participants).toEqual([]);

    // Encerrar Encontro descarta estado e não altera o placar
    session = await useCases.endSession();
    expect(session.stage).toBe('setup');
    expect(session.sharedCount).toBe(0);
    expect(session.skippedCount).toBe(0);

    const teamsAfter = await teamDs.listTeams();
    expect(teamsAfter).toEqual([
      { id: 't1', name: 'Ana', score: 50 },
      { id: 't2', name: 'Bruno', score: 30 },
    ]);
  });

  it('deve suportar o modo livre sem nomes e encerramento manual para o resumo anônimo (RF38, RF39)', async () => {
    const teamDs = new MemoryTeamDataSource();
    const useCases = new TermometroUseCases(teamDs);

    await useCases.setParticipantMode('free');
    let session = await useCases.startMoment();
    expect(session.stage).toBe('turn');
    expect(session.currentSpeakerLabel).toBe('Próxima pessoa');
    expect(session.participants).toEqual([]);

    await useCases.nextSpeaker();
    await useCases.skipSpeaker();
    session = await useCases.finishFreeMode();

    expect(session.stage).toBe('summary');
    expect(session.sharedCount).toBe(1);
    expect(session.skippedCount).toBe(1);
  });
});
