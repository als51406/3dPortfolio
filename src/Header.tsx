import React from 'react'
import { Link } from 'react-router-dom'

const MenuLink: React.FC<{ to: string; children: React.ReactNode }> = ({ to, children }) => {
  const isExternal = /^https?:\/\//i.test(to);
  return isExternal ? (
    <a href={to} target="_blank" rel="noopener noreferrer">{children}</a>
  ) : (
    <Link to={to}>{children}</Link>
  );
};


const Header = () => {
  
  return (
    <header id='headerWrap'>
      <nav className='navi'>
        {/* <ShinyText text="SMART WATCH" disabled={false} speed={3} className="custom-class" /> */}
  <h1 onClick={() => window.location.reload()} style={{color:'#fff', textDecoration:'none'}}>SMART WATCH</h1>
        <ul className='menu'>
          {[
            { label: '스토어', to: 'https://www.apple.com/kr/store' },
            { label: 'MAC', to: 'https://www.apple.com/kr/mac/' },
            { label: 'iPad', to: 'https://www.apple.com/kr/ipad/' },
            { label: 'iPhone', to: 'https://www.apple.com/kr/iphone/' },
            { label: 'Watch', to: 'https://www.apple.com/kr/watch/' },
            { label: 'Vision', to: 'https://www.apple.com/kr/apple-vision-pro/' },
            { label: 'AirPods', to: 'https://www.apple.com/kr/airpods/' },
            { label: 'TV 및 홈', to: 'https://www.apple.com/kr/tv-home/' },
            { label: '엔터테인먼트', to: 'https://www.apple.com/kr/services/' },
            { label: '액세서리', to: 'https://www.apple.com/kr/shop/accessories/all' },
            // 외부 사이트 예시(새 탭): 필요에 따라 URL 교체
            { label: '고객지원', to: 'https://support.apple.com/ko-kr' },
          ].map(item => (
            <li key={item.label}>
              <MenuLink to={item.to}>{item.label}</MenuLink>
            </li>
          ))}
        </ul>
        <ul className='search'>
          <li><svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#f2f2f2ff"><path d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z"/></svg></li>
          <li><svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#f2f2f2ff"><path d="M240-80q-33 0-56.5-23.5T160-160v-480q0-33 23.5-56.5T240-720h80q0-66 47-113t113-47q66 0 113 47t47 113h80q33 0 56.5 23.5T800-640v480q0 33-23.5 56.5T720-80H240Zm0-80h480v-480h-80v80q0 17-11.5 28.5T600-520q-17 0-28.5-11.5T560-560v-80H400v80q0 17-11.5 28.5T360-520q-17 0-28.5-11.5T320-560v-80h-80v480Zm160-560h160q0-33-23.5-56.5T480-800q-33 0-56.5 23.5T400-720ZM240-160v-480 480Z"/></svg></li>
        </ul>
      </nav>
    </header>
  )
}

export default Header
