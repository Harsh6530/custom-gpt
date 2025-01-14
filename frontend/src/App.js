import React, { useState } from 'react';
import './css/App.css';

const App = () => {
    const [prompts, setPrompts] = useState([]);
    const [filledPromptsWithProjects, setFilledPromptsWithProjects] = useState([]); // Ensure this is initialized as an array
    const [promptFile, setPromptFile] = useState(null);
    const [tagFile, setTagFile] = useState(null);

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
            .then((data) => setPrompts(data.prompts || [])) // Default to empty array if undefined
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
                console.log('Response from backend:', data); // Debugging: Log the backend response
                setFilledPromptsWithProjects(data.filledPromptsWithProjects || []); // Default to empty array if undefined
            })
            .catch((error) => console.error('Error uploading tag file:', error));
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
                <ul>
                    {prompts.map((prompt, index) => (
                        <li key={index}>{prompt}</li>
                    ))}
                </ul>

                <h2>Filled Prompts with Project Names</h2>
                {filledPromptsWithProjects.length === 0 && (
                    <p>No filled prompts available. Please upload a valid tags file.</p>
                )}
                {filledPromptsWithProjects.map((project, index) => (
                    <div key={index} className="project-section">
                        <h3>Project: {project.projectName || 'Unknown Project'}</h3> {/* Ensure projectName is safe */}
                        <ul>
                            {(project.filledPrompts || []).map((prompt, promptIndex) => ( // Default to empty array
                                <li key={promptIndex}>{prompt}</li>
                            ))}
                        </ul>
                    </div>
                ))}
            </header>
        </div>
    );
};

export default App;
