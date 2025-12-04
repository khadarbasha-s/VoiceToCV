import api from "./api";

const authService = {
    login: async (username, password) => {
        const response = await api.post("/auth/login/", { username, password });
        if (response.data.token) {
            localStorage.setItem("token", response.data.token);
            localStorage.setItem("user", JSON.stringify(response.data.user));
            // Store user_type for routing
            if (response.data.user.user_profile) {
                localStorage.setItem("user_type", response.data.user.user_profile.user_type);
            }
        }
        return response.data;
    },

    signup: async (userData) => {
        const response = await api.post("/auth/signup/", userData);
        if (response.data.token) {
            localStorage.setItem("token", response.data.token);
            localStorage.setItem("user", JSON.stringify(response.data.user));
            // Store user_type for routing
            if (response.data.user.user_profile) {
                localStorage.setItem("user_type", response.data.user.user_profile.user_type);
            }
        }
        return response.data;
    },

    logout: () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("user_type");
    },

    getCurrentUser: () => {
        const userStr = localStorage.getItem("user");
        if (userStr) return JSON.parse(userStr);
        return null;
    },

    getUserType: () => {
        return localStorage.getItem("user_type");
    },

    isAuthenticated: () => {
        return !!localStorage.getItem("token");
    },

    isCompany: () => {
        return localStorage.getItem("user_type") === 'company';
    },

    isEmployee: () => {
        return localStorage.getItem("user_type") === 'employee';
    }
};

export default authService;
