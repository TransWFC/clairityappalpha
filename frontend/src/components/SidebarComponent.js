import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Badge } from "react-bootstrap";
import { BsHouseDoor, BsRouter, BsPeople } from "react-icons/bs";

const SIDEBAR_WIDTH = 280; // keep consistent across components
const LG_BREAKPOINT = 992; // bootstrap lg

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= LG_BREAKPOINT);
  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= LG_BREAKPOINT);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return isDesktop;
}

const SidebarComponent = ({ isOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeItem, setActiveItem] = useState("");
  const isDesktop = useIsDesktop();

  useEffect(() => {
    const path = location.pathname;
    if (path.includes("/devices")) setActiveItem("devices");
    else if (path.includes("/users")) setActiveItem("users");
    else if (path.includes("/profile")) setActiveItem("profile");
    else setActiveItem("dashboard");
  }, [location]);

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: BsHouseDoor, path: "/dashboard", color: "#667eea", description: "Vista general del sistema" },
    { id: "devices", label: "Dispositivos", icon: BsRouter, path: "/devices", color: "#28a745", description: "Gestión de dispositivos IoT" },
    { id: "users", label: "Usuarios", icon: BsPeople, path: "/users", color: "#17a2b8", description: "Administración de usuarios" },
  ];

  const handleNavigate = (item) => {
    if (!item.disabled) {
      setActiveItem(item.id);
      navigate(item.path);
    }
  };

  // Responsive sizing/behavior
  const width = isDesktop ? (isOpen ? `${SIDEBAR_WIDTH}px` : "0px") : (isOpen ? "min(84vw, 320px)" : "0px");
  const sidebarStyle = {
    width,
    height: "100vh",
    background: "linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%)",
    position: "fixed",
    top: "70px",
    left: 0,
    overflowX: "hidden",
    overflowY: "auto",
    transition: "width 0.3s ease",
    zIndex: 1020,
    borderRight: "1px solid #e9ecef",
    boxShadow: isOpen ? "4px 0 20px rgba(0,0,0,0.1)" : "none"
  };

  const contentStyle = {
    opacity: isOpen ? 1 : 0,
    transition: "opacity 0.25s ease 0.05s",
    pointerEvents: isOpen ? "auto" : "none",
    padding: 24,
  };

  return (
    <aside style={sidebarStyle} aria-hidden={!isOpen} aria-label="Barra lateral de administración">
      <div style={contentStyle}>
        <div className="mb-4">
          <h5 className="fw-bold mb-1" style={{ color: "#1a1d29", fontSize: "1.2rem" }}>Panel de Administración</h5>
          <p className="text-muted small mb-0">Gestiona tu sistema Clairity</p>
        </div>

        <div className="d-flex flex-column gap-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeItem === item.id;
            return (
              <div
                key={item.id}
                className="position-relative"
                style={{ cursor: item.disabled ? "not-allowed" : "pointer", opacity: item.disabled ? 0.5 : 1 }}
                onClick={() => handleNavigate(item)}
              >
                <div
                  className="d-flex align-items-center p-3 rounded-3"
                  style={{
                    background: isActive
                      ? `linear-gradient(135deg, ${item.color}20 0%, ${item.color}10 100%)`
                      : "transparent",
                    border: isActive ? `2px solid ${item.color}30` : "2px solid transparent",
                    transition: "all 0.2s ease",
                    transform: "scale(1)"
                  }}
                  onMouseEnter={(e) => {
                    if (!item.disabled) {
                      e.currentTarget.style.transform = "scale(1.02)";
                      e.currentTarget.style.background = isActive
                        ? `linear-gradient(135deg, ${item.color}20 0%, ${item.color}10 100%)`
                        : `${item.color}08`;
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                    e.currentTarget.style.background = isActive
                      ? `linear-gradient(135deg, ${item.color}20 0%, ${item.color}10 100%)`
                      : "transparent";
                  }}
                >
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center me-3"
                    style={{
                      width: 40, height: 40,
                      background: isActive ? `linear-gradient(135deg, ${item.color} 0%, ${item.color}cc 100%)` : `${item.color}15`,
                      transition: "all 0.2s ease"
                    }}
                  >
                    <Icon size={18} style={{ color: isActive ? "white" : item.color }} />
                  </div>

                  <div className="flex-grow-1">
                    <div className="d-flex align-items-center justify-content-between">
                      <span className="fw-semibold" style={{ color: isActive ? item.color : "#1a1d29", fontSize: "0.95rem" }}>
                        {item.label}
                      </span>
                      {item.badge && (
                        <Badge style={{ background: `${item.color}20`, color: item.color, fontSize: "0.75rem" }}>
                          {item.badge}
                        </Badge>
                      )}
                    </div>
                    <p className="mb-0 small" style={{ color: isActive ? `${item.color}cc` : "#6c757d", fontSize: "0.8rem" }}>
                      {item.description}
                    </p>
                    {item.stats && (
                      <p className="mb-0" style={{ color: isActive ? `${item.color}aa` : "#8c9197", fontSize: "0.75rem", marginTop: 2 }}>
                        {item.stats}
                      </p>
                    )}
                  </div>

                  {isActive && (
                    <div
                      className="position-absolute"
                      style={{
                        right: 0, top: "50%", transform: "translateY(-50%)",
                        width: 4, height: "60%",
                        background: `linear-gradient(180deg, ${item.color} 0%, ${item.color}cc 100%)`,
                        borderRadius: "2px 0 0 2px"
                      }}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
};

export default SidebarComponent;
export { SIDEBAR_WIDTH, LG_BREAKPOINT };
