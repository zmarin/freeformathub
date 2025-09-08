import React from 'react';

// Formatter components
import { JsonFormatter } from '../components/tools/formatters/JsonFormatter';

// Add more components as needed - this is the extensible pattern
// import { XmlFormatter } from '../components/tools/formatters/XmlFormatter';
// import { YamlFormatter } from '../components/tools/formatters/YamlFormatter';
// ... etc

export type ToolComponent = React.ComponentType<any>;

export const TOOL_COMPONENTS: Record<string, ToolComponent> = {
  // Formatters
  'json-formatter': JsonFormatter,
  // Add more components as they're needed:
  // 'xml-formatter': XmlFormatter,
  // 'yaml-formatter': YamlFormatter,
  // ... etc
};

export function getToolComponent(slug: string): ToolComponent | null {
  return TOOL_COMPONENTS[slug] || null;
}

export function hasToolComponent(slug: string): boolean {
  return slug in TOOL_COMPONENTS;
}