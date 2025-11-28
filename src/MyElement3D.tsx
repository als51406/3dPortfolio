

import React from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useRef, useEffect, useMemo, useState } from "react";
import * as THREE from "three";

// 모델 URL
const MODEL_URL = "/models/apple_watch_ultra_2.glb";

interface MyElement3DProps {
  scale?: number; // 반응형 스케일
}

// ✅ React.memo 제거: isModelReady 상태 변경 시 리렌더링 필요
const MyElement3D = ({ scale = 1 }: MyElement3DProps) => {
    // ✅ suspense: false로 명시적 비활성화 (수동 로딩 관리)
    const model1 = useGLTF(MODEL_URL, false);
    const light = useRef<THREE.PointLight>(null);
    const [isModelReady, setIsModelReady] = useState(false);
    const [renderKey, setRenderKey] = useState(0); // ✅ 강제 리렌더링용
    
    // ✅ 모델이 실제로 사용 가능한 상태인지 폴링으로 체크
    useEffect(() => {
      let checkCount = 0;
      const maxChecks = 50; // 5초
      
      const checkInterval = setInterval(() => {
        checkCount++;
        
        if (model1 && model1.scene && model1.scene.children && model1.scene.children.length > 0) {
          // ✅ scene 내부에 실제 mesh가 있는지 확인
          let hasMesh = false;
          model1.scene.traverse((child: any) => {
            if (child.isMesh) {
              hasMesh = true;
            }
          });
          
          if (hasMesh) {
            clearInterval(checkInterval);
            
            if (process.env.NODE_ENV === 'development') {
              console.log('✅ [MyElement3D] 모델 완전히 준비됨:', {
                hasScene: !!model1.scene,
                childrenCount: model1.scene.children.length,
                hasMesh,
                checkCount,
              });
            }
            
            // ✅ 상태 변경으로 리렌더링 트리거
            setIsModelReady(true);
            
            // ✅ 안전장치: 200ms 후 한 번 더 강제 리렌더링
            setTimeout(() => {
              setRenderKey(prev => prev + 1);
              if (process.env.NODE_ENV === 'development') {
                console.log('🔄 [MyElement3D] 강제 리렌더링 트리거');
              }
            }, 200);
          } else if (process.env.NODE_ENV === 'development' && checkCount % 10 === 0) {
            console.log('⏳ [MyElement3D] scene은 있지만 mesh 없음:', checkCount);
          }
        } else if (process.env.NODE_ENV === 'development' && checkCount % 10 === 0) {
          console.log('⏳ [MyElement3D] 모델 폴링 중...', checkCount, {
            hasModel: !!model1,
            hasScene: !!model1?.scene,
            childrenCount: model1?.scene?.children?.length || 0,
          });
        }
        
        // 최대 횟수 도달
        if (checkCount >= maxChecks) {
          clearInterval(checkInterval);
          if (process.env.NODE_ENV === 'development') {
            console.error('❌ [MyElement3D] 모델 로드 타임아웃');
          }
        }
      }, 100);
      
      return () => clearInterval(checkInterval);
    }, [model1]);
    
    // 모델 복제를 한 번만 수행 (메모리 최적화)
    // ✅ model1.scene을 명시적으로 의존성에 추가
    const clonedScenes = useMemo(() => {
      // ✅ isModelReady 상태 체크 추가
      if (!isModelReady || !model1 || !model1.scene || !model1.scene.children.length) {
        if (process.env.NODE_ENV === 'development') {
          console.log('⏳ [MyElement3D] 모델 대기 중...');
        }
        return [];
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 [MyElement3D] 모델 클론 시작...');
      }
        
        const scenes = Array.from({ length: 8 }).map(() => {
          const clonedScene = model1.scene.clone();
          
          // ✅ 모든 Material을 visible하게 강제 설정 (렌더링 보장)
          clonedScene.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh;
              mesh.visible = true; // 강제로 보이게
              
              // Material이 배열인 경우와 단일인 경우 모두 처리
              const materials = Array.isArray(mesh.material) 
                ? mesh.material 
                : [mesh.material];
              
              materials.forEach((material) => {
                if (material) {
                  material.visible = true;
                  // 투명도가 0인 경우 1로 설정
                  if (material.opacity !== undefined && material.opacity === 0) {
                    material.opacity = 1;
                  }
                  // needsUpdate로 변경사항 적용
                  material.needsUpdate = true;
                }
              });
            }
          });
          
          return clonedScene;
        });
        
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ [MyElement3D] 모델 클론 완료:', scenes.length, '개');
          // 첫 번째 모델의 Material 상태 로깅
          if (scenes.length > 0) {
            scenes[0].traverse((child) => {
              if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh;
                const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
                console.log('  - Mesh visible:', mesh.visible, '| Materials:', materials.length);
              }
            });
          }
        }
        
        return scenes;
      
      return [];
    }, [model1, model1.scene, isModelReady]); // ✅ 의존성 수정
    
    // ✅ clonedScenes 생성 완료 시 로그 + Three.js Scene에 추가 확인
    useEffect(() => {
      if (clonedScenes.length > 0) {
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ [MyElement3D] clonedScenes 생성 완료:', clonedScenes.length, '개');
          console.log('  - 첫 번째 scene 타입:', clonedScenes[0].type);
          console.log('  - 첫 번째 scene children:', clonedScenes[0].children.length);
        }
      }
    }, [clonedScenes]);

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
  
  // ✅ 모델이 로드되지 않았으면 null 반환
  if (!model1 || !model1.scene || clonedScenes.length === 0) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ [MyElement3D] 렌더링 차단:', {
        hasModel: !!model1,
        hasScene: !!model1?.scene,
        clonedScenesLength: clonedScenes.length,
        isModelReady,
      });
    }
    return null;
  }

  // ✅ 렌더링 직전 최종 로그
  if (process.env.NODE_ENV === 'development') {
    console.log('🎨 [MyElement3D] JSX 렌더링 시작:', {
      clonedScenesCount: clonedScenes.length,
      scale,
      renderKey,
    });
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
      {clonedScenes.length > 0 && clonedScenes.map((scene, index) => {
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
        
        // ✅ 첫 번째 시계만 상세 로그
        if (index === 0 && process.env.NODE_ENV === 'development') {
          console.log('🕐 [MyElement3D] 첫 번째 시계 렌더링:', {
            position: [x, 0.5, z],
            scale: 12 * scale,
            sceneType: scene.type,
            sceneChildren: scene.children.length,
          });
        }

        return (
          <group
            key={`watch-${index}-${renderKey}`}
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
};

export default MyElement3D;