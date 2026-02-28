/**
 * Utility functions shared across the platform
 */

/**
 * Parse project requirements from natural language
 */
export function extractKeywords(text: string): string[] {
  const keywords = new Set<string>();

  // Common technical keywords
  const patterns = [
    /\b(react|vue|angular|svelte|next\.?js|nuxt)\b/gi,
    /\b(node\.?js|python|django|flask|express|fastapi)\b/gi,
    /\b(mongodb|postgresql|mysql|sqlite|redis)\b/gi,
    /\b(api|rest|graphql|websocket)\b/gi,
    /\b(auth|authentication|login|signup|oauth)\b/gi,
    /\b(crud|database|storage|file upload)\b/gi,
    /\b(dashboard|admin panel|form|table|chart)\b/gi,
    /\b(responsive|mobile|desktop|pwa)\b/gi,
    /\b(typescript|javascript|python|go|rust)\b/gi
  ];

  patterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach(match => keywords.add(match.toLowerCase()));
    }
  });

  return Array.from(keywords);
}
