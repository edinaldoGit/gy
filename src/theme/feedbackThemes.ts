/** Cores semânticas suaves; o texto da pílula mantém contraste sobre branco. */
export const feedbackThemes = {
  success: { background: 'bg-teal-400', foreground: 'text-teal-700' },
  error: { background: 'bg-bubblegum-400', foreground: 'text-bubblegum-700' },
  warning: { background: 'bg-amber-300', foreground: 'text-amber-800' },
  info: { background: 'bg-cerulean-400', foreground: 'text-cerulean-700' }
} as const
