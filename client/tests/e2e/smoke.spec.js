import { expect, test } from "@playwright/test";

async function expectVisibleFocus(locator, expectedOutlineColor) {
  const focusStyle = await locator.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      color: style.outlineColor,
      style: style.outlineStyle,
      width: Number.parseFloat(style.outlineWidth),
    };
  });

  expect(focusStyle.style).toBe("solid");
  expect(focusStyle.width).toBeGreaterThanOrEqual(3);
  if (expectedOutlineColor) {
    expect(focusStyle.color).toBe(expectedOutlineColor);
  }
}

async function prepareAuthenticatedApp(page) {
  await page.addInitScript(() => {
    localStorage.setItem(
      "user",
      JSON.stringify({
        id: 7,
        name: "Validação Héstia",
        email: "visual@example.com",
        isDemo: false,
        onboardingOptIn: false,
      })
    );
    localStorage.setItem("hestia:last-activity-at", String(Date.now()));
    localStorage.setItem("hestia-language", "pt-BR");
  });

  await page.route("http://localhost:5278/api/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: "[]",
      headers: {
        "access-control-allow-origin": "http://127.0.0.1:4173",
        "access-control-allow-credentials": "true",
      },
    });
  });
}

test.describe("public routes", () => {
  test("login page loads with demo block", async ({ page }) => {
    await page.goto("/login");

    await expect(page.locator(".hestia-area-overview")).toBeVisible();
    const brand = page.getByLabel("Marca Héstia").first();
    await expect(brand).toBeVisible();
    const brandImage = brand.locator("img");
    await expect(brandImage).toHaveAttribute("src", /hestia-mark-optimized\.webp/);
    expect(await brandImage.evaluate((image) => image.complete && image.naturalWidth > 0)).toBe(true);
    await expect(page.getByRole("heading", { name: "Entrar" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Explore a conta demo" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Entrar como demonstração/i })).toBeVisible();
  });

  test("register page loads", async ({ page }) => {
    await page.goto("/register");

    await expect(page.locator(".hestia-area-account")).toBeVisible();
    await expect(page.getByRole("heading", { name: /Criar conta/i })).toBeVisible();
    await expect(page.getByLabel("Nome")).toBeVisible();
    await expect(page.getByPlaceholder("seuemail@exemplo.com")).toBeVisible();
  });

  test("forgot password page loads", async ({ page }) => {
    await page.goto("/forgot-password");

    await expect(page.locator(".hestia-area-insight")).toBeVisible();
    await expect(page.getByRole("heading", { name: /Recuperar senha/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Enviar instruções/i })).toBeVisible();
  });

  test("password reset and verification pages keep their semantic identity", async ({ page }) => {
    await page.goto("/reset-password");
    await expect(page.locator(".hestia-area-insight")).toBeVisible();

    await page.goto("/verify-email");
    await expect(page.locator(".hestia-area-success")).toBeVisible();
  });
});

test.describe("route protection", () => {
  test("redirects unauthenticated access to transacoes back to login", async ({ page }) => {
    await page.goto("/transacoes");

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { name: "Entrar" })).toBeVisible();
  });

  test("redirects unauthenticated access to auditoria back to login", async ({ page }) => {
    await page.goto("/auditoria");

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { name: "Entrar" })).toBeVisible();
  });
});

test.describe("basic UX", () => {
  test("theme toggle works on public page", async ({ page }) => {
    await page.goto("/login");

    const toggle = page.getByRole("button", { name: /Ativar tema/i });
    await expect(toggle).toBeVisible();

    await toggle.click();
    await expect(page.locator(":root")).toHaveAttribute("data-theme", "dark");
  });

  test("shows a visible keyboard focus on public form controls in both themes", async ({ page }) => {
    await page.goto("/login");

    const emailInput = page.getByPlaceholder("seuemail@exemplo.com");
    await emailInput.focus();
    await expectVisibleFocus(emailInput, "rgb(100, 120, 91)");

    const submitButton = page.getByRole("button", { name: "Entrar", exact: true });
    await submitButton.focus();
    await expectVisibleFocus(submitButton, "rgb(100, 120, 91)");

    await page.getByRole("button", { name: /Ativar tema escuro/i }).click();
    await emailInput.focus();
    await expectVisibleFocus(emailInput, "rgb(169, 186, 159)");
  });
});

test.describe("authenticated app shell", () => {
  test("supports keyboard navigation and preserves the active route", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await prepareAuthenticatedApp(page);
    await page.goto("/");

    const sidebar = page.getByRole("complementary", { name: "Navegação principal" });
    const analysesLink = sidebar.getByRole("link", { name: "Análises" });
    await analysesLink.focus();
    await expect(analysesLink).toBeFocused();
    await expectVisibleFocus(analysesLink, "rgb(255, 255, 255)");
    await page.keyboard.press("Enter");

    await expect(page).toHaveURL(/\/analises$/);
    await expect(analysesLink).toHaveClass(/app-nav-link-insight/);
    await expect(analysesLink).toHaveClass(/app-nav-link-active/);
  });

  test("keeps the semantic area identity across authenticated routes", async ({ page }) => {
    test.setTimeout(180_000);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await prepareAuthenticatedApp(page);

    const routes = [
      ["/transacoes", "hestia-area-activity"],
      ["/analises", "hestia-area-insight"],
      ["/planejamento", "hestia-area-planning"],
      ["/contas", "hestia-area-account"],
      ["/perfil", "hestia-area-account"],
      ["/historico", "hestia-area-activity"],
    ];

    for (const [path, areaClass] of routes) {
      await page.goto(path);
      await expect(page.locator(`.${areaClass}`)).toBeVisible();
    }

    await page.goto("/planejamento");
    await expect(page.locator(".app-topbar-context")).toContainText("Planejamento");

    await page.goto("/analises");
    await expect(page.getByRole("heading", { name: "Análises", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Ativar tema escuro" }).click();
  });

  test("renders the desktop sidebar and opens the existing transaction flow", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await prepareAuthenticatedApp(page);
    await page.goto("/");

    const sidebar = page.getByRole("complementary", { name: "Navegação principal" });
    await expect(sidebar).toBeVisible({ timeout: 15_000 });
    await expect(sidebar.getByRole("link", { name: "Início" })).toHaveClass(/app-nav-link-active/);
    await expect(
      page.getByRole("heading", { name: "Seu dinheiro, em perspectiva" })
    ).toBeVisible();
    await expect(page.getByLabel("Recorte rápido")).toBeVisible();
    await expect(page.getByText("Héstia percebeu")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Maiores gastos do período" })).toBeVisible();
    await expect(page.locator(".app-mobile-nav")).toBeHidden();

    await page.getByRole("link", { name: "Nova transação" }).click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 15_000 });
    await expect(page).toHaveURL(/\/transacoes$/, { timeout: 15_000 });
    await expect(page.getByRole("heading", { name: "Novo lançamento rápido" })).toBeVisible();
  });

  test("keeps mobile navigation, preferences and logout accessible", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await prepareAuthenticatedApp(page);
    await page.goto("/");

    await expect(page.locator(".app-sidebar")).toBeHidden();
    await expect(page.getByRole("heading", { name: "Seu dinheiro, em perspectiva" })).toBeVisible();
    const mobileNav = page.locator(".app-mobile-nav");
    await expect(mobileNav).toBeVisible();
    await expect(mobileNav.getByRole("link", { name: "Planejamento" })).toHaveClass(
      /app-mobile-nav-link-planning/
    );
    await expect(mobileNav.getByRole("link", { name: "Nova transação" })).toBeVisible();

    await mobileNav.getByRole("button", { name: "Mais" }).click();
    const moreNavigation = page.getByRole("navigation", { name: "Outras áreas" });
    await expect(moreNavigation).toBeVisible();
    await expect(moreNavigation.getByRole("link", { name: "Contas", exact: true })).toBeVisible();
    await expect(moreNavigation.getByRole("link", { name: "Contas", exact: true })).toHaveClass(
      /app-mobile-nav-link-account/
    );
    await expect(page.getByRole("button", { name: "Ativar tema escuro" })).toBeVisible();
    await page.getByRole("button", { name: "Ativar tema escuro" }).click();
    const languageSelect = page.getByLabel("Idioma").last();
    await expect(languageSelect).toBeVisible();
    await languageSelect.focus();
    await expectVisibleFocus(languageSelect.locator(".."));

    await page.getByRole("button", { name: "Sair" }).click();
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { name: "Entrar" })).toBeVisible({ timeout: 15_000 });
    await expect(page.locator(".app-mobile-nav")).toBeHidden();
  });
});
