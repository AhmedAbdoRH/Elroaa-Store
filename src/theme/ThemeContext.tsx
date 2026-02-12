import React, { createContext, useContext, useState, ReactNode } from 'react';

type ThemeContextType = {
  primaryColor: string;
  setPrimaryColor: (color: string) => void;
};

const ThemeContext = createContext<ThemeContextType>({
  primaryColor: '#f5f6db',
  setPrimaryColor: () => { },
});

export const ThemeProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  // إدارة الحالة داخليًا
  const [primaryColor, setPrimaryColor] = useState('#f5f6db');

  return (
    <ThemeContext.Provider value={{ primaryColor, setPrimaryColor }}>
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme() {
  return useContext(ThemeContext);
}
