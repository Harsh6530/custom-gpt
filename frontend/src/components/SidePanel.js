import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './SidePanel.css'; // Import the external CSS file

const SidePanel = () => {
    const [projects, setProjects] = useState([]);
    const [newProjectName, setNewProjectName] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetch('http://localhost:5000/api/projects')
            .then((response) => response.json())
            .then((data) => setProjects(data))
            .catch((error) => console.error('Error fetching projects:', error));
    }, []);

    const handleAddProject = () => {
        if (!newProjectName.trim()) {
            alert('Project name cannot be empty.');
            return;
        }

        fetch('http://localhost:5000/api/projects', {
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

    const handleProjectClick = (projectName) => {
        navigate(`/${projectName}`);
    };

    return (
        <div className="side-panel">
            {/* <h2 className="side-panel-heading">Projects</h2> */}
            <div className="project-list">
                {projects.map((project) => (
                    <div
                        key={project._id}
                        className="project-item"
                        onClick={() => handleProjectClick(project.projectName)}
                    >
                        {project.projectName}
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
