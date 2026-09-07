import {
  History,
  House,
  CalendarDays,
  ReceiptText,
  ScanSearch,
  WalletCards,
} from "lucide-react";

export const PRIMARY_NAV_ITEMS = [
  { to: "/", labelKey: "navbar.home", icon: House, end: true, tone: "overview" },
  { to: "/transacoes", labelKey: "navbar.transactions", icon: ReceiptText, tone: "activity" },
  { to: "/planejamento", labelKey: "navbar.planning", icon: CalendarDays, tone: "planning" },
  { to: "/analises", labelKey: "navbar.analyses", icon: ScanSearch, tone: "insight" },
  { to: "/contas", labelKey: "navbar.accounts", icon: WalletCards, tone: "account" },
];

export const SECONDARY_NAV_ITEMS = [
  { to: "/historico", labelKey: "navbar.history", icon: History, tone: "activity" },
];

export const MOBILE_PRIMARY_ITEMS = [PRIMARY_NAV_ITEMS[0], PRIMARY_NAV_ITEMS[2]];
export const MOBILE_SECONDARY_ITEMS = [PRIMARY_NAV_ITEMS[1]];
export const MOBILE_MORE_ITEMS = [PRIMARY_NAV_ITEMS[3], PRIMARY_NAV_ITEMS[4], ...SECONDARY_NAV_ITEMS];
