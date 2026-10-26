import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";

const config = defineConfig({
  globalCss: {
    "html, body, #root": {
      minHeight: "100%",
    },
    body: {
      bg: "bg",
      color: "fg",
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
          500: { value: "#10B981" },
          600: { value: "#059669" },
          700: { value: "#047857" },
          800: { value: "#065F46" },
          900: { value: "#064E3B" },
          950: { value: "#022C22" },
        },
      },
    },
    semanticTokens: {
      colors: {
        bg: {
          DEFAULT: {
            value: { _light: "{colors.gray.50}", _dark: "{colors.teal.900}" },
          },
          subtle: {
            value: { _light: "{colors.teal.50}", _dark: "{colors.gray.800}" },
          },
          muted: {
            value: { _light: "{colors.gray.100}", _dark: "{colors.gray.800}" },
          },
          emphasized: {
            value: { _light: "{colors.gray.200}", _dark: "{colors.gray.700}" },
          },
          panel: {
            value: { _light: "{colors.white}", _dark: "{colors.gray.800}" },
          },
        },
        fg: {
          DEFAULT: {
            value: { _light: "{colors.gray.800}", _dark: "{colors.teal.200}" },
          },
          muted: {
            value: { _light: "{colors.gray.600}", _dark: "{colors.teal.300}" },
          },
          subtle: {
            value: { _light: "{colors.gray.500}", _dark: "{colors.teal.400}" },
          },
          inverted: {
            value: { _light: "{colors.white}", _dark: "{colors.gray.900}" },
          },
        },
        border: {
          DEFAULT: {
            value: { _light: "{colors.teal.200}", _dark: "{colors.teal.800}" },
          },
          muted: {
            value: { _light: "{colors.teal.100}", _dark: "{colors.teal.900}" },
          },
          emphasized: {
            value: { _light: "{colors.teal.300}", _dark: "{colors.teal.700}" },
          },
        },
        brand: {
          contrast: {
            value: { _light: "{colors.gray.900}", _dark: "{colors.gray.900}" },
          },
          fg: {
            value: { _light: "{colors.brand.700}", _dark: "{colors.teal.200}" },
          },
          subtle: {
            value: { _light: "{colors.brand.50}", _dark: "{colors.gray.800}" },
          },
          muted: {
            value: { _light: "{colors.brand.100}", _dark: "{colors.gray.700}" },
          },
          emphasized: {
            value: { _light: "{colors.brand.200}", _dark: "{colors.gray.600}" },
          },
          solid: {
            value: "{colors.brand.500}",
          },
          focusRing: {
            value: "{colors.brand.500}",
          },
          border: {
            value: "{colors.brand.500}",
          },
        },
      },
    },
  },
});

export const system = createSystem(defaultConfig, config);
