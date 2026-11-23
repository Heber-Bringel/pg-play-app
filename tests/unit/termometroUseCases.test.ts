import { MemoryTeamDataSource } from '@/infra/datasources/memoryTeamDataSource';
import { ValidationError } from '@/model/errors';
import { TermometroUseCases } from '@/usecase/termometroUseCases';

describe('TermometroUseCases — Regras de Negócio do Termômetro de Pedidos (UC11)', () => {
  it('deve iniciar na fase setup com modo padrão custom (pessoas, não equipes), 1 minuto e ordem da lista (RF38, Issue #48)', async () => {
    const useCases = new TermometroUseCases();

    const session = await useCases.getSession();

    expect(session.stage).toBe('setup');
    expect(session.participantMode).toBe('custom');
    expect(session.durationMinutes).toBe(1);
    expect(session.durationSeconds).toBe(60);
    expect(session.orderMode).toBe('list');
    expect(session.participants).toEqual([]);
  });

  it('deve configurar tempo (1, 2, 3 min), ordem (list, random) e nomes digitados (custom) (RF38)', async () => {
    const useCases = new TermometroUseCases(() => 0);

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

    // Issue #73: impedir adição ou remoção de participantes quando stage !== 'setup'
    await expect(useCases.addCustomParticipant('Carlos')).rejects.toThrow(
      ValidationError
    );
    await expect(useCases.removeCustomParticipant('Ana')).rejects.toThrow(
      ValidationError
    );
  });

  it('deve lançar ValidationError para parâmetros inválidos ou lista vazia (RF38, Issue #48)', async () => {
    const useCases = new TermometroUseCases();

    await expect(
      useCases.setParticipantMode('teams' as never)
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

  it('só deve contar o tempo após startSpeaking, não deve permitir pular após iniciar fala e não deve cortar a fala em 00:00 (RF39, Issues #49 e #51)', async () => {
    const useCases = new TermometroUseCases();
    await useCases.addCustomParticipant('Ana');
    await useCases.addCustomParticipant('Bruno');
    await useCases.startMoment();

    // Antes de tocar em "Começar a falar", tickSecond não altera o tempo
    let session = await useCases.tickSecond();
    expect(session.secondsRemaining).toBe(60);
    expect(session.hasStartedSpeaking).toBe(false);

    // Não permite pausar antes de iniciar a fala
    await expect(useCases.togglePause()).rejects.toThrow(ValidationError);

    session = await useCases.startSpeaking();
    expect(session.hasStartedSpeaking).toBe(true);

    // Issue #49: quem já começou a falar não pode acionar skipSpeaker
    await expect(useCases.skipSpeaker()).rejects.toThrow(ValidationError);

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

    // Issue #51: não permite pausar quando o tempo já está concluído (00:00)
    await expect(useCases.togglePause()).rejects.toThrow(ValidationError);
  });

  it('deve diferenciar título do resumo (Todos compartilharam vs Roda de pedidos concluída), descartar nomes ao encerrar e preservar o placar (RF39, RF40, RNF12, Issues #49 e #54)', async () => {
    const teamDs = new MemoryTeamDataSource([
      { id: 't1', name: 'Equipe A', score: 50 },
      { id: 't2', name: 'Equipe B', score: 30 },
    ]);
    const useCases = new TermometroUseCases();

    await useCases.addCustomParticipant('Ana');
    await useCases.addCustomParticipant('Bruno');
    await useCases.startMoment();
    await useCases.startSpeaking();

    // Ana compartilha e toca em "Próximo"
    let session = await useCases.nextSpeaker();
    expect(session.stage).toBe('turn');
    expect(session.currentSpeakerLabel).toBe('Bruno');
    expect(session.sharedCount).toBe(1);
    expect(session.skippedCount).toBe(0);

    // Bruno prefere não falar (antes de Começar a falar) e toca em "Pular minha vez"
    session = await useCases.skipSpeaker();
    expect(session.stage).toBe('summary');
    expect(session.sharedCount).toBe(1);
    expect(session.skippedCount).toBe(1);
    // Issue #49: com 1 pulo, o título não contradiz os números
    expect(session.summaryTitle).toBe('Roda de pedidos concluída');
    // RNF12: nomes descartados ao entrar no resumo
    expect(session.participants).toEqual([]);
    expect(session.currentSpeakerLabel).toBe('');

    const summary = await useCases.getAnonymousSummary();
    expect(summary).toEqual({
      title: 'Roda de pedidos concluída',
      sharedCount: 1,
      skippedCount: 1,
      totalParticipants: 2,
    });

    // Abrir Momento de Oração (sem cronômetro)
    session = await useCases.openPrayerMoment();
    expect(session.stage).toBe('prayer');
    expect(session.participants).toEqual([]);

    // Issue #54: closeEncounter descarta nomes e transita para 'closed'
    session = await useCases.closeEncounter();
    expect(session.stage).toBe('closed');
    expect(session.participants).toEqual([]);

    // Encerrar sessão limpa tudo e não altera o placar
    session = await useCases.endSession();
    expect(session.stage).toBe('setup');
    expect(session.sharedCount).toBe(0);
    expect(session.skippedCount).toBe(0);

    const teamsAfter = await teamDs.listTeams();
    expect(teamsAfter).toEqual([
      { id: 't1', name: 'Equipe A', score: 50 },
      { id: 't2', name: 'Equipe B', score: 30 },
    ]);
  });

  it('deve exibir título Todos compartilharam quando todos falarem e nenhum pular (Issue #49)', async () => {
    const useCases = new TermometroUseCases();
    await useCases.addCustomParticipant('Ana');
    await useCases.startMoment();
    await useCases.startSpeaking();
    const session = await useCases.nextSpeaker();

    expect(session.stage).toBe('summary');
    expect(session.sharedCount).toBe(1);
    expect(session.skippedCount).toBe(0);
    expect(session.summaryTitle).toBe('Todos compartilharam');
  });

  it('deve suportar o modo livre sem pular vez e contabilizar quem estava falando ao concluir a roda (RF38, RF39, Issues #49 e #51)', async () => {
    const useCases = new TermometroUseCases();

    await useCases.setParticipantMode('free');
    let session = await useCases.startMoment();
    expect(session.stage).toBe('turn');
    expect(session.currentSpeakerLabel).toBe('Próxima pessoa');
    expect(session.participants).toEqual([]);

    // Issue #51: no modo livre não existe skipSpeaker
    await expect(useCases.skipSpeaker()).rejects.toThrow(ValidationError);

    // Pessoa 1 começa a falar e toca em Próximo (sharedCount = 1)
    await useCases.startSpeaking();
    await useCases.nextSpeaker();

    // Pessoa 2 começa a falar e o Líder toca em "Encerrar roda" (finishFreeMode) -> deve contar Pessoa 2 (sharedCount = 2)
    await useCases.startSpeaking();
    session = await useCases.finishFreeMode();

    expect(session.stage).toBe('summary');
    expect(session.sharedCount).toBe(2);
    expect(session.skippedCount).toBe(0);
    expect(session.summaryTitle).toBe('Todos compartilharam');
  });
});
