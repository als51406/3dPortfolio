import React from 'react';
import './LoadingSpinner.css';

interface LoadingSpinnerProps {
  progress?: number;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ progress = 0 }) => {
  return (
    <div className="loading-spinner-container">
      <div className="loading-spinner">
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
      </div>
      <div className="loading-text">
        <p>Loading 3D Model...</p>
        {progress > 0 && (
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        )}
        <span className="progress-percent">{Math.round(progress)}%</span>
      </div>
    </div>
  );
};

export default LoadingSpinner;
