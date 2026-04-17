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
    this.state = { hasError: false, errorMessage: "", retryCount: 0 };
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

  handleResetError = () => {
    this.setState({ hasError: false, errorMessage: "", retryCount: 0 });
  };

  handleGoToDashboard = () => {
    this.handleResetError();
    const role = localStorage.getItem("app_role");
    if (role === "FREELANCER") {
      localStorage.setItem("freelancer_active_page", "dashboard");
      window.location.assign("/dashboard");
    } else if (role === "CLIENT") {
      localStorage.setItem("client_active_page", "dashboard");
      window.location.assign("/dashboard");
    } else {
      window.location.assign("/");
    }
  };

  handleReload = () => {
    this.handleResetError();
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
              L'application est maintenant protégée et vous pouvez revenir au tableau de bord.
            </p>
            <p style={{ color: "#b42318", fontWeight: 600 }}>
              {this.state.errorMessage}
            </p>
            <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
              <button
                type="button"
                style={buttonStyle}
                onClick={this.handleGoToDashboard}
              >
                Tableau de bord
              </button>
              <button
                type="button"
                style={{ ...buttonStyle, background: "#6b7280" }}
                onClick={this.handleReload}
              >
                Accueil
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
