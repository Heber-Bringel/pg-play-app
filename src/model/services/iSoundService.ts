export interface ISoundService {
  // Acerto (Quiz, Forca palavra completa, Versículo, Mímica e Quem Sou Eu): som curto e alegre ("plim").
  playCorrect(): Promise<void>;
  // Erro (Quiz, Forca palavra perdida, Versículo): som curto e grave.
  playWrong(): Promise<void>;
  // Letra errada na Forca: clique discreto.
  playLetterWrong(): Promise<void>;
  // Passe / Pular (Mímica e Quem Sou Eu): "whoosh" curto.
  playPass(): Promise<void>;
  // Cronômetro ao entrar nos 10 segundos finais (11s -> 10s): bipe único de atenção.
  playTimerCritical(): Promise<void>;
  // Cronômetro ao esgotar (1s -> 0s): apito/buzina curta.
  playTimerExpired(): Promise<void>;
}
