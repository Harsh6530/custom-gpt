import React, { useState, useEffect } from "react";
import axios from "axios";
import "./css/HomePage.css";

const HomePage = () => {
    const [apiKey, setApiKey] = useState("");
    const [maskedApiKey, setMaskedApiKey] = useState("");
    const [selectedModel, setSelectedModel] = useState("gpt-3.5-turbo");
    const [userType, setUserType] = useState(localStorage.getItem("userType") || "user");
    const [message, setMessage] = useState("");
    const baseURL = process.env.REACT_APP_BACKEND_URL;

    useEffect(() => {
        axios.get(`${baseURL}/api/get-api-settings`)
            .then((response) => {
                console.log("API Settings:", response.data);
                const fullApiKey = response.data.apiKey;
                setApiKey(fullApiKey);

                // ✅ Fixed-length masking (first 2, 10 stars, last 4)
                const maskedKey = fullApiKey.length > 6
                    ? fullApiKey.slice(0, 2) + "**********" + fullApiKey.slice(-4)
                    : fullApiKey;
                
                setMaskedApiKey(maskedKey);
                setSelectedModel(response.data.model);
            })
            .catch((error) => {
                console.error("Error fetching API settings:", error);
            });
    }, []);

    // ✅ Handle API key change
    const handleApiKeyChange = (e) => {
        setApiKey(e.target.value);

        // ✅ Keep masking consistent even while typing
        const newMaskedKey =
            e.target.value.length > 6
                ? e.target.value.slice(0, 2) + "**********" + e.target.value.slice(-4)
                : e.target.value;

        setMaskedApiKey(newMaskedKey);
    };

    // ✅ Handle Model Selection
    const handleModelChange = (e) => {
        setSelectedModel(e.target.value);
    };

    // ✅ Save API Key & Model to Backend
    const saveSettings = async () => {
        try {
            console.log("Saving API Key & Model:", apiKey, selectedModel);
            const response = await axios.post(`${baseURL}/api/update-api-settings`, {
                apiKey,
                model: selectedModel
            });
            setMessage(response.data.message || "Settings saved successfully!");
        } catch (error) {
            console.error("Error saving API settings:", error);
            setMessage("Failed to save API settings.");
        }

        setTimeout(() => setMessage(""), 3000);
    };

    return (
        <div className="home-page">
            <div className="home-page-container">
                <div className="animated-background">
                    <div className="circle one"></div>
                    <div className="circle two"></div>
                    <div className="circle three"></div>
                </div>
                <div className="content">
                    <h1 className="fade-in">Welcome to Custom GPT!</h1>
                    <p className="slide-up">Select a project from the side panel or create a new one to get started.</p>

                    {/* ✅ Show API Key & Model Selection ONLY for Admin */}
                    {userType === "Admin" && (
                        <div className="api-settings">
                            <h3>🔑 OpenAI API Settings</h3>
                            <input
                                type="text"
                                placeholder="Enter your OpenAI API Key"
                                value={maskedApiKey}
                                onChange={handleApiKeyChange}
                                className="api-input"
                            />
                            <select value={selectedModel} onChange={handleModelChange} className="model-dropdown">
                                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                                <option value="gpt-4o">GPT-4</option>
                                <option value="gpt-4-turbo">GPT-4 Turbo</option>
                            </select>
                            <button onClick={saveSettings} className="save-button">Save Settings</button>
                            {message && <p className="success-message">{message}</p>}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HomePage;