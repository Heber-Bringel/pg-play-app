import AsyncStorage from '@react-native-async-storage/async-storage';
import { AsyncStorageThemePreferenceDataSource } from '@/infra/datasources/asyncStorageThemePreferenceDataSource';
import { DataSourceError } from '@/model/errors';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

const mockedAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe('AsyncStorageThemePreferenceDataSource', () => {
  let dataSource: AsyncStorageThemePreferenceDataSource;

  beforeEach(() => {
    jest.clearAllMocks();
    dataSource = new AsyncStorageThemePreferenceDataSource();
  });

  it('retorna auto quando storage está vazio ou contém valor inválido', async () => {
    mockedAsyncStorage.getItem.mockResolvedValueOnce(null);
    expect(await dataSource.getThemePreference()).toBe('auto');

    mockedAsyncStorage.getItem.mockResolvedValueOnce('invalid-mode');
    expect(await dataSource.getThemePreference()).toBe('auto');
  });

  it('retorna a preferência salva válida (light, dark, auto)', async () => {
    mockedAsyncStorage.getItem.mockResolvedValueOnce('dark');
    expect(await dataSource.getThemePreference()).toBe('dark');

    mockedAsyncStorage.getItem.mockResolvedValueOnce('light');
    expect(await dataSource.getThemePreference()).toBe('light');

    mockedAsyncStorage.getItem.mockResolvedValueOnce('auto');
    expect(await dataSource.getThemePreference()).toBe('auto');
  });

  it('persiste a preferência na chave esperada do AsyncStorage', async () => {
    mockedAsyncStorage.setItem.mockResolvedValueOnce(undefined);

    await dataSource.setThemePreference('dark');

    expect(mockedAsyncStorage.setItem).toHaveBeenCalledWith(
      '@pgplay:theme-preference:v1',
      'dark'
    );
  });

  it('converte falhas técnicas do AsyncStorage em DataSourceError', async () => {
    mockedAsyncStorage.getItem.mockRejectedValueOnce(new Error('Falha de leitura'));
    await expect(dataSource.getThemePreference()).rejects.toThrow(DataSourceError);

    mockedAsyncStorage.setItem.mockRejectedValueOnce('erro-string');
    await expect(dataSource.setThemePreference('light')).rejects.toThrow(
      DataSourceError
    );
  });
});
