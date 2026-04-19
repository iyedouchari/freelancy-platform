import { useEffect, useRef, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import AppFeedbackHost from "./components/AppFeedbackHost";
import AppErrorBoundary from "./components/AppErrorBoundary";
import AdminDashboard from "./pages/admin/AdminDashboard";
import FreelancerDashboard from "./pages/freelancer/FreelancerDashboard";
import FreelancerDeals from "./pages/freelancer/FreelancerDeals";
import FreelancerProfile from "./pages/freelancer/FreelancerProfile";
import FreelancerProposals from "./pages/freelancer/FreelancerProposals";
import FreelancerWallet from "./pages/freelancer/FreelancerWallet";
import ClientShell from "./pages/client/ClientShell";
import Landing from "./pages/public/Landing";
import Login from "./pages/public/Login";
import Register from "./pages/public/Register";
import BlockedAccess from "./pages/public/BlockedAccess";
import Workspace from "./pages/shared/Workspace";
import { dealService } from "./services/dealService";

// Socket initialisé une seule fois
import socket from "./services/socket.js"; // ou le chemin où tu mets le fichier
const FREELANCER_PAGE_KEY = "freelancer_active_page";
const FREELANCER_DEAL_KEY = "freelancer_selected_deal_id";
const CLIENT_PAGE_KEY = "client_active_page";
const CLIENT_DEAL_KEY = "client_selected_deal_id";
const FREELANCER_AUTO_REFRESH_INTERVAL_MS = 8000;
function getStoredSession() {
  return {
    role: localStorage.getItem("app_role"),
    token: localStorage.getItem("auth_token"),
    userId: localStorage.getItem("user_id"),
  };
}

function isAuthenticated() {
  const { role, token } = getStoredSession();
  return Boolean(role && token);
}

function hasRole(expectedRole) {
  const { role, token } = getStoredSession();
  return Boolean(token && role === expectedRole);
}

function clearInvalidSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("auth_token");
  localStorage.removeItem("access_token");
  sessionStorage.removeItem("token");
  localStorage.removeItem("app_role");
  localStorage.removeItem("user_id");
  localStorage.removeItem("client_entry_page");
  localStorage.removeItem(FREELANCER_PAGE_KEY);
  localStorage.removeItem(FREELANCER_DEAL_KEY);
  localStorage.removeItem(CLIENT_PAGE_KEY);
  localStorage.removeItem(CLIENT_DEAL_KEY);
}

const ProtectedRoute = ({ role, children }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  if (!hasRole(role)) {
    clearInvalidSession();
    return <Navigate to="/login" replace />;
  }

  return children;
};

const SessionAwareFallback = () => {
  const { role, token } = getStoredSession();

  if (!token || !role) {
    return <Navigate to="/" replace />;
  }

  if (role === "client") {
    return <Navigate to="/client" replace />;
  }

  if (role === "admin") {
    return <Navigate to="/admin" replace />;
  }

  if (role === "freelancer") {
    return <Navigate to="/app" replace />;
  }

  clearInvalidSession();
  return <Navigate to="/login" replace />;
};

// ── Shell Freelancer ──────────────────────────────────────────────────────────
const FreelancerShell = () => {
  const location = useLocation();
  const dashboardRef = useRef(null);
  const [page, setPage] = useState(() => localStorage.getItem(FREELANCER_PAGE_KEY) || "dashboard");
  const [selectedDealId, setSelectedDealId] = useState(
    () => localStorage.getItem(FREELANCER_DEAL_KEY) || null,
  );
  const [selectedProfileUserId, setSelectedProfileUserId] = useState(null);
  const [deals, setDeals] = useState([]);
  const [isLoadingDeals, setIsLoadingDeals] = useState(true);
  const session = getStoredSession();

  const refreshDeals = async ({ silent = false } = {}) => {
    try {
      if (!silent) {
        setIsLoadingDeals(true);
      }

      const rows = await dealService.listMine();
      if (Array.isArray(rows)) {
        setDeals(rows);
      } else {
        setDeals([]);
      }
    } catch (error) {
      console.error("Error loading deals:", error);
      if (!silent) {
        setDeals([]);
      }
    } finally {
      if (!silent) {
        setIsLoadingDeals(false);
      }
    }
  };

  useEffect(() => {
    localStorage.setItem(FREELANCER_PAGE_KEY, page);
  }, [page]);

  useEffect(() => {
    if (selectedDealId === null || selectedDealId === undefined || selectedDealId === "") {
      localStorage.removeItem(FREELANCER_DEAL_KEY);
      return;
    }

    localStorage.setItem(FREELANCER_DEAL_KEY, String(selectedDealId));
  }, [selectedDealId]);

  useEffect(() => {
    void refreshDeals();
  }, []);

  useEffect(() => {
    const shouldAutoRefresh = ["dashboard", "deals", "workspace"].includes(page);
    if (!shouldAutoRefresh) {
      return undefined;
    }

    const refreshIfVisible = () => {
      if (document.visibilityState !== "hidden") {
        void refreshDeals({ silent: true });
      }
    };

    const handleSocketConnect = () => {
      void refreshDeals({ silent: true });
    };

    const timer = window.setInterval(refreshIfVisible, FREELANCER_AUTO_REFRESH_INTERVAL_MS);
    window.addEventListener("focus", refreshIfVisible);
    document.addEventListener("visibilitychange", refreshIfVisible);
    socket.on("connect", handleSocketConnect);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refreshIfVisible);
      document.removeEventListener("visibilitychange", refreshIfVisible);
      socket.off("connect", handleSocketConnect);
    };
  }, [page]);

  useEffect(() => {
    const params = new URLSearchParams(location.search || "");
    const sharedProfileUserId = params.get("viewProfileUserId");

    if (!sharedProfileUserId) {
      return;
    }

    setSelectedProfileUserId(sharedProfileUserId);
    setPage("publicProfile");
  }, [location.search]);

  const goToDashboard = () => {
    try {
      setPage("dashboard");
      localStorage.setItem(FREELANCER_PAGE_KEY, "dashboard");
    } catch (error) {
      console.error("Error navigating to dashboard:", error);
      window.location.href = "/dashboard";
    }
  };
  const goToProposals = () => setPage("proposals");
  const goToDeals    = () => setPage("deals");
  const goToWallet   = () => setPage("wallet");
  const goToProfile  = () => setPage("profile");

  const goToWorkspace = (dealId) => {
    setSelectedDealId(dealId);
    setPage("workspace");
  };

  const openProfileFromWorkspace = ({ userId, dealId }) => {
    setSelectedProfileUserId(userId || null);
    if (dealId) {
      setSelectedDealId(dealId);
    }
    setPage("publicProfile");
  };

  return (
    <div className="app-shell">
      <Navbar
        onDashboard={goToDashboard}
        onRequests={goToProposals}
        onProfile={goToProfile}
        onDeals={goToDeals}
        onWallet={goToWallet}
        activePage={page === "workspace" ? "deals" : page}
      />
      <main className="app-main">
        {page === "dashboard" && <FreelancerDashboard ref={dashboardRef} />}
        {page === "proposals" && <FreelancerProposals onBack={goToDashboard} />}
        {page === "deals" && (
          <FreelancerDeals
            deals={deals}
            isLoading={isLoadingDeals}
            onBack={goToDashboard}
            onOpenWorkspace={goToWorkspace}
          />
        )}
        {page === "wallet" && <FreelancerWallet />}
        {page === "profile" && <FreelancerProfile onBack={goToDashboard} />}
        {page === "publicProfile" && selectedProfileUserId && (
          <FreelancerProfile
            mode="public"
            publicUserId={selectedProfileUserId}
            dealId={selectedDealId}
            onBack={() => {
              if (selectedDealId) {
                setPage("workspace");
                return;
              }

              setPage("dashboard");
            }}
          />
        )}
        {page === "workspace" && (
          <Workspace
            dealId={selectedDealId}
            socket={socket}
            myUserId={session.userId}
            onBack={goToDeals}
            onOpenProfile={openProfileFromWorkspace}
          />
        )}
      </main>
      <Footer />
    </div>
  );
};

// ── Gardes de routes ──────────────────────────────────────────────────────────
const FreelancerRoute = () => (
  <ProtectedRoute role="freelancer">
    <FreelancerShell />
  </ProtectedRoute>
);

const ClientRoute = () => (
  <ProtectedRoute role="client">
    <ClientShell />
  </ProtectedRoute>
);

const AdminRoute = () => (
  <ProtectedRoute role="admin">
    <AdminDashboard />
  </ProtectedRoute>
);

// ── App principale ────────────────────────────────────────────────────────────
const App = () => (
  <AppErrorBoundary>
    <>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/login1" element={<Navigate to="/login" replace />} />
        <Route path="/login1/*" element={<Navigate to="/login" replace />} />
        <Route path="/register" element={<Register />} />
        <Route path="/blocked-access" element={<BlockedAccess />} />
        <Route path="/admin" element={<AdminRoute />} />
        <Route path="/app/*" element={<FreelancerRoute />} />
        <Route path="/client/*" element={<ClientRoute />} />
        <Route path="*" element={<SessionAwareFallback />} />
      </Routes>
      <AppFeedbackHost />
    </>
  </AppErrorBoundary>
);

export default App;
