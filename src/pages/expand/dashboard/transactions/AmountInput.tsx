import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../../lib/firebase";

const DEFAULT_CURRENCY = "៛";
const ADD_CURRENCY_OPTION = "__add_currency__";

interface AmountInputProps {
  name?: string;
  placeholder?: string;
  required?: boolean;
}

export function AmountInput({
  name = "amount",
  placeholder = "50,000",
  required = true,
}: AmountInputProps) {

  const [displayValue, setDisplayValue] = useState("");
  const [currencies, setCurrencies] = useState<string[]>([DEFAULT_CURRENCY]);
  const [selectedCurrency, setSelectedCurrency] = useState(DEFAULT_CURRENCY);
  const [currencyDraft, setCurrencyDraft] = useState("");
  const [isEdit, setIsEdit] = useState(false);

  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        const snapshot = await getDocs(collection(db, "transactions"));
        const seen = new Set<string>();
        snapshot.docs.forEach((doc) => {
          const val = doc.data().currency;
          if (typeof val === "string" && val.trim()) {
            seen.add(val.trim());
          }
        });
        // ត្រូវមាន DEFAULT_CURRENCY ជានិច្ច
        seen.add(DEFAULT_CURRENCY);
        setCurrencies(Array.from(seen));
      } catch {
        // ប្រសិនបើ fetch មិនបាន សូមទុក default
      }
    };
    fetchCurrencies();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputVal = e.target.value;
    if (!inputVal) {
      setDisplayValue("");
      return;
    }

    // ដក comma និងតួអក្សរផ្សេងៗ ទុកតែលេខ និង dot
    const raw = inputVal.replace(/[^\d.]/g, "");
    const parts = raw.split(".");
    const intFormatted = parts[0]
      ? Number(parts[0]).toLocaleString("en-US")
      : "";
    const formatted =
      parts.length > 1
        ? `${intFormatted}.${parts.slice(1).join("")}`
        : intFormatted;

    setDisplayValue(formatted);
  };


  const handleAddCurrency = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;

    if (value === ADD_CURRENCY_OPTION) {
      setCurrencyDraft("");
      setIsEdit(true);
      return;
    }

    setSelectedCurrency(value);
    setIsEdit(false);
  };

  const handleSaveCurrency = () => {
    const value = currencyDraft.trim();
    if (!value) return;

    const existingCurrency = currencies.find(
      (currency) => currency.toLowerCase() === value.toLowerCase(),
    );
    const currency = existingCurrency ?? value;

    if (!existingCurrency) {
      setCurrencies((current) => [...current, currency]);
    }
    setSelectedCurrency(currency);
    setCurrencyDraft("");
    setIsEdit(false);
  };

  const handleCurrencyKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleSaveCurrency();
    } else if (event.key === "Escape") {
      event.preventDefault();
      setCurrencyDraft("");
      setIsEdit(false);
    }
  };

  return (
    // mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
    <div className=" mt-1 flex items-center border border-zinc-300 bg-white  rounded-lg overflow-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20">
      <input
        type="text"
        inputMode="decimal"
        name={name}
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        className="flex-1 min-w-0 bg-transparent px-3 py-2 text-gray-900 placeholder:text-gray-700 border-0 focus:outline-none"
        required={required}
      />


      {/* Created Option choose currency */}
      {!isEdit ? (
        <select
            name="currency"
            value={selectedCurrency}
            onChange={handleAddCurrency}
            aria-label="Currency"
            className="h-full bg-gray-200 px-2 py-2.5 text-gray-900 font-medium border-l border-amber-600/30 focus:outline-none cursor-pointer"
        >
        {currencies.map((cur) => (
          <option key={cur} value={cur}>
            {cur}
          </option>
        ))}

            <option value={ADD_CURRENCY_OPTION}>
                + បន្ថែម
            </option>
        </select>

        ) : (
            <div className="h-full flex items-center w-36 py-2.5 bg-gray-200 border-l border-amber-600/30 overflow-hidden">
                <input
                  type="text"
                  name="currency"
                  value={currencyDraft}
                  onChange={(event) => setCurrencyDraft(event.target.value)}
                  onKeyDown={handleCurrencyKeyDown}
                  className="flex-1 bg-transparent h-full min-w-0 mx-2 border-0 focus:outline-none"
                  placeholder="$"
                  aria-label="New currency"
                  maxLength={8}
                  required
                  autoFocus
                />
                <button
                  type="button"
                  className="w-6"
                  onClick={handleSaveCurrency}
                  aria-label="Save currency"
                  title="Save currency"
                >
                  ✓
                </button>
                <button
                  type="button"
                  className="w-6"
                  onClick={() => {
                    setCurrencyDraft("");
                    setIsEdit(false);
                  }}
                  aria-label="Cancel adding currency"
                  title="Cancel"
                >
                  &times;
                </button>
            </div>
        ) }

    
    </div>
  );
}
