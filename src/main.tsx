import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Self-hosted fonts via @fontsource
import "@fontsource/inter/300.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/inter/800.css";
import "@fontsource/playfair-display/600.css";
import "@fontsource/playfair-display/700.css";
import "@fontsource/playfair-display/800.css";

createRoot(document.getElementById("root")!).render(<App />);
