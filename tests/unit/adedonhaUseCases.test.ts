import { MemoryMultiplayerRoomService } from '@/infra/services/memoryMultiplayerRoomService';
import { SupabaseMultiplayerRoomService } from '@/infra/services/supabaseMultiplayerRoomService';
import { AuthError, DataSourceError, ValidationError } from '@/model/errors';
import { AdedonhaUseCases } from '@/usecase/adedonhaUseCases';

describe('AdedonhaUseCases — Regras de Negócio da Adedonha Bíblica (UC08)', () => {
  it('deve carregar a sala padrão, sugerir colunas bíblicas e permitir adicionar/remover colunas (RF21)', async () => {
    const roomService = new MemoryMultiplayerRoomService();
    const useCases = new AdedonhaUseCases(roomService);

    expect(useCases.getSuggestedColumns().length).toBeGreaterThanOrEqual(5);

    const initialRoom = await useCases.getRoom();
    expect(initialRoom.code).toBe('PG2026');
    expect(initialRoom.config.columns).toHaveLength(3);

    const withAdded = await useCases.addColumn(
      initialRoom.id,
      'Milagre ou Parábola'
    );
    expect(withAdded.config.columns).toContain('Milagre ou Parábola');

    const afterRemove = await useCases.removeColumn(
      initialRoom.id,
      'Milagre ou Parábola'
    );
    expect(afterRemove.config.columns).toHaveLength(3);
  });

  it('deve lançar ValidationError ao adicionar coluna curta, duplicada ou remover a última coluna (RF21)', async () => {
    const roomService = new MemoryMultiplayerRoomService();
    const useCases = new AdedonhaUseCases(roomService);
    const room = await useCases.getRoom();

    await expect(useCases.addColumn(room.id, 'A')).rejects.toThrow(
      ValidationError
    );
    await expect(
      useCases.addColumn(room.id, 'personagem biblico')
    ).rejects.toThrow(ValidationError);

    await useCases.removeColumn(room.id, 'Livro da Bíblia');
    await useCases.removeColumn(room.id, 'Cidade, Monte ou Rio Bíblico');
    await expect(
      useCases.removeColumn(room.id, 'Personagem Bíblico')
    ).rejects.toThrow(ValidationError);
  });

  it('deve sortear letra na Roleta Expressiva sem repetir letras usadas e filtrando K, W, Y (RF21)', async () => {
    const roomService = new MemoryMultiplayerRoomService();
    const useCases = new AdedonhaUseCases(roomService);
    const room = await useCases.getRoom();

    const available = useCases.getAvailableLetters(room);
    expect(available).not.toContain('K');
    expect(available).not.toContain('W');
    expect(available).not.toContain('Y');

    const spunRoom = await useCases.spinRoulette(room.id, 'D');
    expect(spunRoom.currentLetter).toBe('D');
    expect(spunRoom.phase).toBe('filling');
    expect(spunRoom.usedLetters).toContain('D');

    await expect(useCases.spinRoulette(room.id, 'D')).rejects.toThrow(
      ValidationError
    );
    await expect(useCases.spinRoulette(room.id, 'K')).rejects.toThrow(
      ValidationError
    );
  });

  it('deve validar instantaneamente a letra inicial ignorando acentos e habilitar o botão ADEDONHA! (RF22)', () => {
    const roomService = new MemoryMultiplayerRoomService();
    const useCases = new AdedonhaUseCases(roomService);

    expect(useCases.validateAnswerInitial('Davi', 'D')).toBeNull();
    expect(useCases.validateAnswerInitial('Áquila', 'A')).toBeNull();
    expect(useCases.validateAnswerInitial('Moisés', 'D')).toBe(
      'A resposta deve começar com a letra D'
    );

    const columns = ['Personagem Bíblico', 'Livro da Bíblia'];
    expect(
      useCases.canTriggerStop(
        columns,
        { 'Personagem Bíblico': 'Davi', 'Livro da Bíblia': '' },
        'D'
      )
    ).toBe(false);

    expect(
      useCases.canTriggerStop(
        columns,
        { 'Personagem Bíblico': 'Davi', 'Livro da Bíblia': 'Daniel' },
        'D'
      )
    ).toBe(true);
  });

  it('deve acionar ADEDONHA!, pré-classificar respostas (+10 única, +5 repetida), levantar dúvida e julgar pelo Moderador (RF22, RF23)', async () => {
    const roomService = new MemoryMultiplayerRoomService();
    const useCases = new AdedonhaUseCases(roomService);
    const room = await useCases.getRoom();

    await useCases.spinRoulette(room.id, 'D');

    await expect(
      useCases.triggerAdedonha(room.id, 'player-host', {
        'Personagem Bíblico': 'Davi',
        'Livro da Bíblia': 'Malaquias',
        'Cidade, Monte ou Rio Bíblico': 'Damasco',
      })
    ).rejects.toThrow(ValidationError);

    const tallyRoom = await useCases.triggerAdedonha(room.id, 'player-host', {
      'Personagem Bíblico': 'Débora',
      'Livro da Bíblia': 'Daniel',
      'Cidade, Monte ou Rio Bíblico': 'Damasco',
    });

    expect(tallyRoom.phase).toBe('tally');
    expect(tallyRoom.stopTriggeredBy).toBe('Líder do PG');

    const deboraSub = tallyRoom.submissions.find(
      (s) => s.playerId === 'player-host' && s.columnName === 'Personagem Bíblico'
    );
    expect(deboraSub?.status).toBe('unique');
    expect(deboraSub?.points).toBe(10);

    const danielBookSub = tallyRoom.submissions.find(
      (s) => s.playerId === 'player-host' && s.columnName === 'Livro da Bíblia'
    );
    expect(danielBookSub?.status).toBe('repeated');
    expect(danielBookSub?.points).toBe(5);

    const afterDoubt = await useCases.raiseDoubt(room.id, deboraSub!.id);
    const doubted = afterDoubt.submissions.find((s) => s.id === deboraSub!.id);
    expect(doubted?.doubtCount).toBe(1);

    const afterJudge = await useCases.judgeSubmission(
      room.id,
      deboraSub!.id,
      'invalid'
    );
    const invalidated = afterJudge.submissions.find(
      (s) => s.id === deboraSub!.id
    );
    expect(invalidated?.status).toBe('invalid');
    expect(invalidated?.points).toBe(0);

    const nextCol1 = await useCases.advanceTallyColumn(room.id);
    expect(nextCol1.currentTallyColumnIndex).toBe(1);

    const nextCol2 = await useCases.advanceTallyColumn(room.id);
    expect(nextCol2.currentTallyColumnIndex).toBe(2);

    const summaryRoom = await useCases.advanceTallyColumn(room.id);
    expect(summaryRoom.phase).toBe('round_summary');

    const awards = useCases.getAwards(summaryRoom);
    expect(awards.generalChampion).not.toBeNull();
    expect(awards.fastestHand?.nickname).toBe('Líder do PG');

    const nextRoundRoom = await useCases.advanceToNextRound(room.id);
    expect(nextRoundRoom.currentRound).toBe(2);
    expect(nextRoundRoom.phase).toBe('lobby');
  });

  it('deve criar/entrar em sala, encerrar por tempo esgotado e validar erros do SupabaseMultiplayerRoomService', async () => {
    const roomService = new MemoryMultiplayerRoomService();
    const useCases = new AdedonhaUseCases(roomService);

    await expect(useCases.createRoom('A')).rejects.toThrow(ValidationError);
    const created = await useCases.createRoom('Moderador PG');
    expect(created.players[0].nickname).toBe('Moderador PG');

    await expect(useCases.joinRoom('12', 'João')).rejects.toThrow(
      ValidationError
    );
    const joined = await useCases.joinRoom(created.code, 'Rebeca');
    expect(joined.players.some((p) => p.nickname === 'Rebeca')).toBe(true);

    await useCases.spinRoulette(created.id);
    const timedOut = await useCases.finishRoundByTimeOut(
      created.id,
      'player-host',
      {}
    );
    expect(timedOut.phase).toBe('tally');

    const unconfiguredSupabase = new SupabaseMultiplayerRoomService({
      supabaseUrl: '',
      supabaseAnonKey: '',
    });
    await expect(unconfiguredSupabase.getAdedonhaRoom()).rejects.toThrow(
      AuthError
    );

    const configuredWithoutTransport = new SupabaseMultiplayerRoomService({
      supabaseUrl: 'https://example.supabase.co',
      supabaseAnonKey: 'anon-key',
    });
    await expect(configuredWithoutTransport.getAdedonhaRoom()).rejects.toThrow(
      DataSourceError
    );

    const configuredWithTransport = new SupabaseMultiplayerRoomService(
      {
        supabaseUrl: 'https://example.supabase.co',
        supabaseAnonKey: 'anon-key',
      },
      roomService
    );
    const synced = await configuredWithTransport.getAdedonhaRoom(created.id);
    expect(synced.id).toBe(created.id);
  });
});
