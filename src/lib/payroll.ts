export type EmploymentType = "hpp" | "dpp" | "dpc";
export type CalculationMode = "netToGross" | "grossToNet";

export type PayrollInput = {
  mode: CalculationMode;
  amount: number;
  employmentType: EmploymentType;
  signedDeclaration: boolean;
  childrenCount: number;
  useMealAllowance: boolean;
  workedDays: number;
  mealAllowancePerDay: number;
  includeMealAllowanceInNet: boolean;
  applyHealthMinimum: boolean;
  rewardAmount: number;
  personalBonusAmount: number;
  otherTaxableIncomeAmount: number;
  averageHourlyWage: number;
  overtimeHours: number;
  nightHours: number;
  weekendHours: number;
  holidayHours: number;
  hardshipHours: number;
  hardshipRate: number;
};

export type PayrollRow = {
  label: string;
  amount: number;
  tone?: "normal" | "positive" | "negative" | "strong";
};

export type PayrollResult = {
  requestedAmount: number;
  baseGrossWage: number;
  grossWage: number;
  rewardAmount: number;
  personalBonusAmount: number;
  otherTaxableIncomeAmount: number;
  overtimeSupplement: number;
  nightSupplement: number;
  weekendSupplement: number;
  holidaySupplement: number;
  hardshipSupplement: number;
  supplementsTotal: number;
  cashExtras: number;
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
const hasAmount = (value: number) => Math.abs(value) > 0;

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

function calculateSupplements(input: Omit<PayrollInput, "mode" | "amount">) {
  const averageHourlyWage = clampNumber(input.averageHourlyWage);
  const overtimeSupplement =
    input.employmentType === "hpp" ? roundKoruna(averageHourlyWage * clampNumber(input.overtimeHours) * 0.25) : 0;
  const nightSupplement = roundKoruna(averageHourlyWage * clampNumber(input.nightHours) * 0.1);
  const weekendSupplement = roundKoruna(averageHourlyWage * clampNumber(input.weekendHours) * 0.1);
  const holidaySupplement = roundKoruna(averageHourlyWage * clampNumber(input.holidayHours) * 1);
  const hardshipSupplement = roundKoruna(averageHourlyWage * clampNumber(input.hardshipHours) * (clampNumber(input.hardshipRate) / 100));
  const supplementsTotal = overtimeSupplement + nightSupplement + weekendSupplement + holidaySupplement + hardshipSupplement;

  return {
    overtimeSupplement,
    nightSupplement,
    weekendSupplement,
    holidaySupplement,
    hardshipSupplement,
    supplementsTotal,
  };
}

export function grossToNet(input: Omit<PayrollInput, "mode"> & { baseGrossWage: number }): PayrollResult {
  const baseGrossWage = roundKoruna(clampNumber(input.baseGrossWage));
  const rewardAmount = roundKoruna(clampNumber(input.rewardAmount));
  const personalBonusAmount = roundKoruna(clampNumber(input.personalBonusAmount));
  const otherTaxableIncomeAmount = roundKoruna(clampNumber(input.otherTaxableIncomeAmount));
  const supplements = calculateSupplements(input);
  const cashExtras = rewardAmount + personalBonusAmount + otherTaxableIncomeAmount + supplements.supplementsTotal;
  const grossWage = baseGrossWage + cashExtras;
  const workedDays = input.useMealAllowance ? Math.max(0, Math.floor(clampNumber(input.workedDays))) : 0;
  const mealAllowancePerDay = input.useMealAllowance ? clampNumber(input.mealAllowancePerDay) : 0;
  const mealAllowanceTotal = input.useMealAllowance ? roundKoruna(workedDays * mealAllowancePerDay) : 0;
  const exemptMealAllowance = input.useMealAllowance
    ? roundKoruna(workedDays * Math.min(mealAllowancePerDay, PAYROLL_2026.mealAllowanceExemptLimit))
    : 0;
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
    { label: "Základní hrubá mzda", amount: baseGrossWage, tone: "strong" },
    ...(hasAmount(rewardAmount) ? [{ label: "Odměna / prémie", amount: rewardAmount, tone: "positive" as const }] : []),
    ...(hasAmount(personalBonusAmount) ? [{ label: "Osobní ohodnocení", amount: personalBonusAmount, tone: "positive" as const }] : []),
    ...(hasAmount(otherTaxableIncomeAmount) ? [{ label: "Jiný zdanitelný příjem", amount: otherTaxableIncomeAmount, tone: "positive" as const }] : []),
    ...(hasAmount(supplements.overtimeSupplement)
      ? [{ label: "Příplatek za přesčas", amount: supplements.overtimeSupplement, tone: "positive" as const }]
      : []),
    ...(hasAmount(supplements.nightSupplement)
      ? [{ label: "Příplatek za noc", amount: supplements.nightSupplement, tone: "positive" as const }]
      : []),
    ...(hasAmount(supplements.weekendSupplement)
      ? [{ label: "Příplatek za víkend", amount: supplements.weekendSupplement, tone: "positive" as const }]
      : []),
    ...(hasAmount(supplements.holidaySupplement)
      ? [{ label: "Příplatek za svátek", amount: supplements.holidaySupplement, tone: "positive" as const }]
      : []),
    ...(hasAmount(supplements.hardshipSupplement)
      ? [{ label: "Příplatek za ztížené prostředí", amount: supplements.hardshipSupplement, tone: "positive" as const }]
      : []),
    { label: "Hrubá mzda celkem", amount: grossWage, tone: "strong" },
    ...(input.useMealAllowance ? [{ label: "Zdanitelná část stravenek", amount: taxableMealAllowance }] : []),
    { label: "Základ pro odvody", amount: taxableIncome },
    { label: "Sociální pojištění zaměstnance", amount: -employeeSocial, tone: "negative" },
    { label: "Zdravotní pojištění zaměstnance", amount: -employeeHealth, tone: "negative" },
    { label: withholdingTax ? "Srážková daň" : "Záloha na daň před slevami", amount: -taxBeforeDiscounts, tone: "negative" },
    { label: "Sleva na poplatníka", amount: taxpayerDiscount, tone: "positive" },
    { label: "Daňové zvýhodnění na děti", amount: childCredit, tone: "positive" },
    { label: "Daň po slevách", amount: -taxAfterDiscounts, tone: "negative" },
    { label: "Daňový bonus", amount: taxBonus, tone: "positive" },
    { label: "Čistá mzda", amount: netWage, tone: "strong" },
    ...(input.useMealAllowance
      ? [
          { label: "Stravenky celkem", amount: mealAllowanceTotal, tone: "positive" as const },
          { label: "Osvobozená část stravenek", amount: exemptMealAllowance, tone: "positive" as const },
          { label: "Čistý příjem včetně stravenek", amount: netCash, tone: "strong" as const },
        ]
      : []),
    { label: "Sociální pojištění zaměstnavatele", amount: employerSocial },
    { label: "Zdravotní pojištění zaměstnavatele", amount: employerHealth },
    { label: "Náklady zaměstnavatele celkem", amount: employerCost, tone: "strong" },
  ];

  return {
    requestedAmount: input.baseGrossWage,
    baseGrossWage,
    grossWage,
    rewardAmount,
    personalBonusAmount,
    otherTaxableIncomeAmount,
    ...supplements,
    cashExtras,
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
  let best = grossToNet({ ...input, baseGrossWage: high });

  while (best.netCash < targetNet && high < 5_000_000) {
    high *= 2;
    best = grossToNet({ ...input, baseGrossWage: high });
  }

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const result = grossToNet({ ...input, baseGrossWage: mid });

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
    return grossToNet({ ...input, baseGrossWage: input.amount });
  }

  return netToGross({ ...input, targetNet: input.amount });
}
