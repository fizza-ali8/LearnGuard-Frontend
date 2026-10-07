"use client";

import { useEffect, useState } from "react";

export function useDebouncedValue<T>(value: T, delayMs = 200) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [delayMs, value]);
  return debounced;
}
