import React, { createContext, useContext, useState } from 'react';

const ThreatsContext = createContext();

export const ThreatsProvider = ({ children }) => {
  const [recentThreats, setRecentThreats] = useState([]);

  return (
    <ThreatsContext.Provider value={{ recentThreats, setRecentThreats }}>
      {children}
    </ThreatsContext.Provider>
  );
};

export const useThreats = () => useContext(ThreatsContext);
