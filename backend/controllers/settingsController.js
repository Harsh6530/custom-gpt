const APISettings = require('../models/APIsettings');

exports.getApiSettings = async (req, res) => {
    try {
        const settings = await APISettings.findOne();
        if (!settings) return res.status(404).json({ error: 'API settings not found' });
        res.json({ apiKey: settings.apiKey, model: settings.model });
    } catch (error) {
        console.error('Error fetching API settings:', error);
        res.status(500).json({ error: 'Failed to fetch API settings' });
    }
};

exports.updateApiSettings = async (req, res) => {
    try {
        const { apiKey, model } = req.body;
        let settings = await APISettings.findOne();
        if (!settings) {
            settings = new APISettings({});
        }
        if (apiKey) settings.apiKey = apiKey;
        if (model) settings.model = model;
        await settings.save();
        res.json({ success: true, message: 'API settings updated successfully', settings });
    } catch (error) {
        console.error('Error updating API settings:', error);
        res.status(500).json({ error: 'Failed to update API settings' });
    }
}; 