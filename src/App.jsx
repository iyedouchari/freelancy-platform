import { useEffect, useRef, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import FreelancerDashboard from "./pages/freelancer/FreelancerDashboard";
import FreelancerDeals from "./pages/freelancer/FreelancerDeals";
import FreelancerProfile from "./pages/freelancer/FreelancerProfile";
import ClientShell from "./pages/client/ClientShell";
import Landing from "./pages/public/Landing";
import Login from "./pages/public/Login";
import Register from "./pages/public/Register";
import Workspace from "./pages/shared/Workspace";
import { dealService } from "./services/dealService";

function getStoredSession() {
  return {
    role: localStorage.getItem("app_role"),
    token: localStorage.getItem("auth_token"),
  };
}

function isAuthenticated() {
  const session = getStoredSession();
  return Boolean(session.role && session.token);
}

const FreelancerShell = () => {
  const dashboardRef = useRef(null);
  const [page, setPage] = useState("dashboard");
  const [deals, setDeals] = useState([]);
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [isLoadingDeals, setIsLoadingDeals] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadDeals = async () => {
      setIsLoadingDeals(true);

      try {
        const dealRows = await dealService.listMine();
        if (!isMounted) {
          return;
        }

        setDeals(dealRows);
        setSelectedDeal((current) => current ?? dealRows[0] ?? null);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setDeals([]);
      } finally {
        if (isMounted) {
          setIsLoadingDeals(false);
        }
      }
    };

    loadDeals();

    const handleVisibilityRefresh = () => {
      if (document.visibilityState === "visible") {
        loadDeals();
      }
    };

    window.addEventListener("focus", loadDeals);
    document.addEventListener("visibilitychange", handleVisibilityRefresh);

    return () => {
      isMounted = false;
      window.removeEventListener("focus", loadDeals);
      document.removeEventListener("visibilitychange", handleVisibilityRefresh);
    };
  }, []);

  const goToDashboard = () => {
    dashboardRef.current?.goDashboard?.();
    setPage("dashboard");
  };

  const goToDeals = () => setPage("deals");
  const goToProfile = () => setPage("profile");

  const goToWorkspace = (dealOrId) => {
    const resolvedDeal =
      typeof dealOrId === "object"
        ? dealOrId
        : deals.find((deal) => deal.id === dealOrId) ?? deals[0] ?? null;

    if (resolvedDeal) {
      setSelectedDeal(resolvedDeal);
    }
    setPage("workspace");
  };

  const activeNavPage = page === "workspace" ? "deals" : page;

  return (
    <div className="app-shell">
      <Navbar
        onDashboard={goToDashboard}
        onProfile={goToProfile}
        onDeals={goToDeals}
        activePage={activeNavPage}
      />
      <main className="app-main">
        {page === "dashboard" && (
          <FreelancerDashboard ref={dashboardRef} />
        )}
        {page === "deals" && (
          <FreelancerDeals
            deals={deals}
            isLoading={isLoadingDeals}
            onBack={() => setPage("dashboard")}
            onOpenWorkspace={goToWorkspace}
          />
        )}
        {page === "profile" && (
          <FreelancerProfile onBack={() => setPage("dashboard")} />
        )}
        {page === "workspace" && (
          <Workspace
            deal={selectedDeal}
            onBack={() => setPage("deals")}
            viewerRole="freelancer"
          />
        )}
      </main>
      <Footer />
    </div>
  );
};

const FreelancerRoute = () => {
  const session = getStoredSession();

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  if (session.role === "client") {
    return <Navigate to="/client" replace />;
  }

  if (session.role !== "freelancer" && session.role !== "admin") {
    return <Navigate to="/login" replace />;
  }

  return <FreelancerShell />;
};

const ClientRoute = () => {
  const session = getStoredSession();

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  if (session.role === "freelancer" || session.role === "admin") {
    return <Navigate to="/app" replace />;
  }

  if (session.role !== "client") {
    return <Navigate to="/login" replace />;
  }

  return <ClientShell />;
};

const App = () => (
  <Routes>
    <Route path="/" element={<Landing />} />
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route path="/app" element={<FreelancerRoute />} />
    <Route path="/client" element={<ClientRoute />} />
    <Route path="/profile/:name" element={<FreelancerProfile onBack={() => window.history.back()} />} />
  </Routes>
);

export default App;
