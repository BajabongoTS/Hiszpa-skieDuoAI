import Cookies from 'js-cookie';

export const setCookie = (name: string, value: any) => {
    try {
        // Store for 1 year with path set to root to ensure accessibility
        Cookies.set(name, JSON.stringify(value), { 
            expires: 365,
            path: '/',
            sameSite: 'strict'
        });
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
        Cookies.remove(name, { path: '/' });
    } catch (error) {
        console.error('Error removing cookie:', error);
    }
}; 