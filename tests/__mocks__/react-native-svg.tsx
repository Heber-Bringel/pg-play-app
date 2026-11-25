import React from 'react';

export const Svg = (props: any) =>
  React.createElement('Svg', props, props.children);

export const Path = (props: any) =>
  React.createElement('Path', props, props.children);

export const Line = (props: any) =>
  React.createElement('Line', props, props.children);

export const Rect = (props: any) =>
  React.createElement('Rect', props, props.children);

export const Ellipse = (props: any) =>
  React.createElement('Ellipse', props, props.children);

export const Polygon = (props: any) =>
  React.createElement('Polygon', props, props.children);

export default Svg;
