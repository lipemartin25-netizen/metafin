import { useState } from 'react';
import { VisibilityContext } from './VisibilityContext';

export function VisibilityProvider({ children }) {
 const [isVisible, setIsVisible] = useState(() => {
 const saved = localStorage.getItem('mf_dashboard_visibility');
 return saved !== null ? JSON.parse(saved) : true;
 });

 const toggleVisibility = () => {
 setIsVisible(prev => {
 const newVal = !prev;
 localStorage.setItem('mf_dashboard_visibility', JSON.stringify(newVal));
 return newVal;
 });
 };

 return (
 <VisibilityContext.Provider value={{ isVisible, toggleVisibility }}>
 {children}
 </VisibilityContext.Provider>
 );
}
