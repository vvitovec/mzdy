"use client";

import {
  AlertTriangle,
  Baby,
  Calculator,
  ChevronDown,
  CircleHelp,
  Clock3,
  Gift,
  Info,
  Plus,
  ReceiptText,
  RotateCcw,
  ShieldCheck,
  Utensils,
  WalletCards,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  calculatePayroll,
  createDefaultPayrollInput,
  type BaseWageMode,
  type CalculationMode,
  type DisabilityDiscount,
  type DpcRegime,
  type EmployerSocialProfile,
  type EmploymentType,
  type HealthMinimumMode,
  type PayrollInput,
  PAYROLL_2026,
} from "@/lib/payroll";

type FieldProps = {
  label: string;
  suffix?: string;
  compact?: boolean;
  children: React.ReactNode;
};

const currency = new Intl.NumberFormat("cs-CZ", {
  maximumFractionDigits: 0,
  style: "currency",
  currency: "CZK",
});

const decimalCurrency = new Intl.NumberFormat("cs-CZ", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  style: "currency",
  currency: "CZK",
});

const hours = new Intl.NumberFormat("cs-CZ", {
  maximumFractionDigits: 2,
});

const employmentLabels: Record<EmploymentType, string> = {
  hpp: "HPP",
  dpp: "DPP",
  dpc: "DPČ",
};

const employerProfileLabels: Record<EmployerSocialProfile, string> = {
  standard: "Běžná sazba",
  risky: "Rizikové zaměstnání",
  rescue: "ZZS / hasiči podniku",
};

const healthMinimumLabels: Record<HealthMinimumMode, string> = {
  full: "Plné minimum",
  prorated: "Poměrná část",
  exempt: "Bez minima",
};

const defaultInput = createDefaultPayrollInput();

function formatAmount(value: number) {
  return currency.format(Math.round(value));
}

function formatHourlyRate(value: number) {
  return `${decimalCurrency.format(value)}/h`;
}

function formatHours(value: number) {
  return hours.format(value);
}

function Field({ label, suffix, compact, children }: FieldProps) {
  return (
    <label className={compact ? "field compact" : "field"}>
      <span className="field-label">{label}</span>
      <span className="field-control">
        {children}
        {suffix ? <span className="field-suffix">{suffix}</span> : null}
      </span>
    </label>
  );
}

function clampInputNumber(value: number, min = 0) {
  return Number.isFinite(value) ? Math.max(min, value) : min;
}

export function PayrollCalculator() {
  const [input, setInput] = useState<PayrollInput>(defaultInput);
  const [expertMode, setExpertMode] = useState(false);
  const [extrasOpen, setExtrasOpen] = useState(false);
  const result = useMemo(() => calculatePayroll(input), [input]);
  const employeeDeductions = result.employeeSocial + result.employeeHealth + result.taxAfterDiscounts - result.taxBonus;
  const employerInsurance = result.employerSocial + result.employerHealth;
  const hourlyNetTarget = input.calculation.mode === "netToGross" && input.income.baseWageMode === "hourly";
  const primaryResult = hourlyNetTarget ? result.hourlyRate : input.calculation.mode === "netToGross" ? result.grossWage : result.netCash;
  const primaryLabel = hourlyNetTarget
    ? "Hodinová sazba"
    : input.calculation.mode === "netToGross"
      ? "Hrubá mzda celkem"
      : "Čistý příjem";
  const primaryValue = hourlyNetTarget ? formatHourlyRate(primaryResult) : formatAmount(primaryResult);
  const hourlyGrossInput = input.calculation.mode === "grossToNet" && input.income.baseWageMode === "hourly";
  const amountFieldLabel = hourlyGrossInput
    ? "Hodinová sazba"
    : input.calculation.mode === "netToGross"
      ? "Požadovaný čistý příjem"
      : "Základní hrubá mzda";
  const amountFieldValue = hourlyGrossInput ? input.income.hourlyRate : input.calculation.amount;
  const amountFieldSuffix = hourlyGrossInput ? "Kč/h" : "Kč";
  const wageNote =
    input.income.baseWageMode === "hourly"
      ? input.calculation.mode === "grossToNet"
        ? `Hrubý základ ze sazby: ${formatAmount(result.baseGrossWage)} při ${formatHours(result.workedHours)} h.`
        : `Dopočtená hrubá mzda: ${formatAmount(result.baseGrossWage)} při ${formatHours(result.workedHours)} h.`
      : `Přepočtená hodinová sazba: ${formatHourlyRate(result.hourlyRate)} při ${formatHours(result.workedHours)} h.`;
  const resultCopy =
    input.calculation.mode === "netToGross"
      ? input.income.baseWageMode === "hourly"
        ? `Pro cílový čistý příjem ${formatAmount(input.calculation.amount)} vychází sazba ${formatHourlyRate(result.hourlyRate)} a základní hrubá mzda ${formatAmount(result.baseGrossWage)}.`
        : `Základní hrubá mzda ${formatAmount(result.baseGrossWage)} vychází na ${formatHourlyRate(result.hourlyRate)} při ${formatHours(result.workedHours)} h; čistý výsledek ${formatAmount(result.netCash)}.`
      : input.income.baseWageMode === "hourly"
        ? `Hodinová sazba ${formatHourlyRate(result.hourlyRate)} při ${formatHours(result.workedHours)} h dává základní hrubou mzdu ${formatAmount(result.baseGrossWage)} a čistý příjem ${formatAmount(result.netCash)}.`
        : `Zadaná základní hrubá mzda ${formatAmount(result.baseGrossWage)} vychází na ${formatHourlyRate(result.hourlyRate)} při ${formatHours(result.workedHours)} h a dává čistý příjem ${formatAmount(result.netCash)}.`;
  const hasIncomeExtras =
    input.income.rewardAmount > 0 ||
    input.income.personalBonusAmount > 0 ||
    input.income.otherTaxableIncomeAmount > 0 ||
    input.income.overtimeHours > 0 ||
    input.income.nightHours > 0 ||
    input.income.weekendHours > 0 ||
    input.income.holidayHours > 0 ||
    input.income.hardshipHours > 0;

  const updateCalculation = (patch: Partial<PayrollInput["calculation"]>) => {
    setInput((current) => ({ ...current, calculation: { ...current.calculation, ...patch } }));
  };

  const updateEmployment = (patch: Partial<PayrollInput["employment"]>) => {
    setInput((current) => ({ ...current, employment: { ...current.employment, ...patch } }));
  };

  const updateTaxpayer = (patch: Partial<PayrollInput["taxpayer"]>) => {
    setInput((current) => ({ ...current, taxpayer: { ...current.taxpayer, ...patch } }));
  };

  const updateIncome = (patch: Partial<PayrollInput["income"]>) => {
    setInput((current) => ({ ...current, income: { ...current.income, ...patch } }));
  };

  const updateBaseWageMode = (baseWageMode: BaseWageMode) => {
    setInput((current) => {
      const workedHours = clampInputNumber(current.income.workedHours);
      const currentBaseGrossWage =
        current.income.baseWageMode === "hourly" ? Math.round(current.income.hourlyRate * workedHours) : current.calculation.amount;
      const nextIncome = {
        ...current.income,
        baseWageMode,
        hourlyRate:
          baseWageMode === "hourly" && current.calculation.mode === "grossToNet" && workedHours > 0
            ? currentBaseGrossWage / workedHours
            : current.income.hourlyRate || PAYROLL_2026.labor.minimumHourlyWage,
      };
      const nextCalculation =
        baseWageMode === "monthly" && current.calculation.mode === "grossToNet"
          ? { ...current.calculation, amount: currentBaseGrossWage }
          : current.calculation;

      return { ...current, calculation: nextCalculation, income: nextIncome };
    });
  };

  const updateMealAllowance = (patch: Partial<PayrollInput["benefits"]["mealAllowance"]>) => {
    setInput((current) => ({
      ...current,
      benefits: {
        mealAllowance: {
          ...current.benefits.mealAllowance,
          ...patch,
        },
      },
    }));
  };

  const updateInsurance = (patch: Partial<PayrollInput["insurance"]>) => {
    setInput((current) => ({ ...current, insurance: { ...current.insurance, ...patch } }));
  };

  const updateYearToDate = (patch: Partial<PayrollInput["yearToDate"]>) => {
    setInput((current) => ({ ...current, yearToDate: { ...current.yearToDate, ...patch } }));
  };

  const reset = () => {
    setInput(createDefaultPayrollInput());
    setExpertMode(false);
    setExtrasOpen(false);
  };

  return (
    <main className="app-shell">
      <nav className="topbar">
        <div className="brand-area">
          <div className="brand-mark">
            <Calculator size={20} aria-hidden="true" />
          </div>
          <div>
            <div className="brand">Mzdová kalkulačka</div>
          </div>
        </div>
        <div className="nav-links">
          <a className="credit-chip" href="https://vvitovec.com">
            Další projekty
          </a>
        </div>
      </nav>

      <section className="content">
        <header className="page-heading">
          <div>
            <h1>Mzdová kalkulačka 2026</h1>
          </div>
        </header>

        <div className="calculator-shell">
          <section className="input-pane" aria-label="Vstupy pro výpočet mzdy">
            <div className="pane-heading">
              <div>
                <p className="eyebrow">Vstupy</p>
                <h2>Základ</h2>
              </div>
              <button className="icon-button" type="button" onClick={reset} aria-label="Vrátit výchozí hodnoty">
                <RotateCcw size={17} aria-hidden="true" />
              </button>
            </div>

            <div className="segmented" aria-label="Režim výpočtu">
              {(["netToGross", "grossToNet"] as CalculationMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  className={input.calculation.mode === mode ? "active" : ""}
                  onClick={() => updateCalculation({ mode })}
                >
                  {mode === "netToGross" ? "Čistá → hrubá" : "Hrubá → čistá"}
                </button>
              ))}
            </div>

            <div className="segmented" aria-label="Základ mzdy">
              {(["monthly", "hourly"] as BaseWageMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  className={input.income.baseWageMode === mode ? "active" : ""}
                  onClick={() => updateBaseWageMode(mode)}
                >
                  {mode === "monthly" ? "Měsíčně" : "Hodinově"}
                </button>
              ))}
            </div>

            <div className="form-stack">
              <div className="field-grid">
                <Field label={amountFieldLabel} suffix={amountFieldSuffix}>
                  <input
                    value={amountFieldValue}
                    min={0}
                    step={hourlyGrossInput ? "0.01" : "1"}
                    type="number"
                    inputMode="decimal"
                    onChange={(event) => {
                      const value = clampInputNumber(Number(event.target.value));

                      if (hourlyGrossInput) {
                        updateIncome({ hourlyRate: value });
                      } else {
                        updateCalculation({ amount: value });
                      }
                    }}
                  />
                </Field>
                <Field label={input.income.baseWageMode === "hourly" ? "Odpracované hodiny" : "Hodiny pro sazbu"} suffix="h">
                  <input
                    value={input.income.workedHours}
                    min={0}
                    step="0.5"
                    type="number"
                    inputMode="decimal"
                    onChange={(event) => updateIncome({ workedHours: clampInputNumber(Number(event.target.value)) })}
                  />
                </Field>
              </div>
              <p className="inline-note">{wageNote}</p>

              <div className="field-grid">
                <label className="field">
                  <span className="field-label">Typ vztahu</span>
                  <select
                    value={input.employment.type}
                    onChange={(event) => updateEmployment({ type: event.target.value as EmploymentType })}
                  >
                    <option value="hpp">HPP</option>
                    <option value="dpp">DPP</option>
                    <option value="dpc">DPČ</option>
                  </select>
                </label>
                <Field label="Počet dětí" suffix="dětí">
                  <input
                    value={input.taxpayer.childrenCount}
                    min={0}
                    type="number"
                    inputMode="numeric"
                    onChange={(event) => updateTaxpayer({ childrenCount: clampInputNumber(Number(event.target.value)) })}
                  />
                </Field>
              </div>

              <label className="switch-row">
                <span>Podepsané prohlášení poplatníka</span>
                <input
                  type="checkbox"
                  checked={input.taxpayer.signedDeclaration}
                  onChange={(event) => updateTaxpayer({ signedDeclaration: event.target.checked })}
                />
              </label>

              <label className="switch-row">
                <span>Expertní režim</span>
                <input type="checkbox" checked={expertMode} onChange={(event) => setExpertMode(event.target.checked)} />
              </label>

              <OptionalSection
                icon={<Utensils size={17} aria-hidden="true" />}
                title="Přidat příspěvek na stravování"
                enabled={input.benefits.mealAllowance.enabled}
                onChange={(enabled) => updateMealAllowance({ enabled })}
              >
                <div className="field-grid">
                  <Field label="Příspěvek za směnu" suffix="Kč">
                    <input
                      value={input.benefits.mealAllowance.amountPerShift}
                      min={0}
                      step="0.5"
                      type="number"
                      onChange={(event) => updateMealAllowance({ amountPerShift: clampInputNumber(Number(event.target.value)) })}
                    />
                  </Field>
                  <Field label="Způsobilé směny" suffix="směn">
                    <input
                      value={input.benefits.mealAllowance.eligibleShifts}
                      min={0}
                      type="number"
                      onChange={(event) => updateMealAllowance({ eligibleShifts: clampInputNumber(Number(event.target.value)) })}
                    />
                  </Field>
                </div>
                <label className="switch-row">
                  <span>Započítat příspěvek do čistého příjmu</span>
                  <input
                    type="checkbox"
                    checked={input.benefits.mealAllowance.includeInNet}
                    onChange={(event) => updateMealAllowance({ includeInNet: event.target.checked })}
                  />
                </label>
                {expertMode ? (
                  <label className="switch-row">
                    <span>U směn vzniká nárok na cestovní stravné</span>
                    <input
                      type="checkbox"
                      checked={input.benefits.mealAllowance.travelMealEntitlement}
                      onChange={(event) => updateMealAllowance({ travelMealEntitlement: event.target.checked })}
                    />
                  </label>
                ) : null}
                <p className="inline-note">
                  Osvobozený limit pro rok 2026: {decimalCurrency.format(PAYROLL_2026.benefits.mealAllowanceExemptLimit)} za směnu.
                </p>
              </OptionalSection>

              <OptionalSection
                icon={<Gift size={17} aria-hidden="true" />}
                title="Přidat odměny a příplatky"
                enabled={extrasOpen || hasIncomeExtras}
                onChange={(enabled) => {
                  if (!enabled) {
                    setExtrasOpen(false);
                    updateIncome({
                      rewardAmount: 0,
                      personalBonusAmount: 0,
                      otherTaxableIncomeAmount: 0,
                      overtimeHours: 0,
                      nightHours: 0,
                      weekendHours: 0,
                      holidayHours: 0,
                      hardshipHours: 0,
                    });
                  } else {
                    setExtrasOpen(true);
                    updateIncome({ averageHourlyWage: input.income.averageHourlyWage || result.hourlyRate || PAYROLL_2026.labor.minimumMonthlyWage / 168 });
                  }
                }}
              >
                <div className="field-grid">
                  <Field label="Odměna / prémie" suffix="Kč">
                    <input
                      value={input.income.rewardAmount}
                      min={0}
                      type="number"
                      onChange={(event) => updateIncome({ rewardAmount: clampInputNumber(Number(event.target.value)) })}
                    />
                  </Field>
                  <Field label="Osobní ohodnocení" suffix="Kč">
                    <input
                      value={input.income.personalBonusAmount}
                      min={0}
                      type="number"
                      onChange={(event) => updateIncome({ personalBonusAmount: clampInputNumber(Number(event.target.value)) })}
                    />
                  </Field>
                  <Field label="Jiný zdanitelný příjem" suffix="Kč">
                    <input
                      value={input.income.otherTaxableIncomeAmount}
                      min={0}
                      type="number"
                      onChange={(event) => updateIncome({ otherTaxableIncomeAmount: clampInputNumber(Number(event.target.value)) })}
                    />
                  </Field>
                  <Field label="Průměrný hodinový výdělek" suffix="Kč">
                    <input
                      value={Math.round(input.income.averageHourlyWage)}
                      min={0}
                      type="number"
                      onChange={(event) => updateIncome({ averageHourlyWage: clampInputNumber(Number(event.target.value)) })}
                    />
                  </Field>
                </div>

                <div className="supplement-grid">
                  <Field label="Přesčas 25 %" suffix="h" compact>
                    <input
                      value={input.income.overtimeHours}
                      min={0}
                      step="0.5"
                      type="number"
                      disabled={input.employment.type !== "hpp"}
                      onChange={(event) => updateIncome({ overtimeHours: clampInputNumber(Number(event.target.value)) })}
                    />
                  </Field>
                  <Field label="Noc 10 %" suffix="h" compact>
                    <input
                      value={input.income.nightHours}
                      min={0}
                      step="0.5"
                      type="number"
                      onChange={(event) => updateIncome({ nightHours: clampInputNumber(Number(event.target.value)) })}
                    />
                  </Field>
                  <Field label="Víkend 10 %" suffix="h" compact>
                    <input
                      value={input.income.weekendHours}
                      min={0}
                      step="0.5"
                      type="number"
                      onChange={(event) => updateIncome({ weekendHours: clampInputNumber(Number(event.target.value)) })}
                    />
                  </Field>
                  <Field label="Svátek 100 %" suffix="h" compact>
                    <input
                      value={input.income.holidayHours}
                      min={0}
                      step="0.5"
                      type="number"
                      onChange={(event) => updateIncome({ holidayHours: clampInputNumber(Number(event.target.value)) })}
                    />
                  </Field>
                  <Field label={`Ztížené ${input.income.hardshipRate} %`} suffix="h" compact>
                    <input
                      value={input.income.hardshipHours}
                      min={0}
                      step="0.5"
                      type="number"
                      onChange={(event) => updateIncome({ hardshipHours: clampInputNumber(Number(event.target.value)) })}
                    />
                  </Field>
                  <Field label="Sazba ztíženého" suffix="%" compact>
                    <input
                      value={input.income.hardshipRate}
                      min={0}
                      type="number"
                      onChange={(event) => updateIncome({ hardshipRate: clampInputNumber(Number(event.target.value)) })}
                    />
                  </Field>
                </div>
                {input.employment.type !== "hpp" ? (
                  <p className="inline-note">U DPP/DPČ se přesčasový příplatek v této kalkulačce nezapočítá.</p>
                ) : null}
              </OptionalSection>

              {expertMode ? (
                <section className="optional-section open expert-panel" aria-label="Expertní nastavení">
                  <div className="optional-toggle static">
                    <span>
                      <ShieldCheck size={17} aria-hidden="true" />
                      Expertní nastavení
                    </span>
                  </div>

                  <div className="field-grid">
                    <Field label="Děti ZTP/P" suffix="dětí">
                      <input
                        value={input.taxpayer.ztpPChildrenCount}
                        min={0}
                        max={input.taxpayer.childrenCount}
                        type="number"
                        onChange={(event) => updateTaxpayer({ ztpPChildrenCount: clampInputNumber(Number(event.target.value)) })}
                      />
                    </Field>
                    <label className="field">
                      <span className="field-label">Invalidita</span>
                      <select
                        value={input.taxpayer.disability}
                        onChange={(event) => updateTaxpayer({ disability: event.target.value as DisabilityDiscount })}
                      >
                        <option value="none">Bez slevy</option>
                        <option value="basic">Invalidita I./II. stupně</option>
                        <option value="advanced">Invalidita III. stupně</option>
                      </select>
                    </label>
                    <label className="field">
                      <span className="field-label">DPČ režim</span>
                      <select
                        value={input.employment.dpcRegime}
                        disabled={input.employment.type !== "dpc"}
                        onChange={(event) => updateEmployment({ dpcRegime: event.target.value as DpcRegime })}
                      >
                        <option value="smallScope">Zaměstnání malého rozsahu</option>
                        <option value="standard">Standardní DPČ</option>
                      </select>
                    </label>
                    <Field label="Další dohody u stejného plátce" suffix="Kč">
                      <input
                        value={input.employment.otherAgreementIncomeSamePayer}
                        min={0}
                        type="number"
                        onChange={(event) =>
                          updateEmployment({ otherAgreementIncomeSamePayer: clampInputNumber(Number(event.target.value)) })
                        }
                      />
                    </Field>
                    <label className="field">
                      <span className="field-label">Zdravotní minimum</span>
                      <select
                        value={input.insurance.healthMinimumMode}
                        onChange={(event) => updateInsurance({ healthMinimumMode: event.target.value as HealthMinimumMode })}
                      >
                        {Object.entries(healthMinimumLabels).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <Field label="Dny pro poměrné minimum" suffix="dní">
                      <input
                        value={input.insurance.healthMinimumDays}
                        min={0}
                        max={input.insurance.daysInMonth}
                        type="number"
                        disabled={input.insurance.healthMinimumMode !== "prorated"}
                        onChange={(event) => updateInsurance({ healthMinimumDays: clampInputNumber(Number(event.target.value)) })}
                      />
                    </Field>
                    <Field label="Již dosažený sociální základ v roce" suffix="Kč">
                      <input
                        value={input.yearToDate.socialAssessmentBaseBeforeMonth}
                        min={0}
                        type="number"
                        onChange={(event) =>
                          updateYearToDate({ socialAssessmentBaseBeforeMonth: clampInputNumber(Number(event.target.value)) })
                        }
                      />
                    </Field>
                    <label className="field">
                      <span className="field-label">Sazba zaměstnavatele</span>
                      <select
                        value={input.employment.employerSocialProfile}
                        onChange={(event) =>
                          updateEmployment({ employerSocialProfile: event.target.value as EmployerSocialProfile })
                        }
                      >
                        {Object.entries(employerProfileLabels).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className="check-grid">
                    <label className="switch-row">
                      <span>Poplatník je držitel ZTP/P</span>
                      <input
                        type="checkbox"
                        checked={input.taxpayer.ztpP}
                        onChange={(event) => updateTaxpayer({ ztpP: event.target.checked })}
                      />
                    </label>
                    <label className="switch-row">
                      <span>Pracující starobní důchodce</span>
                      <input
                        type="checkbox"
                        checked={input.taxpayer.workingPensioner}
                        onChange={(event) => updateTaxpayer({ workingPensioner: event.target.checked })}
                      />
                    </label>
                    <label className="switch-row">
                      <span>Exekuce / soudní srážky</span>
                      <input
                        type="checkbox"
                        checked={input.taxpayer.hasExecution}
                        onChange={(event) => updateTaxpayer({ hasExecution: event.target.checked })}
                      />
                    </label>
                    <label className="switch-row">
                      <span>Insolvence</span>
                      <input
                        type="checkbox"
                        checked={input.taxpayer.hasInsolvency}
                        onChange={(event) => updateTaxpayer({ hasInsolvency: event.target.checked })}
                      />
                    </label>
                    <label className="switch-row">
                      <span>Nemoc / náhrada mzdy</span>
                      <input
                        type="checkbox"
                        checked={input.taxpayer.hasSickLeave}
                        onChange={(event) => updateTaxpayer({ hasSickLeave: event.target.checked })}
                      />
                    </label>
                    <label className="switch-row">
                      <span>Souběh více zaměstnavatelů</span>
                      <input
                        type="checkbox"
                        checked={input.taxpayer.hasMultipleEmployers}
                        onChange={(event) => updateTaxpayer({ hasMultipleEmployers: event.target.checked })}
                      />
                    </label>
                    <label className="switch-row">
                      <span>Daňový nerezident ČR</span>
                      <input
                        type="checkbox"
                        checked={input.taxpayer.isForeignTaxResident}
                        onChange={(event) => updateTaxpayer({ isForeignTaxResident: event.target.checked })}
                      />
                    </label>
                  </div>
                </section>
              ) : null}
            </div>
          </section>

          <section className="result-pane" aria-label="Výsledek výpočtu">
            <div className="result-head">
              <div>
                <p className="eyebrow">{input.calculation.mode === "netToGross" ? "Dopočtený výsledek" : "Čistý výstup"}</p>
                <h2>{primaryLabel}</h2>
              </div>
              <span className={result.insuranceApplies ? "status-pill success" : "status-pill"}>
                {result.insuranceApplies ? "pojistné se odvádí" : "bez pojistného"}
              </span>
            </div>

            <div className="result-number">{primaryValue}</div>
            <p className="result-copy">{resultCopy}</p>

            {input.calculation.mode === "netToGross" ? (
              <p className={result.accuracy.solverStatus === "exact" ? "accuracy-note exact" : "accuracy-note"}>
                {result.accuracy.solverStatus === "exact"
                  ? "Cílová čistá mzda sedí přesně."
                  : `Odchylka od cíle: ${formatAmount(result.accuracy.difference)}.`}
              </p>
            ) : null}

            {result.warnings.length > 0 ? (
              <div className="alert-list" role="status" aria-live="polite">
                {result.warnings.map((warning) => (
                  <div key={`${warning.code}-${warning.message}`} className={`alert-row ${warning.severity}`}>
                    <AlertTriangle size={17} aria-hidden="true" />
                    <span>{warning.message}</span>
                  </div>
                ))}
              </div>
            ) : null}

            <div className="summary-list">
              <SummaryRow icon={<WalletCards size={18} />} label="Čistá mzda" value={result.netWage} strong />
              <SummaryRow icon={<Plus size={18} />} label="Hrubá mzda celkem" value={result.grossWage} />
              <SummaryRow
                icon={<Clock3 size={18} />}
                label="Hodinová sazba"
                value={result.hourlyRate}
                displayValue={formatHourlyRate(result.hourlyRate)}
              />
              {result.cashExtras > 0 ? <SummaryRow icon={<Gift size={18} />} label="Odměny a příplatky" value={result.cashExtras} /> : null}
              <SummaryRow
                icon={<ReceiptText size={18} />}
                label={result.taxMode === "withholding" ? "Srážková daň" : "Daň po slevách"}
                value={result.taxAfterDiscounts}
              />
              <SummaryRow icon={<CircleHelp size={18} />} label="Srážky zaměstnance" value={employeeDeductions} />
              <SummaryRow icon={<Calculator size={18} />} label="Náklady zaměstnavatele" value={result.employerCost} strong />
              {input.benefits.mealAllowance.enabled ? (
                <>
                  <SummaryRow icon={<Utensils size={18} />} label="Příspěvek na stravování" value={result.mealAllowanceTotal} />
                  <SummaryRow icon={<Utensils size={18} />} label="Osvobozená část" value={result.exemptMealAllowance} />
                </>
              ) : null}
              {input.taxpayer.childrenCount > 0 || result.childTaxCredit + result.taxBonus > 0 ? (
                <SummaryRow icon={<Baby size={18} />} label="Děti a daňový bonus" value={result.childTaxCredit + result.taxBonus} />
              ) : null}
              <SummaryRow icon={<ChevronDown size={18} />} label="Odvody zaměstnavatele" value={employerInsurance} />
            </div>

            <div className="breakdown">
              <div className="breakdown-heading">
                <div>
                  <p className="eyebrow">Rozpad</p>
                  <h2>Výpočet mzdy</h2>
                </div>
                <span>
                  {employmentLabels[input.employment.type]} · {result.taxMode === "withholding" ? "srážková" : "zálohová"} daň
                </span>
              </div>

              <div className="breakdown-list">
                {result.lines.map((row) => (
                  <div key={`${row.label}-${row.amount}`} className={row.tone ? `breakdown-row row-${row.tone}` : "breakdown-row"}>
                    <span>{row.label}</span>
                    <strong>{row.amount < 0 ? `-${formatAmount(Math.abs(row.amount))}` : formatAmount(row.amount)}</strong>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        <section className="methodology" aria-label="Metodika výpočtu">
          <div className="methodology-head">
            <div>
              <p className="eyebrow">Metodika</p>
              <h2>Rozsah výpočtu</h2>
            </div>
            <span className="status-pill">ověřeno 4. 5. 2026</span>
          </div>
          <div className="methodology-grid">
            <div>
              <h3>Počítá</h3>
              <p>
                HPP, DPP a DPČ, zálohovou i srážkovou daň, sociální a zdravotní pojistné, zdravotní minimum,
                roční sociální maximum, hodinovou sazbu z odpracovaných hodin, základní slevy, děti včetně ZTP/P
                a příspěvek na stravování.
              </p>
            </div>
            <div>
              <h3>Mimo model</h3>
              <p>
                Exekuce, insolvence, nemocenská, plný roční payroll, speciální zahraniční režimy a souběhy, které
                potřebují další mzdové doklady nebo roční kontext.
              </p>
            </div>
          </div>
          <div className="source-grid">
            {result.sources.map((source) => (
              <a key={source.id} href={source.url} target="_blank" rel="noreferrer">
                <Info size={15} aria-hidden="true" />
                <span>{source.label}</span>
              </a>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}

function OptionalSection({
  icon,
  title,
  enabled,
  onChange,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  enabled: boolean;
  onChange: (value: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <section className={enabled ? "optional-section open" : "optional-section"}>
      <label className="optional-toggle">
        <span>
          {icon}
          {title}
        </span>
        <input type="checkbox" checked={enabled} onChange={(event) => onChange(event.target.checked)} />
      </label>
      {enabled ? <div className="optional-body">{children}</div> : null}
    </section>
  );
}

function SummaryRow({
  icon,
  label,
  value,
  displayValue,
  strong,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  displayValue?: string;
  strong?: boolean;
}) {
  return (
    <div className={strong ? "summary-row strong" : "summary-row"}>
      <span className="summary-icon">{icon}</span>
      <span>{label}</span>
      <strong>{displayValue ?? formatAmount(value)}</strong>
    </div>
  );
}
