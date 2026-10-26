"use client";

import { ChakraProvider, Theme } from "@chakra-ui/react";
import { system } from "../../../styles/theme";
import { ColorModeProvider } from "./color-mode";
import { Toaster } from "./toaster";

export function ComponentProvider(props: React.PropsWithChildren) {
  return (
    <ChakraProvider value={system}>
      <ColorModeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem={false}
      >
        <Theme>
          {props.children}
          <Toaster />
        </Theme>
      </ColorModeProvider>
    </ChakraProvider>
  );
}
