import type { IHapticService } from '@/model/services/iHapticService';
import type {
  AnswerOutcome,
  IGameFeedbackUseCases,
  TimerFeedbackOptions,
} from '@/usecase/iGameFeedbackUseCases';

// Faixa crítica do ExpressiveTimer (design-system/04-componentes/cronometro-expressivo.md).
export const TIMER_CRITICAL_SECONDS = 10;

// Feedback tátil dos jogos (issue #77, spec 026).
// Cronômetro: um pulso leve por segundo nos 10 finais e uma vibração forte ao
// zerar. Só reage a uma queda de exatamente 1 segundo, para não vibrar ao
// reiniciar o turno nem em re-renderizações.
// Resposta: sucesso no acerto e erro na resposta errada. Avisos únicos, por
// isso não dependem do "Reduzir movimento".
export class GameFeedbackUseCases implements IGameFeedbackUseCases {
  constructor(private readonly hapticService: IHapticService) {}

  async notifyTimerTick(
    previousSeconds: number,
    currentSeconds: number,
    options: TimerFeedbackOptions
  ): Promise<void> {
    if (currentSeconds !== previousSeconds - 1) {
      return;
    }

    if (currentSeconds === 0) {
      // Aviso único de fim de turno: mantido mesmo com "Reduzir movimento".
      await this.hapticService.triggerTimerExpired();
      return;
    }

    if (
      currentSeconds > 0 &&
      currentSeconds <= TIMER_CRITICAL_SECONDS &&
      !options.reduceMotion
    ) {
      await this.hapticService.triggerTimerPulse();
    }
  }

  async notifyAnswer(outcome: AnswerOutcome): Promise<void> {
    if (outcome === 'correct') {
      await this.hapticService.triggerHit();
      return;
    }
    await this.hapticService.triggerAnswerWrong();
  }

  async notifyLetterGuess(isInWord: boolean): Promise<void> {
    // Letra certa não vibra, para o teclado não tremer a cada acerto e o
    // erro continuar se destacando.
    if (isInWord) {
      return;
    }
    await this.hapticService.triggerLetterWrong();
  }
}
