import api from '../Api/api';

export const smsAPI = {
    // Submit new SMS report
    submitSMSReport: (data) => {
        return api.post('/sms-register', data);
    },

    // Get SMS report history
    getSMSHistory: () => {
        return api.get('/sms-register'); // Adjust endpoint as per your backend
    },

    // Get SMS report by ID
    getSMSReportById: (id) => {
        return api.get(`/sms-register/${id}`);
    },

    // Update SMS report
    updateSMSReport: (id, data) => {
        return api.put(`/sms-register/${id}`, data);
    },

    // Delete SMS report
    deleteSMSReport: (id) => {
        return api.delete(`/sms-register/${id}`);
    }
};