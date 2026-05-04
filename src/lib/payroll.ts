export type EmploymentType = "hpp" | "dpp" | "dpc";
export type CalculationMode = "netToGross" | "grossToNet";

export type PayrollInput = {
  mode: CalculationMode;
  amount: number;
  employmentType: EmploymentType;
  signedDeclaration: boolean;
  childrenCount: number;
  workedDays: number;
  mealAllowancePerDay: number;
  includeMealAllowanceInNet: boolean;
  applyHealthMinimum: boolean;
};

export type PayrollRow = {
  label: string;
  amount: number;
  tone?: "normal" | "positive" | "negative" | "strong";
};

export type PayrollResult = {
  requestedAmount: number;
  grossWage: number;
  taxableMealAllowance: number;
  exemptMealAllowance: number;
  mealAllowanceTotal: number;
  taxableIncome: number;
  employeeSocial: number;
  employeeHealth: number;
  employerSocial: number;
  employerHealth: number;
  taxBase: number;
  taxBeforeDiscounts: number;
  taxpayerDiscount: number;
  childTaxCredit: number;
  taxAfterDiscounts: number;
  taxBonus: number;
  netWage: number;
  netCash: number;
  employerCost: number;
  insuranceApplies: boolean;
  taxMode: "advance" | "withholding";
  rows: PayrollRow[];
};

export const PAYROLL_2026 = {
  employeeSocialRate: 0.071,
  employerSocialRate: 0.248,
  employeeHealthRate: 0.045,
  employerHealthRate: 0.09,
  healthTotalRate: 0.135,
  taxRate: 0.15,
  highTaxRate: 0.23,
  highTaxMonthlyThreshold: 146_901,
  taxpayerDiscount: 2_570,
  childCredits: [1_267, 1_860, 2_320],
  mealAllowanceExemptLimit: 129.5,
  dppInsuranceThreshold: 12_000,
  dpcInsuranceThreshold: 4_500,
  minimumWage: 22_400,
};

const roundKoruna = (value: number) => Math.round(value);
const ceilKoruna = (value: number) => Math.ceil(value);
const ceilHundreds = (value: number) => Math.ceil(value / 100) * 100;
const clampNumber = (value: number, min = 0) => (Number.isFinite(value) ? Math.max(min, value) : min);

export function childTaxCredit(childrenCount: number) {
  const count = Math.max(0, Math.floor(childrenCount));
  let total = 0;

  for (let index = 0; index < count; index += 1) {
    total += PAYROLL_2026.childCredits[Math.min(index, PAYROLL_2026.childCredits.length - 1)] ?? 0;
  }

  return total;
}

export function insuranceApplies(employmentType: EmploymentType, taxableIncome: number) {
  if (employmentType === "hpp") return true;
  if (employmentType === "dpp") return taxableIncome >= PAYROLL_2026.dppInsuranceThreshold;
  return taxableIncome >= PAYROLL_2026.dpcInsuranceThreshold;
}

export function grossToNet(input: Omit<PayrollInput, "mode"> & { grossWage: number }): PayrollResult {
  const grossWage = roundKoruna(clampNumber(input.grossWage));
  const workedDays = Math.max(0, Math.floor(clampNumber(input.workedDays)));
  const mealAllowancePerDay = clampNumber(input.mealAllowancePerDay);
  const mealAllowanceTotal = roundKoruna(workedDays * mealAllowancePerDay);
  const exemptMealAllowance = roundKoruna(workedDays * Math.min(mealAllowancePerDay, PAYROLL_2026.mealAllowanceExemptLimit));
  const taxableMealAllowance = Math.max(0, mealAllowanceTotal - exemptMealAllowance);
  const taxableIncome = grossWage + taxableMealAllowance;
  const hasInsurance = insuranceApplies(input.employmentType, taxableIncome);
  const healthMinimumBase =
    input.employmentType === "hpp" && input.applyHealthMinimum
      ? Math.max(taxableIncome, PAYROLL_2026.minimumWage)
      : taxableIncome;
  const employeeSocial = hasInsurance ? ceilKoruna(taxableIncome * PAYROLL_2026.employeeSocialRate) : 0;
  const employeeHealth = hasInsurance ? ceilKoruna(healthMinimumBase * PAYROLL_2026.employeeHealthRate) : 0;
  const employerSocial = hasInsurance ? ceilKoruna(taxableIncome * PAYROLL_2026.employerSocialRate) : 0;
  const employerHealth = hasInsurance ? ceilKoruna(healthMinimumBase * PAYROLL_2026.employerHealthRate) : 0;
  const withholdingTax =
    !input.signedDeclaration &&
    ((input.employmentType === "dpp" && taxableIncome < PAYROLL_2026.dppInsuranceThreshold) ||
      (input.employmentType === "dpc" && taxableIncome < PAYROLL_2026.dpcInsuranceThreshold));
  const taxBase = withholdingTax ? taxableIncome : ceilHundreds(taxableIncome);
  const taxBeforeDiscounts = ceilKoruna(
    Math.min(taxBase, PAYROLL_2026.highTaxMonthlyThreshold) * PAYROLL_2026.taxRate +
      Math.max(0, taxBase - PAYROLL_2026.highTaxMonthlyThreshold) * PAYROLL_2026.highTaxRate,
  );
  const taxpayerDiscount = input.signedDeclaration && !withholdingTax ? PAYROLL_2026.taxpayerDiscount : 0;
  const childCredit = input.signedDeclaration && !withholdingTax ? childTaxCredit(input.childrenCount) : 0;
  const taxAfterTaxpayer = Math.max(0, taxBeforeDiscounts - taxpayerDiscount);
  const taxAfterDiscounts = Math.max(0, taxAfterTaxpayer - childCredit);
  const taxBonus = Math.max(0, childCredit - taxAfterTaxpayer);
  const netWage = grossWage - employeeSocial - employeeHealth - taxAfterDiscounts + taxBonus;
  const netCash = netWage + (input.includeMealAllowanceInNet ? mealAllowanceTotal : 0);
  const employerCost = taxableIncome + employerSocial + employerHealth + exemptMealAllowance;

  const rows: PayrollRow[] = [
    { label: "Hrubá mzda", amount: grossWage, tone: "strong" },
    { label: "Zdanitelná část stravenek", amount: taxableMealAllowance },
    { label: "Základ pro odvody", amount: taxableIncome },
    { label: "Sociální pojištění zaměstnance", amount: -employeeSocial, tone: "negative" },
    { label: "Zdravotní pojištění zaměstnance", amount: -employeeHealth, tone: "negative" },
    { label: withholdingTax ? "Srážková daň" : "Záloha na daň před slevami", amount: -taxBeforeDiscounts, tone: "negative" },
    { label: "Sleva na poplatníka", amount: taxpayerDiscount, tone: "positive" },
    { label: "Daňové zvýhodnění na děti", amount: childCredit, tone: "positive" },
    { label: "Daň po slevách", amount: -taxAfterDiscounts, tone: "negative" },
    { label: "Daňový bonus", amount: taxBonus, tone: "positive" },
    { label: "Čistá mzda", amount: netWage, tone: "strong" },
    { label: "Stravenky celkem", amount: mealAllowanceTotal, tone: "positive" },
    { label: "Čistý příjem včetně stravenek", amount: netCash, tone: "strong" },
    { label: "Sociální pojištění zaměstnavatele", amount: employerSocial },
    { label: "Zdravotní pojištění zaměstnavatele", amount: employerHealth },
    { label: "Náklady zaměstnavatele celkem", amount: employerCost, tone: "strong" },
  ];

  return {
    requestedAmount: input.grossWage,
    grossWage,
    taxableMealAllowance,
    exemptMealAllowance,
    mealAllowanceTotal,
    taxableIncome,
    employeeSocial,
    employeeHealth,
    employerSocial,
    employerHealth,
    taxBase,
    taxBeforeDiscounts,
    taxpayerDiscount,
    childTaxCredit: childCredit,
    taxAfterDiscounts,
    taxBonus,
    netWage,
    netCash,
    employerCost,
    insuranceApplies: hasInsurance,
    taxMode: withholdingTax ? "withholding" : "advance",
    rows,
  };
}

export function netToGross(input: Omit<PayrollInput, "mode"> & { targetNet: number }): PayrollResult {
  const targetNet = roundKoruna(clampNumber(input.targetNet));
  let low = 0;
  let high = Math.max(10_000, targetNet * 3 + 50_000);
  let best = grossToNet({ ...input, grossWage: high });

  while (best.netCash < targetNet && high < 5_000_000) {
    high *= 2;
    best = grossToNet({ ...input, grossWage: high });
  }

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const result = grossToNet({ ...input, grossWage: mid });

    if (result.netCash >= targetNet) {
      best = result;
      high = mid - 1;
    } else {
      low = mid + 1;
    }
  }

  return {
    ...best,
    requestedAmount: targetNet,
  };
}

export function calculatePayroll(input: PayrollInput): PayrollResult {
  if (input.mode === "grossToNet") {
    return grossToNet({ ...input, grossWage: input.amount });
  }

  return netToGross({ ...input, targetNet: input.amount });
}
