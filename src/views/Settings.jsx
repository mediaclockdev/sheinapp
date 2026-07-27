import { useEffect, useState } from "react";
import { Save, Info, Plus, X } from "lucide-react";
import { toast } from "../components/Toast";

const SETTINGS_API_URL = "https://shelynx.mediaclocksoft.com.au/api/settings";

const initialTiers = [{ min: "100", max: "199", discount: "5" }];

const authHeaders = () => {
  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export default function Settings() {
  const [pricePerKg, setPricePerKg] = useState("10");
  const [weight, setWeight] = useState("0.5");
  const [customFee, setCustomFee] = useState("0");
  const [deliveryFee, setDeliveryFee] = useState("0");
  const [tiers, setTiers] = useState(initialTiers);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // "saved" | "error"

  useEffect(() => {
    fetch(SETTINGS_API_URL, { headers: authHeaders() })
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then(({ data }) => {
        if (data?.pricePerKg != null) setPricePerKg(String(data.pricePerKg));
        if (data?.customfee != null) setCustomFee(String(data.customfee));
        else if (data?.customFee != null) setCustomFee(String(data.customFee));
        if (data?.deliveryfee != null) setDeliveryFee(String(data.deliveryfee));
        else if (data?.deliveryFee != null)
          setDeliveryFee(String(data.deliveryFee));
        if (data?.discountRules?.length) {
          setTiers(
            data.discountRules.map((r) => ({
              id: r.id,
              min: String(r.minOrderAmount),
              max: String(r.maxOrderAmount),
              discount: String(r.discountRate),
            })),
          );
        }
      })
      .catch((err) => console.error("Failed to load settings:", err));
  }, []);

  const updateTier = (i, field, value) => {
    setTiers((prev) =>
      prev.map((t, idx) => (idx === i ? { ...t, [field]: value } : t)),
    );
  };

  const addTier = () =>
    setTiers((prev) => [...prev, { min: "", max: "", discount: "" }]);

  const removeTier = (i) =>
    setTiers((prev) => prev.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    setSaving(true);
    setSaveStatus(null);
    try {
      const [shippingRes, rulesRes, feesRes] = await Promise.all([
        fetch(`${SETTINGS_API_URL}/shipping`, {
          method: "PATCH",
          headers: authHeaders(),
          body: JSON.stringify({ pricePerKg: parseFloat(pricePerKg) || 0 }),
        }),
        fetch(`${SETTINGS_API_URL}/discount-rules`, {
          method: "PUT",
          headers: authHeaders(),
          body: JSON.stringify({
            rules: tiers.map((t) => ({
              ...(t.id != null ? { id: t.id } : {}),
              minOrderAmount: parseFloat(t.min) || 0,
              maxOrderAmount: parseFloat(t.max) || 0,
              discountRate: parseFloat(t.discount) || 0,
            })),
          }),
        }),
        fetch(`${SETTINGS_API_URL}/fees`, {
          method: "PATCH",
          headers: authHeaders(),
          body: JSON.stringify({
            customFee: parseFloat(customFee) || 0,
            deliveryFee: parseFloat(deliveryFee) || 0,
          }),
        }),
      ]);

      if (!shippingRes.ok || !rulesRes.ok || !feesRes.ok) {
        throw new Error("Save failed");
      }
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus(null), 3000);
      toast.success("Settings saved");
    } catch (err) {
      console.error("Failed to save settings:", err);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus(null), 4000);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const kg = parseFloat(weight) || 0;
  const basePrice = kg * (parseFloat(pricePerKg) || 0);

  return (
    <div className="flex-1 bg-[#fdf5f7] min-h-[calc(100vh-70px)]">
      <div className="p-4 sm:p-8 max-w-6xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-[32px] font-bold text-[#141D23] tracking-tight">
              Shipping &amp; Pricing Rules
            </h1>
            <p className="text-sm sm:text-base font-no text-[#5C5F60] mt-1">
              Configure your shipping costs, weight conversion units, and
              automatic discount tiers.
            </p>
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
            {saveStatus === "saved" && (
              <span className="text-sm font-semibold text-green-600">
                Saved!
              </span>
            )}
            {saveStatus === "error" && (
              <span className="text-sm font-semibold text-red-500">
                Save failed. Try again.
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center justify-center gap-2 bg-[#ffe8ef] hover:bg-[#ffd4e1] text-[#d24d77] font-semibold text-sm px-4 py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer w-full sm:w-auto"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Card 1: Calculate Weight & Price */}
          <div className="bg-white rounded-2xl border border-[#dec9ce]/40 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
            <div className="flex items-center gap-3 mb-5">
              <span className="h-7 w-7 rounded-lg bg-[#ffe8ef] text-[#d24d77] text-sm font-bold flex items-center justify-center">
                1
              </span>
              <h2 className="text-xl font-semibold text-[#17222b]">
                Calculate Weight &amp; Price
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[13px] font-semibold text-[#4F4446] block mb-1.5">
                  Price Per Kilogram (USD)
                </label>
                <div className="flex items-center bg-[#ECF5FE] border border-[#D3C3C5] rounded-sm px-3 py-2">
                  <span className="text-sm text-[#5c5f60] mr-1">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={pricePerKg}
                    onChange={(e) => setPricePerKg(e.target.value)}
                    className="w-full bg-transparent text-sm text-[#17222b] outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="text-[13px] font-semibold text-[#4F4446] block mb-1.5">
                  Enter Weight
                </label>
                <div className="flex items-center bg-[#ECF5FE] border border-[#D3C3C5] rounded-sm overflow-hidden">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-full bg-transparent text-sm text-[#17222b] outline-none px-3 py-2"
                  />
                  <span className="bg-[#E0E9F2] text-[13px] font-semibold text-[#4F4446] px-3 py-2.5 shrink-0">
                    KG
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <label className="text-[13px] font-semibold text-[#4F4446] block mb-1.5">
                Base Price Calculation
              </label>
              <div className="flex items-center justify-between bg-[#ECF5FE] border border-[#D3C3C5] rounded-lg px-4 py-3">
                <span className="text-sm text-[#141D23]">
                  <span className="font-semibold">
                    {kg.toLocaleString()} kg
                  </span>
                  <span className="text-[#98a2ab] mx-2">×</span>
                  <span className="font-semibold">
                    ${(parseFloat(pricePerKg) || 0).toFixed(2)}
                  </span>
                </span>
                <span className="text-xl font-semibold text-blue-600">
                  = ${basePrice.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Coupon Discount Rules */}
          {/* <div className="order-3 lg:order-2 bg-white rounded-lg border border-[#dec9ce]/40 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
            <div className="flex items-center gap-3 mb-5">
              <span className="h-7 w-7 rounded-lg bg-[#eef4fb] text-[#5c7ba6] text-sm font-bold flex items-center justify-center">
                <span className="lg:hidden">3</span>
                <span className="hidden lg:inline">2</span>
              </span>
              <h2 className="text-xl font-semibold text-[#141D23]">
                Coupon Discount Rules
              </h2>
            </div>

            <div className="border border-[#D3C3C5] rounded-lg overflow-x-auto">
              <div className="flex justify-between bg-[#ECF5FE] px-2 sm:px-4 py-2.5 text-xs font-bold text-[#5c5f60] min-w-max sm:min-w-0">
                <span>Order Amount (USD)</span>
                <span>Discount</span>
              </div>
              {tiers.map((t, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-1.5 sm:gap-3 px-2 sm:px-4 py-3 border-t border-[#e5e9ef] text-sm text-[#17222b] min-w-max sm:min-w-0"
                >
                  <div className="flex items-center gap-1 sm:gap-2">
                    <div className="flex items-center bg-[#eef4fb] border border-[#d9e4f2] rounded-lg px-2 py-1.5 w-16 sm:w-24 flex-none">
                      <span className="text-xs text-[#5c5f60] mr-1">$</span>
                      <input
                        type="number"
                        min="0"
                        value={t.min}
                        onChange={(e) => updateTier(i, "min", e.target.value)}
                        placeholder="Min"
                        className="w-full min-w-0 bg-transparent text-sm text-[#17222b] outline-none"
                      />
                    </div>
                    <span className="text-[#98a2ab] shrink-0">-</span>
                    <div className="flex items-center bg-[#eef4fb] border border-[#d9e4f2] rounded-lg px-2 py-1.5 w-16 sm:w-24 flex-none">
                      <span className="text-xs text-[#5c5f60] mr-1">$</span>
                      <input
                        type="number"
                        min="0"
                        value={t.max}
                        onChange={(e) => updateTier(i, "max", e.target.value)}
                        placeholder="Max"
                        className="w-full min-w-0 bg-transparent text-sm text-[#17222b] outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
                    <div className="flex items-center bg-[#eef4fb] border border-[#d9e4f2] rounded-lg px-2 py-1.5 w-16 sm:w-20 shrink-0">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={t.discount}
                        onChange={(e) =>
                          updateTier(i, "discount", e.target.value)
                        }
                        className="w-full bg-transparent text-sm text-[#17222b] outline-none"
                      />
                      <span className="text-xs text-[#5c5f60] ml-1">%</span>
                    </div>
                    {tiers.length > 1 && (
                      <button
                        onClick={() => removeTier(i)}
                        className="p-1 rounded text-[#98a2ab] hover:text-[#d24d77] hover:bg-[#ffe8ef] transition shrink-0 cursor-pointer"
                        aria-label="Remove tier"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={addTier}
              className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-[#d24d77] hover:bg-[#ffe8ef] px-3 py-2 rounded-lg transition cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Add Tier
            </button>

            <div className="mt-4 flex gap-2 bg-[#eef4fb] border border-[#d9e4f2] rounded-lg p-3">
              <Info className="h-4 w-4 text-[#5c7ba6] shrink-0 mt-0.5" />
              <p className="text-xs text-[#5c5f60] leading-relaxed">
                Discount is applied based on the Base Amount (before discount
                calculation).
              </p>
            </div>
          </div> */}

          {/* Card 3 : Custom and delivery fee  */}
          <div className="order-2 lg:order-3 bg-white rounded-2xl border border-[#dec9ce]/40 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
            <div className="flex items-center gap-3 mb-5">
              <span className="h-7 w-7 rounded-lg bg-[#eef4fb] text-[#5c7ba6] text-sm font-bold flex items-center justify-center">
                <span className="lg:hidden">2</span>
                <span className="hidden lg:inline">3</span>
              </span>
              <h2 className="text-xl font-semibold text-[#141D23]">
                Custom and Delivery Fee Calculation
              </h2>
            </div>

            <div className="border border-[#D3C3C5] rounded-lg overflow-hidden">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 px-4 py-3 border-t border-[#e5e9ef] text-sm text-[#17222b]">
                <div className="flex flex-col gap-4 w-full sm:w-auto">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <div>
                      <label
                        htmlFor="custom-fee-input"
                        className="font-semibold sm:font-normal"
                      >
                        Custom Fee
                      </label>
                    </div>
                    <span className="text-[#98a2ab] hidden sm:inline">-</span>
                    <div className="flex items-center bg-[#eef4fb] border border-[#d9e4f2] rounded-lg px-2 py-1.5 w-full sm:w-24">
                      <span className="text-xs text-[#5c5f60] mr-1">$</span>
                      <input
                        id="custom-fee-input"
                        type="number"
                        step="0.01"
                        min="0"
                        value={customFee}
                        onChange={(e) => setCustomFee(e.target.value)}
                        placeholder="10"
                        className="w-full bg-transparent text-sm text-[#17222b] outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <div>
                      <label
                        htmlFor="delivery-fee-input"
                        className="font-semibold sm:font-normal"
                      >
                        Delivery Fee
                      </label>
                    </div>
                    <span className="text-[#98a2ab] hidden sm:inline">-</span>
                    <div className="flex items-center bg-[#eef4fb] border border-[#d9e4f2] rounded-lg px-2 py-1.5 w-full sm:w-24">
                      <span className="text-xs text-[#5c5f60] mr-1">$</span>
                      <input
                        id="delivery-fee-input"
                        type="number"
                        step="0.01"
                        min="0"
                        value={deliveryFee}
                        onChange={(e) => setDeliveryFee(e.target.value)}
                        placeholder="10"
                        className="w-full bg-transparent text-sm text-[#17222b] outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
