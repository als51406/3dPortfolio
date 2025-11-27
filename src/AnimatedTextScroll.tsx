import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

const texts = [
  {
    title: "견고함의 미학",
    content: "블랙 티타늄 케이스와 사파이어 크리스탈 디스플레이가 만나, 극한의 환경에서도 변치 않는 내구성과 세련미를 선사합니다.",
  },
  {
    title: "밝고 선명한 디스플레이",
    content: "S9 칩의 도입으로 한층 밝아진 디스플레이는, 실내외 어디서나 정보를 또렷하게 확인할 수 있게 해줍니다.",
  },
  {
    title: "아웃도어를 위한 완벽한 설계",
    content: "듀얼 밴드 GPS와 최대 60시간의 배터리, 그리고 방수 설계까지, 디자인의 모든 요소가 모험을 위한 최적의 경험을 제공합니다.",
  },
];

export default function AnimatedTextScroll() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    container: containerRef,
  });

  // 각 아이템의 기준 offset 계산
  const itemHeight = 200;
  const offsets = [
    window.innerHeight / 2 - itemHeight,
    window.innerHeight / 2,
    window.innerHeight / 2 + itemHeight,
  ];

  // useTransform을 map 밖에서 선언
  const y0 = useTransform(scrollYProgress, [0, 1], [offsets[0] - 300, offsets[0] + 300]);
  const y1 = useTransform(scrollYProgress, [0, 1], [offsets[1] - 300, offsets[1] + 300]);
  const y2 = useTransform(scrollYProgress, [0, 1], [offsets[2] - 300, offsets[2] + 300]);
  const opacity0 = useTransform(scrollYProgress, [0, 0.5, 1], [0.2, 1, 0.2]);
  const opacity1 = useTransform(scrollYProgress, [0, 0.5, 1], [0.2, 1, 0.2]);
  const opacity2 = useTransform(scrollYProgress, [0, 0.5, 1], [0.2, 1, 0.2]);

  const yArr = [y0, y1, y2];
  const opacityArr = [opacity0, opacity1, opacity2];

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        height: "100vh",
        overflowY: "scroll",
        background: "#111",
        color: "#000000ff",
      }}
    >
      <div style={{ height: "200vh", position: "relative" }}>
        {texts.map((text, idx) => (
          <motion.div
            key={idx}
            style={{
              position: "absolute",
              left: "50%",
              transform: "translateX(-50%)",
              width: "60vw",
              top: `${offsets[idx]}px`,
              opacity: opacityArr[idx],
              y: yArr[idx],
              padding: "2rem",
              background: "rgba(30,30,30,0.7)",
              borderRadius: "1rem",
              boxShadow: "0 8px 32px rgba(0,0,0,0.2)"
            }}
          >
            <h2 style={{ marginBottom: "1rem", fontSize: "2rem" }}>
              {text.title}
            </h2>
            <p style={{ fontSize: "1.15rem" }}>{text.content}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}