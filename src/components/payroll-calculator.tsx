"use client";

import {
  Baby,
  Calculator,
  ChevronDown,
  CircleHelp,
  Gift,
  Plus,
  ReceiptText,
  RotateCcw,
  Utensils,
  WalletCards,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  calculatePayroll,
  type CalculationMode,
  type EmploymentType,
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

const employmentLabels: Record<EmploymentType, string> = {
  hpp: "HPP",
  dpp: "DPP",
  dpc: "DPČ",
};

const defaultInput = {
  mode: "netToGross" as CalculationMode,
  amount: 30_000,
  employmentType: "hpp" as EmploymentType,
  signedDeclaration: true,
  childrenCount: 0,
  useMealAllowance: false,
  workedDays: 21,
  mealAllowancePerDay: PAYROLL_2026.mealAllowanceExemptLimit,
  includeMealAllowanceInNet: false,
  applyHealthMinimum: true,
  useAdvancedPay: false,
  rewardAmount: 0,
  personalBonusAmount: 0,
  otherTaxableIncomeAmount: 0,
  averageHourlyWage: PAYROLL_2026.minimumWage / 168,
  overtimeHours: 0,
  nightHours: 0,
  weekendHours: 0,
  holidayHours: 0,
  hardshipHours: 0,
  hardshipRate: 10,
};

function formatAmount(value: number) {
  return currency.format(Math.round(value));
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

export function PayrollCalculator() {
  const [mode, setMode] = useState<CalculationMode>(defaultInput.mode);
  const [amount, setAmount] = useState(defaultInput.amount);
  const [employmentType, setEmploymentType] = useState<EmploymentType>(defaultInput.employmentType);
  const [signedDeclaration, setSignedDeclaration] = useState(defaultInput.signedDeclaration);
  const [childrenCount, setChildrenCount] = useState(defaultInput.childrenCount);
  const [useMealAllowance, setUseMealAllowance] = useState(defaultInput.useMealAllowance);
  const [workedDays, setWorkedDays] = useState(defaultInput.workedDays);
  const [mealAllowancePerDay, setMealAllowancePerDay] = useState(defaultInput.mealAllowancePerDay);
  const [includeMealAllowanceInNet, setIncludeMealAllowanceInNet] = useState(defaultInput.includeMealAllowanceInNet);
  const [applyHealthMinimum, setApplyHealthMinimum] = useState(defaultInput.applyHealthMinimum);
  const [useAdvancedPay, setUseAdvancedPay] = useState(defaultInput.useAdvancedPay);
  const [rewardAmount, setRewardAmount] = useState(defaultInput.rewardAmount);
  const [personalBonusAmount, setPersonalBonusAmount] = useState(defaultInput.personalBonusAmount);
  const [otherTaxableIncomeAmount, setOtherTaxableIncomeAmount] = useState(defaultInput.otherTaxableIncomeAmount);
  const [averageHourlyWage, setAverageHourlyWage] = useState(defaultInput.averageHourlyWage);
  const [overtimeHours, setOvertimeHours] = useState(defaultInput.overtimeHours);
  const [nightHours, setNightHours] = useState(defaultInput.nightHours);
  const [weekendHours, setWeekendHours] = useState(defaultInput.weekendHours);
  const [holidayHours, setHolidayHours] = useState(defaultInput.holidayHours);
  const [hardshipHours, setHardshipHours] = useState(defaultInput.hardshipHours);
  const [hardshipRate, setHardshipRate] = useState(defaultInput.hardshipRate);

  const result = useMemo(
    () =>
      calculatePayroll({
        mode,
        amount,
        employmentType,
        signedDeclaration,
        childrenCount,
        useMealAllowance,
        workedDays,
        mealAllowancePerDay,
        includeMealAllowanceInNet,
        applyHealthMinimum,
        rewardAmount: useAdvancedPay ? rewardAmount : 0,
        personalBonusAmount: useAdvancedPay ? personalBonusAmount : 0,
        otherTaxableIncomeAmount: useAdvancedPay ? otherTaxableIncomeAmount : 0,
        averageHourlyWage: useAdvancedPay ? averageHourlyWage : 0,
        overtimeHours: useAdvancedPay ? overtimeHours : 0,
        nightHours: useAdvancedPay ? nightHours : 0,
        weekendHours: useAdvancedPay ? weekendHours : 0,
        holidayHours: useAdvancedPay ? holidayHours : 0,
        hardshipHours: useAdvancedPay ? hardshipHours : 0,
        hardshipRate: useAdvancedPay ? hardshipRate : 0,
      }),
    [
      mode,
      amount,
      employmentType,
      signedDeclaration,
      childrenCount,
      useMealAllowance,
      workedDays,
      mealAllowancePerDay,
      includeMealAllowanceInNet,
      applyHealthMinimum,
      useAdvancedPay,
      rewardAmount,
      personalBonusAmount,
      otherTaxableIncomeAmount,
      averageHourlyWage,
      overtimeHours,
      nightHours,
      weekendHours,
      holidayHours,
      hardshipHours,
      hardshipRate,
    ],
  );

  const employeeDeductions = result.employeeSocial + result.employeeHealth + result.taxAfterDiscounts - result.taxBonus;
  const employerInsurance = result.employerSocial + result.employerHealth;
  const primaryResult = mode === "netToGross" ? result.grossWage : result.netCash;
  const primaryLabel = mode === "netToGross" ? "Hrubá mzda celkem" : "Čistý příjem";

  const reset = () => {
    setMode(defaultInput.mode);
    setAmount(defaultInput.amount);
    setEmploymentType(defaultInput.employmentType);
    setSignedDeclaration(defaultInput.signedDeclaration);
    setChildrenCount(defaultInput.childrenCount);
    setUseMealAllowance(defaultInput.useMealAllowance);
    setWorkedDays(defaultInput.workedDays);
    setMealAllowancePerDay(defaultInput.mealAllowancePerDay);
    setIncludeMealAllowanceInNet(defaultInput.includeMealAllowanceInNet);
    setApplyHealthMinimum(defaultInput.applyHealthMinimum);
    setUseAdvancedPay(defaultInput.useAdvancedPay);
    setRewardAmount(defaultInput.rewardAmount);
    setPersonalBonusAmount(defaultInput.personalBonusAmount);
    setOtherTaxableIncomeAmount(defaultInput.otherTaxableIncomeAmount);
    setAverageHourlyWage(defaultInput.averageHourlyWage);
    setOvertimeHours(defaultInput.overtimeHours);
    setNightHours(defaultInput.nightHours);
    setWeekendHours(defaultInput.weekendHours);
    setHolidayHours(defaultInput.holidayHours);
    setHardshipHours(defaultInput.hardshipHours);
    setHardshipRate(defaultInput.hardshipRate);
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
            <div className="brand-subtitle">2026 · HPP, DPP, DPČ</div>
          </div>
        </div>
        <div className="nav-links">
          <span className="credit-chip">orientační výpočet</span>
          <a href="https://vvitovec.com">vvitovec.com</a>
        </div>
      </nav>

      <section className="content">
        <header className="page-heading">
          <div>
            <p className="eyebrow">Čistá · hrubá · náklady</p>
            <h1>Mzdová kalkulačka 2026</h1>
          </div>
          <p>Rychlý přepočet mzdy, odvodů a nákladů zaměstnavatele pro běžné pracovní scénáře.</p>
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
              <button type="button" className={mode === "netToGross" ? "active" : ""} onClick={() => setMode("netToGross")}>
                Čistá → hrubá
              </button>
              <button type="button" className={mode === "grossToNet" ? "active" : ""} onClick={() => setMode("grossToNet")}>
                Hrubá → čistá
              </button>
            </div>

            <div className="form-stack">
              <Field label={mode === "netToGross" ? "Požadovaná čistá mzda" : "Základní hrubá mzda"} suffix="Kč">
                <input value={amount} min={0} type="number" onChange={(event) => setAmount(Number(event.target.value))} />
              </Field>

              <div className="field-grid">
                <label className="field">
                  <span className="field-label">Typ vztahu</span>
                  <select value={employmentType} onChange={(event) => setEmploymentType(event.target.value as EmploymentType)}>
                    <option value="hpp">HPP</option>
                    <option value="dpp">DPP</option>
                    <option value="dpc">DPČ</option>
                  </select>
                </label>
                <Field label="Počet dětí" suffix="dětí">
                  <input
                    value={childrenCount}
                    min={0}
                    type="number"
                    onChange={(event) => setChildrenCount(Number(event.target.value))}
                  />
                </Field>
              </div>

              <label className="switch-row">
                <span>Podepsané prohlášení poplatníka</span>
                <input
                  type="checkbox"
                  checked={signedDeclaration}
                  onChange={(event) => setSignedDeclaration(event.target.checked)}
                />
              </label>
              <label className="switch-row">
                <span>Hlídat minimum zdravotního pojištění u HPP</span>
                <input
                  type="checkbox"
                  checked={applyHealthMinimum}
                  onChange={(event) => setApplyHealthMinimum(event.target.checked)}
                  disabled={employmentType !== "hpp"}
                />
              </label>

              <OptionalSection
                icon={<Utensils size={17} aria-hidden="true" />}
                title="Přidat stravenky"
                enabled={useMealAllowance}
                onChange={setUseMealAllowance}
              >
                <div className="field-grid">
                  <Field label="Paušál za směnu" suffix="Kč">
                    <input
                      value={mealAllowancePerDay}
                      min={0}
                      step="0.5"
                      type="number"
                      onChange={(event) => setMealAllowancePerDay(Number(event.target.value))}
                    />
                  </Field>
                  <Field label="Odpracované směny" suffix="dní">
                    <input
                      value={workedDays}
                      min={0}
                      type="number"
                      onChange={(event) => setWorkedDays(Number(event.target.value))}
                    />
                  </Field>
                </div>
                <label className="switch-row">
                  <span>Započítat stravenky do čistého příjmu</span>
                  <input
                    type="checkbox"
                    checked={includeMealAllowanceInNet}
                    onChange={(event) => setIncludeMealAllowanceInNet(event.target.checked)}
                  />
                </label>
                <p className="inline-note">Osvobozený limit pro rok 2026: {decimalCurrency.format(PAYROLL_2026.mealAllowanceExemptLimit)} za směnu.</p>
              </OptionalSection>

              <OptionalSection
                icon={<Gift size={17} aria-hidden="true" />}
                title="Přidat odměny a příplatky"
                enabled={useAdvancedPay}
                onChange={setUseAdvancedPay}
              >
                <div className="field-grid">
                  <Field label="Odměna / prémie" suffix="Kč">
                    <input value={rewardAmount} min={0} type="number" onChange={(event) => setRewardAmount(Number(event.target.value))} />
                  </Field>
                  <Field label="Osobní ohodnocení" suffix="Kč">
                    <input
                      value={personalBonusAmount}
                      min={0}
                      type="number"
                      onChange={(event) => setPersonalBonusAmount(Number(event.target.value))}
                    />
                  </Field>
                  <Field label="Jiný zdanitelný příjem" suffix="Kč">
                    <input
                      value={otherTaxableIncomeAmount}
                      min={0}
                      type="number"
                      onChange={(event) => setOtherTaxableIncomeAmount(Number(event.target.value))}
                    />
                  </Field>
                  <Field label="Průměrná hodinová mzda" suffix="Kč">
                    <input
                      value={Math.round(averageHourlyWage)}
                      min={0}
                      type="number"
                      onChange={(event) => setAverageHourlyWage(Number(event.target.value))}
                    />
                  </Field>
                </div>

                <div className="supplement-grid">
                  {employmentType === "hpp" ? (
                    <Field label="Přesčas 25 %" suffix="h" compact>
                      <input
                        value={overtimeHours}
                        min={0}
                        step="0.5"
                        type="number"
                        onChange={(event) => setOvertimeHours(Number(event.target.value))}
                      />
                    </Field>
                  ) : null}
                  <Field label="Noc 10 %" suffix="h" compact>
                    <input value={nightHours} min={0} step="0.5" type="number" onChange={(event) => setNightHours(Number(event.target.value))} />
                  </Field>
                  <Field label="Víkend 10 %" suffix="h" compact>
                    <input
                      value={weekendHours}
                      min={0}
                      step="0.5"
                      type="number"
                      onChange={(event) => setWeekendHours(Number(event.target.value))}
                    />
                  </Field>
                  <Field label="Svátek 100 %" suffix="h" compact>
                    <input
                      value={holidayHours}
                      min={0}
                      step="0.5"
                      type="number"
                      onChange={(event) => setHolidayHours(Number(event.target.value))}
                    />
                  </Field>
                  <Field label={`Ztížené ${hardshipRate} %`} suffix="h" compact>
                    <input
                      value={hardshipHours}
                      min={0}
                      step="0.5"
                      type="number"
                      onChange={(event) => setHardshipHours(Number(event.target.value))}
                    />
                  </Field>
                  <Field label="Sazba ztíženého" suffix="%" compact>
                    <input
                      value={hardshipRate}
                      min={0}
                      type="number"
                      onChange={(event) => setHardshipRate(Number(event.target.value))}
                    />
                  </Field>
                </div>
                {employmentType !== "hpp" ? (
                  <p className="inline-note">U DPP/DPČ není přesčasový příplatek v kalkulačce nabízený.</p>
                ) : null}
              </OptionalSection>
            </div>
          </section>

          <section className="result-pane" aria-label="Výsledek výpočtu">
            <div className="result-head">
              <div>
                <p className="eyebrow">{mode === "netToGross" ? "Dopočtený výsledek" : "Čistý výstup"}</p>
                <h2>{primaryLabel}</h2>
              </div>
              <span className={result.insuranceApplies ? "status-pill success" : "status-pill"}>
                {result.insuranceApplies ? "pojistné se odvádí" : "bez pojistného"}
              </span>
            </div>

            <div className="result-number">{formatAmount(primaryResult)}</div>
            <p className="result-copy">
              {mode === "netToGross"
                ? `Základní hrubá mzda ${formatAmount(result.baseGrossWage)}, celkem s příplatky ${formatAmount(result.grossWage)}.`
                : `Zadaná základní hrubá mzda ${formatAmount(result.baseGrossWage)} dává čistý příjem ${formatAmount(result.netCash)}.`}
            </p>

            <div className="summary-list">
              <SummaryRow icon={<WalletCards size={18} />} label="Čistá mzda" value={result.netWage} strong />
              <SummaryRow icon={<Plus size={18} />} label="Hrubá mzda celkem" value={result.grossWage} />
              {useAdvancedPay && result.cashExtras > 0 ? <SummaryRow icon={<Gift size={18} />} label="Odměny a příplatky" value={result.cashExtras} /> : null}
              <SummaryRow icon={<ReceiptText size={18} />} label={result.taxMode === "withholding" ? "Srážková daň" : "Daň po slevách"} value={result.taxAfterDiscounts} />
              <SummaryRow icon={<CircleHelp size={18} />} label="Odvody zaměstnance" value={employeeDeductions} />
              <SummaryRow icon={<Calculator size={18} />} label="Náklady zaměstnavatele" value={result.employerCost} strong />
              {useMealAllowance ? (
                <>
                  <SummaryRow icon={<Utensils size={18} />} label="Stravenky celkem" value={result.mealAllowanceTotal} />
                  <SummaryRow icon={<Utensils size={18} />} label="Osvobozená část stravenek" value={result.exemptMealAllowance} />
                </>
              ) : null}
              <SummaryRow icon={<Baby size={18} />} label="Děti a daňový bonus" value={result.childTaxCredit + result.taxBonus} />
              <SummaryRow icon={<ChevronDown size={18} />} label="Odvody zaměstnavatele" value={employerInsurance} />
            </div>

            <div className="breakdown">
              <div className="breakdown-heading">
                <div>
                  <p className="eyebrow">Rozpad</p>
                  <h2>Výpočet mzdy</h2>
                </div>
                <span>{employmentLabels[employmentType]}</span>
              </div>

              <div className="breakdown-list">
                {result.rows.map((row) => (
                  <div key={row.label} className={row.tone ? `breakdown-row row-${row.tone}` : "breakdown-row"}>
                    <span>{row.label}</span>
                    <strong>{row.amount < 0 ? `-${formatAmount(Math.abs(row.amount))}` : formatAmount(row.amount)}</strong>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        <footer className="disclaimer">
          Výpočet je orientační. Neřeší exekuce, nemocenskou, roční stropy, rizikové profese, pracující důchodce ani souběhy zaměstnání.
        </footer>
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
  strong,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  strong?: boolean;
}) {
  return (
    <div className={strong ? "summary-row strong" : "summary-row"}>
      <span className="summary-icon">{icon}</span>
      <span>{label}</span>
      <strong>{formatAmount(value)}</strong>
    </div>
  );
}
