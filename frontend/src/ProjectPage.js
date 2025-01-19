import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import "./css/ProjectPage.css";
import Alert from "./components/Alert";
import Loading from "./components/Loading";

const ProjectPage = () => {
    const { projectName } = useParams(); // Retrieve the project name from the route params
    const [prompts, setPrompts] = useState([]);
    const [filledPromptsWithProjects, setFilledPromptsWithProjects] = useState([]);
    const [promptFile, setPromptFile] = useState(null);
    const [tagFile, setTagFile] = useState(null);
    const [downloadLinks, setDownloadLinks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [alert, setAlert] = useState({ show: false, message: "", type: "" });
    const [isCollapsed, setIsCollapsed] = useState(false); // State to track collapse status
    const baseURL = process.env.REACT_APP_BACKEND_URL;

    // Fetch prompts when the component loads
    useEffect(() => {
        setLoading(true);
        fetch(`${baseURL}/api/fetch-prompts/${projectName}`)
            .then((response) => response.json())
            .then((data) => setPrompts(data.prompts || []))
            .catch((error) => {
                console.error("Error fetching prompts:", error);
                showAlert("Failed to fetch prompts.", "error");
            })
            .finally(() => setLoading(false));
    }, [projectName]);

    const showAlert = (message, type) => {
        setAlert({ show: true, message, type });
        setTimeout(() => setAlert({ show: false, message: "", type: "" }), 3000);
    };

    const handlePromptFileChange = (e) => {
        setPromptFile(e.target.files[0]);
    };

    const toggleUploadSection = () => {
        setIsCollapsed((prev) => !prev);
    };

    const handleTagFileChange = (e) => {
        setTagFile(e.target.files[0]);
    };

    // Function to delete all files in the Responses directory
    const deleteResponsesOnReload = () => {
        fetch(`${baseURL}/api/delete-responses`, {
            method: "DELETE",
        })
            .then((response) => response.json())
            .then((data) => {
                console.log("Responses deleted:", data);
                // showAlert("Previous responses cleared successfully.", "success");
            })
            .catch((error) => {
                console.error("Error deleting responses:", error);
                // showAlert("Failed to clear previous responses.", "error");
            });
    };

    const handleUploadPrompts = () => {
        if (!promptFile) return showAlert("Please select a prompt file first.", "error");
        if (!projectName) return showAlert("Project name is missing.", "error");

        const formData = new FormData();
        formData.append("file", promptFile);
        formData.append("projectName", projectName);

        setLoading(true);

        fetch(`${baseURL}/api/upload-prompts`, {
            method: "POST",
            body: formData,
        })
            .then((response) => response.json())
            .then((data) => {
                setPrompts(data.prompts || []);
                showAlert("Prompts uploaded successfully!", "success");
            })
            .catch((error) => {
                console.error("Error uploading prompt file:", error);
                showAlert("Failed to upload prompts.", "error");
            })
            .finally(() => setLoading(false));
    };

    // Call the delete API when the page loads
    useEffect(() => {
        deleteResponsesOnReload();
    }, []);

    const handleUploadTags = () => {
        if (!tagFile) return showAlert("Please select a tag file first.", "error");
        if (!projectName) return showAlert("Project name is missing.", "error");

        const formData = new FormData();
        formData.append("file", tagFile);
        formData.append("projectName", projectName);

        setLoading(true);

        fetch(`${baseURL}/api/upload-tags`, {
            method: "POST",
            body: formData,
        })
            .then((response) => {
                if (!response.ok) {
                    return response.json().then((error) => {
                        throw new Error(error.error);
                    });
                }
                return response.json();
            })
            .then((data) => {
                setFilledPromptsWithProjects(data.filledPromptsWithProjects || []);
                showAlert("Tags uploaded successfully!", "success");
            })
            .catch((error) => {
                console.error("Error uploading tag file:", error.message);
                showAlert("Failed to upload tags.", "error");
            })
            .finally(() => setLoading(false));
    };

    const handleGenerateResponses = () => {
        if (!filledPromptsWithProjects || filledPromptsWithProjects.length === 0) {
            return showAlert("Upload a tag file first to generate responses.", "error");
        }

        setLoading(true);

        fetch(`${baseURL}/api/generate-responses`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ filledPromptsWithProjects }),
        })
            .then((response) => response.json())
            .then((data) => {
                const nameCount = {};
                const updatedLinks = data.projectFiles.map((file) => {
                    const baseName = file.projectName;

                    if (!nameCount[baseName]) {
                        nameCount[baseName] = 0;
                    } else {
                        nameCount[baseName] += 1;
                    }

                    const isDuplicate = data.projectFiles.filter((f) => f.projectName === baseName).length > 1;
                    const displayName = isDuplicate
                        ? `${baseName}(${nameCount[baseName]})`
                        : baseName;

                    return { ...file, displayName };
                });

                setDownloadLinks(updatedLinks || []);
                showAlert("Responses generated successfully!", "success");
            })
            .catch((error) => {
                console.error("Error generating responses:", error);
                showAlert("Failed to generate responses.", "error");
            })
            .finally(() => setLoading(false));
    };

    const handleDownload = (fileName) => {
        const link = document.createElement("a");
        link.href = `${baseURL}/api/download/${encodeURIComponent(fileName)}`;
        link.click();
    };

    return (
        <div className="project-page">
            {loading && <Loading />}
            {alert.show && <Alert message={alert.message} type={alert.type} onClose={() => setAlert({ show: false })} />}
            <header className="static-header">
                <div className="header-title">Custom GPT</div>
                <div className="header-project-name">Current Project: {projectName}</div>
            </header>

            <div className="content">
                <header className="project-header">
                    {Array.isArray(prompts) && prompts.length > 0 ? (
                        <ul>
                            {prompts.map((prompt, index) => (
                                <li key={index}>{prompt}</li>
                            ))}
                        </ul>
                    ) : (
                        <p>No prompts uploaded yet.</p>
                    )}
                </header>

                {/* <button
                    className="toggle-button"
                    onClick={toggleUploadSection}
                >
                    {isCollapsed ? "Show Upload Section" : "Hide Upload Section"}
                </button> */}

                <div className={`upload-section ${isCollapsed ? "collapsed" : "expanded"}`}>
                    <div className="upload-container">
                        <h2>Step 1: Upload Prompt File</h2>
                        <input type="file" accept=".xlsx, .xls" onChange={handlePromptFileChange} />
                        
                        <button onClick={handleUploadPrompts}>Upload Prompts</button>
                    </div>

                    <button className="arrow-button">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="4" y1="12" x2="20" y2="12"></line>
                                <polyline points="14 6 20 12 14 18"></polyline>
                            </svg>
                    </button>
                    
                    <div className="upload-container">
                        <h2>Step 2: Upload Tag File</h2>
                
                        <input type="file" accept=".xlsx, .xls" onChange={handleTagFileChange} />
                        <button onClick={handleUploadTags}>Upload Tags</button>
                        <button className="arrow-button" onClick={handleGenerateResponses}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="4" y1="12" x2="20" y2="12"></line>
                                <polyline points="14 6 20 12 14 18"></polyline>
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Toggle Arrow */}
                <div className="toggle-arrow" onClick={toggleUploadSection}>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={`arrow-icon ${isCollapsed ? "rotate-up" : "rotate-down"}`}
                    >
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </div>

                <div className="download-section">
                    <h2>Download Word Files</h2>
                    {Array.isArray(downloadLinks) && downloadLinks.length > 0 ? (
                        <div className="file-list">
                            {downloadLinks.map((file, index) => (
                                <div key={index} className="file-container" onClick={() => handleDownload(file.filePath)}>
                                    <div className="file-icon">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                            <polyline points="14 2 14 8 20 8"></polyline>
                                            <line x1="12" y1="18" x2="12" y2="12"></line>
                                            <line x1="9" y1="15" x2="12" y2="18"></line>
                                            <line x1="15" y1="15" x2="12" y2="18"></line>
                                        </svg>
                                    </div>
                                    <p className="file-name">{file.displayName}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p>No files available for download. Generate responses first.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProjectPage;
