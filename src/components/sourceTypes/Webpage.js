import { useRef, useState } from "react";
import axios from "axios";
import * as cheerio from "cheerio";
import * as citationUtils from "../citationUtils";
import DateInput from "../formElements/DateInput";
import AuthorsInput from "../formElements/AuthorsInput";

export default function Webpage(props) {
    const { content, setContent, showAcceptDialog, handleAddReference, handleCancel } = props;
    const [url, setUrl] = useState("");
    const autoFillUrlRef = useRef(null);

    function retrieveContent(source) {
        if (source) {
            const website = encodeURIComponent(source);
            axios
                .get(`https://corsproxy.io/?${website}`)
                .then((response) => {
                    const $ = cheerio.load(response.data);
                    setContent((prevContent) => {
                        return {
                            ...prevContent,
                            ...citationUtils.retrieveContentFromWebsite($, source),
                        };
                    });
                })
                .catch((error) => {
                    if (!error.response && error.message === "Network Error") {
                        showAcceptDialog(
                            "Network Error",
                            "Unable to retrieve the webpage due to network issues. Please check your internet connection and try again."
                        );
                    } else {
                        showAcceptDialog(
                            "Webpage Access Error",
                            "We couldn't retrieve the information from the webpage you're attempting to cite. This may be due to the webpage being protected by a login or paywall."
                        );
                    }
                    console.error(error);
                });
        }
    }

    function handleFillIn() {
        retrieveContent(autoFillUrlRef.current.value);
    }

    function updateContentField(key, value) {
        setContent((prevContent) => ({
            ...prevContent,
            [key]: value,
        }));
    }

    function handleUrlChange(event) {
        setUrl(event.target.value);
    }

    return (
        <form className="citation-form" onSubmit={(event) => handleAddReference(event, content)}>
            <p>Insert the URL (link) here to fill the fields automatically:</p>
            <label htmlFor="auto-filler-url">URL</label>
            <input
                type="text"
                name="auto-filler-url"
                placeholder="Insert a URL"
                ref={autoFillUrlRef}
                value={url}
                onChange={handleUrlChange}
            />
            <button type="button" onClick={handleFillIn}>
                Fill in
            </button>

            <p>Or enter webpage details manually:</p>
            <AuthorsInput content={content} setContent={setContent} />

            <label htmlFor="title">Title</label>
            <input
                type="text"
                name="title"
                value={content.title}
                placeholder="Page title"
                onChange={(event) => updateContentField("title", event.target.value)}
                required
            />

            <label htmlFor="website">Website</label>
            <input
                type="text"
                name="website"
                value={content["container-title"]?.[0] ?? ""}
                placeholder="Website title"
                onChange={(event) => updateContentField("container-title", [event.target.value])}
            />

            <label htmlFor="publication-date">Publication date</label>
            <DateInput name="publication-date" content={content} setContent={setContent} dateKey="issued" />

            <label htmlFor="url">URL (link)</label>
            <input
                type="text"
                name="url"
                value={content.URL}
                placeholder="URL (link)"
                onChange={(event) => updateContentField("URL", event.target.value)}
                required
            />

            <label htmlFor="access-date">Access date</label>
            <DateInput name="access-date" content={content} setContent={setContent} dateKey="accessed" />

            <button type="submit">Add reference</button>
            <button type="button" onClick={handleCancel}>
                Cancel
            </button>
        </form>
    );
}
