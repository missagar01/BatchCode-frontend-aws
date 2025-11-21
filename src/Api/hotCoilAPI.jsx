import api from '../Api/api';

export const hotCoilAPI = {
    // Submit Hot Coil data
    submitHotCoil: (data) => {
        return api.post('/hot-coil', data);
    },

    // Get Hot Coil history
    getHotCoilHistory: () => {
        return api.get('/hot-coil');
    },

    // Get Hot Coil by ID
    getHotCoilById: (id) => {
        return api.get(`/hot-coil/${id}`);
    }
};