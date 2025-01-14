import React, { useState } from 'react';
import './css/App.css';

const App = () => {
    const [prompts, setPrompts] = useState([]);
    const [filledPromptsWithProjects, setFilledPromptsWithProjects] = useState([]);
    const [promptFile, setPromptFile] = useState(null);
    const [tagFile, setTagFile] = useState(null);
    const [downloadLinks, setDownloadLinks] = useState([]);

    const handlePromptFileChange = (e) => {
        setPromptFile(e.target.files[0]);
    };

    const handleTagFileChange = (e) => {
        setTagFile(e.target.files[0]);
    };

    const handleUploadPrompts = () => {
        if (!promptFile) return alert('Please select a prompt file first.');

        const formData = new FormData();
        formData.append('file', promptFile);

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

        const formData = new FormData();
        formData.append('file', tagFile);

        fetch('http://localhost:5000/api/upload-tags', {
            method: 'POST',
            body: formData,
        })
            .then((response) => response.json())
            .then((data) => {
                console.log('Response from backend:', data);
                setFilledPromptsWithProjects(data.filledPromptsWithProjects || []);
            })
            .catch((error) => console.error('Error uploading tag file:', error));
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
        <div className="App">
            <header className="App-header">
                <h1>Upload Excel Files</h1>

                <h2>Step 1: Upload Prompt File</h2>
                <input type="file" accept=".xlsx, .xls" onChange={handlePromptFileChange} />
                <button onClick={handleUploadPrompts}>Upload Prompts</button>

                <h2>Step 2: Upload Tag File</h2>
                <input type="file" accept=".xlsx, .xls" onChange={handleTagFileChange} />
                <button onClick={handleUploadTags}>Upload Tags</button>

                <h2>Extracted Prompts</h2>
                {Array.isArray(prompts) && prompts.length > 0 ? (
                    <ul>
                        {prompts.map((prompt, index) => (
                            <li key={index}>{prompt}</li>
                        ))}
                    </ul>
                ) : (
                    <p>No prompts uploaded yet.</p>
                )}

                <h2>Filled Prompts with Project Names</h2>
                {Array.isArray(filledPromptsWithProjects) && filledPromptsWithProjects.length > 0 ? (
                    filledPromptsWithProjects.map((project, index) => (
                        <div key={index} className="project-section">
                            <h3>Project: {project.projectName || 'Unknown Project'}</h3>
                            <ul>
                                {(project.filledPrompts || []).map((prompt, promptIndex) => (
                                    <li key={promptIndex}>{prompt}</li>
                                ))}
                            </ul>
                        </div>
                    ))
                ) : (
                    <p>No filled prompts available. Please upload a valid tags file.</p>
                )}

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
    );
};

export default App;
