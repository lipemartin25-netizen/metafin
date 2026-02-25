import { useContext } from 'react';
import { VisibilityContext } from '../contexts/VisibilityContext';

export function useVisibility() {
    const context = useContext(VisibilityContext);
    if (!context) {
        throw new Error('useVisibility must be used within a VisibilityProvider');
    }
    return context;
}
