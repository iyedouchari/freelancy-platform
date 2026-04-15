import React from "react";

const panelStyle = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "2rem",
  background:
    "linear-gradient(135deg, rgba(247,248,252,1) 0%, rgba(234,240,249,1) 100%)",
};

const cardStyle = {
  width: "100%",
  maxWidth: "640px",
  padding: "2rem",
  borderRadius: "24px",
  background: "#ffffff",
  boxShadow: "0 18px 60px rgba(24, 39, 75, 0.12)",
  color: "#172033",
};

const buttonStyle = {
  marginTop: "1rem",
  border: "none",
  borderRadius: "999px",
  padding: "0.9rem 1.2rem",
  background: "#0f766e",
  color: "#ffffff",
  fontWeight: 700,
  cursor: "pointer",
};

export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      errorMessage: error?.message || "Une erreur inattendue est survenue.",
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Application crash caught by error boundary:", error, errorInfo);
  }

  handleReload = () => {
    window.location.assign("/");
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={panelStyle}>
          <div style={cardStyle}>
            <h1 style={{ marginTop: 0 }}>L'application a rencontré une erreur</h1>
            <p>
              Un écran vide apparaît souvent quand un composant plante pendant le rendu.
              L'application est maintenant protégée et vous pouvez revenir à l'accueil.
            </p>
            <p style={{ color: "#b42318", fontWeight: 600 }}>
              {this.state.errorMessage}
            </p>
            <button type="button" style={buttonStyle} onClick={this.handleReload}>
              Retourner à l'accueil
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
