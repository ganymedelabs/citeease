import { nanoid } from "nanoid";

export const ACTIONS = {
    ADD_NEW_BIBLIOGRAPHY: "Add new bibliography",
    UPDATE_BIBLIOGRAPHY_FIELDS: "Update bibliography fields",
    ADD_NEW_CITATION_TO_BIBLIOGRAPHY: "Add new citation to bibliography",
    ADD_CITATION_TO_EDITED_CITATION: "Add citation to edited citation",
    UPDATE_CONTENT_IN_EDITED_CITATION: "Update content in edited citation",
    UPDATE_CITATION_IN_BIBLIOGRAPHY: "Update citation in bibliography",
    TOGGLE_REFERENCE_ENTRY_CHECKBOX: "Toggle reference entry checkbox",
    HANDLE_MASTER_REFERENCE_ENTRY_CHECKBOX: "Handle manster reference entry checkbox",
    UNCHECK_ALL_CITATIONS: "Uncheck all citations",
    DELETE_BIBLIOGRAPHY: "Delete bibliography",
    DELETE_SELECTED_CITATIONS: "Delete selected citations",
    MOVE_SELECTED_CITATIONS: "Move selected citations",
    COPY_SELECTED_CITATIONS: "Copy selected citations",
    DUPLICATE_SELECTED_CITATIONS: "Duplicate selected citations",
    ADD_NEW_BIBLIOGRAPHY_AND_MOVE_CITATIONS: "Add new bibliography and move citations",
};

const initialState = [];

export default function bibliographiesReducer(bibliographies = initialState, action) {
    console.log(action);

    switch (action.type) {
        case ACTIONS.ADD_NEW_BIBLIOGRAPHY:
            const newBibliography = {
                title: "Untitled Bibliography",
                style: action.payload.bibliographyStyle,
                dateCreated: new Date(),
                dateModified: new Date(),
                id: "bib=" + nanoid(10),
                citations: [],
            };
            return [...bibliographies, newBibliography];

        case ACTIONS.UPDATE_BIBLIOGRAPHY_FIELDS:
            return bibliographies?.map((bib) => {
                if (bib.id === action.payload.bibliographyId) {
                    return { ...bib, [action.payload.key]: action.payload.value, dateModified: new Date() };
                }
                return bib;
            });

        case ACTIONS.ADD_NEW_CITATION_TO_BIBLIOGRAPHY:
            return bibliographies.map((bib) => {
                if (bib.id === action.payload.bibliographyId) {
                    let updatedBib;
                    if (action.payload?.content) {
                        // Create a deep copy of the citations array
                        const updatedCitations = [
                            ...bib.citations,
                            {
                                id: nanoid(),
                                content: {
                                    ...action.payload?.content,
                                    id: nanoid(),
                                },
                                isChecked: false,
                            },
                        ];
                        updatedBib = {
                            ...bib,
                            citations: updatedCitations,
                            dateModified: new Date(),
                        };
                    } else if (action.payload.sourceType) {
                        // Similar approach for adding a new citation to editedCitation
                        const updatedCitations = [
                            ...bib.citations,
                            {
                                id: nanoid(),
                                content: {
                                    id: nanoid(),
                                    type: action.payload.sourceType,
                                    author: [{ given: "", family: "", id: nanoid() }],
                                },
                                isChecked: false,
                            },
                        ];
                        updatedBib = {
                            ...bib,
                            citations: updatedCitations,
                            dateModified: new Date(),
                        };
                    }
                    return updatedBib || bib;
                }
                return bib;
            });

        case ACTIONS.ADD_CITATION_TO_EDITED_CITATION:
            return bibliographies?.map((bib) => {
                if (bib.id === action.payload.bibliographyId) {
                    const targetCitation = bib.citations.find((cit) => cit.id === action.payload.citationId);
                    return {
                        ...bib,
                        editedCitation: targetCitation,
                    };
                }
                return bib;
            });

        case ACTIONS.UPDATE_CONTENT_IN_EDITED_CITATION:
            return bibliographies?.map((bib) => {
                if (bib.id === action.payload.bibliographyId) {
                    return {
                        ...bib,
                        editedCitation: { ...bib.editedCitation, content: action.payload.content },
                        dateModified: new Date(),
                    };
                }
                return bib;
            });

        case ACTIONS.UPDATE_CITATION_IN_BIBLIOGRAPHY:
            return bibliographies?.map((bib) => {
                if (bib.id === action.payload.bibliographyId) {
                    const citationIndex = bib.citations.findIndex((cit) => cit.id === action.payload.editedCitation.id);
                    let updatedCitations;

                    if (citationIndex !== -1) {
                        // If the citation exists, update it
                        updatedCitations = bib.citations.map((cit, index) => {
                            if (index === citationIndex) {
                                return { ...cit, ...action.payload.editedCitation, isChecked: false }; // Update the existing citation
                            }
                            return cit;
                        });
                    } else {
                        // If the citation doesn't exist, add it
                        updatedCitations = [...bib.citations, action.payload.editedCitation];
                    }

                    return {
                        ...bib,
                        citations: updatedCitations,
                        dateModified: new Date(),
                    };
                }
                return bib;
            });

        case ACTIONS.TOGGLE_REFERENCE_ENTRY_CHECKBOX:
            return bibliographies?.map((bib) => {
                if (bib.id === action.payload.bibliographyId) {
                    const citationIndex = bib.citations.findIndex((cit) => cit.id === action.payload.citationId);
                    let updatedCitations;

                    updatedCitations = bib.citations.map((cit, index) => {
                        if (index === citationIndex) {
                            return { ...cit, isChecked: !cit.isChecked };
                        }
                        return cit;
                    });

                    return {
                        ...bib,
                        citations: updatedCitations,
                    };
                }
                return bib;
            });

        case ACTIONS.HANDLE_MASTER_REFERENCE_ENTRY_CHECKBOX:
            return bibliographies?.map((bib) => {
                if (bib.id === action.payload.bibliographyId) {
                    const allChecked = bib.citations.every((cit) => cit.isChecked);
                    const allUnchecked = bib.citations.every((cit) => !cit.isChecked);

                    // If all citations are checked, uncheck all of them
                    if (allChecked) {
                        return {
                            ...bib,
                            citations: bib.citations.map((cit) => ({ ...cit, isChecked: false })),
                        };
                    }
                    // If all citations are unchecked, check all of them
                    else if (allUnchecked) {
                        return {
                            ...bib,
                            citations: bib.citations.map((cit) => ({ ...cit, isChecked: true })),
                        };
                    }
                    // If some citations are checked, check the rest
                    else {
                        return {
                            ...bib,
                            citations: bib.citations.map((cit) => ({ ...cit, isChecked: true })),
                        };
                    }
                }
                return bib;
            });

        case ACTIONS.UNCHECK_ALL_CITATIONS:
            return bibliographies?.map((bib) => {
                if (bib.id === action.payload.bibliographyId) {
                    return {
                        ...bib,
                        citations: bib.citations.map((cit) => ({ ...cit, isChecked: false })),
                    };
                }
                return bib;
            });

        case ACTIONS.DELETE_BIBLIOGRAPHY:
            return bibliographies?.filter((bib) => bib.id !== action.payload.bibliographyId);

        case ACTIONS.MOVE_SELECTED_CITATIONS:
            return bibliographies?.map((bib) => {
                if (bib.id === action.payload.toId) {
                    return {
                        ...bib,
                        citations: [...bib.citations, ...action.payload.checkedCitations],
                        dateModified: new Date(),
                    };
                } else if (bib.id === action.payload.fromId) {
                    const idsForDelete = action.payload.checkedCitations.map((cit) => cit.id);
                    return {
                        ...bib,
                        citations: bib.citations.filter((cit) => !idsForDelete.includes(cit.id)),
                        dateModified: new Date(),
                    };
                }
                return bib;
            });

        case ACTIONS.COPY_SELECTED_CITATIONS:
            return bibliographies?.map((bib) => {
                const filteredCitations = bib.citations.filter(
                    (cit) => !action.payload.checkedCitations.some((checkedCit) => checkedCit.id === cit.id)
                );
                const updatedCitations = filteredCitations.map((cit) => ({ ...cit, isChecked: false }));
                const copiedCitations = action.payload.checkedCitations.map((cit) => {
                    const newId = nanoid();
                    return { ...cit, id: newId, content: { ...cit.content, id: newId }, isChecked: false };
                });
                return {
                    ...bib,
                    citations: [...updatedCitations, ...copiedCitations],
                    dateModified: new Date(),
                };
            });

        case ACTIONS.DUPLICATE_SELECTED_CITATIONS:
            return bibliographies?.map((bib) => {
                if (bib.id === action.payload.bibliographyId) {
                    const newIds = action.payload.checkedCitations.map(() => nanoid());
                    const duplicatedCitations = action.payload.checkedCitations.map((cit, index) => ({
                        ...cit,
                        id: newIds[index],
                        content: { ...cit.content, id: newIds[index] },
                        isChecked: false,
                    }));
                    return {
                        ...bib,
                        citations: [
                            ...bib.citations.map((cit) => ({ ...cit, isChecked: false })),
                            ...duplicatedCitations,
                        ],
                        dateModified: new Date(),
                    };
                }
                return bib;
            });

        case ACTIONS.DELETE_SELECTED_CITATIONS:
            return bibliographies?.map((bib) => {
                if (bib.id === action.payload.bibliographyId) {
                    const targetIds = action.payload.checkedCitations.map((cit) => cit.id);
                    return {
                        ...bib,
                        citations: bib.citations.filter((cit) => !targetIds.includes(cit.id)),
                        dateModified: new Date(),
                    };
                }
                return bib;
            });

        case ACTIONS.ADD_NEW_BIBLIOGRAPHY_AND_MOVE_CITATIONS:
            const newQuickBibliography = {
                title: "Untitled Bibliography",
                style: action.payload.bibliographyStyle,
                dateCreated: new Date(),
                dateModified: new Date(),
                id: "bib=" + nanoid(10),
                citations: [...action.payload.checkedCitations],
            };
            return [...bibliographies, newQuickBibliography];

        default:
            return bibliographies;
    }
}
