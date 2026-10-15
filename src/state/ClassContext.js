import { createContext, useContext, useState } from 'react';

const Ctx = createContext({ selectedClassId: null, setSelectedClassId: () => {} });
export const useSelectedClass = () => useContext(Ctx);

export function ClassProvider({ children }) {
  const [selectedClassId, setSelectedClassId] = useState(null);
  return (
    <Ctx.Provider value={{ selectedClassId, setSelectedClassId }}>{children}</Ctx.Provider>
  );
}