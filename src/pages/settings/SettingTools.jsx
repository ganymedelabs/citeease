import { useDispatch, useSelector } from "react-redux";
import { useId, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    TAG_COLORS,
    TAG_COLOR_VALUES,
    addTag,
    deleteTag,
    resetAllSettings,
} from "../../data/store/slices/settingsSlice";
import Tag from "../../components/ui/Tag";
import { useAuth } from "../../context/AuthContext";
import { deleteAllBibs } from "../../data/store/slices/bibsSlice";
import { uid } from "../../utils/utils.ts";
import { getGradient, getTagBgColors } from "../../utils/uiUtils.ts";
import { Button } from "../../components/ui/StyledButtons";

export function TagsManager() {
    const settings = useSelector((state) => state.settings);
    const [tagLabel, setTagLabel] = useState("");
    const [tagColor, setTagColor] = useState(TAG_COLORS.YELLOW);
    const dispatch = useDispatch();
    const [lightColor, darkColor] = getGradient(getTagBgColors(tagColor)[0]);

    function addTagToBib(event) {
        event.preventDefault();
        if (!/^\s*$/.test(tagLabel)) {
            dispatch(addTag({ tag: { label: tagLabel, color: tagColor, id: uid() } }));
            setTagLabel("");
        }
    }

    return (
        <div>
            <div className="flex flex-wrap gap-1">
                {settings.tags?.map((tag) => (
                    <Tag key={uid()} tagProps={tag} showX onClick={() => dispatch(deleteTag({ tagId: tag.id }))} />
                ))}
            </div>
            <form onSubmit={addTagToBib}>
                <div className="flex grid-cols-2 gap-2 py-2">
                    <input
                        className="w-full grid-flow-row-dense rounded-md p-2 font-sans font-bold"
                        style={{
                            border: `solid 0.1rem ${TAG_COLOR_VALUES[tagColor]}`,
                            background: `linear-gradient(to bottom, ${lightColor}, ${darkColor}`,
                            color: TAG_COLOR_VALUES[tagColor],
                        }}
                        type="text"
                        placeholder="Tag label"
                        value={tagLabel}
                        onChange={(event) => setTagLabel(event.target.value)}
                    />
                    <Button className="text-nowrap" type="submit">
                        Add tag
                    </Button>
                </div>

                <div className="flex flex-wrap gap-1">
                    {Object.values(TAG_COLORS)?.map((color) => {
                        return (
                            <Tag
                                className="h-8 w-8 rounded-full"
                                key={uid()}
                                tagProps={{ color, id: color, label: "" }}
                                onClick={() => setTagColor(color)}
                            />
                        );
                    })}
                </div>
            </form>
        </div>
    );
}

export function UpdateEmailDialog(props) {
    const { setIsVisible } = props;
    const { updateEmail } = useAuth();
    const id = useId();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const newEmailRef = useRef();
    const navigate = useNavigate();

    async function handleSUbmit(event) {
        event.preventDefault();

        try {
            setError("");
            setIsLoading(true);
            await updateEmail(newEmailRef.current.value);
            navigate("/");
            // TODO: Show success toast message
        } catch (tError) {
            setError(`Failed to update email: ${tError}`);
        }

        setIsLoading(false);
    }

    return (
        <div>
            <button type="button" onClick={() => setIsVisible(false)}>
                X
            </button>
            <h3>Update email</h3>
            <pre>{error}</pre>
            <form onSubmit={handleSUbmit}>
                <label htmlFor={`${id}-newEmail`}>
                    Type your new email.
                    <input id={`${id}-newEmail`} type="email" ref={newEmailRef} required />
                </label>
                <button type="submit" disabled={isLoading}>
                    Update email
                </button>
            </form>
        </div>
    );
}

export function ChangePasswordDialog(props) {
    const { setIsVisible } = props;
    const { changePassword } = useAuth();
    const id = useId();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const prevPasswordRef = useRef();
    const newPasswordRef = useRef();
    const confirmPasswordRef = useRef();

    async function handleSUbmit(event) {
        event.preventDefault();

        if (newPasswordRef.current.value !== confirmPasswordRef.current.value) {
            setError("Passwords do not match.");
        } else {
            try {
                setError("");
                setIsLoading(true);
                await changePassword(prevPasswordRef.current.value, newPasswordRef.current.value);
                setIsVisible(false);
                // TODO: Show success toast message
            } catch (tError) {
                setError(`Failed to update password: ${tError}`);
            }

            setIsLoading(false);
        }
    }

    return (
        <div>
            <button type="button" onClick={() => setIsVisible(false)}>
                X
            </button>
            <h3>Change password</h3>
            <pre>{error}</pre>
            <form onSubmit={handleSUbmit}>
                <label htmlFor={`${id}-prevPassword`}>
                    Previous password
                    <input type="password" id={`${id}-prevPassword`} ref={prevPasswordRef} required />
                </label>
                <label htmlFor={`${id}-newPassword`}>
                    New password
                    <input type="password" id={`${id}-newPassword`} ref={newPasswordRef} required />
                </label>
                <label htmlFor={`${id}-confirmPassword`}>
                    Confirm password
                    <input type="password" id={`${id}-confirmPassword`} ref={confirmPasswordRef} required />
                </label>
                <button type="submit" disabled={isLoading}>
                    Update password
                </button>
            </form>
        </div>
    );
}

export function DeleteAccountDialog(props) {
    const { setIsVisible } = props;
    const { deleteAccount } = useAuth();
    const id = useId();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const passwordRef = useRef();
    const checkboxRef = useRef();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    async function handleSUbmit(event) {
        event.preventDefault();

        try {
            setError("");
            setIsLoading(true);
            await deleteAccount(passwordRef.current.value);
            if (!checkboxRef.current.checked) {
                dispatch(deleteAllBibs());
                dispatch(resetAllSettings());
            }
            navigate("/");
            // TODO: Show success toast message
        } catch (tError) {
            setError(`Failed to delete account: ${tError}`);
        }

        setIsLoading(false);
    }

    return (
        <div>
            <button type="button" onClick={() => setIsVisible(false)}>
                X
            </button>
            <h3>Delete account?</h3>
            <pre>{error}</pre>
            <form onSubmit={handleSUbmit}>
                <label htmlFor={`${id}-password`}>
                    Type your password to delete your account.
                    <input id={`${id}-password`} type="password" ref={passwordRef} required />
                </label>

                <label htmlFor={`${id}-checkbox`}>
                    <input id={`${id}-checkbox`} type="checkbox" ref={checkboxRef} />
                    Keep a copy of the associated data locally
                </label>
                <strong>Warning: This action can&apos;t be undone</strong>
                <button type="submit" disabled={isLoading}>
                    Delete account
                </button>
            </form>
        </div>
    );
}
