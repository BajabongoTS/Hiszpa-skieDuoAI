/**
 * Save data to localStorage with proper type checking
 */
export function saveToLocalStorage(key: string, data: any): void {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
        console.error("Error saving to localStorage:", error);
    }
}

/**
 * Load data from localStorage with proper type checking
 */
export function loadFromLocalStorage<T>(key: string, defaultValue: T): T {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error("Error loading from localStorage:", error);
        return defaultValue;
    }
}
