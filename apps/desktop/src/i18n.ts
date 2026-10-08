import { useAppStore } from "./store";

export function useI18n() {
  const language = useAppStore((state) => state.settings.language);
  return {
    language,
    t: (zh: string, en: string) => (language === "zh" ? zh : en),
  };
}
