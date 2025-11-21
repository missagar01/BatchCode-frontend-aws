import api from '../Api/api';

export const laddleAPI = {
    // Submit Ladle checklist data
    submitLaddleChecklist: (data) => {
        return api.post('/laddle-checklist', data);
    },

    // Get all Ladle checklist data
    getLaddleChecklists: () => {
        return api.get('/laddle-checklist');
    },

    // Get Ladle checklist by ID
    getLaddleChecklistById: (id) => {
        return api.get(`/laddle-checklist/${id}`);
    },

    // Get Ladle checklist by ladle number
    getLaddleChecklistByNumber: (laddleNumber) => {
        return api.get(`/laddle-checklist/laddle/${laddleNumber}`);
    },

    // Update Ladle checklist
    updateLaddleChecklist: (id, data) => {
        return api.put(`/laddle-checklist/${id}`, data);
    },

    // Delete Ladle checklist
    deleteLaddleChecklist: (id) => {
        return api.delete(`/laddle-checklist/${id}`);
    }
};