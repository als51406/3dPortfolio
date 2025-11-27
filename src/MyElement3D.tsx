

import { useGLTF } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useRef, useEffect, useMemo, useState, useLayoutEffect } from "react";
import * as THREE from "three";

// 모델 URL
const MODEL_URL = "/models/apple_watch_ultra_2.glb";

interface MyElement3DProps {
  scale?: number; // 반응형 스케일
}

function MyElement3D({ scale = 1 }: MyElement3DProps) {
    const [isReady, setIsReady] = useState(false);
    const model1 = useGLTF(MODEL_URL);
    const light = useRef<THREE.PointLight>(null);
    const { invalidate } = useThree();
    
    // 모델 복제를 한 번만 수행 (메모리 최적화)
    const clonedScenes = useMemo(() => {
      if (model1 && 'scene' in model1 && model1.scene) {
        const scenes = Array.from({ length: 8 }).map(() => model1.scene.clone());
        return scenes;
      }
      return [];
    }, [model1]);
    
    // 레이아웃 준비 후 렌더링 활성화 (단순하고 안정적인 로직)
    useLayoutEffect(() => {
      if (clonedScenes.length > 0 && !isReady) {
        setIsReady(true);
        
        if (process.env.NODE_ENV === 'development') {
          console.log('🔄 MyElement3D: 8개 모델 클론 완료, 렌더링 준비');
        }
      }
    }, [clonedScenes, isReady]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const smallSpherePivot = state.scene.getObjectByName("smallSpherePivot") as THREE.Object3D | undefined;
    if (smallSpherePivot) {
      smallSpherePivot.rotation.y = THREE.MathUtils.degToRad(time * 50);
      if (smallSpherePivot.children[0] && light.current) {
        (smallSpherePivot.children[0] as THREE.Mesh).getWorldPosition(light.current.position);
      }
    }
  });
  
  // 모델이 준비될 때까지 기다림
  if (!isReady || clonedScenes.length === 0) {
    return null;
  }

  return (
    <>
    
      {/* <OrbitControls enableZoom={false} makeDefault/> */}
      {/* <directionalLight
        color="#ffffff"
        intensity={0.3}
        position={[2, 2, 2]}
      /> */}

      <pointLight
        ref={light}
        color="#ffffff"
        intensity={7}
        position={[0, 5, 0]}
        distance={10} // 빛의 최대 거리(퍼짐 범위)
        decay={0.8}   // 빛의 감쇠(자연스러운 퍼짐)
      />
    
        {/* 바닥 메쉬 */}
      <mesh rotation-x={THREE.MathUtils.degToRad(-90)}>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial
          color={"#2c3e50"}
          roughness={0.8}
          metalness={0}
          side={THREE.DoubleSide}
        />
      </mesh>

        {/* 중심 구 */}
      <mesh rotation-x={THREE.MathUtils.degToRad(-90)}>
        <sphereGeometry args={[1.5, 64, 64, 0, Math.PI]} />
        <meshPhysicalMaterial
          color="#ffffff"
          roughness={0}
          metalness={0.5}
          transmission={0.7} // 유리 투명도
          transparent={true} // 투명도(알파값)적용 여부
          opacity={0.3}
          ior={1.5} // 굴절률(유리)
          thickness={0.5} // 두께
          reflectivity={1} //반사율 조절 0(반사없음)~1(최대반사)
        />
      </mesh>
    {/* 시계 원형 배치 */}
      {clonedScenes.map((scene, index) => {
        const angle = THREE.MathUtils.degToRad(45 * index);
        const radius = 3 * scale; // 반응형 스케일 적용
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;

        // 중심(0,0,0)에서 해당 위치로 향하는 벡터의 각도 계산
        const lookAtVec = new THREE.Vector3(x, 0.5, z);
        const targetVec = new THREE.Vector3(0, 0.5, 0);
        const dir = targetVec.clone().sub(lookAtVec).normalize();
        const quaternion = new THREE.Quaternion().setFromUnitVectors(
            new THREE.Vector3(0, 0, 1), // 기본 forward 방향
            dir
        );
        const euler = new THREE.Euler().setFromQuaternion(quaternion);

        return (
          <group
            key={index}
            position={[x, 0.5, z]}
            rotation={[euler.x, euler.y, euler.z]}
          >
            <primitive object={scene} scale={12 * scale} />
          </group>
        );
      })}

      <group name="smallSpherePivot">
        <mesh position={[3, 0.5, 0]}>
          <sphereGeometry args={[0.3, 32, 32]} />
          <meshPhysicalMaterial
            color="#fff0fc"
            roughness={0}
            metalness={0.2}
            emissive="#4f09f3"
            emissiveIntensity={2}
            transparent={true}
            opacity={0.7}
            transmission={0.8}
            ior={1.2}
            reflectivity={0.5}
            clearcoat={1}
            clearcoatRoughness={0}
          />
        </mesh>
        {/* Glow 효과를 위한 추가 구 */}
        <mesh position={[3, 0.5, 0]}>
          <sphereGeometry args={[0.35, 32, 32]} />
          <meshBasicMaterial color="#4f09f3" transparent opacity={0.3} />
        </mesh>
      </group>
    </>
  );
}

export default MyElement3D;