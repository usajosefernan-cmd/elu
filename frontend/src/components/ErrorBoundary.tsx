import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0A0A0F] text-[#F0F0F5] p-6">
                    <div className="max-w-2xl w-full bg-[#1A1A24] border border-red-500/30 rounded-lg p-8 shadow-2xl">
                        <h1 className="text-3xl font-bold text-red-500 mb-4 flex items-center gap-2">
                            ⚠️ Critical System Failure
                        </h1>
                        <p className="text-gray-400 mb-6 text-lg">
                            The application encountered an unexpected error and had to stop.
                        </p>

                        <div className="bg-black/50 p-4 rounded-md font-mono text-sm text-red-300 mb-6 overflow-auto max-h-64 border border-white/5">
                            <p className="font-bold mb-2">{this.state.error?.toString()}</p>
                            <pre className="text-xs text-gray-500 whitespace-pre-wrap">
                                {this.state.errorInfo?.componentStack}
                            </pre>
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={() => window.location.reload()}
                                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-md transition-all shadow-lg hover:shadow-red-500/30"
                            >
                                🔄 Reload System
                            </button>
                            <button
                                onClick={() => {
                                    localStorage.clear();
                                    window.location.reload();
                                }}
                                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-md transition-all"
                            >
                                🧹 Clear Cache & Restart
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
