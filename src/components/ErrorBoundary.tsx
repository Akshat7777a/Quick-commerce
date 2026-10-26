import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

/**
 * Root and section error boundaries: one broken component must never show a
 * white screen. The boundary logs the error and renders a friendly fallback
 * with a recovery action, while everything outside the boundary keeps working.
 */

type Props = {
  children: ReactNode;
  /** Compact fallback for inside sections; the full-screen fallback is default. */
  variant?: "full" | "section";
  /** Short name used for the console log. */
  name?: string;
};

type State = { error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Keep it in the console for diagnosability without breaking the UI.
    console.error(`[ErrorBoundary${this.props.name ? `:${this.props.name}` : ""}]`, error, info.componentStack);
  }

  private recover = () => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    if (this.props.variant === "section") {
      return (
        <div className="container-page py-10">
          <div className="card mx-auto max-w-md p-6 text-center">
            <AlertTriangle className="mx-auto size-5 text-clay" strokeWidth={1.7} />
            <p className="mt-2.5 text-[13px] font-medium text-ink">Something went wrong on this section</p>
            <p className="mt-1 text-[11.5px] leading-relaxed text-ink-soft">
              The rest of the page still works. You can try again.
            </p>
            <button type="button" onClick={this.recover} className="btn btn-secondary btn-sm mt-4">
              <RotateCcw className="size-3.5" /> Try again
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex min-h-[60vh] items-center justify-center px-5 py-16">
        <div className="card w-full max-w-md p-7 text-center">
          <AlertTriangle className="mx-auto size-6 text-clay" strokeWidth={1.6} />
          <p className="mt-3 font-display text-2xl text-ink">Something went wrong.</p>
          <p className="mt-2 text-[12.5px] leading-relaxed text-ink-soft">
            This stopped unexpectedly. Your basket is saved: reloading the page brings the store
            back exactly as it was.
          </p>
          <div className="mt-5 flex flex-col gap-2">
            <button type="button" onClick={() => window.location.reload()} className="btn btn-primary">
              <RotateCcw className="size-3.5" /> Reload the page
            </button>
            <button type="button" onClick={this.recover} className="btn btn-secondary">
              Try again without reloading
            </button>
          </div>
        </div>
      </div>
    );
  }
}
