import { Link } from "react-router-dom";
import ContextMenu from "./ui/ContextMenu";
import { useNavigate } from "react-router-dom";
import BibliographyCard from "./ui/BibliographyCard";
import { useState } from "react";
import { CitationStylesMenu } from "./BibliographyTools";
import { useDispatch, useSelector } from "react-redux";
import * as citationEngine from "../utils/citationEngine";
import { addNewBib } from "../store/slices/bibsSlice";
import Logo from "./ui/Logo";

export default function Home() {
    const bibliographies = useSelector((state) => state.bibliographies);
    const [citationStyleMenuVisible, setCitationStyleMenuVisible] = useState(false);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    function addNewBibWithStyle(style) {
        setCitationStyleMenuVisible(false);
        dispatch(addNewBib({ bibliographyStyle: style }));
        citationEngine.updateCslFiles(style);
    }

    return (
        <div className="mx-auto max-w-[50rem]">
            <Logo />

            <ContextMenu
                icon="more_vert"
                menuStyle={{}}
                buttonType={"Small Button"}
                options={[{ label: "Settings", method: () => navigate("/settings") }]}
            />

            <div className="grid place-items-start gap-y-2">
                {bibliographies && bibliographies.length > 0 ? (
                    bibliographies.map((bib) => (
                        <Link key={bib.id} to={`/${bib.id}`} className="w-full" style={{ textDecoration: "none" }}>
                            <BibliographyCard bibliography={bib} />
                        </Link>
                    ))
                ) : (
                    <p>
                        No bibliographies added yet. Click the button to create one based on citation style or to import
                        from other softwares.
                    </p>
                )}
            </div>

            {citationStyleMenuVisible && (
                <CitationStylesMenu {...{ setCitationStyleMenuVisible, onStyleSelected: addNewBibWithStyle }} />
            )}
            <button
                className="border-2 border-neutral-black fixed p-3 bottom-5 right-5 bg-primary-500"
                onClick={() => {
                    setCitationStyleMenuVisible(true);
                }}
            >
                Add bibliography
            </button>
        </div>
    );
}
