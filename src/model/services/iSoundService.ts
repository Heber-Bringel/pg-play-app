export interface ISoundService {
  // Acerto (Quiz, Forca palavra completa, Versículo, Mímica e Quem Sou Eu): som curto e alegre ("plim").
  playCorrect(): Promise<void>;
  // Erro (Quiz, Forca palavra perdida, Versículo): som curto e grave.
  playWrong(): Promise<void>;
  // Letra errada na Forca: clique discreto.
  playLetterWrong(): Promise<void>;
  // Passe / Pular (Mímica e Quem Sou Eu): "whoosh" curto.
  playPass(): Promise<void>;
  // Cronômetro nos últimos 10 segundos (10s -> 1s): pulso sonoro ritmado curto (< 200ms) a cada segundo.
  playTimerTick(): Promise<void>;
  // Cronômetro ao entrar nos 10 segundos finais: bipe curto de atenção (compatibilidade).
  playTimerCritical(): Promise<void>;
  // Cronômetro ao esgotar (1s -> 0s): apito/buzina curta.
  playTimerExpired(): Promise<void>;
}
