

import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";


// const torusGeometry = new THREE.TorusGeometry(0.4, 0.1, 32, 32);
// const torusMaterial = new THREE.MeshStandardMaterial({
//   color: "#9b59b6",
//   roughness: 0.5,
//   metalness: 0.9,
// });

// 모델 URL
const MODEL_URL = "/models/apple_watch_ultra_2.glb";

// 개발 환경에서 GLTFLoader 캐시 강제 초기화
if (process.env.NODE_ENV === 'development') {
  try {
    useGLTF.clear(MODEL_URL);
  } catch (e) {
    console.log('캐시 클리어 무시:', e);
  }
}

// 모델 사전 로드 (메인뷰용)
useGLTF.preload(MODEL_URL);

function MyElement3D() {
    const model1 = useGLTF(MODEL_URL);
    // Note: model2와 model3는 현재 사용되지 않지만, 향후 확장을 위해 주석 처리
    // const model2 = useGLTF("/models/samsung__galaxy__watch_5.glb");
    // const model3 = useGLTF("/models/samsung__galaxy__watch_5.glb");
  const light = useRef<THREE.PointLight>(null);

  // useHelper(light as React.RefObject<THREE.PointLight>, THREE.PointLightHelper, 0.7); //빛의 가이드라인

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
      {Array.from({ length: 8 }).map((_, index) => {
        const angle = THREE.MathUtils.degToRad(45 * index);
        const radius = 3;
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


        // model1.scene이 존재하는지 타입 가드
        if (model1 && 'scene' in model1 && model1.scene) {
    return (
      <group
        key={index}
        position={[x, 0.5, z]}
        rotation={[euler.x, euler.y, euler.z]}
      >
        <primitive object={model1.scene.clone()} scale={12} />
      </group>
    );
  }
  return null;
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