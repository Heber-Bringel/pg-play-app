import type { ISoundPreferenceDataSource } from '@/model/datasources/iSoundPreferenceDataSource';
import type { IHapticService } from '@/model/services/iHapticService';
import type { ISoundService } from '@/model/services/iSoundService';
import type {
  AnswerOutcome,
  IGameFeedbackUseCases,
  TimerFeedbackOptions,
} from '@/usecase/iGameFeedbackUseCases';

// Faixa crítica do ExpressiveTimer (design-system/04-componentes/cronometro-expressivo.md).
export const TIMER_CRITICAL_SECONDS = 10;

// Feedback tátil e sonoro dos jogos de 1 celular (issues #77 e #84, specs 026 e 027).
// Cronômetro:
//   - tátil: um pulso leve por segundo nos 10 finais (salvo com "Reduzir movimento") e uma vibração forte ao zerar.
//   - sonoro (se som ligado): um bipe a cada segundo nos 10 finais (10s -> 1s) e um som de tempo esgotado ao zerar (1 -> 0).
// Resposta e letra:
//   - acerto: vibração de sucesso + som de acerto;
//   - erro: vibração de erro + som de erro;
//   - letra errada (Forca): toque curto + som discreto de letra errada;
//   - passe/pular (Mímica e Quem Sou Eu): toque médio + som curto de passe.
export class GameFeedbackUseCases implements IGameFeedbackUseCases {
  constructor(
    private readonly hapticService: IHapticService,
    private readonly soundService?: ISoundService,
    private readonly soundPreferenceDataSource?: ISoundPreferenceDataSource
  ) {}

  private async isSoundEnabled(): Promise<boolean> {
    if (!this.soundService) {
      return false;
    }
    if (!this.soundPreferenceDataSource) {
      return true;
    }
    try {
      const preference =
        await this.soundPreferenceDataSource.getSoundPreference();
      return Boolean(preference?.enabled);
    } catch {
      return true;
    }
  }

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
      if (this.soundService && (await this.isSoundEnabled())) {
        await this.soundService.playTimerExpired();
      }
      return;
    }

    if (currentSeconds > 0 && currentSeconds <= TIMER_CRITICAL_SECONDS) {
      if (!options.reduceMotion) {
        await this.hapticService.triggerTimerPulse();
      }
      // Bipe a cada segundo na contagem regressiva dos 10 segundos finais (10s -> 1s).
      if (this.soundService && (await this.isSoundEnabled())) {
        await this.soundService.playTimerCritical();
      }
    }
  }

  async notifyAnswer(outcome: AnswerOutcome): Promise<void> {
    if (outcome === 'correct') {
      await this.hapticService.triggerHit();
      if (this.soundService && (await this.isSoundEnabled())) {
        await this.soundService.playCorrect();
      }
      return;
    }
    await this.hapticService.triggerAnswerWrong();
    if (this.soundService && (await this.isSoundEnabled())) {
      await this.soundService.playWrong();
    }
  }

  async notifyLetterGuess(isInWord: boolean): Promise<void> {
    // Letra certa não vibra nem toca som, para o teclado não tremer/bipar a cada acerto.
    if (isInWord) {
      return;
    }
    await this.hapticService.triggerLetterWrong();
    if (this.soundService && (await this.isSoundEnabled())) {
      await this.soundService.playLetterWrong();
    }
  }

  async notifyPass(): Promise<void> {
    await this.hapticService.triggerPass();
    if (this.soundService && (await this.isSoundEnabled())) {
      await this.soundService.playPass();
    }
  }
}
