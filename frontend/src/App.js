import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import About from "./pages/About";
import UserManagement from "./pages/UserManagement"; // Import UserManagement page
import ClarityDashboard from "./pages/ClairityDashboard";
import DashboardDetail from "./pages/DashboardDetail";
import DeviceManagement from "./pages/DeviceMonitoring";
import Profile from "./pages/Profile"; // Import Profile page

const REACT_APP_BACKEND_API_URL = process.env.REACT_APP_BACKEND_API_URL;

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/users" element={<UserManagement />} /> {/* New route for user management */}
        <Route path="/dashboard" element={<ClarityDashboard />} />
        <Route path="/detail" element={<DashboardDetail />} />
        <Route path="/about" element={<About />} />
        <Route path="/devices" element={<DeviceManagement />} />
        <Route path="/profile" element={<Profile />} /> {/* New route for profile */}
      </Routes>
    </Router>
  );
}

export default App;
