import AsyncStorage from '@react-native-async-storage/async-storage';
import { AsyncStorageSoundPreferenceDataSource } from '@/infra/datasources/asyncStorageSoundPreferenceDataSource';
import { DataSourceError } from '@/model/errors';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

const mockedAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe('AsyncStorageSoundPreferenceDataSource (#84)', () => {
  let dataSource: AsyncStorageSoundPreferenceDataSource;

  beforeEach(() => {
    jest.clearAllMocks();
    dataSource = new AsyncStorageSoundPreferenceDataSource();
  });

  it('retorna som ligado (enabled: true) quando o armazenamento está vazio ou contém JSON inválido', async () => {
    mockedAsyncStorage.getItem.mockResolvedValueOnce(null);
    expect(await dataSource.getSoundPreference()).toEqual({ enabled: true });

    mockedAsyncStorage.getItem.mockResolvedValueOnce('{invalido');
    expect(await dataSource.getSoundPreference()).toEqual({ enabled: true });

    mockedAsyncStorage.getItem.mockResolvedValueOnce(
      JSON.stringify({ enabled: 'sim' })
    );
    expect(await dataSource.getSoundPreference()).toEqual({ enabled: true });
  });

  it('retorna a preferência salva válida (enabled: true ou false)', async () => {
    mockedAsyncStorage.getItem.mockResolvedValueOnce(
      JSON.stringify({ enabled: false })
    );
    expect(await dataSource.getSoundPreference()).toEqual({ enabled: false });

    mockedAsyncStorage.getItem.mockResolvedValueOnce(
      JSON.stringify({ enabled: true })
    );
    expect(await dataSource.getSoundPreference()).toEqual({ enabled: true });
  });

  it('persiste a preferência na chave esperada do AsyncStorage', async () => {
    mockedAsyncStorage.setItem.mockResolvedValueOnce(undefined);

    await dataSource.setSoundPreference({ enabled: false });

    expect(mockedAsyncStorage.setItem).toHaveBeenCalledWith(
      '@pgplay:sound-preference:v1',
      JSON.stringify({ enabled: false })
    );
  });

  it('converte falhas técnicas do AsyncStorage em DataSourceError', async () => {
    mockedAsyncStorage.getItem.mockRejectedValueOnce(
      new Error('Falha de leitura')
    );
    await expect(dataSource.getSoundPreference()).rejects.toThrow(
      DataSourceError
    );

    mockedAsyncStorage.setItem.mockRejectedValueOnce('erro-string');
    await expect(
      dataSource.setSoundPreference({ enabled: true })
    ).rejects.toThrow(DataSourceError);
  });
});
