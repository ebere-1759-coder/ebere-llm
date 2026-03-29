import { useState } from "react";
import { createRoot } from "react-dom/client";
import EbereLLMMobile from "../EbereLLMMobile";

function App() {
  const [colorScheme, setColorScheme] = useState<"dark" | "light">("light");

  return (
    <div
      style={{
        background: colorScheme === "dark" ? "#121212" : "#f0f0f0",
        minHeight: "100dvh",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
    >
      <EbereLLMMobile
        colorScheme={colorScheme}
        isOpen={true}
      />

      {/* Theme toggle */}
      <button
        onClick={() => setColorScheme((s) => (s === "dark" ? "light" : "dark"))}
        style={{
          position: "fixed",
          top: 16,
          right: 16,
          padding: "6px 14px",
          borderRadius: 8,
          border: "none",
          cursor: "pointer",
          fontFamily: "monospace",
          fontSize: 12,
          background: colorScheme === "dark" ? "#2b2b2b" : "#ddd",
          color: colorScheme === "dark" ? "#9e9e9e" : "#555",
          zIndex: 99999,
        }}
      >
        {colorScheme === "dark" ? "Light mode" : "Dark mode"}
      </button>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
