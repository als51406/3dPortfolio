import React from 'react';
import ScrollFloat from './ScrollFloat';
import ScrollReveal from './ScrollReveal';

const MainTextView = () => {

  return (
    <div id='maintextviewWrap'>
      <div className='maintext'>
       <div className='maintext_title'>
       <ScrollFloat
        animationDuration={1}
        ease='back.inOut(2)'
        scrollStart='top 80%'
        scrollEnd='+=500'
        stagger={0.03}
      >
  클래식으로 계속되는 전력질주
    </ScrollFloat>
        </div>
        <div className='maintext_content'>
<ScrollReveal
  baseOpacity={0}
  enableBlur={true}
  baseRotation={8}
  blurStrength={10}
  transformOrigin='50% 50%'
  fontSize={'32px'}
>
매력적인 블랙 티타늄 케이스를 입은 궁극의 스포츠 및 모험용 시계, 
Apple Watch Ultra 2. 일상을 함께 할 연결성, 건강 및 안전 관련 기능을 모두 갖춘 건 물론, 
스포츠 워치 중 가장 뛰어난 정확도를 자랑하는 GPS로 훈련의 수준을 한 차원 높여주죠.
</ScrollReveal>
    
        </div>
      </div>
    </div>
  );
};

export default MainTextView;