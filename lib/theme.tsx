// Theme system removed — Sentri is dark-mode only.
// This file is kept as a stub so any remaining imports don't break during migration.
// TODO: remove all useTheme() imports once fully cleaned up.

export function useTheme() {
  return { theme: "dark" as const, toggle: () => {} };
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
