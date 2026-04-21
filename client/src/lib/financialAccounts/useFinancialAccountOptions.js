import { useEffect, useState } from "react";
import { getFinancialAccounts } from "../api/financialAccounts";
import { formatFinancialAccountLabel } from "./presentation";

export function useFinancialAccountOptions() {
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
              label: formatFinancialAccountLabel(account),
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
  }, []);

  return accounts;
}
