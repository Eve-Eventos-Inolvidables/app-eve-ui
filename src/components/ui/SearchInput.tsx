import { Box, IconButton, Input, InputGroup } from "@chakra-ui/react";
import { Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";

interface SearchInputProps {
  onSearchChange: (value: string) => void;
  placeholder?: string;
  defaultValue?: string;
}

export function SearchInput({
  onSearchChange,
  placeholder,
  defaultValue = "",
}: SearchInputProps) {
  const [value, setValue] = useState(defaultValue);
  const debouncedValue = useDebouncedValue(value.trim());
  const onSearchChangeRef = useRef(onSearchChange);

  useEffect(() => {
    onSearchChangeRef.current = onSearchChange;
  }, [onSearchChange]);

  useEffect(() => {
    onSearchChangeRef.current(debouncedValue);
  }, [debouncedValue]);

  return (
    <InputGroup
      endElement={
        value ? (
          <IconButton
            aria-label="Limpiar búsqueda"
            onClick={() => setValue("")}
            size="xs"
            variant="ghost"
          >
            <X />
          </IconButton>
        ) : (
          <Box color="fg.muted" pointerEvents="none">
            <Search size={16} />
          </Box>
        )
      }
    >
      <Input
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
    </InputGroup>
  );
}
