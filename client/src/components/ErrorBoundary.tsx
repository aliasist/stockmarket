import { Component, type ReactNode, type ErrorInfo } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  /** Optional fallback label for the error card (e.g. "Pitch Builder") */
  label?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Catches render-time exceptions so a crashed child page
 * doesn't bring down the entire SPA.
 */
export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const label = this.props.label ?? "this page";

    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-8">
        <div
          className="max-w-lg w-full rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center space-y-4"
          style={{ fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)" }}
        >
          <AlertTriangle className="mx-auto h-10 w-10 text-destructive/70" />

          <h2 className="text-lg font-semibold text-foreground">
            {label} crashed
          </h2>

          <p className="text-sm text-muted-foreground leading-relaxed">
            An unexpected error occurred while rendering {label}. Your other
            pages are unaffected.
          </p>

          {this.state.error && (
            <pre className="text-left text-xs text-destructive/80 bg-destructive/10 rounded-lg p-4 overflow-x-auto whitespace-pre-wrap break-words">
              {this.state.error.message}
            </pre>
          )}

          <button
            onClick={this.handleReset}
            className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </button>
        </div>
      </div>
    );
  }
}
