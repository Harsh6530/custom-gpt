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
                {/* Static Header */}
                <header className="static-header">
                    <div className="header-title">Custom GPT</div>
                </header>
                
                {/* SidePanel to appear on all screens */}
                <SidePanel />

                {/* Main Content */}
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
