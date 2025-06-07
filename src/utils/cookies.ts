import Cookies from 'js-cookie';

export const setCookie = (name: string, value: any) => {
    try {
        Cookies.set(name, JSON.stringify(value), { expires: 365 }); // Store for 1 year
    } catch (error) {
        console.error('Error setting cookie:', error);
    }
};

export const getCookie = (name: string) => {
    try {
        const value = Cookies.get(name);
        return value ? JSON.parse(value) : null;
    } catch (error) {
        console.error('Error getting cookie:', error);
        return null;
    }
};

export const removeCookie = (name: string) => {
    try {
        Cookies.remove(name);
    } catch (error) {
        console.error('Error removing cookie:', error);
    }
}; 