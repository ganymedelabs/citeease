import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router } from "react-router-dom";
import { Provider as ReduxeProvider } from "react-redux";
import App from "./App";
import store from "./data/store/store.ts";
import { AuthProvider } from "./context/AuthContext";
import ToastProvider from "./context/ToastContext.tsx";
import ErrorBoundary from "./components/ErrorBoundary";
import DialogProvider from "./context/DialogContext.tsx";

import "./index.css";
// import "@material/web/all";
import "@material/web/button/filled-button";
import "@material/web/button/text-button";
import "@material/web/checkbox/checkbox";
import "@material/web/chips/assist-chip";
import "@material/web/chips/chip-set";
import "@material/web/chips/input-chip";
import "@material/web/dialog/dialog";
import "@material/web/divider/divider";
import "@material/web/fab/fab";
import "@material/web/field/filled-field";
import "@material/web/icon/icon";
import "@material/web/iconbutton/icon-button";
import "@material/web/list/list";
import "@material/web/list/list-item";
import "@material/web/menu/menu";
import "@material/web/menu/menu-item";
import "@material/web/menu/sub-menu";
import "@material/web/textfield/filled-text-field";
import "@material/web/progress/circular-progress";
import "@material/web/progress/linear-progress";
import "@material/web/select/filled-select";
import "@material/web/select/select-option";

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <ErrorBoundary>
            <Router basename="/citeease/">
                <AuthProvider>
                    <ReduxeProvider store={store}>
                        <ToastProvider>
                            <DialogProvider>
                                <App />
                            </DialogProvider>
                        </ToastProvider>
                    </ReduxeProvider>
                </AuthProvider>
            </Router>
        </ErrorBoundary>
    </React.StrictMode>
);

if ("serviceWorker" in navigator) {
    const publicUrl = import.meta.env.VITE_PUBLIC_URL;

    navigator.serviceWorker
        .register(`${publicUrl}/service-worker.js`, { scope: `${publicUrl}/` })
        .then((registration) => {
            console.log("Service Worker registered with scope:", registration.scope);
        })
        .catch((error) => {
            console.error("Service Worker registration failed:", error);
        });
}
