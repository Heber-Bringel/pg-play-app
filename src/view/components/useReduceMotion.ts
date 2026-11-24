import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

// Lê o "Reduzir movimento" do sistema (RNF09) e acompanha mudanças com o app
// aberto. Usado pelas telas com ExpressiveTimer para desligar a pulsação
// visual e repassar o valor à ViewModel, que decide o feedback tátil (#77).
export const useReduceMotion = (
  onChange?: (enabled: boolean) => void
): boolean => {
  const [reduceMotion, setReduceMotion] = useState<boolean>(false);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    let active = true;
    const apply = (enabled: boolean) => {
      if (!active) return;
      setReduceMotion(enabled);
      onChangeRef.current?.(enabled);
    };

    if (AccessibilityInfo?.isReduceMotionEnabled) {
      AccessibilityInfo.isReduceMotionEnabled().then(apply, () => {
        // Mantém o padrão (false) quando a plataforma não expõe a configuração.
      });
    }

    const subscription = AccessibilityInfo?.addEventListener?.(
      'reduceMotionChanged',
      apply
    );

    return () => {
      active = false;
      subscription?.remove();
    };
  }, []);

  return reduceMotion;
};
