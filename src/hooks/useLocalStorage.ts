import { useCallback } from "react";

export function useLocalStorage(){
    const saveLocalStorage = useCallback((key:string, data:unknown) => {
        if(!data) return
        try {
            if (typeof data === 'object' && data !== null) {
                localStorage.setItem(key, JSON.stringify(data));
            } else {
                localStorage.setItem(key, String(data));
            }
        } catch (error) {
            console.error('Error guardando en localStorage:', error);
        }
    }, []);
    
    const deleteLocalStorage = useCallback((key:string) => {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error('Error borrando de localStorage:', error);
        }
    }, []);
    
    const getLocalStorage = useCallback((key:string) => {
        try {
            const data = localStorage.getItem(key);
            if (!data) return null;
            
            try {
                return JSON.parse(data);
            } catch {
                return data;
            }
        } catch (error) {
            console.error('Error obteniendo de localStorage:', error);
            return null;
        }
    }, []);
    
    return { saveLocalStorage, deleteLocalStorage, getLocalStorage };
}