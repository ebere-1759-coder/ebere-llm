import { useState } from "react";
import { createRoot } from "react-dom/client";
import EbereLLMPanel from "../EbereLLMPanel";

function App() {
  const [colorScheme, setColorScheme] = useState<"dark" | "light">("dark");

  return (
    <>
      {/* Theme toggle */}
      <div style={{
        position: "fixed",
        top: 16,
        left: 16,
        zIndex: 99999,
        display: "flex",
        gap: 8,
      }}>
        <button
          onClick={() => setColorScheme("dark")}
          style={{
            padding: "6px 12px",
            borderRadius: 8,
            border: "none",
            background: colorScheme === "dark" ? "#9e9eff" : "#333",
            color: "#fff",
            cursor: "pointer",
            fontFamily: "monospace",
            fontSize: 12,
          }}
        >
          Dark
        </button>
        <button
          onClick={() => setColorScheme("light")}
          style={{
            padding: "6px 12px",
            borderRadius: 8,
            border: "none",
            background: colorScheme === "light" ? "#0000ee" : "#333",
            color: "#fff",
            cursor: "pointer",
            fontFamily: "monospace",
            fontSize: 12,
          }}
        >
          Light
        </button>
      </div>

      <EbereLLMPanel colorScheme={colorScheme} isOpen={true} />
    </>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
