import api from '../Api/api';

export const pipeMillAPI = {
    // Submit Pipe Mill data
    submitPipeMill: (data) => {
        return api.post('/pipe-mill', data, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    },

    // Get Pipe Mill data
    getPipeMillData: () => {
        return api.get('/pipe-mill');
    },

    // Get Pipe Mill by ID
    getPipeMillById: (id) => {
        return api.get(`/pipe-mill/${id}`);
    },

    // Update Pipe Mill data
    updatePipeMill: (id, data) => {
        return api.put(`/pipe-mill/${id}`, data, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    }
};