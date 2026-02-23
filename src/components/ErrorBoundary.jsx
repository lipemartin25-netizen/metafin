// src/components/ErrorBoundary.jsx
import { Component } from 'react'

export class ErrorBoundary extends Component {
    constructor(props) {
        super(props)
        this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error }
    }

    componentDidCatch(error, errorInfo) {
        console.error('Critical Error caught by ErrorBoundary:', error, errorInfo)
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center p-12 text-center glass-card my-6">
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
                        <span className="text-3xl">😕</span>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        Algo deu errado
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm">
                        {this.props.fallbackMessage || 'Ocorreu um erro inesperado nesta seção. Tente recarregar a página.'}
                    </p>
                    <button
                        onClick={() => {
                            this.setState({ hasError: false, error: null });
                            window.location.reload();
                        }}
                        className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 transition-all"
                    >
                        Tentar novamente
                    </button>
                </div>
            )
        }

        return this.props.children
    }
}
