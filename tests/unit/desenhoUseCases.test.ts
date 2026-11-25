import { MemoryGameCatalogDataSource } from '@/infra/datasources/memoryGameCatalogDataSource';
import { MemoryMultiplayerRoomService } from '@/infra/services/memoryMultiplayerRoomService';
import { ValidationError } from '@/model/errors';
import {
  DesenhoUseCases,
  normalizeDesenhoGuessText,
} from '@/usecase/desenhoUseCases';

describe('DesenhoUseCases — Sala Multiplayer, Formas Geométricas e Palpites (UC12)', () => {
  const buildSut = () => {
    const roomService = new MemoryMultiplayerRoomService();
    const catalog = new MemoryGameCatalogDataSource();
    const useCases = new DesenhoUseCases(roomService, catalog);
    return { roomService, catalog, useCases };
  };

  it('deve criar sala, permitir entrada via PIN e validar apelido/código/mínimo de jogadores (RF44)', async () => {
    const { useCases } = buildSut();

    await expect(useCases.createRoom('A')).rejects.toThrow(ValidationError);
    await expect(useCases.joinRoom('12', 'Ana')).rejects.toThrow(ValidationError);

    const room = await useCases.createRoom('Roger');
    expect(room.phase).toBe('lobby');
    expect(room.players).toHaveLength(1);
    expect(room.config.turnDurationSeconds).toBe(90);
    expect(room.config.totalRounds).toBe(2);

    // Mínimo de 2 jogadores para começar
    await expect(useCases.startMatch(room.id)).rejects.toThrow(ValidationError);

    const afterJoin = await useCases.joinRoom(room.code, 'Ana');
    expect(afterJoin.players).toHaveLength(2);
    expect(afterJoin.players[1].nickname).toBe('Ana');
  });

  it('deve atualizar parâmetros da sala e bloquear categorias vazias ou valores inválidos (RF44)', async () => {
    const { useCases } = buildSut();
    const room = await useCases.createRoom('Líder');

    const updated = await useCases.updateConfig(room.id, {
      turnDurationSeconds: 120,
      totalRounds: 4,
      categories: ['Bíblico', 'Animais'],
    });
    expect(updated.config.turnDurationSeconds).toBe(120);
    expect(updated.config.totalRounds).toBe(4);
    expect(updated.config.categories).toEqual(['Bíblico', 'Animais']);

    await expect(
      useCases.updateConfig(room.id, { categories: [] })
    ).rejects.toThrow(ValidationError);
    await expect(
      useCases.updateConfig(room.id, { totalRounds: 0 })
    ).rejects.toThrow(ValidationError);
    await expect(
      useCases.updateConfig(room.id, {
        turnDurationSeconds: 45 as 60,
      })
    ).rejects.toThrow(ValidationError);
  });

  it('deve isolar a palavra secreta apenas para o Desenhista durante o turno (RNF11)', async () => {
    const { useCases } = buildSut();
    const room = await useCases.createRoom('Roger');
    const afterJoin = await useCases.joinRoom(room.code, 'Ana');
    const drawerId = afterJoin.players[0].id;
    const guesserId = afterJoin.players[1].id;

    await useCases.startMatch(room.id);

    const drawerView = await useCases.getRoom(room.id, drawerId);
    const guesserView = await useCases.getRoom(room.id, guesserId);

    expect(drawerView.phase).toBe('drawing');
    expect(drawerView.currentSecretWord).toBeTruthy();
    expect(guesserView.currentSecretWord).toBeNull();
    expect(guesserView.currentCardCategory).toBe(drawerView.currentCardCategory);
  });

  it('deve adicionar traço livre e 4 formas geométricas (contorno e preenchido), desfazer e limpar (RF41)', async () => {
    const { useCases } = buildSut();
    const room = await useCases.createRoom('Roger');
    const afterJoin = await useCases.joinRoom(room.code, 'Ana');
    const drawerId = afterJoin.players[0].id;
    const guesserId = afterJoin.players[1].id;

    await useCases.startMatch(room.id);

    // Pincel livre
    await useCases.addElement(room.id, drawerId, {
      tool: 'freehand',
      points: [
        { x: 10, y: 10 },
        { x: 30, y: 40 },
      ],
      colorId: 'ink',
      widthId: 'thin',
    });

    // Linha (sempre força stroke mesmo se fill vier)
    const afterLine = await useCases.addElement(room.id, drawerId, {
      tool: 'line',
      start: { x: 5, y: 5 },
      end: { x: 80, y: 80 },
      fillMode: 'fill',
      colorId: 'purple',
      widthId: 'thick',
    });
    expect(afterLine.elements[1]).toMatchObject({
      tool: 'line',
      fillMode: 'stroke',
    });

    // Retângulo preenchido
    await useCases.addElement(room.id, drawerId, {
      tool: 'rectangle',
      start: { x: 10, y: 10 },
      end: { x: 90, y: 70 },
      fillMode: 'fill',
      colorId: 'coral',
      widthId: 'thin',
    });

    // Círculo contorno
    await useCases.addElement(room.id, drawerId, {
      tool: 'circle',
      start: { x: 20, y: 20 },
      end: { x: 100, y: 100 },
      fillMode: 'stroke',
      colorId: 'green',
      widthId: 'thick',
    });

    // Triângulo preenchido
    const afterTriangle = await useCases.addElement(room.id, drawerId, {
      tool: 'triangle',
      start: { x: 15, y: 15 },
      end: { x: 120, y: 120 },
      fillMode: 'fill',
      colorId: 'purple',
      widthId: 'thin',
    });
    expect(afterTriangle.elements).toHaveLength(5);

    // Adivinhador não pode desenhar
    await expect(
      useCases.addElement(room.id, guesserId, {
        tool: 'freehand',
        points: [{ x: 1, y: 1 }],
        colorId: 'ink',
        widthId: 'thin',
      })
    ).rejects.toThrow(ValidationError);

    // Forma minúscula (< 2 dp) é rejeitada
    await expect(
      useCases.addElement(room.id, drawerId, {
        tool: 'rectangle',
        start: { x: 10, y: 10 },
        end: { x: 11, y: 11 },
        fillMode: 'stroke',
        colorId: 'ink',
        widthId: 'thin',
      })
    ).rejects.toThrow(ValidationError);

    const afterUndo = await useCases.undoElement(room.id, drawerId);
    expect(afterUndo.elements).toHaveLength(4);

    const afterClear = await useCases.clearCanvas(room.id, drawerId);
    expect(afterClear.elements).toHaveLength(0);
  });

  it('deve validar palpites normalizados sem vazar resposta, pontuar (+20/+15/+10 e +10/+5) e encerrar turno quando todos acertam (RF43)', async () => {
    const { useCases } = buildSut();
    const room = await useCases.createRoom('Roger');
    await useCases.joinRoom(room.code, 'Ana');
    const withThree = await useCases.joinRoom(room.code, 'Lucas');

    const [drawer, ana, lucas] = withThree.players;
    await useCases.startMatch(room.id);

    const drawerRoom = await useCases.getRoom(room.id, drawer.id);
    const secret = drawerRoom.currentSecretWord!;

    // Palpite errado fica visível no feed
    const wrong = await useCases.submitGuess(room.id, ana.id, 'abacaxi');
    expect(wrong.isCorrect).toBe(false);
    expect(wrong.pointsAwarded).toBe(0);
    expect(wrong.room.guesses[0].text).toBe('abacaxi');

    // Desenhista não pode enviar palpite
    await expect(
      useCases.submitGuess(room.id, drawer.id, secret)
    ).rejects.toThrow(ValidationError);

    // 1º acerto (Ana) ignorando acentos e maiúsculas: +20 pts, desenhista +10 pts, sem vazar palavra
    const normalizedVariant = normalizeDesenhoGuessText(secret).toUpperCase();
    const firstHit = await useCases.submitGuess(
      room.id,
      ana.id,
      `  ${normalizedVariant}  `
    );
    expect(firstHit.isCorrect).toBe(true);
    expect(firstHit.pointsAwarded).toBe(20);
    expect(firstHit.room.guesses[1].text).toBe('Acertou a palavra!');
    expect(firstHit.room.phase).toBe('drawing');

    // Ana não pode acertar duas vezes no mesmo turno
    await expect(useCases.submitGuess(room.id, ana.id, secret)).rejects.toThrow(
      ValidationError
    );

    // 2º acerto (Lucas): +15 pts, desenhista +5 pts (total 15) e turno encerra automaticamente (todos acertaram!)
    const secondHit = await useCases.submitGuess(room.id, lucas.id, secret);
    expect(secondHit.isCorrect).toBe(true);
    expect(secondHit.pointsAwarded).toBe(15);
    expect(secondHit.room.phase).toBe('turn_summary');
    expect(secondHit.room.currentSecretWord).toBe(secret);

    const updatedDrawer = secondHit.room.players.find((p) => p.id === drawer.id)!;
    const updatedAna = secondHit.room.players.find((p) => p.id === ana.id)!;
    const updatedLucas = secondHit.room.players.find((p) => p.id === lucas.id)!;

    expect(updatedAna.score).toBe(20);
    expect(updatedAna.firstGuessCount).toBe(1);
    expect(updatedLucas.score).toBe(15);
    expect(updatedDrawer.score).toBe(15);
    expect(updatedDrawer.drawingScore).toBe(15);

    const awards = useCases.getAwards(secondHit.room);
    expect(awards.generalChampion?.id).toBe(ana.id);
    expect(awards.bestArtist?.id).toBe(drawer.id);
    expect(awards.eagleEye?.id).toBe(ana.id);
  });

  it('deve avançar turnos sem repetir cartas até o pódio final e reiniciar no lobby', async () => {
    const { useCases } = buildSut();
    const room = await useCases.createRoom('Roger');
    await useCases.joinRoom(room.code, 'Ana');
    await useCases.updateConfig(room.id, { totalRounds: 1 });

    await useCases.startMatch(room.id);
    const turn1 = await useCases.getRoom(room.id, room.hostId);
    const firstWord = turn1.currentSecretWord;

    await useCases.finishTurn(room.id, 'timeout');
    const turn2 = await useCases.advanceTurn(room.id);
    expect(turn2.phase).toBe('drawing');
    expect(turn2.currentDrawerIndex).toBe(1);

    const turn2Drawer = await useCases.getRoom(room.id, turn2.currentDrawerId!);
    expect(turn2Drawer.currentSecretWord).not.toBe(firstWord);

    await useCases.finishTurn(room.id, 'timeout');
    const finished = await useCases.advanceTurn(room.id);
    expect(finished.phase).toBe('finished');

    const restarted = await useCases.restartLobby(room.id);
    expect(restarted.phase).toBe('lobby');
    expect(restarted.players.every((p) => p.score === 0)).toBe(true);
  });
});
