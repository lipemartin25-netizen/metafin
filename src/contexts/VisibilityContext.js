import { createContext } from 'react';

export const VisibilityContext = createContext({
 isVisible: true,
 toggleVisibility: () => { },
});
