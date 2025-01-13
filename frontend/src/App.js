import React, { useState } from "react";
import axios from "axios";
import "./css/App.css"; // Importing the CSS file

const App = () => {
  const [promptsFile, setPromptsFile] = useState(null);
  const [tagsFile, setTagsFile] = useState(null);
  const [parsedProjects, setParsedProjects] = useState([]);
  const [loading, setLoading] = useState(false);

  const uploadFile = async (file, endpoint) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await axios.post(`http://localhost:5000/${endpoint}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  };

  const handlePromptsUpload = async () => {
    if (promptsFile) {
      setLoading(true);
      try {
        const data = await uploadFile(promptsFile, "upload-prompts");
        console.log("Prompts uploaded:", data);
      } catch (error) {
        console.error("Error uploading prompts:", error);
      }
      setLoading(false);
    }
  };

  const handleTagsUpload = async () => {
    if (tagsFile) {
      setLoading(true);
      try {
        const data = await uploadFile(tagsFile, "upload-tags");
        console.log("Parsed Projects Response:", data);
        setParsedProjects(data.parsedProjects);
      } catch (error) {
        console.error("Error uploading tags:", error);
      }
      setLoading(false);
    }
  };

  const handleGenerateResponses = async (projectName, promptIndex) => {
    setLoading(true);
    try {
      const selectedPrompt = parsedProjects
        .find((project) => project.projectName === projectName)
        .parsedPrompts[promptIndex];

      const response = await axios.post("http://localhost:5000/generate-responses", {
        prompts: [selectedPrompt.parsedPrompt],
      });

      setParsedProjects((prevProjects) =>
        prevProjects.map((project) =>
          project.projectName === projectName
            ? {
                ...project,
                parsedPrompts: project.parsedPrompts.map((p, i) =>
                  i === promptIndex ? { ...p, response: response.data.responses[0].response } : p
                ),
              }
            : project
        )
      );

      console.log(`Response for ${projectName} - Prompt ${promptIndex}:`, response.data.responses);
    } catch (error) {
      console.error("Error generating response:", error);
    }
    setLoading(false);
  };

  return (
    <div className="container">
      <h1>Custom GPT Prompt Manager</h1>

      <div className="file-upload">
        <h2>Upload Prompts File</h2>
        <input type="file" onChange={(e) => setPromptsFile(e.target.files[0])} />
        <button onClick={handlePromptsUpload} disabled={loading}>
          {loading ? "Uploading..." : "Upload Prompts"}
        </button>
      </div>

      <div className="file-upload">
        <h2>Upload Tags File</h2>
        <input type="file" onChange={(e) => setTagsFile(e.target.files[0])} />
        <button onClick={handleTagsUpload} disabled={loading}>
          {loading ? "Uploading..." : "Upload Tags"}
        </button>
      </div>

      <div className="projects">
        <h2>Parsed Projects and Prompts</h2>
        {parsedProjects.length > 0 ? (
          parsedProjects.map((project) => (
            <div key={project.projectName} className="project">
              <h3>Project: {project.projectName}</h3>
              {project.parsedPrompts.map((prompt, index) => (
                <div key={index} className="prompt">
                  <strong>Original:</strong> {prompt.Prompt} <br />
                  <strong>Parsed:</strong> {prompt.parsedPrompt} <br />
                  <strong>Response:</strong> {prompt.response || "Pending..."} <br />
                  <button
                    onClick={() => handleGenerateResponses(project.projectName, index)}
                    disabled={loading}
                  >
                    {loading ? "Generating..." : "Generate Response"}
                  </button>
                </div>
              ))}
            </div>
          ))
        ) : (
          <p>No projects found. Please upload valid files.</p>
        )}
      </div>
    </div>
  );
};

export default App;
