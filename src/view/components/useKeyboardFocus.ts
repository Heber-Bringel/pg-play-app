import { useCallback, useEffect, useRef, useState } from 'react';
import type { ViewStyle } from 'react-native';
import type { AppTokens } from '@/view/theme';

type InputModality = 'keyboard' | 'pointer';

let lastInputModality: InputModality = 'keyboard';
let listenersRegistered = false;

const KEYBOARD_NAV_KEYS = new Set([
  'Tab',
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'Enter',
  ' ',
  'Escape',
]);

function ensureGlobalModalityListeners() {
  if (listenersRegistered) return;
  if (typeof globalThis === 'undefined') return;
  const target = globalThis as unknown as {
    addEventListener?: (
      type: string,
      listener: (event: { key?: string }) => void,
      options?: boolean
    ) => void;
  };
  if (typeof target.addEventListener !== 'function') return;

  listenersRegistered = true;

  const markPointer = () => {
    lastInputModality = 'pointer';
  };
  const markKeyboard = (event: { key?: string }) => {
    if (!event.key || KEYBOARD_NAV_KEYS.has(event.key)) {
      lastInputModality = 'keyboard';
    }
  };

  target.addEventListener('pointerdown', markPointer, true);
  target.addEventListener('mousedown', markPointer, true);
  target.addEventListener('touchstart', markPointer, true);
  target.addEventListener('keydown', markKeyboard, true);
}

export function setInputModalityForTest(modality: InputModality) {
  lastInputModality = modality;
}

export function getFocusRingStyle(
  activeTokens: AppTokens,
  focusVisible: boolean
): ViewStyle | undefined {
  if (!focusVisible) return undefined;
  return {
    outlineStyle: 'solid',
    outlineWidth: activeTokens.semantic.border.focus,
    outlineColor: activeTokens.semantic.color.focus,
    outlineOffset: activeTokens.semantic.space.xs,
  };
}

export type KeyboardFocusBindings = {
  focusVisible: boolean;
  onPressIn: () => void;
  onPressOut: () => void;
  onFocus: () => void;
  onBlur: () => void;
};

export function useKeyboardFocus(): KeyboardFocusBindings {
  const [focusVisible, setFocusVisible] = useState(false);
  const pointerActiveRef = useRef(false);

  useEffect(() => {
    ensureGlobalModalityListeners();
  }, []);

  const onPressIn = useCallback(() => {
    pointerActiveRef.current = true;
    if (listenersRegistered) {
      lastInputModality = 'pointer';
    }
    setFocusVisible(false);
  }, []);

  const onPressOut = useCallback(() => {
    pointerActiveRef.current = false;
  }, []);

  const onFocus = useCallback(() => {
    if (pointerActiveRef.current || lastInputModality === 'pointer') {
      setFocusVisible(false);
      return;
    }
    setFocusVisible(true);
  }, []);

  const onBlur = useCallback(() => {
    setFocusVisible(false);
  }, []);

  return {
    focusVisible,
    onPressIn,
    onPressOut,
    onFocus,
    onBlur,
  };
}
