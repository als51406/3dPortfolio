import React from 'react';

interface LoadingFallbackProps {
  progress?: number;
  message?: string;
}

/**
 * 3D 모델 로딩 중 표시되는 폴백 UI
 * Suspense fallback으로 사용
 * 
 * @param progress - 로딩 진행률 (0-100)
 * @param message - 표시할 메시지
 */
const LoadingFallback: React.FC<LoadingFallbackProps> = ({ 
  progress = 0, 
  message = '로딩 중...' 
}) => {
  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#000',
      zIndex: 10
    }}>
      {/* 로딩 스피너 */}
      <div style={{
        width: '60px',
        height: '60px',
        border: '4px solid rgba(255, 255, 255, 0.1)',
        borderTop: '4px solid #007AFF',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        marginBottom: '20px'
      }} />
      
      {/* 메시지 */}
      <p style={{
        color: '#fff',
        fontSize: '16px',
        fontWeight: 500,
        marginBottom: '10px',
        fontFamily: "'Noto Sans', sans-serif"
      }}>
        {message}
      </p>
      
      {/* 진행률 표시 (0보다 클 때만) */}
      {progress > 0 && (
        <>
          <div style={{
            width: '200px',
            height: '4px',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '2px',
            overflow: 'hidden',
            marginBottom: '10px'
          }}>
            <div style={{
              width: `${progress}%`,
              height: '100%',
              backgroundColor: '#007AFF',
              transition: 'width 0.3s ease',
              borderRadius: '2px'
            }} />
          </div>
          
          <span style={{
            color: '#86868B',
            fontSize: '14px',
            fontWeight: 500
          }}>
            {Math.round(progress)}%
          </span>
        </>
      )}
      
      {/* 애니메이션 정의 */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default LoadingFallback;
