import React from 'react';

const glyphMap = {
  'account-multiple-plus': 1,
  'alert-circle': 2,
  alert: 3,
  'timer-outline': 4,
  'check-circle': 5,
  'close-circle': 6,
  magnify: 7,
  play: 8,
  check: 9,
  'Skip-next': 10,
  eye: 11,
  'drama-masks': 12,
  'lightning-bolt': 13,
  alphabetical: 14,
  trophy: 15,
};

export const MaterialCommunityIcons = Object.assign(
  (props: { name: keyof typeof glyphMap; size?: number; color?: string }) =>
    React.createElement('MaterialCommunityIcons', props),
  { glyphMap }
);
