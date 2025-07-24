import i18next from "i18next";
import * as enResource from "./locales/en.json"
import * as frResource from "./locales/fr.json"
import {initReactI18next} from "react-i18next";

const supportedLanguages = [
    "en",
    "fr",
]

async function initI18n() {
    return i18next
        .use(initReactI18next)
        .init({
            fallbackLng: "en",
            supportedLngs: supportedLanguages,
            interpolation: {
                escapeValue: false,
            },
            resources: {
                en: {translation: enResource},
                fr: {translation: frResource},
            },
        })
}

export default initI18n;

export {
    supportedLanguages
}