import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

interface CanvasLoaderProps {
  message?: string;
}

/**
 * Three.js Canvas 내부에서 사용하는 로딩 컴포넌트
 * Suspense fallback으로 사용 가능
 * 
 * @param message - 표시할 메시지
 */
const CanvasLoader: React.FC<CanvasLoaderProps> = ({ 
  message = '로딩 중...' 
}) => {
  const meshRef = useRef<THREE.Mesh>(null);

  // 회전 애니메이션
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.5;
      meshRef.current.rotation.y += delta * 0.3;
    }
  });

  return (
    <>
      {/* 3D 로딩 스피너 (육면체) */}
      <mesh ref={meshRef}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial 
          color="#007AFF" 
          wireframe 
          transparent 
          opacity={0.6}
        />
      </mesh>

      {/* HTML 오버레이 (메시지) */}
      <Html center>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '15px',
          padding: '20px',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          borderRadius: '10px',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          minWidth: '200px'
        }}>
          {/* 회전 스피너 */}
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid rgba(255, 255, 255, 0.1)',
            borderTop: '3px solid #007AFF',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          
          {/* 메시지 */}
          <p style={{
            color: '#fff',
            fontSize: '14px',
            fontWeight: 500,
            margin: 0,
            textAlign: 'center',
            fontFamily: "'Noto Sans', sans-serif"
          }}>
            {message}
          </p>
        </div>

        {/* 애니메이션 정의 */}
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </Html>

      {/* 조명 (스피너가 보이도록) */}
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
    </>
  );
};

export default CanvasLoader;
