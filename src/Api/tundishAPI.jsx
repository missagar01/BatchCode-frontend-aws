import api from '../Api/api';

export const tundishAPI = {
    // Submit Tundish Checklist
    submitTundishChecklist: (data) => {
        return api.post('/tundish-checklist', data);
    },

    // Get Tundish Checklist history
    getTundishHistory: () => {
        return api.get('/tundish-checklist');
    },

    // Get Tundish Checklist by ID
    getTundishById: (id) => {
        return api.get(`/tundish-checklist/${id}`);
    }
};