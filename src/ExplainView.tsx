import React, { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const ExplainView = () => {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const nums = Array.from(root.querySelectorAll<HTMLElement>('.battery .count'))
    const tweens: gsap.core.Tween[] = []

    nums.forEach((el) => {
      const to = Number(el.dataset.to || '0')
      const proxy = { v: 0 }
      const tween = gsap.fromTo(
        proxy,
        { v: 0 },
        {
          v: to,
          duration: 2.0,
          ease: 'power1.out',
          onUpdate: () => {
            el.textContent = Math.floor(proxy.v).toString()
          },
          scrollTrigger: {
            trigger: el,
            start: 'top 90%',
            once: true,
          },
        }
      )
      tweens.push(tween)
    })

    return () => {
      tweens.forEach((t) => t.kill())
    }
  }, [])

  return (
    <div id='explainviewWrap' ref={rootRef}>
      <section className='explainview'>
        <div className='explainview_img'>
          <h3>극강의 내구성과 최고의 활력</h3>
          <p>절전모드시 24시간 사용가능하며 익사이팅모드로 18시간 사용 가능</p>
        </div>
      </section>

      <section className='battery'>
        <div className='battery_title'>
          <span><img src='./images/battery.png' alt='배터리 아이콘'></img> </span>
          <h4>지구력을 갖춘 배터리.</h4>
          <p>Apple Watch Ultra 2는 더 긴 배터리 사용 시간을 제공하도록 설계되었습니다. <br/>
          당신이 그 어느 때보다 더 멀리, 더 넓게 이동할 있도록 말이죠. 꼭 충전이 필요할 땐<br/>
           15분 급속 충전만으로도 일반 사용 시 최대 12시간까지 사용할 수 있답니다.</p>
        </div>
        <div className='battery_content'>
          <div className='battery_normal'>
            <p>최대</p>
            <p><span className="count" data-to="42">0</span>시간</p>
            <p>일반 사용 시</p>
          </div>
          <div className='battery_row'>
            <p>최대</p>
            <p><span className="count" data-to="72">0</span>시간</p>
            <p>저전력 모드에서 일반 사용 시</p>
          </div>
          <div className='battery_gps'>
            <p>최대</p>
            <p><span className="count" data-to="14">0</span>시간</p>
            <p>GPS 및 심밧수 측정 기능이<br/>완전히 활성화된 상태에서<br/>실외 운동 시</p>
          </div>
          <div className='battery_gpslow'>
            <p>최대</p>
            <p><span className="count" data-to="35">0</span>시간</p>
            <p>셀룰러가 켜진 상태에서 '더 적은 빈도로<br/>GPS 및 심박수 측정' 기능이 활성화 된 <br/>저전력 모드로 실외 운동 시</p>
          </div>
        </div>
      </section>

    </div>
  )
}

export default ExplainView