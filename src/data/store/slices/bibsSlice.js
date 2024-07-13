import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
// import { doc, setDoc } from "firebase/firestore";
// import firestoreDB from "../../db/firebase/firebase";
import dexieDB from "../../db/dexie/dexie";
import { uid } from "../../../utils/utils.ts";

const initialState = [];

function save(newState, currentUser = undefined) {
    const serializedState = JSON.stringify(newState);
    dexieDB.items.put({ id: "bibliographies", value: serializedState });

    console.log(currentUser);

    // if (currentUser) {
    //     const parsedCurrentUser = JSON.parse(currentUser);
    //     const userRef = doc(firestoreDB, "users", parsedCurrentUser?.uid);
    //     setDoc(userRef, { bibliographies: JSON.stringify(newState) });

    //     newState.forEach((bib) => {
    //         if (bib?.collab?.open) {
    //             const coBibsRef = doc(firestoreDB, "coBibs", bib?.collab?.id);
    //             setDoc(coBibsRef, { bibliography: JSON.stringify(newState) });
    //         }
    //     });
    // }
}

export const loadFromIndexedDB = createAsyncThunk("bibliographies/loadFromIndexedDB", async () => {
    const loadedBibs = await dexieDB.items.get("bibliographies");
    const parsedBibs = await JSON.parse(loadedBibs.value);
    const cleanedBibs = parsedBibs?.map((bib) => ({
        ...bib,
        citations: bib.citations.map((cit) => ({ ...cit, isChecked: false })),
    }));

    return cleanedBibs;
});

const bibsSlice = createSlice({
    name: "bibliographies",
    initialState,
    reducers: {
        mergeWithCurrent: (bibs, action) => {
            // Prompt the user if they want to merge them first
            if (!action.payload.bibs) return bibs;
            const newBibs = action.payload.bibs;
            const newBibsIds = newBibs.map((bib) => bib.id);
            const filteredOldBibs = bibs.filter((bib) => !newBibsIds.includes(bib.id));
            const newState = [...filteredOldBibs, ...newBibs];
            save(newState, action.payload.currentUser);
            return newState;
        },
        enableCollabInBib: (bibs, action) => {
            const newState = bibs.map((bib) => {
                if (bib.id === action.payload.bibId && action.payload.currentUser) {
                    const parsedCurrentUser = JSON.parse(action.payload.currentUser);
                    return {
                        ...bib,
                        collab: {
                            open: true,
                            id: action.payload.coId,
                            adminId: parsedCurrentUser.uid,
                            collaborators: [{ name: parsedCurrentUser.displayName, id: parsedCurrentUser.uid }],
                            preferences: {},
                            changelog: [],
                            password: action.payload.password,
                        },
                    };
                }
                return bib;
            });
            save(newState, action.payload.currentUser);
            return newState;
        },
        reEnableCollabInBib: (bibs, action) => {
            const newState = bibs.map((bib) => {
                if (bib.id === action.payload.bibId) {
                    return {
                        ...bib,
                        collab: {
                            ...bib.collab,
                            open: true,
                        },
                    };
                }
                return bib;
            });
            save(newState, action.payload.currentUser);
            return newState;
        },
        disableCollabInBib: (bibs, action) => {
            const newState = bibs.map((bib) => {
                if (bib.id === action.payload.bibId) {
                    return {
                        ...bib,
                        collab: {
                            ...bib.collab,
                            open: false,
                            collaborators: [bib.collab.collaborators.find((co) => co.id === bib.collab.adminId)],
                            changelog: [],
                        },
                    };
                }
                return bib;
            });
            save(newState, action.payload.currentUser);
            return newState;
        },
        addNewBib: (bibs, action) => {
            const newBib = {
                title: "Untitled Bibliography",
                style: action.payload.bibliographyStyle,
                dateCreated: new Date().toString(),
                dateModified: new Date().toString(),
                id: uid(10),
                citations: [],
                tags: [],
            };
            const newState = [...bibs, newBib];
            save(newState, action.payload.currentUser);
            return newState;
        },
        deleteBib: (bibs, action) => {
            const newState = bibs?.filter((bib) => bib.id !== action.payload.bibliographyId);
            save(newState, action.payload.currentUser);
            return newState;
        },
        updateBibField: (bibs, action) => {
            const newState = bibs?.map((bib) => {
                if (bib.id === action.payload.bibliographyId) {
                    return { ...bib, [action.payload.key]: action.payload.value, dateModified: new Date().toString() };
                }
                return bib;
            });
            save(newState, action.payload.currentUser);
            return newState;
        },
        addNewCitation: (bibs, action) => {
            const newState = bibs.map((bib) => {
                if (bib.id === action.payload.bibliographyId) {
                    const citId = uid();
                    if (action.payload?.content) {
                        // If passed ready content, it gets added directly to the citations array
                        return {
                            ...bib,
                            citations: [
                                ...bib.citations,
                                {
                                    id: citId,
                                    content: {
                                        ...action.payload?.content,
                                        id: citId,
                                    },
                                    isChecked: false,
                                },
                            ],
                            dateModified: new Date().toString(),
                        };
                    }
                    if (action.payload.sourceType) {
                        // If passed a sourceType, it means it doesn't have content, so it gets added to the editedCitation field to get filled with the source's data
                        return {
                            ...bib,
                            editedCitation: {
                                id: citId,
                                content: {
                                    id: citId,
                                    type: action.payload.sourceType,
                                    author: [{ given: "", family: "", id: uid() }],
                                },
                                isChecked: false,
                            },
                            dateModified: new Date().toString(),
                        };
                    }
                }
                return bib;
            });
            save(newState, action.payload.currentUser);
            return newState;
        },
        editCitation: (bibs, action) => {
            const newState = bibs?.map((bib) => {
                if (bib.id === action.payload.bibliographyId) {
                    const targetCitation = bib.citations.find((cit) => cit.id === action.payload.citationId);
                    return {
                        ...bib,
                        editedCitation: { ...targetCitation },
                    };
                }
                return bib;
            });
            save(newState, action.payload.currentUser);
            return newState;
        },
        updateContentInEditedCitation: (bibs, action) => {
            const newState = bibs?.map((bib) => {
                if (bib.id === action.payload.bibliographyId) {
                    return {
                        ...bib,
                        editedCitation: { ...bib.editedCitation, content: action.payload.content },
                        dateModified: new Date().toString(),
                    };
                }
                return bib;
            });
            save(newState, action.payload.currentUser);
            return newState;
        },
        updateCitation: (bibs, action) => {
            const newState = bibs.map((bib) => {
                if (bib.id === action.payload.bibliographyId) {
                    const citationIndex = bib.citations.findIndex((cit) => cit.id === action.payload.editedCitation.id);
                    let updatedCitations;

                    if (citationIndex !== -1) {
                        // If the citation exists, update it
                        updatedCitations = bib.citations.map((cit, index) => {
                            if (index === citationIndex) {
                                return { ...cit, ...action.payload.editedCitation, isChecked: false };
                            }
                            return cit;
                        });
                    } else {
                        // If the citation doesn't exist, add it to the rest of bibliography.citations array
                        updatedCitations = [...bib.citations, action.payload.editedCitation];
                    }

                    return {
                        ...bib,
                        citations: updatedCitations,
                        dateModified: new Date().toString(),
                    };
                }
                return bib;
            });
            save(newState, action.payload.currentUser);
            return newState;
        },
        toggleEntryCheckbox: (bibs, action) => {
            const newState = bibs?.map((bib) => {
                if (bib.id === action.payload.bibliographyId) {
                    const citationIndex = bib.citations.findIndex((cit) => cit.id === action.payload.citationId);

                    const updatedCitations = bib.citations.map((cit, index) => {
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
            return newState;
        },
        handleMasterEntriesCheckbox: (bibs, action) => {
            const newState = bibs?.map((bib) => {
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
                    if (allUnchecked) {
                        return {
                            ...bib,
                            citations: bib.citations.map((cit) => ({ ...cit, isChecked: true })),
                        };
                    }
                    // If some citations are checked, check the rest

                    return {
                        ...bib,
                        citations: bib.citations.map((cit) => ({ ...cit, isChecked: true })),
                    };
                }
                return bib;
            });
            return newState;
        },
        moveSelectedCitations: (bibs, action) => {
            const newState = bibs?.map((bib) => {
                if (bib.id === action.payload.toId) {
                    return {
                        ...bib,
                        citations: [...bib.citations, ...action.payload.checkedCitations],
                        dateModified: new Date().toString(),
                    };
                }
                if (bib.id === action.payload.fromId) {
                    const idsForDelete = action.payload.checkedCitations.map((cit) => cit.id);
                    return {
                        ...bib,
                        citations: bib.citations.filter((cit) => !idsForDelete.includes(cit.id)),
                        dateModified: new Date().toString(),
                    };
                }
                return bib;
            });
            save(newState, action.payload.currentUser);
            return newState;
        },
        copySelectedCitations: (bibs, action) => {
            const newState = bibs?.map((bib) => {
                const filteredCitations = bib.citations.filter(
                    (cit) => !action.payload.checkedCitations.some((checkedCit) => checkedCit.id === cit.id)
                );
                const updatedCitations = filteredCitations.map((cit) => ({ ...cit, isChecked: false }));
                const copiedCitations = action.payload.checkedCitations.map((cit) => {
                    const newId = uid();
                    return {
                        ...cit,
                        id: newId,
                        content: { ...cit.content, id: newId },
                        isChecked: false,
                    };
                });
                return {
                    ...bib,
                    citations: [...updatedCitations, ...copiedCitations],
                    dateModified: new Date().toString(),
                };
            });
            save(newState, action.payload.currentUser);
            return newState;
        },
        duplicateSelectedCitations: (bibs, action) => {
            const newState = bibs?.map((bib) => {
                if (bib.id === action.payload.bibliographyId) {
                    const duplicatedCitations = action.payload.checkedCitations?.map((cit) => {
                        const newId = uid();
                        return {
                            ...cit,
                            id: newId,
                            content: { ...cit.content, id: newId },
                            isChecked: false,
                        };
                    });
                    return {
                        ...bib,
                        citations: [
                            ...bib.citations.map((cit) => ({ ...cit, isChecked: false })),
                            ...duplicatedCitations,
                        ],
                        dateModified: new Date().toString(),
                    };
                }
                return bib;
            });
            save(newState, action.payload.currentUser);
            return newState;
        },
        deleteSelectedCitations: (bibs, action) => {
            const newState = bibs?.map((bib) => {
                if (bib.id === action.payload.bibliographyId) {
                    const targetIds = action.payload.checkedCitations.map((cit) => cit.id);
                    return {
                        ...bib,
                        citations: bib.citations.filter((cit) => !targetIds.includes(cit.id)),
                        dateModified: new Date().toString(),
                    };
                }
                return bib;
            });
            save(newState, action.payload.currentUser);
            return newState;
        },
        addNewBibAndMoveSelectedCitations: (bibs, action) => {
            const newBib = {
                title: "Untitled Bibliography",
                style: action.payload.bibliographyStyle,
                dateCreated: new Date().toString(),
                dateModified: new Date().toString(),
                id: uid(10),
                citations: [...action.payload.checkedCitations],
            };
            const newState = [...bibs, newBib];
            save(newState, action.payload.currentUser);
            return newState;
        },
        deleteAllBibs: (action) => {
            save(initialState, action.payload?.saveToFirestore);
            return initialState;
        },
    },
    extraReducers: (builder) => {
        builder.addCase(loadFromIndexedDB.fulfilled, (state, action) => action?.payload || state);
    },
});

export const {
    mergeWithCurrent,
    enableCollabInBib,
    reEnableCollabInBib,
    disableCollabInBib,
    addNewBib,
    deleteBib,
    updateBibField,
    addNewCitation,
    editCitation,
    updateContentInEditedCitation,
    updateCitation,
    toggleEntryCheckbox,
    handleMasterEntriesCheckbox,
    moveSelectedCitations,
    copySelectedCitations,
    duplicateSelectedCitations,
    deleteSelectedCitations,
    addNewBibAndMoveSelectedCitations,
    deleteAllBibs,
} = bibsSlice.actions;

export default bibsSlice.reducer;
