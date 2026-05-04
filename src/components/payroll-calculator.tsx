"use client";

import {
  Baby,
  BadgeCheck,
  Building2,
  Calculator,
  HeartPulse,
  ReceiptText,
  RotateCcw,
  Utensils,
  Users,
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
  childrenCount: 2,
  workedDays: 21,
  mealAllowancePerDay: PAYROLL_2026.mealAllowanceExemptLimit,
  includeMealAllowanceInNet: false,
  applyHealthMinimum: true,
};

function Field({ label, suffix, children }: FieldProps) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <span className="field-control">
        {children}
        {suffix ? <span className="field-suffix">{suffix}</span> : null}
      </span>
    </label>
  );
}

function formatAmount(value: number) {
  return currency.format(Math.round(value));
}

export function PayrollCalculator() {
  const [mode, setMode] = useState<CalculationMode>(defaultInput.mode);
  const [amount, setAmount] = useState(defaultInput.amount);
  const [employmentType, setEmploymentType] = useState<EmploymentType>(defaultInput.employmentType);
  const [signedDeclaration, setSignedDeclaration] = useState(defaultInput.signedDeclaration);
  const [childrenCount, setChildrenCount] = useState(defaultInput.childrenCount);
  const [workedDays, setWorkedDays] = useState(defaultInput.workedDays);
  const [mealAllowancePerDay, setMealAllowancePerDay] = useState(defaultInput.mealAllowancePerDay);
  const [includeMealAllowanceInNet, setIncludeMealAllowanceInNet] = useState(defaultInput.includeMealAllowanceInNet);
  const [applyHealthMinimum, setApplyHealthMinimum] = useState(defaultInput.applyHealthMinimum);

  const result = useMemo(
    () =>
      calculatePayroll({
        mode,
        amount,
        employmentType,
        signedDeclaration,
        childrenCount,
        workedDays,
        mealAllowancePerDay,
        includeMealAllowanceInNet,
        applyHealthMinimum,
      }),
    [
      mode,
      amount,
      employmentType,
      signedDeclaration,
      childrenCount,
      workedDays,
      mealAllowancePerDay,
      includeMealAllowanceInNet,
      applyHealthMinimum,
    ],
  );

  const employeeDeductions = result.employeeSocial + result.employeeHealth + result.taxAfterDiscounts - result.taxBonus;
  const mealPercent = result.employerCost > 0 ? (result.exemptMealAllowance / result.employerCost) * 100 : 0;
  const grossPercent = result.employerCost > 0 ? (result.taxableIncome / result.employerCost) * 100 : 0;
  const employerInsurancePercent =
    result.employerCost > 0 ? ((result.employerSocial + result.employerHealth) / result.employerCost) * 100 : 0;
  const cssDonut = {
    "--gross": `${grossPercent}%`,
    "--employer": `${grossPercent + employerInsurancePercent}%`,
    "--meal": `${grossPercent + employerInsurancePercent + mealPercent}%`,
  } as React.CSSProperties;

  const reset = () => {
    setMode(defaultInput.mode);
    setAmount(defaultInput.amount);
    setEmploymentType(defaultInput.employmentType);
    setSignedDeclaration(defaultInput.signedDeclaration);
    setChildrenCount(defaultInput.childrenCount);
    setWorkedDays(defaultInput.workedDays);
    setMealAllowancePerDay(defaultInput.mealAllowancePerDay);
    setIncludeMealAllowanceInNet(defaultInput.includeMealAllowanceInNet);
    setApplyHealthMinimum(defaultInput.applyHealthMinimum);
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
            <p className="eyebrow">Čistá, hrubá, odvody a náklady</p>
            <h1>Spočítejte mzdu bez účetního lovení v tabulkách.</h1>
          </div>
          <p>
            Zadejte domluvenou čistou nebo hrubou mzdu, typ vztahu, děti a stravenky. Kalkulačka přepočítá hrubou mzdu,
            odvody zaměstnance i celkový měsíční náklad zaměstnavatele.
          </p>
        </header>

        <div className="workspace-grid">
          <aside className="card input-panel">
            <div className="card-header">
              <div>
                <p className="eyebrow">Vstupy</p>
                <h2>Základní údaje</h2>
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
              <Field label={mode === "netToGross" ? "Požadovaná čistá mzda" : "Hrubá mzda"} suffix="Kč">
                <input value={amount} min={0} type="number" onChange={(event) => setAmount(Number(event.target.value))} />
              </Field>

              <label className="field">
                <span className="field-label">Typ pracovního vztahu</span>
                <select value={employmentType} onChange={(event) => setEmploymentType(event.target.value as EmploymentType)}>
                  <option value="hpp">HPP</option>
                  <option value="dpp">DPP</option>
                  <option value="dpc">DPČ</option>
                </select>
              </label>

              <div className="section-divider" />

              <h3 className="section-title">
                <Utensils size={17} aria-hidden="true" />
                Stravenky
              </h3>
              <Field label="Stravenkový paušál za směnu" suffix="Kč">
                <input
                  value={mealAllowancePerDay}
                  min={0}
                  step="0.5"
                  type="number"
                  onChange={(event) => setMealAllowancePerDay(Number(event.target.value))}
                />
              </Field>
              <Field label="Odpracované směny" suffix="dní">
                <input value={workedDays} min={0} type="number" onChange={(event) => setWorkedDays(Number(event.target.value))} />
              </Field>
              <label className="switch-row">
                <span>Započítat stravenky do čistého příjmu</span>
                <input
                  type="checkbox"
                  checked={includeMealAllowanceInNet}
                  onChange={(event) => setIncludeMealAllowanceInNet(event.target.checked)}
                />
              </label>

              <div className="section-divider" />

              <h3 className="section-title">
                <Baby size={17} aria-hidden="true" />
                Slevy a děti
              </h3>
              <Field label="Počet dětí pro odpočet" suffix="dětí">
                <input
                  value={childrenCount}
                  min={0}
                  type="number"
                  onChange={(event) => setChildrenCount(Number(event.target.value))}
                />
              </Field>
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
            </div>
          </aside>

          <section className="main-column">
            <div className="hero-result card">
              <div>
                <p className="eyebrow">{mode === "netToGross" ? "Odhad hrubé mzdy" : "Odhad čisté mzdy"}</p>
                <div className="result-number">{mode === "netToGross" ? formatAmount(result.grossWage) : formatAmount(result.netCash)}</div>
                <p>
                  {mode === "netToGross"
                    ? `Hrubá mzda potřebná pro cílový čistý příjem ${formatAmount(result.requestedAmount)}.`
                    : `Čistý příjem z hrubé mzdy ${formatAmount(result.grossWage)}.`}
                </p>
              </div>
              <BadgeCheck className="hero-icon" size={42} aria-hidden="true" />
            </div>

            <div className="metric-grid">
              <MetricCard icon={<HeartPulse size={24} />} label="Zdravotní zaměstnanec" value={result.employeeHealth} detail="4,5 % z vyměřovacího základu" />
              <MetricCard icon={<Users size={24} />} label="Sociální zaměstnanec" value={result.employeeSocial} detail="7,1 % při účasti na pojištění" />
              <MetricCard icon={<ReceiptText size={24} />} label={result.taxMode === "withholding" ? "Srážková daň" : "Záloha na daň"} value={result.taxAfterDiscounts} detail="po slevách a dětech" />
              <MetricCard icon={<Utensils size={24} />} label="Stravenky celkem" value={result.mealAllowanceTotal} detail={`${decimalCurrency.format(PAYROLL_2026.mealAllowanceExemptLimit)} osvobozený limit`} />
            </div>

            <div className="card breakdown-card">
              <div className="card-header">
                <div>
                  <p className="eyebrow">Rozpad</p>
                  <h2>Výpočet mzdy</h2>
                </div>
                <span className={result.insuranceApplies ? "status-pill success" : "status-pill"}>{result.insuranceApplies ? "pojistné se odvádí" : "bez pojistného"}</span>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Položka</th>
                      <th>Částka</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.rows.map((row) => (
                      <tr key={row.label} className={row.tone ? `row-${row.tone}` : undefined}>
                        <td>{row.label}</td>
                        <td>{row.amount < 0 ? `-${formatAmount(Math.abs(row.amount))}` : formatAmount(row.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <aside className="side-column">
            <div className="card cost-card">
              <div className="card-header">
                <div>
                  <p className="eyebrow">Zaměstnavatel</p>
                  <h2>Náklady</h2>
                </div>
                <Building2 size={24} aria-hidden="true" />
              </div>
              <div className="cost-value">{formatAmount(result.employerCost)}</div>
              <p>Celkový měsíční náklad včetně zaměstnavatelských odvodů a osvobozené části stravenek.</p>
            </div>

            <div className="card chart-card">
              <h2>Rozdělení nákladů</h2>
              <div className="donut" style={cssDonut}>
                <div>
                  <span>Celkem</span>
                  <strong>{formatAmount(result.employerCost)}</strong>
                </div>
              </div>
              <div className="legend">
                <Legend color="blue" label="Mzda + zdanitelné plnění" value={result.taxableIncome} />
                <Legend color="sky" label="Odvody zaměstnavatele" value={result.employerSocial + result.employerHealth} />
                <Legend color="green" label="Osvobozené stravenky" value={result.exemptMealAllowance} />
              </div>
            </div>

            <div className="card facts-card">
              <h2>Parametry 2026</h2>
              <dl>
                <div>
                  <dt>Typ vztahu</dt>
                  <dd>{employmentLabels[employmentType]}</dd>
                </div>
                <div>
                  <dt>Základ daně</dt>
                  <dd>{formatAmount(result.taxBase)}</dd>
                </div>
                <div>
                  <dt>Děti</dt>
                  <dd>{formatAmount(result.childTaxCredit)}</dd>
                </div>
                <div>
                  <dt>Daňový bonus</dt>
                  <dd>{formatAmount(result.taxBonus)}</dd>
                </div>
              </dl>
            </div>
          </aside>
        </div>

        <footer className="disclaimer">
          Výpočet je orientační. Neřeší exekuce, nemocenskou, roční stropy, rizikové profese, pracující důchodce,
          souběhy zaměstnání ani další individuální výjimky.
        </footer>
      </section>
    </main>
  );
}

function MetricCard({
  icon,
  label,
  value,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  detail: string;
}) {
  return (
    <div className="metric-card">
      <div className="metric-icon">{icon}</div>
      <div>
        <p>{label}</p>
        <strong>{formatAmount(value)}</strong>
        <span>{detail}</span>
      </div>
    </div>
  );
}

function Legend({ color, label, value }: { color: "blue" | "sky" | "green"; label: string; value: number }) {
  return (
    <div className="legend-row">
      <span className={`legend-dot ${color}`} />
      <span>{label}</span>
      <strong>{formatAmount(value)}</strong>
    </div>
  );
}
