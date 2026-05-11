import { expect, test } from "@playwright/test";

test("basic salary flow shows a sourced result", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Mzdová kalkulačka 2026" })).toBeVisible();
  await expect(page.getByLabel("Požadovaný čistý příjem")).toHaveValue("30000");
  await page.getByRole("button", { name: "Hrubá → čistá" }).click();
  await expect(page.getByLabel("Základní hrubá mzda")).toHaveValue("33600");
  await page.getByRole("button", { name: "Čistá → hrubá" }).click();
  await expect(page.getByLabel("Požadovaný čistý příjem")).toHaveValue("30000");
  await page.getByRole("button", { name: "Hrubá → čistá" }).click();
  await page.getByLabel("Základní hrubá mzda").fill("45000");
  await page.getByLabel("Počet dětí").fill("2");

  await expect(page.getByText("Čistá mzda").first()).toBeVisible();
  await expect(page.getByText("Metodika")).toBeVisible();
  await expect(page.getByRole("link", { name: /MPSV: minimální mzda 2026/ })).toBeVisible();
});

test("pdf export is available from both calculation modes", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("button", { name: "Export PDF" })).toBeVisible();

  await page.evaluate(() => {
    window.print = () => undefined;
  });
  await page.getByRole("button", { name: "Export PDF" }).click();

  await page.getByRole("button", { name: "Hrubá → čistá" }).click();
  await page.getByLabel("Základní hrubá mzda").fill("45000");
  await expect(page.getByRole("button", { name: "Export PDF" })).toBeVisible();
});

test("expert mode exposes edge cases and unsupported warnings", async ({ page }) => {
  await page.goto("/");

  await page.getByLabel("Expertní režim").check();
  await page.getByLabel("Typ vztahu").selectOption("dpp");
  await page.getByLabel("Podepsané prohlášení poplatníka").uncheck();
  await page.getByRole("button", { name: "Hrubá → čistá" }).click();
  await page.getByLabel("Základní hrubá mzda").fill("11999");
  await page.getByLabel("Exekuce / soudní srážky").check();

  await expect(page.locator(".summary-row").filter({ hasText: "Pojistné" }).getByText("Ne")).toBeVisible();
  await expect(page.getByText("Srážková daň").first()).toBeVisible();
  await expect(page.getByText(/Exekuce a soudní srážky nejsou ve v1 počítané/)).toBeVisible();
});

test("large numbers and keyboard navigation keep the layout usable", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Hrubá → čistá" }).click();
  await page.getByLabel("Základní hrubá mzda").fill("9999999");
  await page.getByLabel("Základní hrubá mzda").focus();
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Hodiny pro sazbu")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Typ vztahu")).toBeFocused();

  await expect(page.getByText("Náklady zaměstnavatele").first()).toBeVisible();
  await expect(page.locator(".result-number")).toBeVisible();
});

test("hourly wage mode calculates gross wage from rate and hours", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Hrubá → čistá" }).click();
  await page.getByRole("button", { name: "Hodinově" }).click();
  await page.getByLabel("Hodinová sazba").fill("250");
  await page.getByLabel("Odpracované hodiny").fill("160");

  await expect(page.getByText(/Hrubý základ ze sazby: 40\s?000\s?Kč/)).toBeVisible();
  await expect(page.getByText(/250,00\s?Kč\/h/).first()).toBeVisible();
  await expect(page.getByText("Základní hrubá mzda z hodinové sazby (160 h)").first()).toBeVisible();
});

test("optional payroll inputs can be clicked through and reset", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Hrubá → čistá" }).click();
  await page.getByLabel("Základní hrubá mzda").fill("52000");
  await page.getByLabel("Přidat příspěvek na stravování").check();
  await page.getByLabel("Příspěvek za směnu").fill("150");
  await page.getByLabel("Způsobilé směny").fill("18");
  await page.getByLabel("Započítat příspěvek do čistého příjmu").check();
  await page.getByLabel("Přidat odměny a příplatky").check();
  await page.getByLabel("Odměna / prémie").fill("3000");
  await page.getByLabel("Průměrný hodinový výdělek").fill("250");
  await page.getByLabel("Noc 10 %").fill("6");
  await page.getByLabel("Víkend 10 %").fill("4");

  await expect(page.getByText("Příspěvek na stravování").first()).toBeVisible();
  await expect(page.getByText("Odměny a příplatky").first()).toBeVisible();

  await page.getByLabel("Expertní režim").check();
  await page.getByLabel("Typ vztahu").selectOption("dpc");
  await page.getByLabel("DPČ režim").selectOption("standard");
  await page.getByLabel("Zdravotní minimum").selectOption("prorated");
  await page.getByLabel("Dny pro poměrné minimum").fill("12");
  await page.getByLabel("Pracující starobní důchodce").check();

  await expect(page.getByText("DPČ · zálohová daň")).toBeVisible();

  await page.getByRole("button", { name: "Vrátit výchozí hodnoty" }).click();
  await expect(page.getByLabel("Požadovaný čistý příjem")).toHaveValue("30000");
  await expect(page.getByLabel("Expertní režim")).not.toBeChecked();
  await expect(page.getByLabel("Přidat příspěvek na stravování")).not.toBeChecked();
});

test("desktop, tablet and phone layouts avoid horizontal overflow", async ({ page }) => {
  const viewports = [
    { width: 1440, height: 900 },
    { width: 1024, height: 900 },
    { width: 390, height: 844 },
  ];

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await page.getByRole("button", { name: "Hrubá → čistá" }).click();
    await page.getByLabel("Základní hrubá mzda").fill("9999999");
    await page.getByLabel("Expertní režim").check();
    await page.getByLabel("Přidat odměny a příplatky").check();

    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );

    expect(hasHorizontalOverflow).toBe(false);
    await expect(page.getByText("Náklady zaměstnavatele").first()).toBeVisible();
    await expect(page.getByLabel("Exekuce / soudní srážky")).toBeVisible();
  }
});
