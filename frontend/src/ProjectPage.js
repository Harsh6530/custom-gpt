import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import './css/ProjectPage.css';

const ProjectPage = () => {
    const { projectName } = useParams(); // Retrieve the project name from the route params
    const [prompts, setPrompts] = useState([]);
    const [filledPromptsWithProjects, setFilledPromptsWithProjects] = useState([]);
    const [promptFile, setPromptFile] = useState(null);
    const [tagFile, setTagFile] = useState(null);
    const [downloadLinks, setDownloadLinks] = useState([]);

    // Fetch prompts when the component loads
    useEffect(() => {
        fetch(`http://localhost:5000/api/fetch-prompts/${projectName}`)
            .then((response) => response.json())
            .then((data) => setPrompts(data.prompts || []))
            .catch((error) => console.error('Error fetching prompts:', error));
    }, [projectName]);

    const handlePromptFileChange = (e) => {
        setPromptFile(e.target.files[0]);
    };

    const handleTagFileChange = (e) => {
        setTagFile(e.target.files[0]);
    };

    const handleUploadPrompts = () => {
        if (!promptFile) return alert('Please select a prompt file first.');
        if (!projectName) return alert('Project name is missing.');

        const formData = new FormData();
        formData.append('file', promptFile);
        formData.append('projectName', projectName); // Add projectName to the form data

        console.log('API request received');
        console.log('Uploaded file:', promptFile);
        console.log('Project Name:', projectName);

        fetch('http://localhost:5000/api/upload-prompts', {
            method: 'POST',
            body: formData,
        })
            .then((response) => response.json())
            .then((data) => setPrompts(data.prompts || []))
            .catch((error) => console.error('Error uploading prompt file:', error));
    };

    const handleUploadTags = () => {
        if (!tagFile) return alert('Please select a tag file first.');
        if (!projectName) return alert('Project name is missing.');
    
        const formData = new FormData();
        formData.append('file', tagFile);
        formData.append('projectName', projectName); // Include project name
    
        fetch('http://localhost:5000/api/upload-tags', {
            method: 'POST',
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
                console.log('Response from backend:', data);
                setFilledPromptsWithProjects(data.filledPromptsWithProjects || []);
            })
            .catch((error) => {
                console.error('Error uploading tag file:', error.message);
                alert(error.message); // Display the error to the user
            });
    };
    
    const handleGenerateResponses = () => {
        fetch('http://localhost:5000/api/generate-responses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filledPromptsWithProjects }),
        })
            .then((response) => response.json())
            .then((data) => {
                console.log('Generated files:', data.projectFiles);
                setDownloadLinks(data.projectFiles || []);
            })
            .catch((error) => console.error('Error generating responses:', error));
    };

    const handleDownload = (fileName) => {
        const link = document.createElement('a');
        link.href = `http://localhost:5000/api/download/${encodeURIComponent(fileName)}`;
        link.click();
    };

    return (
        <div className="project-page">
            <header className="static-header">
                <div className="header-title">Custom GPT</div>
                <div className="header-project-name">Current Project: {projectName}</div>
            </header>

            <div className="content">
                {/* <h1>Project: {projectName}</h1> */}
                <header className="project-header">
                    {/* <h2>Prompts</h2> */}
                    {Array.isArray(prompts) && prompts.length > 0 ? (
                        <ul>
                            {prompts.map((prompt, index) => (
                                <li key={index}>{prompt}</li>
                            ))}
                        </ul>
                    ) : (
                        <p>No prompts uploaded yet.</p>
                    )}
                    <h2>Step 1: Upload Prompt File</h2>
                    <input type="file" accept=".xlsx, .xls" onChange={handlePromptFileChange} />
                    <button onClick={handleUploadPrompts}>Upload Prompts</button>

                    <h2>Step 2: Upload Tag File</h2>
                    <input type="file" accept=".xlsx, .xls" onChange={handleTagFileChange} />
                    <button onClick={handleUploadTags}>Upload Tags</button>

                    <h2>Step 3: Generate Responses</h2>
                    <button onClick={handleGenerateResponses}>Generate Responses</button>

                    <h2>Download Word Files</h2>
                    {Array.isArray(downloadLinks) && downloadLinks.length > 0 ? (
                        downloadLinks.map((file, index) => (
                            <div key={index}>
                                <button onClick={() => handleDownload(file.filePath.split('/').pop())}>
                                    Download {file.projectName}
                                </button>
                            </div>
                        ))
                    ) : (
                        <p>No files available for download. Generate responses first.</p>
                    )}
                </header>
            </div>
        </div>
    );

};

export default ProjectPage;
