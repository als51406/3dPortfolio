import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

/**
 * ErrorBoundary 컴포넌트
 * React 컴포넌트 트리에서 발생하는 JavaScript 에러를 포착하고
 * 폴백 UI를 표시하여 전체 앱 크래시를 방지합니다.
 * 
 * @example
 * <ErrorBoundary fallback={<ErrorFallback />}>
 *   <YourComponent />
 * </ErrorBoundary>
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // 다음 렌더링에서 폴백 UI 표시
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // 에러 로깅 서비스에 전송 (Sentry, LogRocket 등)
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
    
    // 프로덕션에서는 에러 모니터링 서비스로 전송
    // Example: Sentry.captureException(error);
    
    this.setState({ errorInfo });
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // 커스텀 폴백 UI가 제공되면 사용
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 기본 폴백 UI
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: '#000',
          color: '#fff',
          padding: '20px',
          textAlign: 'center',
          fontFamily: "'Noto Sans', sans-serif"
        }}>
          <div style={{ maxWidth: '600px' }}>
            <h1 style={{ fontSize: '48px', marginBottom: '20px', fontWeight: 600 }}>
              🚨 오류 발생
            </h1>
            <p style={{ 
              fontSize: '18px', 
              color: '#86868B', 
              marginBottom: '30px',
              lineHeight: 1.6
            }}>
              예상치 못한 오류가 발생했습니다.<br />
              불편을 드려 죄송합니다.
            </p>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                padding: '20px',
                borderRadius: '10px',
                marginBottom: '30px',
                textAlign: 'left',
                fontSize: '14px',
                color: '#ff4444',
                cursor: 'pointer'
              }}>
                <summary style={{ marginBottom: '10px', fontWeight: 600 }}>
                  에러 상세 정보 (개발 모드)
                </summary>
                <pre style={{ 
                  overflow: 'auto', 
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}>
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
            
            <button
              onClick={this.handleReset}
              style={{
                backgroundColor: '#007AFF',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                padding: '15px 40px',
                fontSize: '16px',
                fontWeight: 600,
                cursor: 'pointer',
                marginRight: '10px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#0051D5';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#007AFF';
              }}
            >
              다시 시도
            </button>
            
            <button
              onClick={() => window.location.href = '/'}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: '#fff',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '10px',
                padding: '15px 40px',
                fontSize: '16px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
              }}
            >
              홈으로 이동
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
