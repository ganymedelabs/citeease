import { useEffect, useState } from "react";
import Bibliography from "./components/Bibliography";
import { Route, Routes } from "react-router-dom";
import Home from "./components/Home";
import { db, useIndexedDB, useReducerWithIndexedDB } from "./utils";
import bibliographiesReducer, { ACTIONS } from "./components/reducers/bibliographiesReducer";
import Settings from "./components/Settings";
import BibliographySettings from "./components/BibliographySettings";
import settingsReducer from "./components/reducers/settingsReducer";
import MarkdownPage from "./components/MarkdownPage";
import { AcceptDialog, ConfirmDialog } from "./components/ui/Dialogs";
import NotFoundPage from "./components/NotFoundPage";
import { useLiveQuery } from "dexie-react-hooks";

export default function App() {
    const [bibliographies, dispatch] = useReducerWithIndexedDB(
        "bibliographies",
        bibliographiesReducer,
        useLiveQuery(() => db.bibliographies?.get()) || []
    );
    const [settings, settingsDispatch] = useReducerWithIndexedDB(
        "settings",
        settingsReducer,
        useLiveQuery(() => db.settings?.get()) || {}
    );
    const [savedCslFiles, updateSavedCslFiles] = useIndexedDB(
        "savedCslFiles",
        useLiveQuery(() => db.savedCslFiles?.get()) || {}
    );
    const [acceptDialog, setAcceptDialog] = useState({});
    const [confirmDialog, setConfirmDialog] = useState({});

    useEffect(() => {
        const h1 = document.querySelector("h1");
        if (h1) document.title = `${h1.textContent} - CiteEase` || "CiteEase";

        return () => (document.title = "CiteEase");
    });

    function showAcceptDialog(title, body = "") {
        setAcceptDialog({ message: { title, body } });
    }

    function showConfirmDialog(title, body, onConfirmMethod, yesLabel = "Yes", noLabel = "No") {
        setConfirmDialog({ message: { title, body }, onConfirmMethod, yesLabel, noLabel });
    }

    return (
        <div className="font-sans bg-neutral-white p-5 min-h-screen text-neutral-black">
            <Routes>
                <Route
                    path="/"
                    element={<Home bibliographies={bibliographies} dispatch={dispatch} ACTIONS={ACTIONS} />}
                />
                <Route
                    path="/settings"
                    element={<Settings settings={settings} settingsDispatch={settingsDispatch} />}
                />
                <Route
                    path="/:bibId"
                    element={
                        <Bibliography
                            bibliographies={bibliographies}
                            dispatch={dispatch}
                            ACTIONS={ACTIONS}
                            settings={settings}
                            showAcceptDialog={showAcceptDialog}
                            showConfirmDialog={showConfirmDialog}
                            savedCslFiles={savedCslFiles}
                            updateSavedCslFiles={updateSavedCslFiles}
                        />
                    }
                />
                <Route path="/:bibId/settings" element={<BibliographySettings bibliographies={bibliographies} />} />

                <Route
                    path="/about"
                    element={<MarkdownPage title={"About CiteEase"} filePath={"/citeease/markdown/about.md"} />}
                />
                <Route
                    path="/terms"
                    element={<MarkdownPage title={"Terms of Use"} filePath={"/citeease/markdown/terms.md"} />}
                />
                <Route
                    path="/privacy"
                    element={<MarkdownPage title={"Privacy Policy"} filePath={"/citeease/markdown/privacy.md"} />}
                />

                <Route path="*" element={<NotFoundPage />} />
            </Routes>

            {acceptDialog.message && (
                <AcceptDialog message={acceptDialog.message} closeDialog={() => setAcceptDialog({})} />
            )}
            {confirmDialog.message && <ConfirmDialog {...confirmDialog} closeDialog={() => setConfirmDialog({})} />}
        </div>
    );
}
