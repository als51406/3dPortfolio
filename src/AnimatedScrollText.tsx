import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

const texts = [
  "첫번째 디자인 문구 예시",
  "두번째 디자인 문구 예시",
  "세번째 디자인 문구 예시",
];

export default function AnimatedScrollText() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    container: containerRef,
  });

  // 각 텍스트별 y 애니메이션을 Hook 최상단에서 선언
  const y0 = useTransform(scrollYProgress, [0, 1], [0, -200]);
  const y1 = useTransform(scrollYProgress, [0, 1], [250, 50]);
  const y2 = useTransform(scrollYProgress, [0, 1], [500, 300]);
  const yArr = [y0, y1, y2];

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        height: "100vh",
        overflowY: "scroll",
        background: "#222",
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
              top: `${idx * 250}px`,
              y: yArr[idx],
              padding: "2rem",
              background: "rgba(30,30,30,0.7)",
              borderRadius: "1rem",
              color: "#fff",
              textAlign: "center",
              fontSize: "1.5rem",
              boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
            }}
          >
            {text}
          </motion.div>
        ))}
      </div>
    </div>
  );
}