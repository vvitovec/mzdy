import { expect, test } from "@playwright/test";

test("basic salary flow shows a sourced result", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Mzdová kalkulačka 2026" })).toBeVisible();
  await page.getByRole("button", { name: "Hrubá → čistá" }).click();
  await page.getByLabel("Základní hrubá mzda").fill("45000");
  await page.getByLabel("Počet dětí").fill("2");

  await expect(page.getByText("Čistá mzda").first()).toBeVisible();
  await expect(page.getByText("Metodika")).toBeVisible();
  await expect(page.getByRole("link", { name: /MPSV: minimální mzda 2026/ })).toBeVisible();
});

test("expert mode exposes edge cases and unsupported warnings", async ({ page }) => {
  await page.goto("/");

  await page.getByLabel("Expertní režim").check();
  await page.getByLabel("Typ vztahu").selectOption("dpp");
  await page.getByLabel("Podepsané prohlášení poplatníka").uncheck();
  await page.getByRole("button", { name: "Hrubá → čistá" }).click();
  await page.getByLabel("Základní hrubá mzda").fill("11999");
  await page.getByLabel("Exekuce / soudní srážky").check();

  await expect(page.getByText("bez pojistného")).toBeVisible();
  await expect(page.getByText("Srážková daň").first()).toBeVisible();
  await expect(page.getByText(/Exekuce a soudní srážky nejsou ve v1 počítané/)).toBeVisible();
});

test("large numbers and keyboard navigation keep the layout usable", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Hrubá → čistá" }).click();
  await page.getByLabel("Základní hrubá mzda").fill("9999999");
  await page.getByLabel("Základní hrubá mzda").focus();
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Typ vztahu")).toBeFocused();

  await expect(page.getByText("Náklady zaměstnavatele").first()).toBeVisible();
  await expect(page.locator(".result-number")).toBeVisible();
});
