import { useSelector } from "react-redux";
import { useState } from "react";
import { updateSettingsField } from "../data/store/slices/settingsSlice";
import { uid } from "../utils/utils.ts";
import { ChipSet, Divider, FilledButton, Icon, IconButton, OutlinedButton, TextField } from "./ui/MaterialComponents";
import { useEnhancedDispatch, useTheme } from "../hooks/hooks.tsx";
import { useDialog } from "../context/DialogContext.tsx";
import { markdownToHtml, parseHtmlToJsx } from "../utils/conversionUtils.tsx";
import defaults from "../assets/json/defaults.json";

const { colors: colorValues, settings: s } = defaults;
const { tags: builtinTags, icons: builtinIcons } = s;

export function TagsManager() {
    const { data: settings } = useSelector((state) => state.settings);
    const [tagLabel, setTagLabel] = useState("");
    const [tagColor, setTagColor] = useState("yellow");
    const [errorMessage, setErrorMessage] = useState("");
    const dispatch = useEnhancedDispatch();
    const [theme] = useTheme();

    function addTag(event) {
        event.preventDefault();
        if (/^\s*$/.test(tagLabel)) {
            setErrorMessage("You can't add an empty tag.");
            return;
        }

        dispatch(
            updateSettingsField({
                key: "tags",
                value: [...settings.tags, { label: tagLabel, color: tagColor, id: uid() }],
            })
        );
        setTagLabel("");
        setErrorMessage("");
    }

    function deleteTag(id) {
        dispatch(
            updateSettingsField({
                key: "tags",
                value: settings?.tags.filter((tag) => tag.id !== id),
            })
        );
    }

    function restoreDefaultTags() {
        dispatch(
            updateSettingsField({
                key: "tags",
                value: [
                    ...settings.tags,
                    ...builtinTags.filter((tag) => !settings?.tags.some((sTag) => sTag.id === tag.id)),
                ],
            })
        );
    }

    return (
        <div className="grid gap-2 px-5">
            <ChipSet
                chips={settings?.tags.map((tag) => {
                    return {
                        ...tag,
                        end: <Icon className="max-h-min max-w-min text-sm" name="close" />,
                        selected: true,
                        onClick: () => deleteTag(tag.id),
                    };
                })}
            />

            <Divider className="my-2" />

            <form className="grid gap-2" onSubmit={addTag}>
                <TextField
                    className="w-full"
                    errorText={errorMessage}
                    style={{
                        "--md-filled-text-field-focus-active-indicator-color": colorValues[theme][tagColor],
                    }}
                    type="text"
                    label="Tag label"
                    placeholder="eg., Favorite"
                    value={tagLabel}
                    onChange={(event) => {
                        setErrorMessage("");
                        setTagLabel(event.target.value);
                    }}
                />

                <ChipSet
                    chips={Object.keys(colorValues[theme]).map((color) => {
                        return {
                            label: color.charAt(0).toUpperCase() + color.slice(1).toLowerCase(),
                            color,
                            selected: tagColor === color,
                            onClick: () => setTagColor(color),
                        };
                    })}
                />

                <FilledButton type="submit" onClick={addTag}>
                    Add tag
                </FilledButton>

                <OutlinedButton onClick={restoreDefaultTags}>Restore default tags</OutlinedButton>
            </form>
        </div>
    );
}

export function IconsManager() {
    const { data: settings } = useSelector((state) => state.settings);
    const { icons } = settings;
    const dispatch = useEnhancedDispatch();
    const [iconName, setIconName] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const dialog = useDialog();

    function addIcon(event) {
        event.preventDefault();
        if (/^\s*$/.test(iconName)) {
            setErrorMessage("You can't add an empty icon.");
            return;
        }

        if (icons?.includes(iconName.toLowerCase())) {
            setErrorMessage(`You already have \`${iconName}\` icon.`);
        } else {
            dispatch(
                updateSettingsField({
                    key: "icons",
                    value: [...settings.icons, iconName],
                })
            );
            setIconName("");
            setErrorMessage("");
        }
    }

    function deleteIcon(name) {
        dispatch(
            updateSettingsField({
                key: "icons",
                value: settings?.icons.filter((icon) => icon !== name),
            })
        );
    }

    function restoreDefaultTags() {
        dispatch(
            updateSettingsField({
                key: "icons",
                value: Array.isArray(icons)
                    ? [...icons, ...builtinIcons.filter((icon) => !settings?.icons.some((sIcon) => sIcon === icon))]
                    : builtinIcons,
            })
        );
    }

    function showHelpDialog() {
        dialog.show({
            headline: "How to add icons?",
            content: (
                <div className="px-5 [&_img]:h-auto [&_img]:w-full [&_ol]:ps-5">
                    {parseHtmlToJsx(
                        markdownToHtml(`
                            ![How to add icons](${import.meta.env.VITE_PUBLIC_URL}/images/how-to-add-icons.png)
                            1. Visit [Material Icons](https://fonts.google.com/icons).
                            2. Select your preferred icon.
                            3. Copy the \`Icon name\` from the right panel.
                            4. Paste the name into the Icon Manager's text input to add the icon.
                        `)
                    )}
                </div>
            ),
            actions: [["Ok", () => dialog.close()]],
        });
    }

    return (
        <div className="grid gap-2 px-5">
            <div className="flex flex-wrap justify-stretch gap-1">
                {icons?.map((icon) => {
                    const style = {
                        background: "var(--md-sys-color-error)",
                    };
                    const iconStyle = {
                        color: "var(--md-sys-color-on-error)",
                    };
                    return (
                        <IconButton
                            className="rounded-full transition-colors"
                            style={errorMessage && errorMessage.length !== 0 && iconName === icon ? style : {}}
                            key={uid()}
                            name={icon}
                            onClick={() => deleteIcon(icon)}
                            iconStyle={errorMessage && errorMessage.length !== 0 && iconName === icon ? iconStyle : {}}
                        />
                    );
                })}
            </div>

            <form className="grid gap-2" onSubmit={addIcon}>
                <TextField
                    className="w-full"
                    errorText={errorMessage}
                    type="text"
                    label="Icon name"
                    placeholder="eg., star"
                    value={iconName}
                    onChange={(event) => {
                        setErrorMessage("");
                        setIconName(event.target.value.trim());
                    }}
                />

                <div className="flex justify-between gap-2">
                    <FilledButton className="flex-1" type="submit" onClick={addIcon}>
                        Add icon
                    </FilledButton>
                    <IconButton onClick={showHelpDialog} name="help" />
                </div>

                <OutlinedButton onClick={restoreDefaultTags}>Restore default icons</OutlinedButton>
            </form>
        </div>
    );
}
