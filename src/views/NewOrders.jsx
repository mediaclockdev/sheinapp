import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import SuccessToast from "../components/common/SuccessToast";
import { handleUnauthorized, isUnauthorized } from "../lib/sessionExpiry";
import usericon from "../assets/CustomerInformationicon.svg";
import addnewordericon from "../assets/addnewproduct.svg";
import productdetailsicon from "../assets/productdetailicon.svg";
import plusicon from "../assets/plusicon.svg";
import minus from "../assets/minusicon.svg";
import camera from "../assets/cameraicon.svg";
import linkicon from "../assets/linkicon.svg";

const ORDERS_API_URL = "https://shelynx.mediaclocksoft.com.au/api/orders";

const initialCustomer = {
  fullName: "",
  phoneNumber: "",
  shippingAddress: "",
  customerMessage: "",
  serviceFee: "",
};

const initialProduct = {
  productName: "",
  skuCode: "",
  sheinUrl: "",
  price: "",
  size: "XS",
  color: "",
  weight: "",
  quantity: 1,
};

const NewOrders = () => {
  const navigate = useNavigate();
  const [excludePromotion, setExcludePromotion] = useState(false);
  const [customer, setCustomer] = useState(initialCustomer);
  const [product, setProduct] = useState(initialProduct);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [productImages, setProductImages] = useState([]);
  const [successMessage, setSuccessMessage] = useState(null);

  const updateCustomer = (field) => (event) => {
    setCustomer((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleImageSelect = (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    setProductImages((prev) => [
      ...prev,
      ...files.map((file) => ({ file, preview: URL.createObjectURL(file) })),
    ]);
    event.target.value = "";
  };

  const handleRemoveImage = (index) => {
    setProductImages((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const updateProduct = (field) => (event) => {
    setProduct((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const adjustQuantity = (delta) => {
    setProduct((prev) => ({
      ...prev,
      quantity: Math.max(1, Number(prev.quantity || 1) + delta),
    }));
  };

  const handleCreateOrder = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");

      const items = [
        {
          productName: product.productName,
          skuCode: product.skuCode,
          productUrl: product.sheinUrl,
          size: product.size,
          color: product.color,
          weight: String(product.weight || 0),
          quantity: Number(product.quantity) || 1,
          price: Number(product.price) || 0,
          excludePromotion,
        },
      ];

      const formData = new FormData();
      formData.append("customerName", customer.fullName);
      formData.append("customerPhone", customer.phoneNumber);
      formData.append("shippingAddress", customer.shippingAddress);
      formData.append("customerMessage", customer.customerMessage);
      formData.append("serviceFee", customer.serviceFee);
      formData.append("items", JSON.stringify(items));
      productImages.forEach(({ file }) => formData.append("files", file));

      if (!token) {
        throw new Error("You are not logged in. Please log in again.");
      }

      const response = await fetch(ORDERS_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (isUnauthorized(response.status)) {
        handleUnauthorized();
        return;
      }
      const rawText = await response.text();
      let result = {};
      try {
        result = rawText ? JSON.parse(rawText) : {};
      } catch {
        console.error("Non-JSON response from /api/orders:", rawText);
      }

      if (!response.ok) {
        console.error("Create order failed", response.status, result, rawText);
        throw new Error(
          result.message ||
            result.errors?.map((e) => e.message).join(", ") ||
            `Failed to create order (status ${response.status})`,
        );
      }

      setSuccessMessage("Order created successfully!");
      setTimeout(() => navigate("/orders"), 1200);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 lg:p-8 bg-[#FFD1DC]/20 min-h-[calc(100vh-70px)] space-y-6">
      <SuccessToast
        message={successMessage}
        onClose={() => setSuccessMessage(null)}
      />
      {/* Header Info */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between lg:items-center">
        <div>
          <h1 className="text-2xl lg:text-[32px] font-bold text-[#17222B] tracking-tight">
            New Order Entry
          </h1>
          <p className="text-sm lg:text-base text-[#5C5F60]/80 mt-1 font-semibold">
            Manually register a new proxy order for Shein items.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className=" bg-[#FFFFFF]/2 hover:bg-[#FFFFFF]/50 text-[#141D23] border border-[#D3C3C5] font-normal px-5 py-2 rounded-sm whitespace-nowrap text-sm lg:text-base cursor-pointer transition duration-200 shadow-sm flex items-center gap-1.5"
          >
            <p>Cancel</p>
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={handleCreateOrder}
            className=" bg-[#FFD1DC] hover:bg-[#FFD1DC]/60 text-[#2D141C] border border-[#D3C3C5] font-normal px-5 py-2.5 rounded-sm whitespace-nowrap text-sm lg:text-base cursor-pointer transition duration-200 shadow-sm flex items-center gap-1.5 disabled:opacity-60"
          >
            <img
              src={addnewordericon}
              alt="New order icon"
              className="h-4 w-4"
            />
            <p>{loading ? "Creating Order..." : "Create Order"}</p>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-300 text-red-600 text-sm font-medium rounded-md px-4 py-3">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 items-start">
        {/* Customer Information  */}
        <div className="bg-white border border-[#D3C3C5] rounded-lg p-6 space-y-6">
          <div className="flex items-center gap-1">
            <img src={usericon} alt="" />
            <h2 className="text-[#141D23] font-semibold text-xl">
              Customer Information
            </h2>
          </div>
          <form className="space-y-5">
            <div className="flex flex-col gap-1">
              <label className="text-[#5C5F60] font-semibold text-sm">
                Full Name<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={customer.fullName}
                requireds
                onChange={updateCustomer("fullName")}
                placeholder="e.g. Eleanor Rigby"
                className="placeholder:text-[#6B7280] text-black text-sm font-normal rounded-sm border border-[#D3C3C5] px-4 py-2.5 outline-none"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[#5C5F60] font-semibold text-sm">
                Phone Number<span className="text-red-500">*</span>
              </label>
              <input
                label="Phone Number"
                required
                value={customer.phoneNumber}
                onChange={updateCustomer("phoneNumber")}
                placeholder="+61 20 7123 4567"
                className="placeholder:text-[#6B7280] text-black text-sm font-normal rounded-sm border border-[#D3C3C5] px-4 py-2.5 outline-none"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[#5C5F60] font-semibold text-sm">
                Shipping Address<span className="text-red-500">*</span>
              </label>
              <textarea
                rows={4}
                required
                value={customer.shippingAddress}
                onChange={updateCustomer("shippingAddress")}
                placeholder="Street, City, State, ZIP..."
                className="w-full rounded-md border border-[#D3C3C5] px-4 py-3 resize-none outline-none"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[#5C5F60] font-semibold text-sm">
                Customer Message<span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={customer.customerMessage}
                onChange={updateCustomer("customerMessage")}
                placeholder="e.g. Please check the size guide..."
                className="w-full rounded-md border border-[#D3C3C5] px-4 py-3 resize-none outline-none"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[#5C5F60] font-semibold text-sm">
                Service Fee ($)
              </label>
              <input
                type="number"
                value={customer.serviceFee}
                onChange={updateCustomer("serviceFee")}
                placeholder="5.00"
                className="placeholder:text-[#6B7280] text-[#6B7280] text-sm font-normal rounded-sm border border-[#D3C3C5] px-4 py-2.5 outline-none"
              />
            </div>
          </form>
          <div className="space-y-1 bg-[#FFD1DC] rounded-lg px-5 py-4">
            <h2 className="text-[#78555E] font-semibold text-xl">
              Shelynx Promise
            </h2>
            <p>
              Ensure all data entries are accurate to avoid logistics
              delays.{" "}
            </p>
          </div>
        </div>
        {/* Product detail form */}
        <div className=" bg-white p-6 space-y-3 border border-[#D3C3C5] rounded-lg">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1">
              <img src={productdetailsicon} alt="" />
              <h2 className="text-[#141D23] font-semibold text-xl">
                Product Details
              </h2>
            </div>
            <div>
              <button className="flex border border-[#78555E] px-3 py-1 rounded-sm gap-1">
                <img src={plusicon} alt="plus icon" />
                <p className="text-[#78555E] text-sm font-semibold">
                  Add Product
                </p>
              </button>
            </div>
          </div>
          <div className=" relative border border-[#D3C3C5] p-4 rounded-sm">
            <button className="absolute right-2 top-0 text-xl text-gray-500">
              ✕
            </button>

            <form className="space-y-6">
              {/* Row 1 */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="col-span-8">
                  <label className="block text-[#5C5F60] text-sm font-medium mb-2">
                    Product Name<span className="text-red-500">*</span>
                  </label>

                  <input
                    type="text"
                    value={product.productName}
                    onChange={updateProduct("productName")}
                    placeholder="e.g. Contrast Lace Camisole"
                    className="w-full h-12 px-5 border border-[#D3C3C5] rounded-md text-[15px] outline-none"
                  />
                </div>

                <div className="col-span-8 lg:col-span-4">
                  <label className="block text-[#5C5F60] text-sm font-medium mb-2">
                    SKU Code<span className="text-red-500">*</span>
                  </label>

                  <input
                    type="text"
                    value={product.skuCode}
                    onChange={updateProduct("skuCode")}
                    placeholder="SH-92831-PNK"
                    className="w-full h-12 px-5 border border-[#D3C3C5] rounded-md text-[15px] outline-none"
                  />
                </div>
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="col-span-8">
                  <label className="block text-[#5C5F60] text-sm font-medium mb-2">
                    Shein Product URL <span className="text-red-500">*</span>
                  </label>

                  <div className="relative">
                    <img
                      src={linkicon}
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5"
                    />

                    <input
                      type="text"
                      value={product.sheinUrl}
                      onChange={updateProduct("sheinUrl")}
                      placeholder="https://www.shein.com/..."
                      className="w-full h-12 pl-12 pr-4 border border-[#D3C3C5] rounded-md outline-none italic text-[#6B7280]"
                    />
                  </div>
                </div>

                <div className="col-span-8 lg:col-span-4">
                  <label className="block text-[#5C5F60] text-sm font-medium mb-2">
                    Product Price($)<span className="text-red-500">*</span>
                  </label>

                  <input
                    type="number"
                    value={product.price}
                    onChange={updateProduct("price")}
                    placeholder="0.00 $"
                    className="w-full h-12 px-5 border border-[#D3C3C5] rounded-md outline-none"
                  />
                </div>
              </div>

              {/* Row 3 */}
              <div className="grid grid-cols-3 lg:grid-cols-12 gap-6">
                <div className="col-span-4">
                  <label className="block text-[#5C5F60] text-sm font-medium mb-2">
                    Size<span className="text-red-500">*</span>
                  </label>

                  <div className="relative">
                    <select
                      value={product.size}
                      onChange={updateProduct("size")}
                      className="w-full h-12 px-5 pr-10 border border-[#D3C3C5] rounded-md outline-none appearance-none bg-white cursor-pointer"
                    >
                      <option>XS</option>
                      <option>S</option>
                      <option>M</option>
                      <option>L</option>
                      <option>XL</option>
                      <option>XXL</option>
                    </select>
                    <ChevronDown
                      size={18}
                      className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#5C5F60]"
                    />
                  </div>
                </div>

                <div className="col-span-4">
                  <label className="block text-[#5C5F60] text-sm font-medium mb-2">
                    Color<span className="text-red-500">*</span>
                  </label>

                  <input
                    type="text"
                    value={product.color}
                    onChange={updateProduct("color")}
                    placeholder="Soft Pink"
                    className="w-full h-12 px-5 border border-[#D3C3C5] rounded-md outline-none"
                  />
                </div>

                <div className="col-span-4">
                  <label className="block text-[#5C5F60] text-sm font-medium mb-2">
                    Weight (kg)<span className="text-red-500">*</span>
                  </label>

                  <input
                    type="text"
                    value={product.weight}
                    onChange={updateProduct("weight")}
                    placeholder="0.25"
                    className="w-full h-12 px-5 border border-[#D3C3C5] rounded-md outline-none"
                  />
                </div>
              </div>

              {/* Row 4 */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
                {/* Quantity */}
                <div className="col-span-8 lg:col-span-4">
                  <label className="block text-[#5C5F60] text-sm font-medium mb-2">
                    Quantity
                  </label>

                  <div className="flex w-[195px] h-14 border border-[#D3C3C5] rounded-md overflow-hidden">
                    <button
                      type="button"
                      onClick={() => adjustQuantity(-1)}
                      className="w-16 flex items-center justify-center border-r border-[#D3C3C5]"
                    >
                      <img src={minus} alt="" />
                    </button>

                    <div className="w-16 flex items-center justify-center border-r border-[#D3C3C5] text-lg">
                      {product.quantity}
                    </div>

                    <button
                      type="button"
                      onClick={() => adjustQuantity(1)}
                      className="w-16 flex items-center justify-center"
                    >
                      <img src={plusicon} alt="" />
                    </button>
                  </div>
                </div>

                {/* Toggle */}
                <div className="col-span-8 lg:col-span-4">
                  <label className="block text-[#5C5F60] text-sm font-medium mb-2">
                    Exclude Promotion
                  </label>

                  <button
                    type="button"
                    onClick={() => setExcludePromotion(!excludePromotion)}
                    className={`relative w-[58px] h-[32px] rounded-full transition-all ${
                      excludePromotion ? "bg-[#78555E]" : "bg-[#D1D5DB]"
                    }`}
                  >
                    <span
                      className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all ${
                        excludePromotion ? "left-[30px]" : "left-1"
                      }`}
                    />
                  </button>
                </div>

                {/* Upload */}
                <div className="col-span-8 lg:col-span-4 space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    id="product-image-input"
                    className="hidden"
                    multiple
                    onChange={handleImageSelect}
                  />
                  <label
                    htmlFor="product-image-input"
                    className="w-full h-[104px] border-2 border-dashed border-[#4B4B4B] rounded-lg bg-[#FFF8FA] flex flex-col items-center justify-center gap-2 cursor-pointer"
                  >
                    <img src={camera} className="w-8 h-8" />

                    <span className="text-[#2D141C] text-lg font-medium">
                      + Add Photo
                    </span>
                  </label>

                  {productImages.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {productImages.map((img, index) => (
                        <div
                          key={img.preview}
                          className="relative w-14 h-14 rounded-md overflow-hidden border border-[#D3C3C5]"
                        >
                          <img
                            src={img.preview}
                            alt={`Product ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index)}
                            className="absolute top-0 right-0 h-4 w-4 rounded-full bg-white/90 text-[#2D141C] text-[10px] flex items-center justify-center shadow"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </form>

            <div className="mt-3 border-t border-[#D3C3C5] pt-3">
              <div className="flex justify-end">
                <div className="w-[260px] space-y-2">
                  <div className="flex justify-between">
                    <p className="text-[#5C5F60] font-normal text-sm">
                      Item Total:
                    </p>
                    <p className="text-[#5C5F60] font-normal text-sm">
                      $
                      {(
                        (Number(product.price) || 0) *
                        (Number(product.quantity) || 1)
                      ).toFixed(2)}
                    </p>
                  </div>

                  <div className="flex justify-between">
                    <p className="text-[#141D23] font-semibold text-xl">
                      Grand Total:
                    </p>
                    <p className="text-[#78555E] font-semibold text-xl">
                      $
                      {(
                        (Number(product.price) || 0) *
                        (Number(product.quantity) || 1)
                      ).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewOrders;
