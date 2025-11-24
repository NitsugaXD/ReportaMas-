// apps/tech-pwa/src/theme/colors.ts

export const lightTheme = {
  base: "#F7F7FA",          // fondo general claro
  card: "#FFFFFF",          // tarjetas
  border: "#E2E4EF",

  text: "#1F2933",          // texto principal
  textMuted: "#6B7280",     // texto secundario

  primary: "#F07020",       // botón principal
  primaryHover: "#D95E07",
  primarySoft: "#FFE4CC",   // chips / etiquetas suaves

  accent: "#F0B040",        // detalles

  gradientFrom: "#F38B1F",
  gradientTo: "#F0C04A",
}

export const darkTheme = {
  base: "#05060A",          // fondo general oscuro
  card: "#0B0F18",          // tarjetas
  border: "#1E2535",

  text: "#F9FAFB",          // texto principal
  textMuted: "#9CA3AF",     // texto secundario

  primary: "#F38B1F",       // botón principal en dark mode
  primaryHover: "#D96A00",
  primarySoft: "#3A2410",

  accent: "#F3C049",

  gradientFrom: "#F38B1F",
  gradientTo: "#F3C049",
}

/**
 * Devuelve la paleta según el modo oscuro o claro.
 * Puedes usarla así:
 *
 * const theme = getTheme(isDark)
 * <div style={{ background: theme.base }}>
 */
export function getTheme(isDark: boolean) {
  return isDark ? darkTheme : lightTheme
}