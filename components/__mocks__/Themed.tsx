import React from "react";

export type TextProps = any;
export type ViewProps = any;

export function Text({ children, ...props }: any) {
  return React.createElement("Text", props, children);
}

export function View({ children, ...props }: any) {
  return React.createElement("View", props, children);
}
