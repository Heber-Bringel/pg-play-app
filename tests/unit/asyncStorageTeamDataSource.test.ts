import AsyncStorage from '@react-native-async-storage/async-storage';
import { AsyncStorageTeamDataSource } from '@/infra/datasources/asyncStorageTeamDataSource';
import { DataSourceError } from '@/model/errors';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

const mockedAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe('AsyncStorageTeamDataSource', () => {
  let dataSource: AsyncStorageTeamDataSource;

  beforeEach(() => {
    jest.clearAllMocks();
    dataSource = new AsyncStorageTeamDataSource();
  });

  it('retorna equipes padrão e persiste quando storage está vazio', async () => {
    mockedAsyncStorage.getItem.mockResolvedValueOnce(null);
    mockedAsyncStorage.setItem.mockResolvedValueOnce(undefined);

    const teams = await dataSource.listTeams();

    expect(teams).toHaveLength(2);
    expect(teams[0].name).toBe('Tribo de Judá');
    expect(teams[1].name).toBe('Leões da Fé');
    expect(mockedAsyncStorage.setItem).toHaveBeenCalledTimes(1);
  });

  it('retorna equipes salvas quando storage já possui dados', async () => {
    const saved = [{ id: 't1', name: 'Alfa', score: 30 }];
    mockedAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(saved));

    const teams = await dataSource.listTeams();

    expect(teams).toEqual(saved);
    expect(mockedAsyncStorage.setItem).not.toHaveBeenCalled();
  });

  it('adiciona nova equipe com nome aparado e score 0', async () => {
    const saved = [{ id: 't1', name: 'Alfa', score: 10 }];
    mockedAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(saved));
    mockedAsyncStorage.setItem.mockResolvedValueOnce(undefined);

    const created = await dataSource.addTeam('  Beta  ');

    expect(created.name).toBe('Beta');
    expect(created.score).toBe(0);
    expect(mockedAsyncStorage.setItem).toHaveBeenCalledWith(
      '@pgplay:teams:v1',
      expect.stringContaining('"Beta"'),
    );
  });

  it('remove equipe pelo id', async () => {
    const saved = [
      { id: 't1', name: 'Alfa', score: 10 },
      { id: 't2', name: 'Beta', score: 20 },
    ];
    mockedAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(saved));
    mockedAsyncStorage.setItem.mockResolvedValueOnce(undefined);

    await dataSource.removeTeam('t1');

    expect(mockedAsyncStorage.setItem).toHaveBeenCalledWith(
      '@pgplay:teams:v1',
      JSON.stringify([{ id: 't2', name: 'Beta', score: 20 }]),
    );
  });

  it('soma pontuação sem permitir score negativo', async () => {
    const saved = [
      { id: 't1', name: 'Alfa', score: 10 },
      { id: 't2', name: 'Beta', score: 20 },
    ];
    mockedAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(saved));
    mockedAsyncStorage.setItem.mockResolvedValueOnce(undefined);

    await dataSource.addScore('t1', -50);

    expect(mockedAsyncStorage.setItem).toHaveBeenCalledWith(
      '@pgplay:teams:v1',
      JSON.stringify([
        { id: 't1', name: 'Alfa', score: 0 },
        { id: 't2', name: 'Beta', score: 20 },
      ]),
    );
  });

  it('zera pontuação de todas as equipes em resetScores', async () => {
    const saved = [
      { id: 't1', name: 'Alfa', score: 50 },
      { id: 't2', name: 'Beta', score: 20 },
    ];
    mockedAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(saved));
    mockedAsyncStorage.setItem.mockResolvedValueOnce(undefined);

    await dataSource.resetScores();

    expect(mockedAsyncStorage.setItem).toHaveBeenCalledWith(
      '@pgplay:teams:v1',
      JSON.stringify([
        { id: 't1', name: 'Alfa', score: 0 },
        { id: 't2', name: 'Beta', score: 0 },
      ]),
    );
  });

  it('converte erros técnicos em DataSourceError em todos os métodos', async () => {
    mockedAsyncStorage.getItem.mockRejectedValue(new Error('Falha de disco'));
    await expect(dataSource.listTeams()).rejects.toThrow(DataSourceError);
    await expect(dataSource.addTeam('Nova')).rejects.toThrow(DataSourceError);
    await expect(dataSource.removeTeam('t1')).rejects.toThrow(DataSourceError);
    await expect(dataSource.addScore('t1', 10)).rejects.toThrow(DataSourceError);
    await expect(dataSource.resetScores()).rejects.toThrow(DataSourceError);

    mockedAsyncStorage.getItem.mockResolvedValue(JSON.stringify([]));
    mockedAsyncStorage.setItem.mockRejectedValue('erro-string');
    await expect(dataSource.addTeam('Nova')).rejects.toThrow(DataSourceError);
    await expect(dataSource.removeTeam('t1')).rejects.toThrow(DataSourceError);
    await expect(dataSource.addScore('t1', 10)).rejects.toThrow(DataSourceError);
    await expect(dataSource.resetScores()).rejects.toThrow(DataSourceError);
  });
});
