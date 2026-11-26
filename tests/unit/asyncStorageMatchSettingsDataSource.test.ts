import AsyncStorage from '@react-native-async-storage/async-storage';
import { AsyncStorageMatchSettingsDataSource } from '@/infra/datasources/asyncStorageMatchSettingsDataSource';
import { DEFAULT_MATCH_SETTINGS } from '@/model/entities/matchSettings';
import { DataSourceError } from '@/model/errors';

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

const STORAGE_KEY = '@pgplay:match_settings:v1';

describe('AsyncStorageMatchSettingsDataSource — Parâmetros da Partida (RF29)', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.restoreAllMocks();
  });

  it('retorna os padrões quando nada foi salvo', async () => {
    const dataSource = new AsyncStorageMatchSettingsDataSource();

    await expect(dataSource.getSettings()).resolves.toEqual(DEFAULT_MATCH_SETTINGS);
  });

  it('salva e recarrega a última configuração', async () => {
    const dataSource = new AsyncStorageMatchSettingsDataSource();
    const settings = {
      mimica: { durationSeconds: 90 as const, totalRounds: 5 },
      quiz: { durationSeconds: 30 as const, questionCount: 15 as const },
      forca: { maxAttempts: 8 as const, totalRounds: 1 },
      desenho: { durationSeconds: 120 as const, totalRounds: 4 },
    };

    await dataSource.saveSettings(settings);

    await expect(new AsyncStorageMatchSettingsDataSource().getSettings()).resolves.toEqual(
      settings
    );
  });

  it('completa com os padrões uma configuração parcial salva por versão antiga', async () => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ quiz: { durationSeconds: 15 } }));

    const settings = await new AsyncStorageMatchSettingsDataSource().getSettings();

    expect(settings.quiz).toEqual({ durationSeconds: 15, questionCount: 10 });
    expect(settings.mimica).toEqual(DEFAULT_MATCH_SETTINGS.mimica);
    expect(settings.desenho).toEqual(DEFAULT_MATCH_SETTINGS.desenho);
  });

  it.each(['{quebrado', 'null', '"texto"', '[1,2]', '{"mimica":"x","quiz":null}'])(
    'volta aos padrões quando o valor salvo está corrompido (%s)',
    async (corrupted) => {
      await AsyncStorage.setItem(STORAGE_KEY, corrupted);

      await expect(new AsyncStorageMatchSettingsDataSource().getSettings()).resolves.toEqual(
        DEFAULT_MATCH_SETTINGS
      );
    }
  );

  it('converte falhas de leitura e de gravação em DataSourceError', async () => {
    const dataSource = new AsyncStorageMatchSettingsDataSource();

    jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(new Error('falha de leitura'));
    await expect(dataSource.getSettings()).rejects.toBeInstanceOf(DataSourceError);

    jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('disco cheio'));
    await expect(dataSource.saveSettings(DEFAULT_MATCH_SETTINGS)).rejects.toBeInstanceOf(
      DataSourceError
    );
  });
});
