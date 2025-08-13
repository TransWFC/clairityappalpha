import React, { useEffect, useState } from "react";
import SidebarComponent, { SIDEBAR_WIDTH, LG_BREAKPOINT } from "./SidebarComponent";
import NavbarComponent from "./NavbarComponent";

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= LG_BREAKPOINT);
  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= LG_BREAKPOINT);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return isDesktop;
}

const LayoutWithSidebar = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isDesktop = useIsDesktop();

  const user = JSON.parse(localStorage.getItem("user"));
  const isAdmin = user?.type === "admin";

  // Close sidebar when resizing to desktop -> keep state; on going to mobile, close to avoid hidden overlay
  useEffect(() => {
    if (!isDesktop) {
      // ensure closed when entering mobile to avoid off-screen focus traps
      setSidebarOpen(false);
    }
  }, [isDesktop]);

  // Close on ESC (mobile overlay)
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") setSidebarOpen(false);
    };
    if (sidebarOpen) document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [sidebarOpen]);

  const contentStyle = {
    marginLeft: isAdmin && isDesktop && sidebarOpen ? `${SIDEBAR_WIDTH}px` : "0px",
    transition: "margin-left 0.3s ease",
  };

  return (
    <div className="d-flex">
      {isAdmin && <SidebarComponent isOpen={sidebarOpen} />}

      {/* Mobile overlay backdrop */}
      {isAdmin && sidebarOpen && !isDesktop && (
        <div
          role="button"
          aria-label="Cerrar menú lateral"
          onClick={() => setSidebarOpen(false)}
          style={{
            position: "fixed", inset: 0, top: "70px",
            background: "rgba(16,24,40,0.4)",
            backdropFilter: "blur(2px)",
            zIndex: 1015
          }}
        />
      )}

      <div className="flex-grow-1" style={contentStyle}>
        <NavbarComponent toggleSidebar={() => setSidebarOpen(v => !v)} />

        {/* Offset for fixed navbar */}
        <div style={{ paddingTop: "70px" }}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default LayoutWithSidebar;
