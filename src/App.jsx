import { useRef, useState } from "react";
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
import { activeDeals } from "./data/deals";

function getStoredRole() {
  return localStorage.getItem("app_role");
}

const FreelancerShell = () => {
  const dashboardRef = useRef(null);
  const [page, setPage] = useState("dashboard");
  const [selectedDealId, setSelectedDealId] = useState(activeDeals[0]?.id ?? null);

  const goToDashboard = () => {
    dashboardRef.current?.goDashboard?.();
    setPage("dashboard");
  };

  const goToDeals = () => setPage("deals");
  const goToProfile = () => setPage("profile");

  const goToWorkspace = (dealId) => {
    if (dealId) {
      setSelectedDealId(dealId);
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
            onBack={() => setPage("dashboard")}
            onOpenWorkspace={goToWorkspace}
          />
        )}
        {page === "profile" && (
          <FreelancerProfile onBack={() => setPage("dashboard")} />
        )}
        {page === "workspace" && (
          <Workspace
            dealId={selectedDealId}
            onBack={() => setPage("deals")}
          />
        )}
      </main>
      <Footer />
    </div>
  );
};

const FreelancerRoute = () => {
  const role = getStoredRole();

  if (!role) {
    return <Navigate to="/login" replace />;
  }

  if (role === "client") {
    return <Navigate to="/client" replace />;
  }

  return <FreelancerShell />;
};

const ClientRoute = () => {
  const role = getStoredRole();

  if (!role) {
    return <Navigate to="/login" replace />;
  }

  if (role === "freelancer") {
    return <Navigate to="/app" replace />;
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
  </Routes>
);

export default App;
