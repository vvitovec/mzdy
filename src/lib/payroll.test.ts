import { describe, expect, it } from "vitest";
import { calculatePayroll, grossToNet, PAYROLL_2026 } from "./payroll";

const baseInput = {
  employmentType: "hpp" as const,
  signedDeclaration: true,
  childrenCount: 0,
  useMealAllowance: false,
  workedDays: 21,
  mealAllowancePerDay: PAYROLL_2026.mealAllowanceExemptLimit,
  includeMealAllowanceInNet: false,
  applyHealthMinimum: true,
  rewardAmount: 0,
  personalBonusAmount: 0,
  otherTaxableIncomeAmount: 0,
  averageHourlyWage: 250,
  overtimeHours: 0,
  nightHours: 0,
  weekendHours: 0,
  holidayHours: 0,
  hardshipHours: 0,
  hardshipRate: 10,
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
    const signed = grossToNet({ ...baseInput, baseGrossWage: 45_000, signedDeclaration: true });
    const unsigned = grossToNet({ ...baseInput, baseGrossWage: 45_000, signedDeclaration: false });

    expect(signed.netCash).toBeGreaterThan(unsigned.netCash);
    expect(signed.taxpayerDiscount).toBe(2_570);
    expect(unsigned.taxpayerDiscount).toBe(0);
  });

  it("applies child credits and tax bonus", () => {
    const result = grossToNet({ ...baseInput, baseGrossWage: 25_000, childrenCount: 3 });

    expect(result.childTaxCredit).toBe(5_447);
    expect(result.taxBonus).toBeGreaterThanOrEqual(0);
  });

  it("keeps DPP under threshold without insurance and withholding tax", () => {
    const result = grossToNet({
      ...baseInput,
      employmentType: "dpp",
      signedDeclaration: false,
      baseGrossWage: 11_999,
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
      baseGrossWage: 12_000,
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
      baseGrossWage: 4_499,
      workedDays: 0,
      mealAllowancePerDay: 0,
    });
    const threshold = grossToNet({
      ...baseInput,
      employmentType: "dpc",
      baseGrossWage: 4_500,
      workedDays: 0,
      mealAllowancePerDay: 0,
    });

    expect(under.insuranceApplies).toBe(false);
    expect(threshold.insuranceApplies).toBe(true);
  });

  it("splits meal allowance into exempt and taxable parts", () => {
    const result = grossToNet({
      ...baseInput,
      useMealAllowance: true,
      baseGrossWage: 40_000,
      workedDays: 10,
      mealAllowancePerDay: 150,
    });

    expect(result.mealAllowanceTotal).toBe(1_500);
    expect(result.exemptMealAllowance).toBe(1_295);
    expect(result.taxableMealAllowance).toBe(205);
  });

  it("hides meal allowance rows and amounts by default", () => {
    const result = grossToNet({ ...baseInput, baseGrossWage: 40_000 });

    expect(result.mealAllowanceTotal).toBe(0);
    expect(result.rows.some((row) => row.label.includes("Stravenky"))).toBe(false);
  });

  it("adds rewards and personal bonus to gross wage and employer cost", () => {
    const plain = grossToNet({ ...baseInput, baseGrossWage: 40_000 });
    const withExtras = grossToNet({
      ...baseInput,
      baseGrossWage: 40_000,
      rewardAmount: 2_000,
      personalBonusAmount: 1_500,
    });

    expect(withExtras.grossWage).toBe(43_500);
    expect(withExtras.netCash).toBeGreaterThan(plain.netCash);
    expect(withExtras.employerCost).toBeGreaterThan(plain.employerCost);
  });

  it("calculates common pay supplements", () => {
    const result = grossToNet({
      ...baseInput,
      baseGrossWage: 40_000,
      averageHourlyWage: 200,
      overtimeHours: 4,
      nightHours: 10,
      weekendHours: 8,
      holidayHours: 2,
      hardshipHours: 5,
      hardshipRate: 12,
    });

    expect(result.overtimeSupplement).toBe(200);
    expect(result.nightSupplement).toBe(200);
    expect(result.weekendSupplement).toBe(160);
    expect(result.holidaySupplement).toBe(400);
    expect(result.hardshipSupplement).toBe(120);
    expect(result.supplementsTotal).toBe(1_080);
  });

  it("does not apply overtime supplement for DPP and DPČ", () => {
    const dpp = grossToNet({
      ...baseInput,
      employmentType: "dpp",
      baseGrossWage: 20_000,
      averageHourlyWage: 250,
      overtimeHours: 10,
    });
    const dpc = grossToNet({
      ...baseInput,
      employmentType: "dpc",
      baseGrossWage: 20_000,
      averageHourlyWage: 250,
      overtimeHours: 10,
    });

    expect(dpp.overtimeSupplement).toBe(0);
    expect(dpc.overtimeSupplement).toBe(0);
  });

  it("reverses HPP target net with known rewards", () => {
    const result = calculatePayroll({
      ...baseInput,
      mode: "netToGross",
      amount: 35_000,
      rewardAmount: 3_000,
      personalBonusAmount: 2_000,
      averageHourlyWage: 250,
      nightHours: 4,
    });

    expect(Math.abs(result.netCash - 35_000)).toBeLessThanOrEqual(1);
    expect(result.cashExtras).toBe(5_100);
  });
});
