export type EmploymentType = "hpp" | "dpp" | "dpc";
export type CalculationMode = "netToGross" | "grossToNet";
export type DpcRegime = "standard" | "smallScope";
export type EmployerSocialProfile = "standard" | "risky" | "rescue";
export type HealthMinimumMode = "full" | "prorated" | "exempt";
export type DisabilityDiscount = "none" | "basic" | "advanced";
export type TaxMode = "advance" | "withholding";
export type SolverStatus = "not-run" | "exact" | "approximate" | "bounded";

export type PayrollSource = {
  id: string;
  label: string;
  url: string;
  verifiedOn: string;
};

export type PayrollRules = {
  year: 2026;
  validFrom: string;
  validTo: string;
  sourceIds: string[];
  social: {
    employeeRate: number;
    employeeWorkingPensionerDiscountRate: number;
    employerRates: Record<EmployerSocialProfile, number>;
    annualMaximumAssessmentBase: number;
    dppParticipationThreshold: number;
    smallEmploymentThreshold: number;
  };
  health: {
    totalRate: number;
    minimumWage: number;
  };
  tax: {
    standardRate: number;
    highRate: number;
    highMonthlyThreshold: number;
    taxpayerDiscount: number;
    disabilityBasicDiscount: number;
    disabilityAdvancedDiscount: number;
    ztpPDiscount: number;
    childCredits: [number, number, number];
    monthlyTaxBonusMinimum: number;
    monthlyTaxBonusIncomeThreshold: number;
  };
  benefits: {
    mealAllowanceExemptLimit: number;
  };
  labor: {
    minimumMonthlyWage: number;
    minimumHourlyWage: number;
    remoteWorkHourlyAllowance: number;
  };
};

export type PayrollInput = {
  calculation: {
    mode: CalculationMode;
    amount: number;
  };
  employment: {
    type: EmploymentType;
    dpcRegime: DpcRegime;
    employerSocialProfile: EmployerSocialProfile;
    otherAgreementIncomeSamePayer: number;
  };
  taxpayer: {
    signedDeclaration: boolean;
    childrenCount: number;
    ztpPChildrenCount: number;
    disability: DisabilityDiscount;
    ztpP: boolean;
    workingPensioner: boolean;
    hasExecution: boolean;
    hasInsolvency: boolean;
    hasSickLeave: boolean;
    hasMultipleEmployers: boolean;
    isForeignTaxResident: boolean;
  };
  income: {
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
  benefits: {
    mealAllowance: {
      enabled: boolean;
      eligibleShifts: number;
      amountPerShift: number;
      includeInNet: boolean;
      travelMealEntitlement: boolean;
    };
  };
  insurance: {
    healthMinimumMode: HealthMinimumMode;
    healthMinimumDays: number;
    daysInMonth: number;
  };
  yearToDate: {
    socialAssessmentBaseBeforeMonth: number;
  };
};

export type PayrollWarning = {
  code: string;
  severity: "info" | "warning" | "unsupported";
  message: string;
};

export type PayrollAssumption = {
  label: string;
  value: string;
};

export type PayrollLine = {
  label: string;
  amount: number;
  tone?: "normal" | "positive" | "negative" | "strong";
  kind?: "income" | "deduction" | "tax" | "insurance" | "benefit" | "summary";
};

export type PayrollRow = PayrollLine;

export type InsuranceParticipation = {
  social: boolean;
  health: boolean;
  thresholdIncome: number;
  reason: string;
};

export type PayrollAccuracy = {
  targetAmount: number;
  actualAmount: number;
  difference: number;
  solverStatus: SolverStatus;
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
  socialAssessmentBase: number;
  remainingSocialAssessmentBase: number;
  employeeSocialBeforeDiscount: number;
  employeeSocialDiscount: number;
  employeeSocial: number;
  healthAssessmentBase: number;
  healthMinimumBase: number;
  employeeHealth: number;
  employerSocial: number;
  employerHealth: number;
  taxBase: number;
  taxBeforeDiscounts: number;
  taxpayerDiscount: number;
  otherTaxDiscounts: number;
  childTaxCredit: number;
  taxAfterDiscounts: number;
  taxBonus: number;
  unusedTaxBonus: number;
  netWage: number;
  netCash: number;
  employerCost: number;
  insuranceApplies: boolean;
  taxMode: TaxMode;
  insuranceParticipation: InsuranceParticipation;
  warnings: PayrollWarning[];
  unsupportedReasons: string[];
  assumptions: PayrollAssumption[];
  sources: PayrollSource[];
  accuracy: PayrollAccuracy;
  lines: PayrollLine[];
  rows: PayrollRow[];
};

export type PayrollCalculationContext = {
  rules?: PayrollRules;
  baseGrossWage?: number;
  solverStatus?: SolverStatus;
  requestedAmount?: number;
};

type DeepPartial<T> = {
  [Key in keyof T]?: T[Key] extends object ? DeepPartial<T[Key]> : T[Key];
};

export const PAYROLL_SOURCES: PayrollSource[] = [
  {
    id: "mpsv-minimum-wage-2026",
    label: "MPSV: minimální mzda 2026",
    url: "https://mpsv.gov.cz/minimalni-mzda",
    verifiedOn: "2026-05-04",
  },
  {
    id: "financial-administration-tax-2026",
    label: "Finanční správa: daň ze závislé činnosti 2026",
    url: "https://financnisprava.gov.cz/cs/dane/dane/dan-z-prijmu/zamestnanci-zamestnavatele/obecne-informace",
    verifiedOn: "2026-05-04",
  },
  {
    id: "cssz-social-insurance-2026",
    label: "ČSSZ: pojistné na sociální zabezpečení 2026",
    url: "https://www.cssz.cz/placeni-pojistneho-snadne-a-prehledne",
    verifiedOn: "2026-05-04",
  },
  {
    id: "cssz-social-maximum-2026",
    label: "ČSSZ: maximální vyměřovací základ 2026",
    url: "https://www.cssz.cz/maximalni-vymerovaci-zaklad",
    verifiedOn: "2026-05-04",
  },
  {
    id: "vzp-health-insurance-2026",
    label: "VZP: výpočet zdravotního pojistného",
    url: "https://www.vzp.cz/platci/informace/zamestnavatel/vymerovaci-zaklad-a-vypocet-pojistneho/vypocet-pojistneho",
    verifiedOn: "2026-05-04",
  },
  {
    id: "mpsv-dpp-participation-2026",
    label: "MPSV: nemocenské pojištění a DPP 2026",
    url: "https://mpsv.gov.cz/nemocenske-pojisteni",
    verifiedOn: "2026-05-04",
  },
  {
    id: "mpsv-travel-meals-2026",
    label: "MPSV: cestovní náhrady 2026",
    url: "https://ppropo.mpsv.cz/Vyhlaska_573_2025",
    verifiedOn: "2026-05-04",
  },
];

export const PAYROLL_RULES: Record<2026, PayrollRules> = {
  2026: {
    year: 2026,
    validFrom: "2026-01-01",
    validTo: "2026-12-31",
    sourceIds: PAYROLL_SOURCES.map((source) => source.id),
    social: {
      employeeRate: 0.071,
      employeeWorkingPensionerDiscountRate: 0.065,
      employerRates: {
        standard: 0.248,
        risky: 0.278,
        rescue: 0.298,
      },
      annualMaximumAssessmentBase: 2_350_416,
      dppParticipationThreshold: 12_000,
      smallEmploymentThreshold: 4_500,
    },
    health: {
      totalRate: 0.135,
      minimumWage: 22_400,
    },
    tax: {
      standardRate: 0.15,
      highRate: 0.23,
      highMonthlyThreshold: 146_901,
      taxpayerDiscount: 2_570,
      disabilityBasicDiscount: 210,
      disabilityAdvancedDiscount: 420,
      ztpPDiscount: 1_345,
      childCredits: [1_267, 1_860, 2_320],
      monthlyTaxBonusMinimum: 50,
      monthlyTaxBonusIncomeThreshold: 11_200,
    },
    benefits: {
      mealAllowanceExemptLimit: 129.5,
    },
    labor: {
      minimumMonthlyWage: 22_400,
      minimumHourlyWage: 134.4,
      remoteWorkHourlyAllowance: 4.7,
    },
  },
};

export const PAYROLL_2026 = PAYROLL_RULES[2026];

const roundKoruna = (value: number) => Math.round(value);
const ceilKoruna = (value: number) => Math.ceil(value);
const floorKoruna = (value: number) => Math.floor(value);
const ceilHundreds = (value: number) => Math.ceil(value / 100) * 100;
const clampNumber = (value: number, min = 0, max = Number.POSITIVE_INFINITY) =>
  Number.isFinite(value) ? Math.min(Math.max(value, min), max) : min;
const hasAmount = (value: number) => Math.abs(value) > 0;

function roundAdvanceTaxBase(value: number) {
  if (value <= 0) return 0;
  if (value <= 100) return ceilKoruna(value);
  return ceilHundreds(value);
}

export function getPayrollRules(year: 2026 = 2026) {
  return PAYROLL_RULES[year];
}

export function createDefaultPayrollInput(overrides: DeepPartial<PayrollInput> = {}): PayrollInput {
  const rules = getPayrollRules();
  const base: PayrollInput = {
    calculation: {
      mode: "netToGross",
      amount: 30_000,
    },
    employment: {
      type: "hpp",
      dpcRegime: "smallScope",
      employerSocialProfile: "standard",
      otherAgreementIncomeSamePayer: 0,
    },
    taxpayer: {
      signedDeclaration: true,
      childrenCount: 0,
      ztpPChildrenCount: 0,
      disability: "none",
      ztpP: false,
      workingPensioner: false,
      hasExecution: false,
      hasInsolvency: false,
      hasSickLeave: false,
      hasMultipleEmployers: false,
      isForeignTaxResident: false,
    },
    income: {
      rewardAmount: 0,
      personalBonusAmount: 0,
      otherTaxableIncomeAmount: 0,
      averageHourlyWage: rules.labor.minimumMonthlyWage / 168,
      overtimeHours: 0,
      nightHours: 0,
      weekendHours: 0,
      holidayHours: 0,
      hardshipHours: 0,
      hardshipRate: 10,
    },
    benefits: {
      mealAllowance: {
        enabled: false,
        eligibleShifts: 21,
        amountPerShift: rules.benefits.mealAllowanceExemptLimit,
        includeInNet: false,
        travelMealEntitlement: false,
      },
    },
    insurance: {
      healthMinimumMode: "full",
      healthMinimumDays: 30,
      daysInMonth: 30,
    },
    yearToDate: {
      socialAssessmentBaseBeforeMonth: 0,
    },
  };

  return {
    calculation: { ...base.calculation, ...overrides.calculation },
    employment: { ...base.employment, ...overrides.employment },
    taxpayer: { ...base.taxpayer, ...overrides.taxpayer },
    income: { ...base.income, ...overrides.income },
    benefits: {
      mealAllowance: {
        ...base.benefits.mealAllowance,
        ...overrides.benefits?.mealAllowance,
      },
    },
    insurance: { ...base.insurance, ...overrides.insurance },
    yearToDate: { ...base.yearToDate, ...overrides.yearToDate },
  };
}

function normalizeInput(input: PayrollInput): PayrollInput {
  const normalized = createDefaultPayrollInput(input);
  const childrenCount = Math.floor(clampNumber(normalized.taxpayer.childrenCount));
  const ztpPChildrenCount = Math.floor(clampNumber(normalized.taxpayer.ztpPChildrenCount, 0, childrenCount));
  const daysInMonth = Math.max(1, Math.floor(clampNumber(normalized.insurance.daysInMonth, 1, 31)));

  return {
    ...normalized,
    calculation: {
      mode: normalized.calculation.mode,
      amount: roundKoruna(clampNumber(normalized.calculation.amount)),
    },
    employment: {
      ...normalized.employment,
      otherAgreementIncomeSamePayer: roundKoruna(clampNumber(normalized.employment.otherAgreementIncomeSamePayer)),
    },
    taxpayer: {
      ...normalized.taxpayer,
      childrenCount,
      ztpPChildrenCount,
    },
    income: {
      rewardAmount: roundKoruna(clampNumber(normalized.income.rewardAmount)),
      personalBonusAmount: roundKoruna(clampNumber(normalized.income.personalBonusAmount)),
      otherTaxableIncomeAmount: roundKoruna(clampNumber(normalized.income.otherTaxableIncomeAmount)),
      averageHourlyWage: clampNumber(normalized.income.averageHourlyWage),
      overtimeHours: clampNumber(normalized.income.overtimeHours),
      nightHours: clampNumber(normalized.income.nightHours),
      weekendHours: clampNumber(normalized.income.weekendHours),
      holidayHours: clampNumber(normalized.income.holidayHours),
      hardshipHours: clampNumber(normalized.income.hardshipHours),
      hardshipRate: clampNumber(normalized.income.hardshipRate),
    },
    benefits: {
      mealAllowance: {
        enabled: normalized.benefits.mealAllowance.enabled,
        eligibleShifts: Math.floor(clampNumber(normalized.benefits.mealAllowance.eligibleShifts)),
        amountPerShift: clampNumber(normalized.benefits.mealAllowance.amountPerShift),
        includeInNet: normalized.benefits.mealAllowance.includeInNet,
        travelMealEntitlement: normalized.benefits.mealAllowance.travelMealEntitlement,
      },
    },
    insurance: {
      healthMinimumMode: normalized.insurance.healthMinimumMode,
      healthMinimumDays: Math.floor(clampNumber(normalized.insurance.healthMinimumDays, 0, daysInMonth)),
      daysInMonth,
    },
    yearToDate: {
      socialAssessmentBaseBeforeMonth: roundKoruna(clampNumber(normalized.yearToDate.socialAssessmentBaseBeforeMonth)),
    },
  };
}

export function childTaxCredit(childrenCount: number, ztpPChildrenCount = 0, rules = getPayrollRules()) {
  const count = Math.floor(clampNumber(childrenCount));
  let ztpRemaining = Math.floor(clampNumber(ztpPChildrenCount, 0, count));
  let total = 0;

  for (let index = count - 1; index >= 0; index -= 1) {
    const baseCredit = rules.tax.childCredits[Math.min(index, rules.tax.childCredits.length - 1)] ?? 0;
    const isZtpP = ztpRemaining > 0;
    total += isZtpP ? baseCredit * 2 : baseCredit;
    if (isZtpP) ztpRemaining -= 1;
  }

  return total;
}

export function resolveInsuranceParticipation(
  input: PayrollInput,
  taxableIncome: number,
  rules = getPayrollRules(),
): InsuranceParticipation {
  const thresholdIncome = roundKoruna(taxableIncome + clampNumber(input.employment.otherAgreementIncomeSamePayer));

  if (input.employment.type === "hpp") {
    return {
      social: true,
      health: true,
      thresholdIncome,
      reason: "Pracovní poměr zakládá účast na pojistném.",
    };
  }

  if (input.employment.type === "dpp") {
    const applies = thresholdIncome >= rules.social.dppParticipationThreshold;
    return {
      social: applies,
      health: applies,
      thresholdIncome,
      reason: applies
        ? "DPP dosáhla rozhodné částky 12 000 Kč u stejného plátce."
        : "DPP nedosáhla rozhodné částky 12 000 Kč u stejného plátce.",
    };
  }

  if (input.employment.dpcRegime === "standard") {
    return {
      social: true,
      health: true,
      thresholdIncome,
      reason: "DPČ mimo režim zaměstnání malého rozsahu je v kalkulačce brána jako pojištěná.",
    };
  }

  const applies = thresholdIncome >= rules.social.smallEmploymentThreshold;
  return {
    social: applies,
    health: applies,
    thresholdIncome,
    reason: applies
      ? "DPČ v režimu zaměstnání malého rozsahu dosáhla rozhodného příjmu 4 500 Kč."
      : "DPČ v režimu zaměstnání malého rozsahu nedosáhla rozhodného příjmu 4 500 Kč.",
  };
}

function calculateSupplements(input: PayrollInput) {
  const averageHourlyWage = clampNumber(input.income.averageHourlyWage);
  const overtimeSupplement =
    input.employment.type === "hpp" ? roundKoruna(averageHourlyWage * input.income.overtimeHours * 0.25) : 0;
  const nightSupplement = roundKoruna(averageHourlyWage * input.income.nightHours * 0.1);
  const weekendSupplement = roundKoruna(averageHourlyWage * input.income.weekendHours * 0.1);
  const holidaySupplement = roundKoruna(averageHourlyWage * input.income.holidayHours);
  const hardshipSupplement = roundKoruna(
    averageHourlyWage * input.income.hardshipHours * (input.income.hardshipRate / 100),
  );
  const supplementsTotal =
    overtimeSupplement + nightSupplement + weekendSupplement + holidaySupplement + hardshipSupplement;

  return {
    overtimeSupplement,
    nightSupplement,
    weekendSupplement,
    holidaySupplement,
    hardshipSupplement,
    supplementsTotal,
  };
}

export function calculateMealAllowance(input: PayrollInput, rules = getPayrollRules()) {
  if (!input.benefits.mealAllowance.enabled) {
    return {
      mealAllowanceTotal: 0,
      exemptMealAllowance: 0,
      taxableMealAllowance: 0,
      warning: undefined as PayrollWarning | undefined,
    };
  }

  const shifts = input.benefits.mealAllowance.eligibleShifts;
  const amountPerShift = input.benefits.mealAllowance.amountPerShift;
  const mealAllowanceTotal = roundKoruna(shifts * amountPerShift);
  const exemptLimit = input.benefits.mealAllowance.travelMealEntitlement
    ? 0
    : rules.benefits.mealAllowanceExemptLimit;
  const exemptMealAllowance = roundKoruna(shifts * Math.min(amountPerShift, exemptLimit));
  const taxableMealAllowance = Math.max(0, mealAllowanceTotal - exemptMealAllowance);
  const warning = input.benefits.mealAllowance.travelMealEntitlement
    ? {
        code: "meal-travel-entitlement",
        severity: "warning" as const,
        message:
          "U směn s nárokem na cestovní stravné není peněžitý příspěvek na stravování v kalkulačce osvobozen.",
      }
    : undefined;

  return { mealAllowanceTotal, exemptMealAllowance, taxableMealAllowance, warning };
}

export function calculateSocialInsurance(
  input: PayrollInput,
  taxableIncome: number,
  participation: InsuranceParticipation,
  rules = getPayrollRules(),
) {
  const remainingSocialAssessmentBase = Math.max(
    0,
    rules.social.annualMaximumAssessmentBase - input.yearToDate.socialAssessmentBaseBeforeMonth,
  );
  const socialAssessmentBase = participation.social
    ? Math.min(roundKoruna(taxableIncome), remainingSocialAssessmentBase)
    : 0;
  const employeeSocialBeforeDiscount = participation.social
    ? ceilKoruna(socialAssessmentBase * rules.social.employeeRate)
    : 0;
  const employeeSocialDiscount =
    participation.social && input.taxpayer.workingPensioner
      ? Math.min(
          employeeSocialBeforeDiscount,
          ceilKoruna(socialAssessmentBase * rules.social.employeeWorkingPensionerDiscountRate),
        )
      : 0;
  const employeeSocial = Math.max(0, employeeSocialBeforeDiscount - employeeSocialDiscount);
  const employerSocial = participation.social
    ? ceilKoruna(socialAssessmentBase * rules.social.employerRates[input.employment.employerSocialProfile])
    : 0;

  return {
    socialAssessmentBase,
    remainingSocialAssessmentBase,
    employeeSocialBeforeDiscount,
    employeeSocialDiscount,
    employeeSocial,
    employerSocial,
  };
}

export function calculateHealthInsurance(
  input: PayrollInput,
  taxableIncome: number,
  participation: InsuranceParticipation,
  rules = getPayrollRules(),
) {
  if (!participation.health) {
    return {
      healthAssessmentBase: 0,
      healthMinimumBase: 0,
      employeeHealth: 0,
      employerHealth: 0,
    };
  }

  const actualBase = roundKoruna(taxableIncome);
  const proratedMinimum = (rules.health.minimumWage * input.insurance.healthMinimumDays) / input.insurance.daysInMonth;
  const minimumBase =
    input.insurance.healthMinimumMode === "full"
      ? rules.health.minimumWage
      : input.insurance.healthMinimumMode === "prorated"
        ? proratedMinimum
        : 0;
  const healthAssessmentBase = roundKoruna(Math.max(actualBase, minimumBase));
  const totalHealth = ceilKoruna(healthAssessmentBase * rules.health.totalRate);
  const employeeHealth = ceilKoruna(totalHealth / 3);
  const employerHealth = totalHealth - employeeHealth;

  return {
    healthAssessmentBase,
    healthMinimumBase: roundKoruna(minimumBase),
    employeeHealth,
    employerHealth,
  };
}

export function calculateTax(
  input: PayrollInput,
  taxableIncome: number,
  participation: InsuranceParticipation,
  rules = getPayrollRules(),
) {
  const withholdingTax =
    !input.taxpayer.signedDeclaration &&
    ((input.employment.type === "dpp" && participation.thresholdIncome < rules.social.dppParticipationThreshold) ||
      (input.employment.type === "dpc" &&
        input.employment.dpcRegime === "smallScope" &&
        participation.thresholdIncome < rules.social.smallEmploymentThreshold));
  const taxBase = withholdingTax ? floorKoruna(taxableIncome) : roundAdvanceTaxBase(taxableIncome);
  const taxBeforeDiscounts = withholdingTax
    ? floorKoruna(taxBase * rules.tax.standardRate)
    : ceilKoruna(
        Math.min(taxBase, rules.tax.highMonthlyThreshold) * rules.tax.standardRate +
          Math.max(0, taxBase - rules.tax.highMonthlyThreshold) * rules.tax.highRate,
      );
  const discountsAllowed = input.taxpayer.signedDeclaration && !withholdingTax;
  const taxpayerDiscount = discountsAllowed ? rules.tax.taxpayerDiscount : 0;
  const disabilityDiscount =
    discountsAllowed && input.taxpayer.disability === "basic"
      ? rules.tax.disabilityBasicDiscount
      : discountsAllowed && input.taxpayer.disability === "advanced"
        ? rules.tax.disabilityAdvancedDiscount
        : 0;
  const ztpPDiscount = discountsAllowed && input.taxpayer.ztpP ? rules.tax.ztpPDiscount : 0;
  const otherTaxDiscounts = disabilityDiscount + ztpPDiscount;
  const childCredit = discountsAllowed
    ? childTaxCredit(input.taxpayer.childrenCount, input.taxpayer.ztpPChildrenCount, rules)
    : 0;
  const taxAfterPersonalDiscounts = Math.max(0, taxBeforeDiscounts - taxpayerDiscount - otherTaxDiscounts);
  const taxAfterDiscounts = Math.max(0, taxAfterPersonalDiscounts - childCredit);
  const potentialTaxBonus = Math.max(0, childCredit - taxAfterPersonalDiscounts);
  const taxBonusEligible =
    potentialTaxBonus >= rules.tax.monthlyTaxBonusMinimum &&
    taxableIncome >= rules.tax.monthlyTaxBonusIncomeThreshold;
  const taxBonus = taxBonusEligible ? potentialTaxBonus : 0;

  return {
    taxMode: withholdingTax ? ("withholding" as const) : ("advance" as const),
    taxBase,
    taxBeforeDiscounts,
    taxpayerDiscount,
    otherTaxDiscounts,
    childTaxCredit: childCredit,
    taxAfterDiscounts,
    taxBonus,
    unusedTaxBonus: potentialTaxBonus - taxBonus,
  };
}

function buildWarnings(input: PayrollInput, result: Pick<PayrollResult, "taxableIncome" | "socialAssessmentBase">) {
  const warnings: PayrollWarning[] = [];

  if (input.taxpayer.hasExecution) {
    warnings.push({
      code: "execution-unsupported",
      severity: "unsupported",
      message: "Exekuce a soudní srážky nejsou ve v1 počítané. Výsledek je před srážkami.",
    });
  }

  if (input.taxpayer.hasInsolvency) {
    warnings.push({
      code: "insolvency-unsupported",
      severity: "unsupported",
      message: "Insolvence není ve v1 počítaná. Výsledek je před insolvenční srážkou.",
    });
  }

  if (input.taxpayer.hasSickLeave) {
    warnings.push({
      code: "sick-leave-unsupported",
      severity: "unsupported",
      message: "Nemocenská a náhrada mzdy za nemoc nejsou ve v1 počítané.",
    });
  }

  if (input.taxpayer.hasMultipleEmployers) {
    warnings.push({
      code: "multiple-employers",
      severity: "warning",
      message:
        "Souběh více zaměstnavatelů může změnit roční daňové povinnosti, sociální maximum a nárok na slevy.",
    });
  }

  if (input.taxpayer.isForeignTaxResident) {
    warnings.push({
      code: "foreign-tax-resident",
      severity: "warning",
      message: "Daňový nerezident může mít omezené měsíční slevy. Kalkulačka počítá běžný český režim.",
    });
  }

  if (input.yearToDate.socialAssessmentBaseBeforeMonth > 0 && result.socialAssessmentBase < result.taxableIncome) {
    warnings.push({
      code: "social-cap-used",
      severity: "info",
      message: "Sociální pojištění je omezené zadaným ročním maximálním vyměřovacím základem.",
    });
  }

  if (input.employment.type !== "hpp" && input.income.overtimeHours > 0) {
    warnings.push({
      code: "agreement-overtime-ignored",
      severity: "info",
      message: "Přesčasový příplatek kalkulačka počítá jen pro HPP; u DPP/DPČ je ignorovaný.",
    });
  }

  return warnings;
}

function buildAssumptions(input: PayrollInput, rules: PayrollRules): PayrollAssumption[] {
  const assumptions: PayrollAssumption[] = [
    { label: "Rok pravidel", value: String(rules.year) },
    { label: "Zaokrouhlování", value: "Daň a pojistné jsou zaokrouhlovány na celé Kč nahoru podle typu odvodu." },
    { label: "Stravenkový paušál", value: "Osvobození se počítá jen pro směny bez nároku na cestovní stravné." },
  ];

  if (input.taxpayer.ztpPChildrenCount > 0) {
    assumptions.push({
      label: "Děti ZTP/P",
      value: "ZTP/P zvýhodnění se při souhrnném zadání přiřazuje od nejvyššího pořadí dítěte.",
    });
  }

  return assumptions;
}

function makeLine(label: string, amount: number, tone?: PayrollLine["tone"], kind?: PayrollLine["kind"]): PayrollLine {
  return { label, amount, tone, kind };
}

export function grossToNet(input: PayrollInput, context: PayrollCalculationContext = {}): PayrollResult {
  const rules = context.rules ?? getPayrollRules();
  const normalized = normalizeInput(input);
  const baseGrossWage = roundKoruna(clampNumber(context.baseGrossWage ?? normalized.calculation.amount));
  const supplements = calculateSupplements(normalized);
  const rewardAmount = normalized.income.rewardAmount;
  const personalBonusAmount = normalized.income.personalBonusAmount;
  const otherTaxableIncomeAmount = normalized.income.otherTaxableIncomeAmount;
  const cashExtras = rewardAmount + personalBonusAmount + otherTaxableIncomeAmount + supplements.supplementsTotal;
  const grossWage = baseGrossWage + cashExtras;
  const meal = calculateMealAllowance(normalized, rules);
  const taxableIncome = grossWage + meal.taxableMealAllowance;
  const insuranceParticipation = resolveInsuranceParticipation(normalized, taxableIncome, rules);
  const social = calculateSocialInsurance(normalized, taxableIncome, insuranceParticipation, rules);
  const health = calculateHealthInsurance(normalized, taxableIncome, insuranceParticipation, rules);
  const tax = calculateTax(normalized, taxableIncome, insuranceParticipation, rules);
  const netWage =
    grossWage -
    social.employeeSocial -
    health.employeeHealth -
    tax.taxAfterDiscounts +
    tax.taxBonus;
  const netCash = netWage + (normalized.benefits.mealAllowance.includeInNet ? meal.mealAllowanceTotal : 0);
  const employerCost = grossWage + meal.mealAllowanceTotal + social.employerSocial + health.employerHealth;
  const warnings = buildWarnings(normalized, { taxableIncome, socialAssessmentBase: social.socialAssessmentBase });

  if (meal.warning) warnings.push(meal.warning);

  if (netCash < 0) {
    warnings.push({
      code: "negative-net-cash",
      severity: "warning",
      message:
        "Výsledek vychází záporně, typicky kvůli zdravotnímu minimu nebo slevám mimo běžnou mzdovou situaci.",
    });
  }

  if (tax.unusedTaxBonus > 0) {
    warnings.push({
      code: "tax-bonus-not-paid",
      severity: "info",
      message:
        "Vznikl potenciální daňový bonus, ale nesplnil měsíční minimum nebo příjmový limit pro výplatu v měsíci.",
    });
  }

  const actualAmount = normalized.calculation.mode === "netToGross" ? netCash : netCash;
  const targetAmount = context.requestedAmount ?? normalized.calculation.amount;
  const difference = actualAmount - targetAmount;
  const solverStatus = context.solverStatus ?? "not-run";
  const accuracy: PayrollAccuracy = {
    targetAmount,
    actualAmount,
    difference,
    solverStatus,
  };

  if (solverStatus === "approximate") {
    warnings.push({
      code: "net-solver-approximate",
      severity: "info",
      message: `Čistá mzda se kvůli zaokrouhlení liší od cíle o ${Math.abs(difference)} Kč.`,
    });
  }

  if (solverStatus === "bounded") {
    warnings.push({
      code: "net-solver-bounded",
      severity: "warning",
      message: "Cílovou čistou mzdu se nepodařilo dosáhnout v bezpečném intervalu výpočtu.",
    });
  }

  const lines: PayrollLine[] = [
    makeLine("Základní hrubá mzda", baseGrossWage, "strong", "income"),
    ...(hasAmount(rewardAmount) ? [makeLine("Odměna / prémie", rewardAmount, "positive", "income")] : []),
    ...(hasAmount(personalBonusAmount)
      ? [makeLine("Osobní ohodnocení", personalBonusAmount, "positive", "income")]
      : []),
    ...(hasAmount(otherTaxableIncomeAmount)
      ? [makeLine("Jiný zdanitelný příjem", otherTaxableIncomeAmount, "positive", "income")]
      : []),
    ...(hasAmount(supplements.overtimeSupplement)
      ? [makeLine("Příplatek za přesčas", supplements.overtimeSupplement, "positive", "income")]
      : []),
    ...(hasAmount(supplements.nightSupplement)
      ? [makeLine("Příplatek za noc", supplements.nightSupplement, "positive", "income")]
      : []),
    ...(hasAmount(supplements.weekendSupplement)
      ? [makeLine("Příplatek za víkend", supplements.weekendSupplement, "positive", "income")]
      : []),
    ...(hasAmount(supplements.holidaySupplement)
      ? [makeLine("Příplatek za svátek", supplements.holidaySupplement, "positive", "income")]
      : []),
    ...(hasAmount(supplements.hardshipSupplement)
      ? [makeLine("Příplatek za ztížené prostředí", supplements.hardshipSupplement, "positive", "income")]
      : []),
    makeLine("Hrubá mzda celkem", grossWage, "strong", "summary"),
    ...(normalized.benefits.mealAllowance.enabled
      ? [
          makeLine("Peněžitý příspěvek na stravování celkem", meal.mealAllowanceTotal, "positive", "benefit"),
          makeLine("Osvobozená část příspěvku na stravování", meal.exemptMealAllowance, "positive", "benefit"),
          makeLine("Zdanitelná část příspěvku na stravování", meal.taxableMealAllowance, "normal", "benefit"),
        ]
      : []),
    makeLine("Základ pro daň a pojistné", taxableIncome, "normal", "summary"),
    makeLine("Vyměřovací základ pro sociální pojištění", social.socialAssessmentBase, "normal", "insurance"),
    makeLine("Sociální pojištění zaměstnance před slevou", -social.employeeSocialBeforeDiscount, "negative", "insurance"),
    ...(hasAmount(social.employeeSocialDiscount)
      ? [makeLine("Sleva na sociálním pojistném zaměstnance", social.employeeSocialDiscount, "positive", "insurance")]
      : []),
    makeLine("Sociální pojištění zaměstnance", -social.employeeSocial, "negative", "insurance"),
    makeLine("Vyměřovací základ pro zdravotní pojištění", health.healthAssessmentBase, "normal", "insurance"),
    makeLine("Zdravotní pojištění zaměstnance", -health.employeeHealth, "negative", "insurance"),
    makeLine(tax.taxMode === "withholding" ? "Srážková daň" : "Záloha na daň před slevami", -tax.taxBeforeDiscounts, "negative", "tax"),
    makeLine("Sleva na poplatníka", tax.taxpayerDiscount, "positive", "tax"),
    ...(hasAmount(tax.otherTaxDiscounts)
      ? [makeLine("Ostatní měsíční slevy na dani", tax.otherTaxDiscounts, "positive", "tax")]
      : []),
    makeLine("Daňové zvýhodnění na děti", tax.childTaxCredit, "positive", "tax"),
    makeLine("Daň po slevách", -tax.taxAfterDiscounts, "negative", "tax"),
    makeLine("Daňový bonus", tax.taxBonus, "positive", "tax"),
    makeLine("Čistá mzda", netWage, "strong", "summary"),
    ...(normalized.benefits.mealAllowance.enabled && normalized.benefits.mealAllowance.includeInNet
      ? [makeLine("Čistý příjem včetně příspěvku na stravování", netCash, "strong", "summary")]
      : []),
    makeLine("Sociální pojištění zaměstnavatele", social.employerSocial, "normal", "insurance"),
    makeLine("Zdravotní pojištění zaměstnavatele", health.employerHealth, "normal", "insurance"),
    makeLine("Náklady zaměstnavatele celkem", employerCost, "strong", "summary"),
  ];

  const unsupportedReasons = warnings
    .filter((warning) => warning.severity === "unsupported")
    .map((warning) => warning.message);

  return {
    requestedAmount: targetAmount,
    baseGrossWage,
    grossWage,
    rewardAmount,
    personalBonusAmount,
    otherTaxableIncomeAmount,
    ...supplements,
    cashExtras,
    taxableMealAllowance: meal.taxableMealAllowance,
    exemptMealAllowance: meal.exemptMealAllowance,
    mealAllowanceTotal: meal.mealAllowanceTotal,
    taxableIncome,
    socialAssessmentBase: social.socialAssessmentBase,
    remainingSocialAssessmentBase: social.remainingSocialAssessmentBase,
    employeeSocialBeforeDiscount: social.employeeSocialBeforeDiscount,
    employeeSocialDiscount: social.employeeSocialDiscount,
    employeeSocial: social.employeeSocial,
    healthAssessmentBase: health.healthAssessmentBase,
    healthMinimumBase: health.healthMinimumBase,
    employeeHealth: health.employeeHealth,
    employerSocial: social.employerSocial,
    employerHealth: health.employerHealth,
    taxBase: tax.taxBase,
    taxBeforeDiscounts: tax.taxBeforeDiscounts,
    taxpayerDiscount: tax.taxpayerDiscount,
    otherTaxDiscounts: tax.otherTaxDiscounts,
    childTaxCredit: tax.childTaxCredit,
    taxAfterDiscounts: tax.taxAfterDiscounts,
    taxBonus: tax.taxBonus,
    unusedTaxBonus: tax.unusedTaxBonus,
    netWage,
    netCash,
    employerCost,
    insuranceApplies: insuranceParticipation.social || insuranceParticipation.health,
    taxMode: tax.taxMode,
    insuranceParticipation,
    warnings,
    unsupportedReasons,
    assumptions: buildAssumptions(normalized, rules),
    sources: PAYROLL_SOURCES.filter((source) => rules.sourceIds.includes(source.id)),
    accuracy,
    lines,
    rows: lines,
  };
}

export function solveGrossForTargetNet(input: PayrollInput, rules = getPayrollRules()): PayrollResult {
  const normalized = normalizeInput(input);
  const targetNet = normalized.calculation.amount;
  let low = 0;
  let high = Math.max(10_000, targetNet * 3 + 50_000);
  let best = grossToNet(normalized, {
    rules,
    baseGrossWage: high,
    requestedAmount: targetNet,
    solverStatus: "bounded",
  });

  while (best.netCash < targetNet && high < 5_000_000) {
    high *= 2;
    best = grossToNet(normalized, {
      rules,
      baseGrossWage: high,
      requestedAmount: targetNet,
      solverStatus: "bounded",
    });
  }

  if (best.netCash < targetNet) {
    return best;
  }

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const result = grossToNet(normalized, {
      rules,
      baseGrossWage: mid,
      requestedAmount: targetNet,
      solverStatus: "approximate",
    });

    if (result.netCash >= targetNet) {
      best = result;
      high = mid - 1;
    } else {
      low = mid + 1;
    }
  }

  const difference = best.netCash - targetNet;
  const solverStatus: SolverStatus = difference === 0 ? "exact" : Math.abs(difference) <= 1 ? "approximate" : "bounded";

  return grossToNet(normalized, {
    rules,
    baseGrossWage: best.baseGrossWage,
    requestedAmount: targetNet,
    solverStatus,
  });
}

export function netToGross(input: PayrollInput, rules = getPayrollRules()): PayrollResult {
  return solveGrossForTargetNet(input, rules);
}

export function calculatePayroll(input: PayrollInput): PayrollResult {
  const normalized = normalizeInput(input);

  if (normalized.calculation.mode === "grossToNet") {
    return grossToNet(normalized, {
      requestedAmount: normalized.calculation.amount,
      solverStatus: "not-run",
    });
  }

  return solveGrossForTargetNet(normalized);
}
