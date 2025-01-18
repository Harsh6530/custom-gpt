import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import SidePanel from './components/SidePanel';
import HomePage from './HomePage';
import ProjectPage from './ProjectPage';
import './css/App.css';

const App = () => {
    return (
        <Router>
            <div className="app-container">
                {/* SidePanel is outside of Routes to ensure it appears on all screens */}
                <SidePanel />
                <main className="main-content">
                    <Routes>
                        {/* HomePage displayed when route is "/" */}
                        <Route path="/" element={<HomePage />} />

                        {/* ProjectPage displayed for any project route */}
                        <Route path="/:projectName" element={<ProjectPage />} />
                    </Routes>
                </main>
            </div>
        </Router>
    );
};

export default App;
