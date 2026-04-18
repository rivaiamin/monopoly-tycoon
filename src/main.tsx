import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "sweetalert2/dist/sweetalert2.min.css";
import "./index.css";

// StrictMode double-mounts effects in dev and races Colyseus reconnect + localStorage restore.
createRoot(document.getElementById("root")!).render(<App />);
