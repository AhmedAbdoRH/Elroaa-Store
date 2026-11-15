import React, { createContext, useContext, useState, ReactNode } from 'react';

type ThemeContextType = {
  primaryColor: string;
  setPrimaryColor: (color: string) => void;
};

const ThemeContext = createContext<ThemeContextType>({
  primaryColor: '#F7F3E9',
  setPrimaryColor: () => { },
});

export const ThemeProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  // إدارة الحالة داخليًا
  const [primaryColor, setPrimaryColor] = useState('#F7F3E9');

  return (
    <ThemeContext.Provider value={{ primaryColor, setPrimaryColor }}>
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme() {
  return useContext(ThemeContext);
}
