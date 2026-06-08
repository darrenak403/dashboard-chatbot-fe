"use client";

import { createContext, useContext, useState } from "react";

interface YearContextValue {
  selectedYear: number | null;
  setSelectedYear: (year: number | null) => void;
}

const YearContext = createContext<YearContextValue>({
  selectedYear: null,
  setSelectedYear: () => {},
});

export function YearProvider({ children }: { children: React.ReactNode }) {
  const [selectedYear, setSelectedYearState] = useState<number | null>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("selected_admission_year");
      return stored ? Number(stored) : null;
    }
    return null;
  });

  const setSelectedYear = (year: number | null) => {
    setSelectedYearState(year);
    if (year === null) localStorage.removeItem("selected_admission_year");
    else localStorage.setItem("selected_admission_year", String(year));
  };

  return (
    <YearContext.Provider value={{ selectedYear, setSelectedYear }}>
      {children}
    </YearContext.Provider>
  );
}

export const useYear = () => useContext(YearContext);
