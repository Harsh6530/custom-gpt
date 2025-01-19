import React from 'react';
import './css/HomePage.css';

const HomePage = () => {
    return (
        <div className="home-page">
            <div className="home-page-container">
                <div className="animated-background">
                    <div className="circle one"></div>
                    <div className="circle two"></div>
                    <div className="circle three"></div>
                </div>
                <div className="content">
                    <h1 className="fade-in">Welcome to Custom GPT!</h1>
                    <p className="slide-up">Select a project from the side panel or create a new one to get started.</p>
                    {/* <button className="pulse-button">Get Started</button> */}
                </div>
            </div>
        </div>
    );
};

export default HomePage;
