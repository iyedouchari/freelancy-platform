import { useRef, useState } from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import FreelancerDashboard from "./pages/freelancer/FreelancerDashboard";
import FreelancerProfile from "./components/FreelancerProfile";
import Deals from "./pages/shared/Deals";
import Landing from "./pages/public/Landing";
import Login from "./pages/public/Login";
import Register from "./pages/public/Register";
import Workspace from "./pages/shared/Workspace";

/* Inner app shell — keeps the existing state-based navigation for the logged-in area */
const AppShell = () => {
  const dashboardRef = useRef(null);
  const [page, setPage] = useState("dashboard"); // profile | dashboard | deals | workspace

  const goToDashboard = () => {
    dashboardRef.current?.goDashboard?.();
    setPage("dashboard");
  };

  const goToDeals = () => setPage("deals");
  const goToProfile = () => setPage("profile");
  const goToWorkspace = () => setPage("workspace");

  return (
    <div className="app-shell">
      <Navbar
        onDashboard={goToDashboard}
        onProfile={goToProfile}
        onDeals={goToDeals}
        activePage={page}
      />
      <main className="app-main">
        {page === "profile" && (
          <FreelancerProfile onBack={() => setPage("dashboard")} />
        )}
        {page === "dashboard" && (
          <FreelancerDashboard ref={dashboardRef} />
        )}
        {page === "deals" && (
          <Deals
            onBack={() => setPage("dashboard")}
            onOpenWorkspace={goToWorkspace}
          />
        )}
        {page === "workspace" && (
          <Workspace onBack={() => setPage("deals")} />
        )}
      </main>
      <Footer />
    </div>
  );
};

const App = () => (
  <Routes>
    <Route path="/" element={<Landing />} />
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route path="/app" element={<AppShell />} />
  </Routes>
);

export default App;
