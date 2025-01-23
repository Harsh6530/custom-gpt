import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './SidePanel.css'; // Import the external CSS file

const SidePanel = () => {
    const [projects, setProjects] = useState([]);
    const [newProjectName, setNewProjectName] = useState('');
    const navigate = useNavigate();
    const baseURL = process.env.REACT_APP_BACKEND_URL;

    useEffect(() => {
        fetch(`${baseURL}/api/projects`)
            .then((response) => response.json())
            .then((data) => setProjects(data))
            .catch((error) => console.error('Error fetching projects:', error));
    }, []);

    const handleAddProject = () => {
        if (!newProjectName.trim()) {
            alert('Project name cannot be empty.');
            return;
        }

        fetch(`${baseURL}/api/projects`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ projectName: newProjectName }),
        })
            .then((response) => response.json())
            .then((data) => {
                setProjects((prevProjects) => [...prevProjects, data]);
                setNewProjectName('');
            })
            .catch((error) => console.error('Error adding project:', error));
    };

    const handleDeleteProject = (projectId, projectName) => {
        const confirmDelete = window.confirm(
            `Are you sure you want to delete the project "${projectName}"? This action cannot be undone.`
        );

        if (!confirmDelete) return;

        fetch(`${baseURL}/api/projects/${projectId}`, {
            method: 'DELETE',
        })
            .then((response) => {
                if (response.ok) {
                    setProjects((prevProjects) =>
                        prevProjects.filter((project) => project._id !== projectId)
                    );
                    alert(`Project "${projectName}" has been deleted.`);
                    window.location.reload();
                } else {
                    throw new Error('Failed to delete the project');
                }
            })
            .catch((error) => console.error('Error deleting project:', error));
    };

    const handleProjectClick = (projectName) => {
        navigate(`/${projectName}`);
    };

    return (
        <div className="side-panel">
            <div className="project-list">
                {projects.map((project) => (
                    <div key={project._id} className="project-item">
                        <span onClick={() => handleProjectClick(project.projectName)}>
                            {project.projectName}
                        </span>
                        <button
                            className="delete-button"
                            onClick={(e) => {
                                e.stopPropagation(); // Prevents triggering the project click event
                                handleDeleteProject(project._id, project.projectName);
                            }}
                        >
                            🗑️
                        </button>
                    </div>
                ))}
            </div>
            <div className="add-project-section">
                <input
                    type="text"
                    placeholder="New project name"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    className="project-input"
                />
                <button onClick={handleAddProject} className="add-project-button">
                    Create Project
                </button>
            </div>
        </div>
    );
};

export default SidePanel;
