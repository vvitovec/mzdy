import { describe, expect, it } from "vitest";
import {
  calculatePayroll,
  createDefaultPayrollInput,
  grossToNet,
  PAYROLL_2026,
  type EmploymentType,
  type PayrollInput,
} from "./payroll";

function input(overrides: Parameters<typeof createDefaultPayrollInput>[0] = {}) {
  return createDefaultPayrollInput(overrides);
}

function gross(amount: number, overrides: Parameters<typeof createDefaultPayrollInput>[0] = {}) {
  const base = input(overrides);
  return grossToNet({
    ...base,
    calculation: {
      ...base.calculation,
      mode: "grossToNet",
      amount,
    },
  });
}

describe("payroll 2026 production engine", () => {
  it("reverses HPP target net to gross within one koruna", () => {
    const result = calculatePayroll(
      input({
        calculation: { mode: "netToGross", amount: 30_000 },
        taxpayer: { childrenCount: 2 },
      }),
    );

    expect(Math.abs(result.netCash - 30_000)).toBeLessThanOrEqual(1);
    expect(result.grossWage).toBeGreaterThan(30_000);
    expect(result.insuranceParticipation.social).toBe(true);
    expect(["exact", "approximate"]).toContain(result.accuracy.solverStatus);
  });

  it("calculates lower HPP tax when declaration is signed", () => {
    const signed = gross(45_000, { taxpayer: { signedDeclaration: true } });
    const unsigned = gross(45_000, { taxpayer: { signedDeclaration: false } });

    expect(signed.netCash).toBeGreaterThan(unsigned.netCash);
    expect(signed.taxpayerDiscount).toBe(PAYROLL_2026.tax.taxpayerDiscount);
    expect(unsigned.taxpayerDiscount).toBe(0);
  });

  it("applies child credits including ZTP/P child assigned to the highest order", () => {
    const result = gross(35_000, {
      taxpayer: {
        childrenCount: 3,
        ztpPChildrenCount: 1,
      },
    });

    expect(result.childTaxCredit).toBe(1_267 + 1_860 + 2_320 * 2);
    expect(result.assumptions.some((assumption) => assumption.label === "Děti ZTP/P")).toBe(true);
  });

  it("does not pay monthly tax bonus below the 2026 monthly income threshold", () => {
    const result = gross(10_000, {
      taxpayer: {
        childrenCount: 1,
        signedDeclaration: true,
      },
      insurance: { healthMinimumMode: "exempt" },
    });

    expect(result.taxBonus).toBe(0);
    expect(result.unusedTaxBonus).toBeGreaterThan(0);
    expect(result.warnings.some((warning) => warning.code === "tax-bonus-not-paid")).toBe(true);
  });

  it("pays monthly tax bonus once income reaches the monthly threshold", () => {
    const result = gross(12_000, {
      taxpayer: {
        childrenCount: 1,
        signedDeclaration: true,
      },
      insurance: { healthMinimumMode: "exempt" },
    });

    expect(result.taxBonus).toBeGreaterThan(0);
    expect(result.unusedTaxBonus).toBe(0);
  });

  it("keeps DPP under threshold without insurance and with withholding tax", () => {
    const result = gross(11_999, {
      employment: { type: "dpp" },
      taxpayer: { signedDeclaration: false },
      insurance: { healthMinimumMode: "exempt" },
    });

    expect(result.insuranceParticipation.social).toBe(false);
    expect(result.employeeSocial).toBe(0);
    expect(result.employeeHealth).toBe(0);
    expect(result.taxMode).toBe("withholding");
  });

  it("turns DPP insurance on at 12 000 Kč including same payer aggregation", () => {
    const result = gross(8_000, {
      employment: {
        type: "dpp",
        otherAgreementIncomeSamePayer: 4_000,
      },
      insurance: { healthMinimumMode: "exempt" },
    });

    expect(result.insuranceParticipation.thresholdIncome).toBe(12_000);
    expect(result.insuranceParticipation.social).toBe(true);
    expect(result.employeeSocial).toBeGreaterThan(0);
    expect(result.taxMode).toBe("advance");
  });

  it("turns DPČ small-scope insurance on from 4 500 Kč", () => {
    const under = gross(4_499, {
      employment: { type: "dpc", dpcRegime: "smallScope" },
      insurance: { healthMinimumMode: "exempt" },
    });
    const threshold = gross(4_500, {
      employment: { type: "dpc", dpcRegime: "smallScope" },
      insurance: { healthMinimumMode: "exempt" },
    });

    expect(under.insuranceParticipation.social).toBe(false);
    expect(threshold.insuranceParticipation.social).toBe(true);
  });

  it("treats standard DPČ as insured even below small-scope threshold", () => {
    const result = gross(3_000, {
      employment: { type: "dpc", dpcRegime: "standard" },
      insurance: { healthMinimumMode: "exempt" },
    });

    expect(result.insuranceParticipation.social).toBe(true);
    expect(result.employeeSocial).toBeGreaterThan(0);
  });

  it("splits meal allowance into exempt and taxable parts", () => {
    const result = gross(40_000, {
      benefits: {
        mealAllowance: {
          enabled: true,
          eligibleShifts: 10,
          amountPerShift: 150,
        },
      },
    });

    expect(result.mealAllowanceTotal).toBe(1_500);
    expect(result.exemptMealAllowance).toBe(1_295);
    expect(result.taxableMealAllowance).toBe(205);
  });

  it("taxes the whole meal allowance when travel meal entitlement is flagged", () => {
    const result = gross(40_000, {
      benefits: {
        mealAllowance: {
          enabled: true,
          eligibleShifts: 2,
          amountPerShift: 120,
          travelMealEntitlement: true,
        },
      },
    });

    expect(result.exemptMealAllowance).toBe(0);
    expect(result.taxableMealAllowance).toBe(240);
    expect(result.warnings.some((warning) => warning.code === "meal-travel-entitlement")).toBe(true);
  });

  it("calculates a gross wage from hourly rate and worked hours", () => {
    const result = gross(0, {
      income: {
        baseWageMode: "hourly",
        hourlyRate: 250,
        workedHours: 160,
      },
    });

    expect(result.baseWageMode).toBe("hourly");
    expect(result.baseGrossWage).toBe(40_000);
    expect(result.hourlyRate).toBe(250);
    expect(result.grossWage).toBe(40_000);
  });

  it("computes hourly rate from monthly gross wage and hours", () => {
    const result = gross(33_600, {
      income: {
        workedHours: 168,
      },
    });

    expect(result.baseWageMode).toBe("monthly");
    expect(result.hourlyRate).toBe(200);
  });

  it("reverses target net into an hourly rate when hourly mode is selected", () => {
    const result = calculatePayroll(
      input({
        calculation: { mode: "netToGross", amount: 30_000 },
        income: {
          baseWageMode: "hourly",
          workedHours: 160,
        },
      }),
    );

    expect(Math.abs(result.netCash - 30_000)).toBeLessThanOrEqual(1);
    expect(result.hourlyRate).toBeCloseTo(result.baseGrossWage / 160, 5);
    expect(result.hourlyRate).toBeGreaterThan(PAYROLL_2026.labor.minimumHourlyWage);
  });

  it("adds rewards and common pay supplements to gross wage and employer cost", () => {
    const result = gross(40_000, {
      income: {
        rewardAmount: 2_000,
        personalBonusAmount: 1_500,
        averageHourlyWage: 200,
        overtimeHours: 4,
        nightHours: 10,
        weekendHours: 8,
        holidayHours: 2,
        hardshipHours: 5,
        hardshipRate: 12,
      },
    });

    expect(result.overtimeSupplement).toBe(200);
    expect(result.nightSupplement).toBe(200);
    expect(result.weekendSupplement).toBe(160);
    expect(result.holidaySupplement).toBe(400);
    expect(result.hardshipSupplement).toBe(120);
    expect(result.grossWage).toBe(44_580);
    expect(result.employerCost).toBeGreaterThan(result.grossWage);
  });

  it("uses the 23% tax band above the 2026 monthly threshold", () => {
    const result = gross(200_000);
    const expectedTax = Math.ceil(
      PAYROLL_2026.tax.highMonthlyThreshold * PAYROLL_2026.tax.standardRate +
        (200_000 - PAYROLL_2026.tax.highMonthlyThreshold) * PAYROLL_2026.tax.highRate,
    );

    expect(result.taxBase).toBe(200_000);
    expect(result.taxBeforeDiscounts).toBe(expectedTax);
  });

  it("rounds advance tax base up to whole korunas only when the base is up to 100 Kč", () => {
    const result = gross(50, {
      taxpayer: { signedDeclaration: false },
      insurance: { healthMinimumMode: "exempt" },
    });

    expect(result.taxMode).toBe("advance");
    expect(result.taxBase).toBe(50);
    expect(result.taxBeforeDiscounts).toBe(8);
  });

  it("rounds withholding tax base and withholding tax down to whole korunas", () => {
    const result = gross(101, {
      employment: { type: "dpp" },
      taxpayer: { signedDeclaration: false },
      insurance: { healthMinimumMode: "exempt" },
    });

    expect(result.taxMode).toBe("withholding");
    expect(result.taxBase).toBe(101);
    expect(result.taxBeforeDiscounts).toBe(15);
  });

  it("caps social insurance by the annual maximum assessment base", () => {
    const result = gross(100_000, {
      yearToDate: {
        socialAssessmentBaseBeforeMonth: PAYROLL_2026.social.annualMaximumAssessmentBase - 1_000,
      },
    });

    expect(result.socialAssessmentBase).toBe(1_000);
    expect(result.employeeSocialBeforeDiscount).toBe(71);
    expect(result.warnings.some((warning) => warning.code === "social-cap-used")).toBe(true);
  });

  it("applies working pensioner social insurance discount with separate rounding", () => {
    const result = gross(40_000, {
      taxpayer: { workingPensioner: true },
    });

    expect(result.employeeSocialBeforeDiscount).toBe(2_840);
    expect(result.employeeSocialDiscount).toBe(2_600);
    expect(result.employeeSocial).toBe(240);
  });

  it("supports full, prorated and exempt health minimum modes", () => {
    const full = gross(10_000, { insurance: { healthMinimumMode: "full" } });
    const prorated = gross(10_000, {
      insurance: {
        healthMinimumMode: "prorated",
        healthMinimumDays: 15,
        daysInMonth: 30,
      },
    });
    const exempt = gross(10_000, { insurance: { healthMinimumMode: "exempt" } });

    expect(full.healthAssessmentBase).toBe(22_400);
    expect(prorated.healthAssessmentBase).toBe(11_200);
    expect(exempt.healthAssessmentBase).toBe(10_000);
  });

  it("flags explicitly unsupported payroll-grade scenarios instead of silently ignoring them", () => {
    const result = gross(40_000, {
      taxpayer: {
        hasExecution: true,
        hasInsolvency: true,
        hasSickLeave: true,
      },
    });

    expect(result.unsupportedReasons).toHaveLength(3);
    expect(result.warnings.filter((warning) => warning.severity === "unsupported")).toHaveLength(3);
  });

  it.each<EmploymentType>(["hpp", "dpp", "dpc"])("never returns NaN for supported %s scenarios", (employmentType) => {
    const samples: PayrollInput[] = [
      input({
        calculation: { mode: "grossToNet", amount: 0 },
        employment: { type: employmentType },
      }),
      input({
        calculation: { mode: "grossToNet", amount: 123_456 },
        employment: { type: employmentType },
        taxpayer: { childrenCount: 4, ztpPChildrenCount: 2, workingPensioner: true },
        benefits: { mealAllowance: { enabled: true, eligibleShifts: 31, amountPerShift: 300, includeInNet: true } },
      }),
    ];

    for (const sample of samples) {
      const result = calculatePayroll(sample);
      const numericValues = [
        result.grossWage,
        result.netCash,
        result.taxableIncome,
        result.employeeSocial,
        result.employeeHealth,
        result.taxAfterDiscounts,
        result.employerCost,
      ];

      expect(numericValues.every((value) => Number.isFinite(value))).toBe(true);
      expect(result.employeeSocial).toBeGreaterThanOrEqual(0);
      expect(result.employeeHealth).toBeGreaterThanOrEqual(0);
      expect(result.taxAfterDiscounts).toBeGreaterThanOrEqual(0);
      if (result.netCash < 0) {
        expect(result.warnings.some((warning) => warning.code === "negative-net-cash")).toBe(true);
      }
    }
  });
});
