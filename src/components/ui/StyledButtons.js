import { useState } from "react";
import "../../css/StyledButtons.css";
import { useBgGradient } from "../../hooks/hooks.ts";

/* eslint-disable react/jsx-props-no-spreading */

export function ContextMenuOption({ className, children, onClick, ...rest }) {
    const [isClicked, setIsClicked] = useState(false);

    const upClasses = "bg-transparent hover:bg-neutral-transparentGray";
    const downClasses = "bg-secondary-100 hover:bg-secondary-200";

    const dynamicClasses = isClicked ? downClasses : upClasses;

    return (
        <div>
            <button
                className={`transition-regular rounded border border-none p-2 ${dynamicClasses} ${className}`}
                type="button"
                onClick={onClick}
                onTouchStart={() => setIsClicked(true)}
                onMouseDown={() => setIsClicked(true)}
                onMouseUp={() => setIsClicked(false)}
                onTouchEnd={() => setIsClicked(false)}
                {...rest}
            >
                {children}
            </button>
        </div>
    );
}

export function Button({ className, children, onClick, color = "#ffd60a", ...rest }) {
    const [isClicked, setIsClicked] = useState(false);
    const yellowGradient = useBgGradient(color);

    const upClasses = "transform translate-y-0 shadow-hard";
    const downClasses = "transform translate-y-1 shadow-none";

    const dynamicClasses = isClicked ? downClasses : upClasses;

    return (
        <div>
            <button
                className={`styled-button border-1 rounded-lg border-solid border-neutral-black ${yellowGradient} p-2 ${dynamicClasses} ${className}`}
                type="button"
                onClick={onClick}
                onTouchStart={() => setIsClicked(true)}
                onMouseDown={() => setIsClicked(true)}
                onMouseUp={() => setIsClicked(false)}
                onTouchEnd={() => setIsClicked(false)}
                {...rest}
            >
                {children}
            </button>
        </div>
    );
}
