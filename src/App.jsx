import { useEffect, useRef, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import AppFeedbackHost from "./components/AppFeedbackHost";
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

// ── Shell Freelancer ──────────────────────────────────────────────────────────
const FreelancerShell = () => {
  const dashboardRef = useRef(null);
  const [page, setPage] = useState("dashboard");
  const [selectedDealId, setSelectedDealId] = useState(null);
  const [deals, setDeals] = useState([]);
  const [isLoadingDeals, setIsLoadingDeals] = useState(true);
  const session = getStoredSession();

  useEffect(() => {
    let isMounted = true;

    const loadDeals = async () => {
      setIsLoadingDeals(true);

      try {
        const rows = await dealService.listMine();
        if (!isMounted) return;
        setDeals(rows);
      } catch {
        if (!isMounted) return;
        setDeals([]);
      } finally {
        if (isMounted) {
          setIsLoadingDeals(false);
        }
      }
    };

    loadDeals();

    return () => {
      isMounted = false;
    };
  }, []);

  const goToDashboard = () => setPage("dashboard");
  const goToProposals = () => setPage("proposals");
  const goToDeals    = () => setPage("deals");
  const goToWallet   = () => setPage("wallet");
  const goToProfile  = () => setPage("profile");

  const goToWorkspace = (dealId) => {
    setSelectedDealId(dealId);
    setPage("workspace");
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
        {page === "workspace" && (
          <Workspace
            dealId={selectedDealId}
            socket={socket}
            myUserId={session.userId}
            onBack={goToDeals}
          />
        )}
      </main>
      <Footer />
    </div>
  );
};

// ── Gardes de routes ──────────────────────────────────────────────────────────
const FreelancerRoute = () =>
  isAuthenticated() ? <FreelancerShell /> : <Navigate to="/login" replace />;

const ClientRoute = () =>
  isAuthenticated() ? <ClientShell /> : <Navigate to="/login" replace />;

const AdminRoute = () =>
  isAuthenticated() ? <AdminDashboard /> : <Navigate to="/login" replace />;

// ── App principale ────────────────────────────────────────────────────────────
const App = () => (
  <>
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/blocked-access" element={<BlockedAccess />} />
      <Route path="/admin" element={<AdminRoute />} />
      <Route path="/app/*" element={<FreelancerRoute />} />
      <Route path="/client/*" element={<ClientRoute />} />
    </Routes>
    <AppFeedbackHost />
  </>
);

export default App;
