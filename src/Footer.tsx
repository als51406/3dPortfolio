import React from 'react'

const Footer = () => {
  return (
    <div id='footerWrap'>
      <div className='footer'>
        <section className='making'>
          <p style={{ color: '#e9e9e9ff', lineHeight: 1.7 }}>
            본 페이지는 Apple Watch 제품 페이지를 참고하여 3D 오브젝트와 인터랙티브 요소를 추가해 재구성한 포트폴리오용 페이지입니다. <br/>
            원 저작물의 저작권은 Apple Inc.에 있으며, 표기된 로고와 상표는 각 소유권자에게 귀속됩니다.
          </p>
          <p style={{ color: '#c2c2c2ff' }}>
            이 사이트는 학습·연구 목적의 데모이며 상업적 이용 또는 판매를 위한 용도가 아닙니다.
          </p>
        </section>
        <section className='address'>
          <p>email: als51406@gmail.com</p>
          <p>git: https://github.com/als51406/3group_mindHealing.git</p>
        </section>
      </div>
    </div>
  )
}

export default Footer