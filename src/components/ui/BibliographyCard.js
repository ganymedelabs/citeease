import { timeAgo } from "../../utils/utils";
import Tag from "./Tag";

export default function BibliographyCard(props) {
    const { bibliography } = props;
    // const dateOptions = {
    //     weekday: "short",
    //     year: "2-digit",
    //     month: "short",
    //     day: "numeric",
    // };

    // const allDateOptions = {
    //     weekday: "narrow" | "short" | "long",
    //     era: "narrow" | "short" | "long",
    //     year: "numeric" | "2-digit",
    //     month: "numeric" | "2-digit" | "narrow" | "short" | "long",
    //     day: "numeric" | "2-digit",
    //     hour: "numeric" | "2-digit",
    //     minute: "numeric" | "2-digit",
    //     second: "numeric" | "2-digit",
    //     timeZoneName: "short" | "long",

    //     // Time zone to express it in
    //     timeZone: "Asia/Shanghai",
    //     // Force 12-hour or 24-hour
    //     hour12: true | false,

    //     // Rarely-used options
    //     hourCycle: "h11" | "h12" | "h23" | "h24",
    //     formatMatcher: "basic" | "best fit",
    // };

    return (
        <div className="shadow-hardTransparent border-2 border-solid border-neutral-lightGray rounded-lg items-center p-4 bg-white transition duration-150 ease-in-out hover:bg-neutral-transparentGray">
            <div className="w-full text-neutral-black sm:flex sm:justify-between sm:gap-2">
                <h3 className="mb-0 sm:mb-4">{bibliography.title}</h3>
                <p>{`${bibliography.style.name.short || bibliography.style.name.long.replace(/\((.*?)\)/g, "")} • ${
                    bibliography.citations.length === 0
                        ? "No sources added"
                        : bibliography.citations.length === 1
                        ? "1 source"
                        : `${bibliography.citations.length} sources`
                } • ${timeAgo(bibliography.dateModified)}`}</p>
            </div>
            <div className="flex gap-1 flex-wrap">
                {bibliography?.tags?.map((tag, index) => (
                    <Tag key={index} tagProps={tag} />
                ))}
            </div>
        </div>
    );
}
