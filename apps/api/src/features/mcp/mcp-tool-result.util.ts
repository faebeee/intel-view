/**
 * Shared MCP tool result shape used across all MCP tool controllers: a
 * single text content block containing the JSON-serialized payload. This
 * mirrors how the corresponding REST endpoints respond, just wrapped in the
 * MCP tool content envelope.
 */
export type McpToolTextResult = {
  content: [{ type: 'text'; text: string }];
};

export function textResult(data: unknown): McpToolTextResult {
  return { content: [{ type: 'text', text: JSON.stringify(data) }] };
}
