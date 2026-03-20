import { useRef, useState } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import FreelancerDashboard from "./pages/freelancer/FreelancerDashboard";
import FreelancerProfile from "./components/FreelancerProfile";

const App = () => {
  const dashboardRef = useRef(null);
  const [page, setPage] = useState("profile"); // profile | dashboard

  const goToDashboard = () => {
    dashboardRef.current?.goDashboard?.();
    setPage("dashboard");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar onDashboard={goToDashboard} onProfile={() => setPage("profile")} />
      <main className="flex-1 overflow-auto">
        {page === "profile" ? (
          <FreelancerProfile onBack={() => setPage("dashboard")} />
        ) : (
          <FreelancerDashboard ref={dashboardRef} />
        )}
      </main>
      <Footer />
    </div>
  );
};

export default App;
