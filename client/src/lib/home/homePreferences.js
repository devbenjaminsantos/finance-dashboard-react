import { loadJSON, saveJSON } from "../storage/jsonStorage";

export const HOME_WIDGET_OPTIONS = [
  { key: "context", label: "Guia e contexto" },
  { key: "summary", label: "Resumo financeiro" },
  { key: "shortcuts", label: "Atalhos principais" },
  { key: "insights", label: "Insights do periodo" },
  { key: "comparisons", label: "Comparativo rapido" },
  { key: "goals", label: "Resumo de metas" },
  { key: "history", label: "Historico recente" },
];

export const DEFAULT_HOME_WIDGETS = HOME_WIDGET_OPTIONS.reduce((accumulator, option) => {
  accumulator[option.key] = true;
  return accumulator;
}, {});

function getStorageKey(user) {
  const userScope = user?.id || user?.email || "anonymous";
  return `finova:home-widgets:${userScope}`;
}

export function loadHomeWidgets(user) {
  const stored = loadJSON(getStorageKey(user), DEFAULT_HOME_WIDGETS);

  return HOME_WIDGET_OPTIONS.reduce((accumulator, option) => {
    accumulator[option.key] =
      typeof stored?.[option.key] === "boolean"
        ? stored[option.key]
        : DEFAULT_HOME_WIDGETS[option.key];
    return accumulator;
  }, {});
}

export function saveHomeWidgets(user, widgets) {
  const normalized = HOME_WIDGET_OPTIONS.reduce((accumulator, option) => {
    accumulator[option.key] = Boolean(widgets?.[option.key]);
    return accumulator;
  }, {});

  saveJSON(getStorageKey(user), normalized);
  return normalized;
}
