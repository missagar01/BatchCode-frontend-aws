import api from '../Api/api';

export const reCoilAPI = {
    // Submit ReCoil data
    submitReCoil: (data) => {
        return api.post('/re-coiler', data);
    },

    // Get ReCoil history
    getReCoilHistory: () => {
        return api.get('/re-coiler');
    },

    // Get ReCoil by ID
    getReCoilById: (id) => {
        return api.get(`/re-coiler/${id}`);
    }
};