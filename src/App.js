import "./css/App.css";
import { useState } from "react";
import Bibliography from "./components/Bibliography";
import { Route, Routes } from "react-router-dom";
import Home from "./components/Home";
import { db, useIndexedDB, useReducerWithIndexedDB } from "./utils";
import AcceptDialog from "./components/ui/AcceptDialog";
import ConfirmDialog from "./components/ui/ConfirmDialog";
import bibliographiesReducer, { ACTIONS } from "./components/reducers/bibliographiesReducer";
import Settings from "./components/Settings";
import BibliographySettings from "./components/BibliographySettings";
import settingsReducer from "./components/reducers/settingsReducer";
import MarkdownPage from "./components/MarkdownPage";
import { useLiveQuery } from "dexie-react-hooks";

const CITATION_STYLES = [
    { name: "American Psychological Association 7th edition", code: "apa" },
    { name: "Modern Language Association 9th edition", code: "modern-language-association" },
    { name: "Chicago Manual of Style 17th edition (author-date)", code: "chicago-author-date" },
    { name: "Cite Them Right 12th edition - Harvard", code: "harvard-cite-them-right" },
    { name: "Vancouver", code: "vancouver" },
];

export default function App() {
    const [bibliographies, dispatch] = useReducerWithIndexedDB(
        "bibliographies",
        bibliographiesReducer,
        useLiveQuery(() => db.bibliographies?.get())
    );
    const [settings, settingsDispatch] = useReducerWithIndexedDB(
        "settings",
        settingsReducer,
        useLiveQuery(() => db.settings?.get())
    );
    const [savedCslFiles, setSavedCslFiles] = useIndexedDB(
        "savedCslFiles",
        useLiveQuery(() => db.savedCslFiles?.get())
    );
    const [acceptDialog, setAcceptDialog] = useState({});
    const [confirmDialog, setConfirmDialog] = useState({});

    function showAcceptDialog(title, body = "") {
        setAcceptDialog({ message: { title, body } });
    }

    // TODO: Move this to utils.js, and use it instead of the error message of citationEngine.formatCitation
    function showConfirmDialog(title, body, onConfirmMethod, yesLabel = "Yes", noLabel = "No") {
        setConfirmDialog({ message: { title, body }, onConfirmMethod, yesLabel, noLabel });
    }

    return (
        <div className="app">
            <Routes>
                <Route
                    path="/"
                    element={
                        <Home
                            bibliographies={bibliographies}
                            CITATION_STYLES={CITATION_STYLES}
                            dispatch={dispatch}
                            ACTIONS={ACTIONS}
                        />
                    }
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
                            CITATION_STYLES={CITATION_STYLES}
                            dispatch={dispatch}
                            ACTIONS={ACTIONS}
                            settings={settings}
                            showAcceptDialog={showAcceptDialog}
                            showConfirmDialog={showConfirmDialog}
                            savedCslFiles={savedCslFiles}
                            setSavedCslFiles={setSavedCslFiles}
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

                {/* <Route path="*" element={<NotFoundPage />} /> */}
            </Routes>
            {acceptDialog.message && (
                <AcceptDialog message={acceptDialog.message} closeDialog={() => setAcceptDialog({})} />
            )}
            {confirmDialog.message && <ConfirmDialog {...confirmDialog} closeDialog={() => setConfirmDialog({})} />}
        </div>
    );
}
