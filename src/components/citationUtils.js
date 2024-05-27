import axios from "axios";
import * as cheerio from "cheerio";
import { nanoid } from "nanoid";

const CORS_PROXY = "https://corsproxy.io/?";

export function createDateObject(yearOrDate, month = undefined, day = undefined) {
    if (yearOrDate === undefined) return;
    let year, adjustedMonth, adjustedDay;

    if (yearOrDate instanceof Date) {
        year = yearOrDate.getFullYear();
        adjustedMonth = yearOrDate.getMonth() + 1;
        adjustedDay = yearOrDate.getDate();
    } else {
        year = yearOrDate;
        adjustedMonth = month !== undefined ? month : 1;
        adjustedDay = day !== undefined ? day : 1;
    }

    let dateParts = [year];
    if (adjustedMonth !== undefined) {
        dateParts.push(adjustedMonth);
        if (adjustedDay !== undefined) {
            dateParts.push(adjustedDay);
        }
    }

    const newDate = new Date(year, adjustedMonth, adjustedDay);

    return {
        "date-parts": [dateParts],
        raw: `${newDate.getFullYear()}-${newDate.getMonth()}-${newDate.getDate()}`,
        // "date-time": newDate.toISOString() || undefined,
        // timestamp: newDate.getTime() || undefined,
    };
}

export function createAuthorsArray(authors) {
    if (!authors) return;
    const result = authors.map((author) => {
        const names = author.split(/\s+/);
        const given = names.shift() || "";
        const family = names.join(" ");
        return { given, family, id: nanoid() };
    });

    return result;
}

export function recognizeIdentifierType(string) {
    const urlPattern = /(https?:\/\/[^\s]+)/g;
    const doiPatterns = [
        /^\s*(https?:\/\/(?:dx\.)?doi\.org\/(10.\d{4,9}\/[-._;()/:A-Z0-9[\]<>]+))\s*$/i,
        /^\s*((?:dx\.)?doi\.org\/(10.\d{4,9}\/[-._;()/:A-Z0-9[\]<>]+))\s*$/i,
        /^\s*(10.\d{4,9}\/[-._;()/:A-Z0-9[\]<>]+)\s*$/i,
        /^10.\d{4,9}\/[-._;()/:A-Z0-9[\]<>]+$/i,
        /\b10\.\d{4,9}[-.\w]+\b/i,
    ];
    const pmcidPattern = /^PMC\d+$/i;
    const pmidPatern = /^pmid:\s*\d+$/i;
    const isbnPatterns = [
        /^(97[89])(?:-\d+){0,2}|\d{10}\s?|\d{13}\s?$|((97[89])?\d{9}\s?)(\d{5})$/,
        /^10\.(978|979)\.\d{2,8}\/\d{2,7}$/,
        /^(978|979)\d{10}$/,
        /^\d{10}$/,
    ];

    if (urlPattern.test(string)) return "url";

    for (let doiPattern of doiPatterns) {
        if (doiPattern.test(string.replace(/doi:\s*/gi, ""))) return "doi";
    }

    if (pmcidPattern.test(string.replace(/pmcid:\s*/g, ""))) return "pmcid";

    if (pmidPatern.test(string.replace(/\s+/g, ""))) return "pmid";

    for (let isbnPattern of isbnPatterns) {
        if (isbnPattern.test(string.replace(/-|\s+/g, ""))) return "isbn";
    }
}

// FIXME: They all should only return something when response.ok === true
export async function retrieveContentFromURL(url) {
    function extractAuthors($) {
        let authors = [];

        authors.push($(".author[rel='author']").text());
        $('meta[name="author"], meta[name="article:author"]').each((index, element) => {
            authors.push($(element).attr("content"));
        });

        $('span.css-1baulvz.last-byline[itemprop="name"]').each((index, element) => {
            authors.push($(element).text().trim());
        });

        authors = authors.filter((author, index, self) => {
            return author.trim() !== "" && self.indexOf(author) === index;
        });

        return createAuthorsArray(authors);
    }

    if (!url) return;

    try {
        const website = encodeURIComponent(url);
        const response = await axios.get(`${CORS_PROXY}${website}`);

        if (!response.ok) {
            throw new Error(`HTTP error status: ${response.status}`);
        }

        const $ = cheerio.load(response.data);

        return {
            type: "webpage",
            title: $("title").text(), // TODO: Give option to prioritize h1 tag instead of title tag $("h1").text()
            author: extractAuthors($),
            "container-title": $("meta[property='og:site_name']").attr("content") || "", // TODO: Should use the website link as a fallback
            publisher: $("meta[property='article:publisher']").attr("content"),
            accessed: createDateObject(new Date()),
            issued: createDateObject(
                new Date(
                    $("meta[name='date']").attr("content") ||
                        $("meta[name='article:published_time']").attr("content") ||
                        $("meta[property='article:published_time']").attr("content") ||
                        $("meta[name='article:modified_time']").attr("content") ||
                        $("meta[property='article:modified_time']").attr("content") ||
                        $("meta[name='og:updated_time']").attr("content") ||
                        $("meta[property='og:updated_time']").attr("content") ||
                        $(".publication-date").text()
                )
            ),
            URL:
                $("meta[property='og:url']").attr("content") ||
                $("meta[name='url']").attr("content") ||
                $("link[rel='canonical']").attr("href") ||
                url,
        };
    } catch (error) {
        console.error(`Failed to retrieve content from ${url}: ${error}`);
        return null;
    }
}

// These are some examples of the needed fields for citeproc https://api.zotero.org/groups/459003/items?format=csljson&limit=8&itemType=journalArticle
export async function retrieveContentFromDOI(doi) {
    if (!doi) return;

    try {
        const cleanedDoi = doi.replace(/doi:\s*/gi, "");
        const response = await fetch(`${CORS_PROXY}https://api.crossref.org/works/${cleanedDoi}`);

        if (!response.ok) {
            throw new Error(`HTTP error status: ${response.status}`);
        }

        const data = await response.json();
        const message = data?.message;

        return {
            DOI: message?.DOI,
            URL: message?.URL || message?.DOI ? "https://doi.org/" + message.DOI : undefined,
            ISSN: message?.ISSN,
            PMID: message?.PMID,
            PMCID: message?.PMCID,
            "container-title": message?.["container-title"]?.[0],
            issue: message?.issue,
            issued: message?.issued,
            page: message?.page,
            "publisher-place": message?.["publisher-place"],
            source: message?.source,
            title: message?.title,
            volume: message?.volume,
            online: true,
            type: "article-journal", // This API returns the type as "journal-article", but for citeproc, it should be "article-journal"
            accessed: createDateObject(new Date()),
            author: message?.author?.map((author) => ({
                ...author,
                id: nanoid(),
            })),
        };
    } catch (error) {
        console.error(`Failed to retrieve content from ${doi}: ${error}`);
        return null;
    }
}

export async function retrieveContentFromISBN(isbn) {
    if (!isbn) return;

    try {
        const response = await fetch(
            `https://openlibrary.org/search.json?q=isbn:${isbn}&mode=everything&fields=*,editions`
        );

        if (!response.ok) {
            throw new Error(`HTTP error status: ${response.status}`);
        }

        const data = await response.json();
        const docs = data?.docs[0];
        const edition = docs?.editions?.docs[0];

        return {
            type: "book",
            title: docs?.title,
            "number-of-pages": docs?.number_of_pages_median,
            author: createAuthorsArray(docs?.author_name),
            publisher: edition?.publisher?.[0],
            "publisher-place": edition?.publish_place?.[0],
            ISBN: edition?.isbn?.[0] || isbn,
            issued: createDateObject(edition?.publish_date?.[0]),
            accessed: createDateObject(new Date()),
        };
    } catch (error) {
        console.error(`Failed to retrieve content from ${isbn}: ${error}`);
        return null;
    }
}

export async function retrieveContentFromPMCID(pmcid) {
    if (!pmcid) return;

    try {
        const cleanedPmcid = pmcid.replace(/pmcid:\s*|PMC|\s*/gi, "");
        const response = await fetch(
            `${CORS_PROXY}https://api.ncbi.nlm.nih.gov/lit/ctxp/v1/pmc/?format=csl&id=${cleanedPmcid}`
        );

        if (!response.ok) {
            throw new Error(`HTTP error status: ${response.status}`);
        }

        const data = await response.json();

        return {
            DOI: data?.DOI,
            URL: data?.URL || data?.DOI ? "https://doi.org/" + data.DOI : undefined,
            ISSN: data?.ISSN,
            PMID: data?.PMID,
            PMCID: data?.PMCID,
            "container-title": data?.["container-title"],
            issue: data?.issue,
            issued: data?.issued,
            page: data?.page,
            "publisher-place": data?.["publisher-place"],
            source: data?.source,
            title: data?.title,
            type: data?.type,
            volume: data?.volume,
            online: true,
            accessed: createDateObject(new Date()),
            author: data?.author?.map((author) => ({
                ...author,
                id: nanoid(),
            })),
        };
    } catch (error) {
        console.error(`Failed to retrieve content from ${pmcid}: ${error}`);
        return null;
    }
}

export async function retrieveContentFromPMID(pmid) {
    if (!pmid) return;

    try {
        const cleanedPmid = pmid.replace(/pmid:\s*|\s*/gi, "");
        const response = await fetch(
            `${CORS_PROXY}https://api.ncbi.nlm.nih.gov/lit/ctxp/v1/pubmed/?format=csl&id=${cleanedPmid}`
        );

        if (!response.ok) {
            throw new Error(`HTTP error status: ${response.status}`);
        }

        const data = await response.json();

        return {
            DOI: data?.DOI,
            URL: data?.URL || data?.DOI ? "https://doi.org/" + data.DOI : undefined,
            ISSN: data?.ISSN,
            PMID: data?.PMID,
            PMCID: data?.PMCID,
            "container-title": data?.["container-title"],
            issue: data?.issue,
            issued: data?.issued,
            page: data?.page,
            "publisher-place": data?.["publisher-place"],
            source: data?.source,
            title: data?.title,
            type: data?.type,
            volume: data?.volume,
            online: true,
            accessed: createDateObject(new Date()),
            author: data?.author?.map((author) => ({
                ...author,
                id: nanoid(),
            })),
        };
    } catch (error) {
        console.error(`Failed to retrieve content from ${pmid}: ${error}`);
        return null;
    }
}
