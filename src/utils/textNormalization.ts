/**
 * Normalizes Spanish text for comparison by:
 * 1. Converting to lowercase
 * 2. Removing articles (el, la, los, las)
 * 3. Removing diacritical marks
 * 4. Trimming whitespace
 */
export const normalizeSpanishText = (text: string): string => {
    return text
        .toLowerCase()
        // Remove articles
        .replace(/^(el|la|los|las)\s+/i, '')
        // Replace diacritical marks
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        // Remove extra whitespace
        .trim();
}; 