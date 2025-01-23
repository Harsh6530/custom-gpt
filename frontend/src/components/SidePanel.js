import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Alert from './Alert';
import Loading from './Loading';
import Confirm from './Confirm';
import './SidePanel.css';

const SidePanel = () => {
    const [projects, setProjects] = useState([]);
    const [newProjectName, setNewProjectName] = useState('');
    const [loading, setLoading] = useState(false);
    const [alert, setAlert] = useState({ show: false, message: '', type: '' });
    const [showConfirm, setShowConfirm] = useState(false); // State for confirmation modal
    const [deleteProject, setDeleteProject] = useState(null); // Store project details for deletion
    const navigate = useNavigate();
    const baseURL = process.env.REACT_APP_BACKEND_URL;

    const showAlert = (message, type) => {
        setAlert({ show: true, message, type });
        setTimeout(() => setAlert({ show: false, message: '', type: '' }), 3000);
    };

    useEffect(() => {
        setLoading(true);
        fetch(`${baseURL}/api/projects`)
            .then((response) => response.json())
            .then((data) => setProjects(data))
            .catch((error) => {
                console.error('Error fetching projects:', error);
                showAlert('Failed to fetch projects.', 'error');
            })
            .finally(() => setLoading(false));
    }, []);

    const handleAddProject = () => {
        if (!newProjectName.trim()) {
            showAlert('Project name cannot be empty.', 'error');
            return;
        }

        setLoading(true);
        fetch(`${baseURL}/api/projects`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ projectName: newProjectName }),
        })
            .then((response) => response.json())
            .then((data) => {
                setProjects((prevProjects) => [...prevProjects, data]);
                setNewProjectName('');
                showAlert('Project added successfully!', 'success');
            })
            .catch((error) => {
                console.error('Error adding project:', error);
                showAlert('Failed to add project.', 'error');
            })
            .finally(() => setLoading(false));
    };

    const confirmDeleteProject = (projectId, projectName) => {
        setDeleteProject({ projectId, projectName }); // Store project details
        setShowConfirm(true); // Show confirmation modal
    };

    const handleDeleteProject = () => {
        if (!deleteProject) return;

        setLoading(true);
        fetch(`${baseURL}/api/projects/${deleteProject.projectId}`, {
            method: 'DELETE',
        })
            .then((response) => {
                if (response.ok) {
                    setProjects((prevProjects) =>
                        prevProjects.filter((project) => project._id !== deleteProject.projectId)
                    );
                    showAlert(`Project "${deleteProject.projectName}" has been deleted.`, 'success');
                } else {
                    throw new Error('Failed to delete the project');
                }
            })
            .catch((error) => {
                console.error('Error deleting project:', error);
                showAlert('Failed to delete project.', 'error');
            })
            .finally(() => {
                setLoading(false);
                setShowConfirm(false); // Hide confirmation modal
                setDeleteProject(null); // Clear project details
            });
    };

    const handleProjectClick = (projectName) => {
        navigate(`/${projectName}`);
    };

    return (
        <div className="side-panel">
            {loading && <Loading />}
            {alert.show && <Alert message={alert.message} type={alert.type} />}
            {showConfirm && (
                <Confirm
                    message={`Are you sure you want to delete the project "${deleteProject.projectName}"?`}
                    onConfirm={handleDeleteProject}
                    onCancel={() => setShowConfirm(false)}
                />
            )}

            <div className="project-list">
                {projects.map((project) => (
                    <div key={project._id} className="project-item">
                        <span onClick={() => handleProjectClick(project.projectName)}>
                            {project.projectName}
                        </span>
                        <button
                            className="delete-button"
                            onClick={(e) => {
                                e.stopPropagation();
                                confirmDeleteProject(project._id, project.projectName);
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
