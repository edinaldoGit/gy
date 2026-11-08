export const sectionThemes = {
  treino: {
    id: 'amethyst',
    header: 'bg-amethyst-500',
    pageTitle: 'text-amethyst-500',
    accent: 'text-amethyst-500',
    action: 'bg-amethyst-500 hover:bg-amethyst-600'
  },
  fichas: {
    id: 'cerulean',
    header: 'bg-cerulean-600',
    pageTitle: 'text-cerulean-600',
    accent: 'text-cerulean-600',
    action: 'bg-cerulean-600 hover:bg-cerulean-700'
  },
  historico: {
    id: 'teal',
    header: 'bg-teal-600',
    pageTitle: 'text-teal-600',
    accent: 'text-teal-600',
    action: 'bg-teal-600 hover:bg-teal-700'
  },
  perfil: {
    id: 'bubblegum',
    header: 'bg-bubblegum-500',
    pageTitle: 'text-bubblegum-500',
    accent: 'text-bubblegum-500',
    action: 'bg-bubblegum-500 hover:bg-bubblegum-600'
  }
} as const

export type SectionThemeId = keyof typeof sectionThemes
