import api from '../Api/api';

export const qcLabAPI = {
    // Submit QC Lab test data
    submitQCLabTest: (formData) => {
        return api.post('/qc-lab-samples', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    },

    // Get QC Lab test history
    getQCLabHistory: () => {
        return api.get('/qc-lab-samples');
    },

    // Get QC Lab test by ID
    getQCLabTestById: (id) => {
        return api.get(`/qc-lab-samples/${id}`);
    },

    // Update QC Lab test
    updateQCLabTest: (id, data) => {
        return api.put(`/qc-lab-samples/${id}`, data);
    },

    // Delete QC Lab test
    deleteQCLabTest: (id) => {
        return api.delete(`/qc-lab-samples/${id}`);
    }
};