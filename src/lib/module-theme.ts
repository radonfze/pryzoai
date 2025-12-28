export const MODULE_THEME = {
  sales: {
    gradient: 'from-pink-500 via-rose-500 to-orange-500',
    lightGradient: 'from-pink-50 via-rose-50 to-orange-50',
    darkGradient: 'from-pink-950 via-rose-950 to-orange-950',
    icon: 'text-pink-600',
    bg: 'bg-pink-500',
    card: 'bg-gradient-to-br from-pink-500/10 to-orange-500/10',
    border: 'border-pink-500/20',
    hover: 'hover:bg-pink-500/10',
  },
  procurement: {
    gradient: 'from-purple-500 via-violet-500 to-blue-500',
    lightGradient: 'from-purple-50 via-violet-50 to-blue-50',
    darkGradient: 'from-purple-950 via-violet-950 to-blue-950',
    icon: 'text-purple-600',
    bg: 'bg-purple-500',
    card: 'bg-gradient-to-br from-purple-500/10 to-blue-500/10',
    border: 'border-purple-500/20',
    hover: 'hover:bg-purple-500/10',
  },
  inventory: {
    gradient: 'from-green-500 via-emerald-500 to-teal-500',
    lightGradient: 'from-green-50 via-emerald-50 to-teal-50',
    darkGradient: 'from-green-950 via-emerald-950 to-teal-950',
    icon: 'text-green-600',
    bg: 'bg-green-500',
    card: 'bg-gradient-to-br from-green-500/10 to-teal-500/10',
    border: 'border-green-500/20',
    hover: 'hover:bg-green-500/10',
  },
  finance: {
    gradient: 'from-emerald-500 via-teal-500 to-cyan-500',
    lightGradient: 'from-emerald-50 via-teal-50 to-cyan-50',
    darkGradient: 'from-emerald-950 via-teal-950 to-cyan-950',
    icon: 'text-emerald-600',
    bg: 'bg-emerald-500',
    card: 'bg-gradient-to-br from-emerald-500/10 to-cyan-500/10',
    border: 'border-emerald-500/20',
    hover: 'hover:bg-emerald-500/10',
  },
  hr: {
    gradient: 'from-blue-500 via-indigo-500 to-purple-500',
    lightGradient: 'from-blue-50 via-indigo-50 to-purple-50',
    darkGradient: 'from-blue-950 via-indigo-950 to-purple-950',
    icon: 'text-blue-600',
    bg: 'bg-blue-500',
    card: 'bg-gradient-to-br from-blue-500/10 to-purple-500/10',
    border: 'border-blue-500/20',
    hover: 'hover:bg-blue-500/10',
  },
  projects: {
    gradient: 'from-violet-500 via-purple-500 to-fuchsia-500',
    lightGradient: 'from-violet-50 via-purple-50 to-fuchsia-50',
    darkGradient: 'from-violet-950 via-purple-950 to-fuchsia-950',
    icon: 'text-violet-600',
    bg: 'bg-violet-500',
    card: 'bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10',
    border: 'border-violet-500/20',
    hover: 'hover:bg-violet-500/10',
  },
  manufacturing: {
    gradient: 'from-orange-500 via-amber-500 to-yellow-500',
    lightGradient: 'from-orange-50 via-amber-50 to-yellow-50',
    darkGradient: 'from-orange-950 via-amber-950 to-yellow-950',
    icon: 'text-orange-600',
    bg: 'bg-orange-500',
    card: 'bg-gradient-to-br from-orange-500/10 to-yellow-500/10',
    border: 'border-orange-500/20',
    hover: 'hover:bg-orange-500/10',
  },
} as const;

export type ModuleType = keyof typeof MODULE_THEME;

export function getModuleTheme(module: ModuleType) {
  return MODULE_THEME[module];
}
