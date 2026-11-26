export interface IHapticService {
  // Acerto (Quem Sou Eu, Quiz, Forca e Versículo): notificação de sucesso.
  triggerHit(): Promise<void>;
  triggerPass(): Promise<void>;
  // Cronômetro (issue #77): pulso leve a cada segundo dos 10 finais.
  triggerTimerPulse(): Promise<void>;
  // Cronômetro (issue #77): vibração forte quando o tempo chega a 0.
  triggerTimerExpired(): Promise<void>;
  // Resposta errada (Quiz, Versículo, palavra perdida na Forca): notificação de erro.
  triggerAnswerWrong(): Promise<void>;
  // Letra que não está na palavra (Forca): toque curto.
  triggerLetterWrong(): Promise<void>;
}
