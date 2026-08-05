import { Component } from 'react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          padding: '2rem',
          background: '#090909',
          color: '#F0D08A',
          fontFamily: 'Cinzel, serif',
          textAlign: 'center',
        }}>
          <h1 style={{ fontSize: '1.5rem', margin: 0 }}>Something went wrong</h1>
          <p style={{ color: 'rgba(255,255,255,0.65)', maxWidth: '28rem', margin: 0 }}>
            The page failed to load. Refresh the browser or run{' '}
            <code style={{ color: '#C61717' }}>npm run dev</code> (not Live Server on root index.html).
          </p>
          {import.meta.env.DEV && this.state.error && (
            <pre style={{
              marginTop: '1rem',
              padding: '1rem',
              background: '#121212',
              color: '#ff6b6b',
              fontSize: '0.75rem',
              maxWidth: '90vw',
              overflow: 'auto',
              textAlign: 'left',
            }}>
              {this.state.error.message}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
