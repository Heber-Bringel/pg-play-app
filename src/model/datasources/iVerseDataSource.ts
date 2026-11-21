import type { VersePack, VersePassage } from '@/model/entities/versePassage';

export interface IVerseDataSource {
  listPassages(packs?: VersePack[]): Promise<VersePassage[]>;
}
