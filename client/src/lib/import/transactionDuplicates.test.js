import { describe, expect, it } from "vitest";
import {
  buildDefaultImportSelection,
  detectImportDuplicates,
} from "./transactionDuplicates";

describe("transaction duplicate reconciliation", () => {
  it("marks duplicates against existing transactions", () => {
    const reconciled = detectImportDuplicates(
      [
        {
          date: "2026-04-14",
          type: "expense",
          amountCents: 12000,
          description: "Mercado Central",
        },
      ],
      [
        {
          id: 1,
          date: "2026-04-14",
          type: "expense",
          amountCents: 12000,
          description: "Mercado Central",
        },
      ]
    );

    expect(reconciled[0]).toMatchObject({
      isPossibleDuplicate: true,
      duplicateSource: "existing",
    });
  });

  it("marks repeated rows inside the same import", () => {
    const reconciled = detectImportDuplicates(
      [
        {
          date: "2026-04-14",
          type: "expense",
          amountCents: 12000,
          description: "Mercado Central",
        },
        {
          date: "2026-04-14",
          type: "expense",
          amountCents: 12000,
          description: "Mercado Central",
        },
      ],
      []
    );

    expect(reconciled[0].isPossibleDuplicate).toBe(false);
    expect(reconciled[1].isPossibleDuplicate).toBe(true);
    expect(reconciled[1].duplicateSource).toBe("import");
  });

  it("preselects only rows that are not suspected duplicates", () => {
    const selection = buildDefaultImportSelection([
      { isPossibleDuplicate: false },
      { isPossibleDuplicate: true },
      { isPossibleDuplicate: false },
    ]);

    expect(Array.from(selection)).toEqual([0, 2]);
  });
});
