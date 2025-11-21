import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../Api/api';

const AuthContext = createContext();

const decodeToken = (token) => {
    try {
        const payload = token.split('.')[1];
        const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
        const decodedPayload = atob(base64);
        return JSON.parse(decodedPayload);
    } catch (err) {
        console.error('Failed to decode token', err);
        return null;
    }
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initializeAuth = () => {
            try {
                const storedToken = sessionStorage.getItem('token');
                if (storedToken) {
                    const decoded = decodeToken(storedToken);
                    if (decoded) {
                        const parsedUser = {
                            id: decoded?.id || decoded?.sub || null,
                            employee_id: decoded?.employee_id || null,
                            username: decoded?.username || decoded?.user_name || '',
                            role: decoded?.role || 'user',
                            isAdmin: (decoded?.role || 'user') === 'admin'
                        };
                        setToken(storedToken);
                        setUser(parsedUser);
                        sessionStorage.setItem('username', parsedUser.username || '');
                        sessionStorage.setItem('role', parsedUser.role || 'user');
                        sessionStorage.setItem('employee_id', parsedUser.employee_id || '');
                        sessionStorage.setItem('id', parsedUser.id || '');
                        api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
                    } else {
                        logout();
                    }
                }
            } catch (error) {
                console.error('Error initializing auth:', error);
                logout();
            } finally {
                setLoading(false);
            }
        };

        initializeAuth();
    }, []);

    const login = async (credentials) => {
        try {
            setLoading(true);

            const response = await api.post('/auth/login', {
                user_name: credentials.username,
                employee_id: credentials.username,
                password: credentials.password
            });

            const payload = response.data || {};
            const apiUser = payload.data?.user || payload.user || {};
            const authToken = payload.data?.token || payload.token || payload.access_token;

            if (!authToken) {
                throw new Error('No token received from server');
            }

            const decoded = decodeToken(authToken);

            const userData = {
                id: apiUser.id || decoded?.id || decoded?.sub || null,
                employee_id: apiUser.employee_id || decoded?.employee_id || null,
                username: apiUser.username || apiUser.user_name || decoded?.username || credentials.username,
                role: apiUser.role || decoded?.role || 'user',
                isAdmin: (apiUser.role || decoded?.role || 'user') === 'admin'
            };

            setToken(authToken);
            setUser(userData);
            sessionStorage.setItem('token', authToken);
            sessionStorage.setItem('username', userData.username || '');
            sessionStorage.setItem('role', userData.role || 'user');
            sessionStorage.setItem('employee_id', userData.employee_id || '');
            sessionStorage.setItem('id', userData.id || '');
            api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;

            return {
                success: true,
                data: payload,
                user: userData,
                token: authToken
            };
        } catch (error) {
            console.error('Login error:', error);
            let errorMessage = 'Login failed';

            if (error.response) {
                errorMessage = error.response.data?.message || error.response.statusText || 'Login failed';
            } else if (error.request) {
                errorMessage = 'No response from server';
            }

            return {
                success: false,
                error: errorMessage
            };
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('username');
        sessionStorage.removeItem('role');
        sessionStorage.removeItem('employee_id');
        sessionStorage.removeItem('id');
        delete api.defaults.headers.common['Authorization'];
    };

    const isAuthenticated = () => !!token && !!user;

    const getAuthHeaders = () => ({
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
    });

    const value = {
        user,
        token,
        loading,
        login,
        logout,
        isAuthenticated,
        getAuthHeaders,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default AuthContext;
