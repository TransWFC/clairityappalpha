import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import About from "./pages/About";
import UserManagement from "./pages/UserManagement"; // Import UserManagement page
import ClarityDashboard from "./pages/ClairityDashboard";
import DeviceManagement from "./pages/DeviceMonitoring";
import Profile from "./pages/Profile"; // Import Profile page
import Visitor from "./pages/Visitor";
import PrivacyTerms from "./pages/PrivacyTerms";
const REACT_APP_BACKEND_API_URL = process.env.REACT_APP_BACKEND_API_URL;

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/privacy" element={<PrivacyTerms />} />
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/users" element={<UserManagement />} /> {/* New route for user management */}
        <Route path="/dashboard" element={<ClarityDashboard />} />
        <Route path="/about" element={<About />} />
        <Route path="/devices" element={<DeviceManagement />} />
        <Route path="/profile" element={<Profile />} /> {/* New route for profile */}
        <Route path="/visitor" element={<Visitor />} /> {/* New route for Visitor */}
      </Routes>
    </Router>
  );
}

export default App;
