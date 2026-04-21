import { useEffect, useState } from "react";
import { useI18n } from "../../i18n/LanguageProvider";
import { getFinancialAccounts } from "../api/financialAccounts";
import { formatFinancialAccountLabel } from "./presentation";

export function useFinancialAccountOptions() {
  const { t } = useI18n();
  const [accounts, setAccounts] = useState([]);

  useEffect(() => {
    let active = true;

    async function loadAccounts() {
      try {
        const data = await getFinancialAccounts();

        if (active) {
          setAccounts(
            (Array.isArray(data) ? data : []).map((account) => ({
              ...account,
              label: formatFinancialAccountLabel(account, {
                fallbackName: t("accounts.fallbackAccountName"),
                endingLabel: t("accounts.endingLabel"),
              }),
            }))
          );
        }
      } catch {
        if (active) {
          setAccounts([]);
        }
      }
    }

    loadAccounts();

    return () => {
      active = false;
    };
  }, [t]);

  return accounts;
}
