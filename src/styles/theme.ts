import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";
import type { SystemStyleObject } from "@chakra-ui/react";

const config = defineConfig({
  globalCss: {
    "html, body, #root": {
      minHeight: "100%",
    },
    body: {
      bg: "bg",
      color: "fg",
      ...({
        WebkitFontSmoothing: "antialiased",
        MozOsxFontSmoothing: "grayscale",
      } as SystemStyleObject),
    },
  },
  theme: {
    tokens: {
      colors: {
        brand: {
          50: { value: "#ECFDF5" },
          100: { value: "#D1FAE5" },
          200: { value: "#A7F3D0" },
          300: { value: "#6EE7B7" },
          400: { value: "#34D399" },
          500: { value: "#10B981" }, // Tu color principal exacto
          600: { value: "#059669" },
          700: { value: "#047857" },
          800: { value: "#065F46" },
          900: { value: "#064E3B" },
          950: { value: "#022C22" },
        },
        accent: {
          50: { value: "#FDF2F8" },
          100: { value: "#FCE7F3" },
          200: { value: "#FBCFE8" },
          300: { value: "#F9A8D4" },
          400: { value: "#F472B6" },
          500: { value: "#E91E8C" }, // Tu rosado exacto
          600: { value: "#DB2777" },
          700: { value: "#BE185D" },
          800: { value: "#9D174D" },
          900: { value: "#831843" },
        },
      },
    },
    semanticTokens: {
      colors: {
        bg: {
          DEFAULT: { value: { _light: "{colors.gray.50}", _dark: "{colors.gray.900}" } },
          subtle: { value: { _light: "{colors.gray.100}", _dark: "{colors.gray.800}" } },
          panel: { value: { _light: "{colors.white}", _dark: "{colors.gray.800}" } },
          header: {
            value: {
              _light: "rgba(255, 255, 255, 0.72)",
              _dark: "rgba(31, 41, 55, 0.72)",
            },
          },
        },
        fg: {
          DEFAULT: { value: { _light: "{colors.gray.800}", _dark: "{colors.gray.50}" } },
          muted: { value: { _light: "{colors.gray.600}", _dark: "{colors.gray.400}" } },
          inverted: { value: { _light: "{colors.white}", _dark: "{colors.gray.900}" } },
          header: {
            value: {
              _light: "{colors.gray.900}",
              _dark: "{colors.gray.50}",
            },
          },
          headerMuted: {
            value: {
              _light: "{colors.gray.600}",
              _dark: "{colors.gray.400}",
            },
          },
        },
        border: {
          DEFAULT: { value: { _light: "{colors.gray.200}", _dark: "{colors.gray.700}" } },
          subtle: { value: { _light: "{colors.gray.100}", _dark: "{colors.gray.800}" } },
          header: {
            value: {
              _light: "rgba(229, 231, 235, 0.8)",
              _dark: "rgba(55, 65, 81, 0.8)",
            },
          },
        },
        brand: {
          contrast: { value: { _light: "{colors.white}", _dark: "{colors.gray.900}" } },
          solid: { value: { _light: "{colors.brand.500}", _dark: "{colors.brand.500}" } },
          fg: { value: { _light: "{colors.brand.600}", _dark: "{colors.brand.400}" } },
          muted: { value: { _light: "{colors.brand.100}", _dark: "rgba(16, 185, 129, 0.2)" } },
          focusRing: { value: "{colors.brand.500}" },
        },
        accent: {
          contrast: { value: { _light: "{colors.white}", _dark: "{colors.white}" } },
          solid: { value: { _light: "{colors.accent.500}", _dark: "{colors.accent.400}" } },
          fg: { value: { _light: "{colors.accent.600}", _dark: "{colors.accent.400}" } },
          muted: { value: { _light: "{colors.accent.100}", _dark: "rgba(233, 30, 140, 0.2)" } },
        },
      },
    },
  },
});

export const system = createSystem(defaultConfig, config);