import { tw } from '@/lib/theme';
import { Component } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

/**
 * Error Boundary global para capturar erros de renderização
 * Previne que a aplicação inteira quebre
 */
export class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ errorInfo });

        // Log para Sentry se disponível
        if (typeof window !== 'undefined' && window.Sentry) {
            window.Sentry.captureException(error, {
                extra: { componentStack: errorInfo.componentStack }
            });
        }

        // Log no console para debug
        console.error('ErrorBoundary caught:', error, errorInfo);
    }

    handleReload = () => {
        window.location.reload();
    };

    handleGoHome = () => {
        window.location.href = '/';
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-800/30 dark:bg-surface-950 p-4">
                    <div className={`\${tw.card} text-center max-w-md w-full p-8`}>
                        {/* Ícone de erro */}
                        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 ring-4 ring-red-500/20">
                            <AlertTriangle className="w-10 h-10 text-red-400" />
                        </div>

                        {/* Título */}
                        <h1 className="text-2xl font-bold text-white dark:text-white mb-2">
                            Ops! Algo deu errado
                        </h1>

                        {/* Descrição */}
                        <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                            Encontramos um problema inesperado. Nossa equipe já foi notificada
                            e está trabalhando para resolver.
                        </p>

                        {/* Detalhes do erro (apenas em dev) */}
                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <details className="mb-6 text-left">
                                <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-300 dark:hover:text-gray-300">
                                    Detalhes técnicos
                                </summary>
                                <pre className="mt-2 p-3 bg-gray-800/40 dark:bg-gray-900 rounded-lg text-xs overflow-auto max-h-40 text-red-600 dark:text-red-400">
                                    {this.state.error.toString()}
                                    {this.state.errorInfo?.componentStack}
                                </pre>
                            </details>
                        )}

                        {/* Botões de ação */}
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <button
                                onClick={this.handleReload}
                                className="btn-primary flex items-center justify-center gap-2"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Tentar novamente
                            </button>
                            <button
                                onClick={this.handleGoHome}
                                className="px-4 py-2 rounded-xl border border-gray-700/50 dark:border-white/10 text-gray-300 dark:text-gray-300 hover:bg-gray-800/40 dark:hover:bg-gray-800/40/5 transition-colors flex items-center justify-center gap-2"
                            >
                                <Home className="w-4 h-4" />
                                Ir para início
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
