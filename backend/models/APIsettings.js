const mongoose = require("mongoose");

const apiSettingsSchema = new mongoose.Schema({
    apiKey: { type: String, required: true },
    model: { type: String, default: "gpt-4o" },
});

const APISettings = mongoose.model("APISettings", apiSettingsSchema);

module.exports = APISettings;
