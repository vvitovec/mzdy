import { describe, expect, it } from "vitest";
import { calculatePayroll, grossToNet, PAYROLL_2026 } from "./payroll";

const baseInput = {
  employmentType: "hpp" as const,
  signedDeclaration: true,
  childrenCount: 0,
  workedDays: 21,
  mealAllowancePerDay: PAYROLL_2026.mealAllowanceExemptLimit,
  includeMealAllowanceInNet: false,
  applyHealthMinimum: true,
};

describe("payroll 2026", () => {
  it("reverses HPP target net to gross within one koruna", () => {
    const result = calculatePayroll({
      ...baseInput,
      mode: "netToGross",
      amount: 30_000,
      childrenCount: 2,
    });

    expect(Math.abs(result.netCash - 30_000)).toBeLessThanOrEqual(1);
    expect(result.grossWage).toBeGreaterThan(30_000);
    expect(result.insuranceApplies).toBe(true);
  });

  it("calculates lower HPP tax when declaration is signed", () => {
    const signed = grossToNet({ ...baseInput, grossWage: 45_000, signedDeclaration: true });
    const unsigned = grossToNet({ ...baseInput, grossWage: 45_000, signedDeclaration: false });

    expect(signed.netCash).toBeGreaterThan(unsigned.netCash);
    expect(signed.taxpayerDiscount).toBe(2_570);
    expect(unsigned.taxpayerDiscount).toBe(0);
  });

  it("applies child credits and tax bonus", () => {
    const result = grossToNet({ ...baseInput, grossWage: 25_000, childrenCount: 3 });

    expect(result.childTaxCredit).toBe(5_447);
    expect(result.taxBonus).toBeGreaterThanOrEqual(0);
  });

  it("keeps DPP under threshold without insurance and withholding tax", () => {
    const result = grossToNet({
      ...baseInput,
      employmentType: "dpp",
      signedDeclaration: false,
      grossWage: 11_999,
      workedDays: 0,
      mealAllowancePerDay: 0,
    });

    expect(result.insuranceApplies).toBe(false);
    expect(result.employeeSocial).toBe(0);
    expect(result.employeeHealth).toBe(0);
    expect(result.taxMode).toBe("withholding");
  });

  it("turns DPP insurance on at threshold", () => {
    const result = grossToNet({
      ...baseInput,
      employmentType: "dpp",
      grossWage: 12_000,
      workedDays: 0,
      mealAllowancePerDay: 0,
    });

    expect(result.insuranceApplies).toBe(true);
    expect(result.employeeSocial).toBeGreaterThan(0);
    expect(result.employeeHealth).toBeGreaterThan(0);
  });

  it("turns DPČ insurance on from 4 500 Kč", () => {
    const under = grossToNet({
      ...baseInput,
      employmentType: "dpc",
      grossWage: 4_499,
      workedDays: 0,
      mealAllowancePerDay: 0,
    });
    const threshold = grossToNet({
      ...baseInput,
      employmentType: "dpc",
      grossWage: 4_500,
      workedDays: 0,
      mealAllowancePerDay: 0,
    });

    expect(under.insuranceApplies).toBe(false);
    expect(threshold.insuranceApplies).toBe(true);
  });

  it("splits meal allowance into exempt and taxable parts", () => {
    const result = grossToNet({
      ...baseInput,
      grossWage: 40_000,
      workedDays: 10,
      mealAllowancePerDay: 150,
    });

    expect(result.mealAllowanceTotal).toBe(1_500);
    expect(result.exemptMealAllowance).toBe(1_295);
    expect(result.taxableMealAllowance).toBe(205);
  });
});
