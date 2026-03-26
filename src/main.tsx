import { useState } from "react";
import { createRoot } from "react-dom/client";
import EbereLLMPanel from "../EbereLLMPanel";
import EbereLLMMobile from "../EbereLLMMobile";

type View = "desktop" | "mobile";

function App() {
  const [colorScheme, setColorScheme] = useState<"dark" | "light">("dark");
  const [view, setView] = useState<View>("desktop");
  const [mobileOpen, setMobileOpen] = useState(true);

  const bg = colorScheme === "dark" ? "#121212" : "#e8e8e8";

  const tabBase: React.CSSProperties = {
    padding: "6px 14px",
    borderRadius: 8,
    border: "none",
    cursor: "pointer",
    fontFamily: "monospace",
    fontSize: 12,
  };

  const activeTab: React.CSSProperties = {
    ...tabBase,
    background: colorScheme === "dark" ? "#9e9eff" : "#0000ee",
    color: "#fff",
  };

  const inactiveTab: React.CSSProperties = {
    ...tabBase,
    background: colorScheme === "dark" ? "#2b2b2b" : "#ccc",
    color: colorScheme === "dark" ? "#9e9e9e" : "#555",
  };

  return (
    <div style={{ background: bg, minHeight: "100vh" }}>
      {/* Controls */}
      <div
        style={{
          position: "fixed",
          top: 16,
          left: 16,
          zIndex: 99999,
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        {/* View toggle */}
        <button style={view === "desktop" ? activeTab : inactiveTab} onClick={() => setView("desktop")}>
          Desktop
        </button>
        <button
          style={view === "mobile" ? activeTab : inactiveTab}
          onClick={() => { setView("mobile"); setMobileOpen(true); }}
        >
          Mobile
        </button>

        {/* Divider */}
        <span style={{ width: 1, background: "#444", margin: "0 4px" }} />

        {/* Theme toggle */}
        <button
          style={colorScheme === "dark" ? activeTab : inactiveTab}
          onClick={() => setColorScheme("dark")}
        >
          Dark
        </button>
        <button
          style={colorScheme === "light" ? activeTab : inactiveTab}
          onClick={() => setColorScheme("light")}
        >
          Light
        </button>

        {/* Mobile open/close */}
        {view === "mobile" && (
          <>
            <span style={{ width: 1, background: "#444", margin: "0 4px" }} />
            <button
              style={inactiveTab}
              onClick={() => setMobileOpen((v) => !v)}
            >
              {mobileOpen ? "Close panel" : "Open panel"}
            </button>
          </>
        )}
      </div>

      {/* Mobile frame hint */}
      {view === "mobile" && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: 390,
            height: "100dvh",
            border: `1px dashed ${colorScheme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
            pointerEvents: "none",
            zIndex: 9990,
          }}
        />
      )}

      {/* Components */}
      {view === "desktop" && (
        <EbereLLMPanel colorScheme={colorScheme} isOpen={true} />
      )}

      {view === "mobile" && (
        <EbereLLMMobile
          colorScheme={colorScheme}
          isOpen={mobileOpen}
          onClose={() => setMobileOpen(false)}
          width={390}
        />
      )}
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
