"use client";

import { ChakraProvider, Theme } from "@chakra-ui/react";
import { system } from "@chakra-ui/react/preset";

export interface ColorModeProviderProps {
  children: React.ReactNode;
}
export function ComponentProvider(props: React.PropsWithChildren) {
  return (
    <ChakraProvider value={system}>
      <Theme>
        {props.children}
      </Theme>
    </ChakraProvider>
  );
}