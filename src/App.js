import { useEffect, useState } from "react";
import Bibliography from "./components/Bibliography";
import { Route, Routes } from "react-router-dom";
import db from "./db/dexie";
import Home from "./components/Home";
import { useIndexedDB, useReducerWithIndexedDB } from "./hooks/hooks";
import { loadFromIndexedDB } from "./store/slices/bibsSlice";
import Settings from "./components/Settings";
import BibliographySettings from "./components/BibliographySettings";
import MarkdownPage from "./components/MarkdownPage";
import { AcceptDialog, ConfirmDialog } from "./components/ui/Dialogs";
import NotFoundPage from "./components/NotFoundPage";
import { useLiveQuery } from "dexie-react-hooks";
import { useDispatch } from "react-redux";

export default function App() {
    const [savedCslFiles, updateSavedCslFiles] = useIndexedDB(
        "savedCslFiles",
        useLiveQuery(() => db.savedCslFiles?.get()) || {}
    );
    const [acceptDialog, setAcceptDialog] = useState({});
    const [confirmDialog, setConfirmDialog] = useState({});

    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(loadFromIndexedDB());
    }, [dispatch]);

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
                <Route path="/" element={<Home />} />
                <Route path="/settings" element={<Settings />} />
                <Route
                    path="/:bibId"
                    element={
                        <Bibliography
                            showAcceptDialog={showAcceptDialog}
                            showConfirmDialog={showConfirmDialog}
                            savedCslFiles={savedCslFiles}
                            updateSavedCslFiles={updateSavedCslFiles}
                        />
                    }
                />
                <Route path="/:bibId/settings" element={<BibliographySettings />} />

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
