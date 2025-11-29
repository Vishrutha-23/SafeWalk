import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "@tomtom-international/web-sdk-maps/dist/maps.css";


createRoot(document.getElementById("root")!).render(<App />);
