import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Eroare prinsă de ErrorBoundary:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="text-center mt-5">
          <h1>Ceva nu a mers bine.</h1>
          <p>Ne pare rău pentru inconvenient. Încercați din nou mai târziu.</p>
          <button onClick={this.handleRetry} className="btn btn-primary">
            Reîncarcă
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
