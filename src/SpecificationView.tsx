import React from 'react';
import './SpecificationView.css';

interface SpecItem {
  category: string;
  ultra2: string | React.ReactNode;
  ultra1: string | React.ReactNode;
  series9: string | React.ReactNode;
}

const specifications: SpecItem[] = [
  {
    category: '디스플레이',
    ultra2: '49mm 티타늄 케이스\n502 x 410 픽셀',
    ultra1: '49mm 티타늄 케이스\n502 x 410 픽셀',
    series9: '45mm 알루미늄 케이스\n484 x 396 픽셀',
  },
  {
    category: '칩셋',
    ultra2: 'S9 SiP (64비트 듀얼코어)',
    ultra1: 'S8 SiP',
    series9: 'S9 SiP (64비트 듀얼코어)',
  },
  {
    category: '배터리',
    ultra2: '최대 36시간\n(절전모드 72시간)',
    ultra1: '최대 36시간\n(절전모드 60시간)',
    series9: '최대 18시간',
  },
  {
    category: '내구성',
    ultra2: 'MIL-STD 810H 인증\n100m 방수\nEN13319 다이빙 인증',
    ultra1: 'MIL-STD 810H 인증\n100m 방수\nEN13319 다이빙 인증',
    series9: '50m 방수',
  },
  {
    category: '밝기',
    ultra2: '최대 3000 nits',
    ultra1: '최대 2000 nits',
    series9: '최대 2000 nits',
  },
  {
    category: '액션 버튼',
    ultra2: '✓ 지원',
    ultra1: '✓ 지원',
    series9: '✗ 미지원',
  },
  {
    category: 'GPS',
    ultra2: '듀얼 주파수\n(L1 + L5)',
    ultra1: '듀얼 주파수\n(L1 + L5)',
    series9: '단일 주파수 (L1)',
  },
  {
    category: '수심 센서',
    ultra2: '40m까지 측정',
    ultra1: '40m까지 측정',
    series9: '✗ 미지원',
  },
  {
    category: '사이렌',
    ultra2: '86dB (긴급 상황용)',
    ultra1: '86dB (긴급 상황용)',
    series9: '✗ 미지원',
  },
  {
    category: '가격',
    ultra2: '₩1,149,000~',
    ultra1: '₩1,049,000~',
    series9: '₩599,000~',
  },
];

const SpecificationView: React.FC = () => {
  return (
    <div id="specificationViewWrap">
      <section className="specification-view">
        <div className="spec-container">
          <h2 className="spec-title">
            SPECIFICATION
          </h2>
          <p className="spec-subtitle">
            세대별 모델 비교
          </p>

          <div className="spec-table">
            {/* 테이블 헤더 */}
            <div className="spec-row spec-header">
              <div className="spec-cell category-cell">사양</div>
              <div className="spec-cell model-cell highlight">
                <div className="model-badge ultra2">NEW</div>
                <div className="model-name">Apple Watch Ultra 2</div>
              </div>
              <div className="spec-cell model-cell">
                <div className="model-name">Apple Watch Ultra</div>
              </div>
              <div className="spec-cell model-cell">
                <div className="model-name">Apple Watch Series 9</div>
              </div>
            </div>

            {/* 스펙 행들 */}
            {specifications.map((spec, index) => (
              <div key={index} className="spec-row">
                <div className="spec-cell category-cell">
                  <strong>{spec.category}</strong>
                </div>
                <div className="spec-cell value-cell highlight">
                  {typeof spec.ultra2 === 'string' 
                    ? spec.ultra2.split('\n').map((line, i, arr) => (
                        <React.Fragment key={i}>
                          {line}
                          {i < arr.length - 1 && <br />}
                        </React.Fragment>
                      ))
                    : spec.ultra2}
                </div>
                <div className="spec-cell value-cell">
                  {typeof spec.ultra1 === 'string'
                    ? spec.ultra1.split('\n').map((line, i, arr) => (
                        <React.Fragment key={i}>
                          {line}
                          {i < arr.length - 1 && <br />}
                        </React.Fragment>
                      ))
                    : spec.ultra1}
                </div>
                <div className="spec-cell value-cell">
                  {typeof spec.series9 === 'string'
                    ? spec.series9.split('\n').map((line, i, arr) => (
                        <React.Fragment key={i}>
                          {line}
                          {i < arr.length - 1 && <br />}
                        </React.Fragment>
                      ))
                    : spec.series9}
                </div>
              </div>
            ))}
          </div>

          {/* CTA 버튼 */}
          <div className="spec-cta">
            <button className="spec-btn primary">
              Apple Watch Ultra 2 구매하기
            </button>
            <button className="spec-btn secondary">
              모든 모델 비교하기
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SpecificationView;
