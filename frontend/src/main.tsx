import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import 'slick-carousel/slick/slick.css'
import 'slick-carousel/slick/slick-theme.css'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

// Create a QueryClient instance
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            refetchOnWindowFocus: false,
            retry: 1,
        },
    },
})

// Simple error boundary
class ErrorBoundary extends React.Component<
    { children: React.ReactNode },
    { hasError: boolean; error: Error | null }
> {
    constructor(props: { children: React.ReactNode }) {
        super(props)
        this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('Error caught by boundary:', error, errorInfo)
    }

    render() {
        if (this.state.hasError) {
            return (
                <div
                    style={{
                        padding: '20px',
                        color: 'white',
                        background: 'black',
                        minHeight: '100vh',
                    }}
                >
                    <h1 style={{ color: 'white' }}>
                        Error loading application
                    </h1>
                    <p style={{ color: 'red' }}>
                        {this.state.error?.message || 'Unknown error'}
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            padding: '10px 20px',
                            marginTop: '20px',
                            cursor: 'pointer',
                        }}
                    >
                        Reload Page
                    </button>
                </div>
            )
        }

        return this.props.children
    }
}

createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <ErrorBoundary>
                    <ThemeProvider>
                        <App />
                    </ThemeProvider>
                </ErrorBoundary>
            </AuthProvider>
        </QueryClientProvider>
    </React.StrictMode>
)
