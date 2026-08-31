import { useEffect, useState } from "react";
import { Pencil, Trash2, Search, Store } from "lucide-react";
import SuccessToast from "../components/common/SuccessToast";
import apiClient, { API_ORIGIN, getErrorMessage } from "../lib/api/client";
import { ENDPOINTS } from "../lib/api/endpoints";
import addnewordericon from "../assets/addnewproduct.svg";
import plusicon from "../assets/plusicon.svg";
import minus from "../assets/minusicon.svg";
import camera from "../assets/cameraicon.svg";

const emptyForm = {
  productName: "",
  skuCode: "",
  tag: "",
  description: "",
  price: "",
  size: "",
  color: "",
  quantity: 1,
};

const toForm = (product) => ({
  productName: product.name,
  skuCode: product.skuCode || "",
  tag: product.tag || "",
  description: product.description || "",
  price: String(product.price ?? ""),
  size: product.size || "",
  color: product.color || "",
  quantity: product.stockQuantity ?? 1,
});

const TAGS = ["Fast Delivery", "Local Stock", "New Product"];

const fieldClass =
  "w-full h-12 px-4 border border-[#D3C3C5] rounded-md text-[15px] bg-white outline-none transition duration-150 focus:border-[#78555E] focus:ring-2 focus:ring-[#FFD1DC]";
const label = "block text-[#5C5F60] text-sm font-medium mb-2";
const pressable = "transition duration-150 motion-safe:active:scale-[0.97]";
const rowAction = `${pressable} flex items-center gap-1.5 px-3 py-1.5 border border-[#D6C5CC] rounded-lg text-xs font-bold text-[#7A5C69] hover:bg-[#F9F5F6] cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#78555E]`;
const primaryBtn = `${pressable} h-12 bg-[#FFD1DC] hover:bg-[#FFD1DC]/60 text-[#2D141C] border border-[#D3C3C5] font-normal px-5 rounded-sm whitespace-nowrap text-sm lg:text-base cursor-pointer shadow-sm flex items-center gap-1.5 outline-none focus-visible:ring-2 focus-visible:ring-[#78555E] disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100`;
const secondaryBtn = `${pressable} h-12 bg-white/50 hover:bg-white text-[#141D23] border border-[#D3C3C5] font-normal px-5 rounded-sm whitespace-nowrap text-sm lg:text-base cursor-pointer shadow-sm flex items-center gap-1.5 outline-none focus-visible:ring-2 focus-visible:ring-[#78555E]`;

const fmtDate = (value) => {
  const d = value ? new Date(value) : null;
  return d && !isNaN(d)
    ? d.toLocaleDateString("en-AU", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";
};

const stockTone = (qty) =>
  qty === 0
    ? "bg-red-50 text-red-600 border-red-200"
    : qty < 15
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : "bg-emerald-50 text-emerald-700 border-emerald-200";

const LIMIT = 20;

// `images` come back as server-relative paths, so they need the API origin
const imageUrl = (path) =>
  !path || path.startsWith("http") ? path : `${API_ORIGIN}${path}`;

// falls back to the Store icon when there is no photo, or the URL fails to load
const Thumb = ({ src, alt = "" }) => {
  const [failed, setFailed] = useState(false);

  return src && !failed ? (
    <img
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      className="h-12 w-12 rounded-md object-cover border border-[#D3C3C5] shrink-0"
    />
  ) : (
    <div className="h-12 w-12 rounded-md bg-[#FFF8FA] border border-[#D3C3C5] flex items-center justify-center text-[#B9A6AB] shrink-0">
      <Store size={18} />
    </div>
  );
};

const NewOrders = () => {
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [listLoading, setListLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [pendingDelete, setPendingDelete] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // null = listing, otherwise the product being edited ({} for a new one)
  const [editing, setEditing] = useState(null);
  const [product, setProduct] = useState(emptyForm);
  const [touched, setTouched] = useState({});
  const [productImages, setProductImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const timer = setTimeout(
      async () => {
        setListLoading(true);
        setError(null);
        try {
          const { data } = await apiClient.get(ENDPOINTS.marketplace.list, {
            params: { page, limit: LIMIT, search: query.trim() },
          });
          // the list payload has moved around, so accept the usual shapes
          const payload = data?.data ?? data;
          const rows = Array.isArray(payload)
            ? payload
            : payload?.products || payload?.items || payload?.rows || [];
          setProducts(rows);
          setTotal(Number(payload?.total ?? payload?.count ?? rows.length));
        } catch (err) {
          setError(getErrorMessage(err, "Failed to load products"));
        } finally {
          setListLoading(false);
        }
      },
      query ? 300 : 0,
    );
    return () => clearTimeout(timer);
  }, [query, page, refreshKey]);

  const errors = {
    productName: product.productName.trim() ? null : "Product name is required",
    description: product.description.trim() ? null : "Description is required",
    price: Number(product.price) > 0 ? null : "Enter a price greater than 0",
  };
  const isValid = !errors.productName && !errors.description && !errors.price;
  const showError = (name) => (touched[name] ? errors[name] : null);
  const markTouched = (name) => () =>
    setTouched((prev) => ({ ...prev, [name]: true }));

  const openForm = (existing) => {
    setProduct(existing ? toForm(existing) : emptyForm);
    setEditing(existing || {});
    setTouched({});
    setProductImages([]);
    setError(null);
  };

  const closeForm = () => {
    productImages.forEach((img) => URL.revokeObjectURL(img.preview));
    setProductImages([]);
    setEditing(null);
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

  // one tag per product; clicking the active chip clears it
  const toggleTag = (tag) =>
    setProduct((prev) => ({ ...prev, tag: prev.tag === tag ? "" : tag }));

  const adjustQuantity = (delta) => {
    setProduct((prev) => ({
      ...prev,
      quantity: Math.max(0, Number(prev.quantity || 0) + delta),
    }));
  };

  const confirmDelete = async () => {
    const target = pendingDelete;
    setPendingDelete(null);
    try {
      await apiClient.delete(ENDPOINTS.marketplace.byId(target.id));
      setProducts((prev) => prev.filter((p) => p.id !== target.id));
      setTotal((prev) => Math.max(0, prev - 1));
      setSuccessMessage(`"${target.name}" deleted`);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to delete product"));
    }
  };

  const handleSave = async () => {
    setTouched({ productName: true, description: true, price: true });
    if (!isValid) return;

    const draft = {
      name: product.productName.trim(),
      description: product.description.trim(),
      price: Number(product.price) || 0,
      stockQuantity: Number(product.quantity) || 0,
      skuCode: product.skuCode.trim(),
      size: product.size.trim(),
      color: product.color.trim(),
      tag: product.tag,
    };

    setLoading(true);
    setError(null);
    try {
      if (!localStorage.getItem("token")) {
        throw new Error("You are not logged in. Please log in again.");
      }

      const formData = new FormData();
      formData.append("name", draft.name);
      formData.append("description", draft.description);
      formData.append("price", String(draft.price));
      formData.append("stockQuantity", String(draft.stockQuantity));
      formData.append("size", draft.size);
      formData.append("color", draft.color);
      formData.append("skuCode", draft.skuCode);
      formData.append("tag", draft.tag);
      productImages.forEach(({ file }) => formData.append("photos", file));

      const { data } = editing.id
        ? await apiClient.put(ENDPOINTS.marketplace.byId(editing.id), formData)
        : await apiClient.post(ENDPOINTS.marketplace.create, formData);

      const saved = data?.data;
      if (editing.id) {
        setProducts((prev) =>
          prev.map((p) =>
            p.id === editing.id ? saved || { ...p, ...draft } : p,
          ),
        );
        setSuccessMessage("Product updated");
      } else {
        setPage(1);
        setRefreshKey((k) => k + 1);
        setSuccessMessage("Product created successfully!");
      }
      closeForm();
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          editing.id ? "Failed to update product" : "Failed to create product",
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  const existingPhotos = (editing?.images || []).map(imageUrl);
  const term = query.trim();
  const pages = Math.max(1, Math.ceil(total / LIMIT));

  const grandTotal =
    (Number(product.price) || 0) * (Number(product.quantity) || 0);

  return (
    <div className="p-4 lg:p-8 bg-[#FFD1DC]/20 min-h-[calc(100vh-70px)] space-y-6">
      <SuccessToast
        message={successMessage}
        onClose={() => setSuccessMessage(null)}
      />

      {/* Header */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between lg:items-center">
        <div>
          <h1 className="text-2xl lg:text-[32px] font-bold text-[#17222B] tracking-tight">
            {!editing
              ? "Marketplace"
              : editing.id
                ? "Edit Product"
                : "New Product"}
          </h1>
          <p className="text-sm lg:text-base text-[#5C5F60]/80 mt-1 font-semibold">
            {!editing
              ? `${total} product${total === 1 ? "" : "s"} listed`
              : "Products you add here appear in your marketplace"}
          </p>
        </div>

        <div className="flex gap-2">
          {!editing ? (
            <>
              <div className="relative flex-1 lg:w-64">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#5C5F60]"
                />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search products"
                  className={`${fieldClass} pl-9`}
                />
              </div>
              <button
                type="button"
                onClick={() => openForm(null)}
                className={primaryBtn}
              >
                <img src={addnewordericon} alt="" className="h-4 w-4" />
                Add Product
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={closeForm}
                className={secondaryBtn}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loading || !isValid}
                onClick={handleSave}
                className={primaryBtn}
              >
                <img src={addnewordericon} alt="" className="h-4 w-4" />
                {loading
                  ? "Saving..."
                  : editing.id
                    ? "Save Changes"
                    : "Create Product"}
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-300 text-red-600 text-sm font-medium rounded-md px-4 py-3">
          {error}
        </div>
      )}

      {/* Listing */}
      {!editing && (
        <div className="bg-white border border-[#D8D8D8] rounded-lg overflow-hidden">
          {listLoading ? (
            <div className="py-20 text-center text-sm text-[#5C5F60]">
              Loading products…
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20 px-6 text-center">
              <Store size={32} className="text-[#B9A6AB]" />
              <p className="text-[#17222B] font-semibold">
                {term ? "No products match that search" : "No products yet"}
              </p>
              <p className="text-sm text-[#5C5F60]">
                {term
                  ? "Try a different name."
                  : "Add your first product to see it listed here."}
              </p>
              {!term && (
                <button
                  type="button"
                  onClick={() => openForm(null)}
                  className={`${rowAction} mt-1`}
                >
                  + Add Product
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#F8F5F7] border-b border-[#D8D8D8]">
                  <tr>
                    {["Product", "SKU", "Price", "Stock", "Added", ""].map(
                      (head) => (
                        <th
                          key={head}
                          className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-[#5C5F60] whitespace-nowrap"
                        >
                          {head}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {products.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-[#EFE7EA] last:border-0 hover:bg-[#FDFAFB] transition duration-150"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <Thumb src={imageUrl(item.images?.[0])} />
                          <div className="min-w-0">
                            <p className="font-semibold text-[#17222B] truncate">
                              {item.name}
                            </p>
                            <p className="text-sm text-[#5C5F60] truncate max-w-[420px]">
                              {item.description}
                            </p>
                            {item.tag && (
                              <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full bg-[#FFF1F5] border border-[#E8D3D9] text-[11px] font-semibold text-[#7A5C69]">
                                {item.tag}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-[#5C5F60] whitespace-nowrap font-mono">
                        {item.skuCode || "—"}
                      </td>
                      <td className="px-5 py-4 font-semibold text-[#78555E] whitespace-nowrap">
                        ${Number(item.price).toFixed(2)}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full border text-xs font-bold whitespace-nowrap ${stockTone(
                            item.stockQuantity,
                          )}`}
                        >
                          {item.stockQuantity === 0
                            ? "Out of stock"
                            : `${item.stockQuantity} in stock`}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-[#5C5F60] whitespace-nowrap">
                        {fmtDate(item.createdAt)}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openForm(item)}
                            className={rowAction}
                          >
                            <Pencil size={14} />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setPendingDelete(item)}
                            className={`${rowAction} text-red-600 border-red-200 hover:bg-red-50`}
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!listLoading && pages > 1 && (
            <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-[#EFE7EA]">
              <p className="text-sm text-[#5C5F60]">
                Page {page} of {pages}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className={`${rowAction} disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={page >= pages}
                  onClick={() => setPage((p) => p + 1)}
                  className={`${rowAction} disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add / edit form */}
      {editing && (
        <form
          className="max-w-4xl space-y-6"
          onSubmit={(e) => e.preventDefault()}
        >
          <section className="bg-white p-6 border border-[#D3C3C5] rounded-lg space-y-6">
            <h2 className="text-lg font-semibold text-[#17222B]">Product</h2>

            <div>
              <label htmlFor="productName" className={label}>
                Product Name<span className="text-red-500">*</span>
              </label>
              <input
                id="productName"
                type="text"
                value={product.productName}
                onChange={updateProduct("productName")}
                onBlur={markTouched("productName")}
                aria-invalid={Boolean(showError("productName"))}
                placeholder="e.g. Contrast Lace Camisole"
                className={`${fieldClass} ${
                  showError("productName") ? "border-red-400" : ""
                }`}
              />
              {showError("productName") && (
                <p className="mt-1.5 text-sm text-red-600">
                  {showError("productName")}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="description" className={label}>
                Description<span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                rows={4}
                value={product.description}
                onChange={updateProduct("description")}
                onBlur={markTouched("description")}
                aria-invalid={Boolean(showError("description"))}
                placeholder="Fabric, fit, care instructions, anything the buyer should know"
                className={`${fieldClass} h-auto py-3 resize-y ${
                  showError("description") ? "border-red-400" : ""
                }`}
              />
              {showError("description") && (
                <p className="mt-1.5 text-sm text-red-600">
                  {showError("description")}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label htmlFor="skuCode" className={label}>
                  SKU
                </label>
                <input
                  id="skuCode"
                  type="text"
                  value={product.skuCode}
                  onChange={updateProduct("skuCode")}
                  placeholder="e.g. SH-CAM-LACE-02"
                  className={fieldClass}
                />
              </div>

              <div>
                <label htmlFor="size" className={label}>
                  Size
                </label>
                <input
                  id="size"
                  type="text"
                  value={product.size}
                  onChange={updateProduct("size")}
                  placeholder="e.g. M, or 8 / UK 12"
                  className={fieldClass}
                />
              </div>

              <div>
                <label htmlFor="color" className={label}>
                  Color
                </label>
                <input
                  id="color"
                  type="text"
                  value={product.color}
                  onChange={updateProduct("color")}
                  placeholder="Soft Pink"
                  className={fieldClass}
                />
              </div>
            </div>

            <fieldset>
              <legend className={label}>Tag</legend>
              <div className="flex flex-wrap gap-2">
                {TAGS.map((tag) => {
                  const active = product.tag === tag;
                  return (
                    <button
                      key={tag}
                      type="button"
                      aria-pressed={active}
                      onClick={() => toggleTag(tag)}
                      className={`${pressable} px-3 py-1.5 rounded-full border text-sm font-medium cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#78555E] ${
                        active
                          ? "bg-[#FFD1DC] border-[#D3C3C5] text-[#2D141C]"
                          : "bg-white border-[#D3C3C5] text-[#5C5F60] hover:bg-[#FFF8FA]"
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div className="space-y-3">
              <span className={label}>Photos</span>
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
                className={`${pressable} w-full max-w-md h-[104px] border-2 border-dashed border-[#D3C3C5] hover:border-[#78555E] rounded-lg bg-[#FFF8FA] flex flex-col items-center justify-center gap-2 cursor-pointer`}
              >
                <img src={camera} alt="" className="w-8 h-8" />
                <span className="text-[#2D141C] text-base font-medium">
                  + Add Photo
                </span>
              </label>

              {(existingPhotos.length > 0 || productImages.length > 0) && (
                <div className="flex flex-wrap gap-3">
                  {existingPhotos.map((url) => (
                    <img
                      key={url}
                      src={url}
                      alt="Product"
                      className="w-20 h-20 object-cover rounded-md border border-[#D3C3C5]"
                    />
                  ))}
                  {productImages.map((img, index) => (
                    <div key={img.preview} className="relative w-20 h-20">
                      <img
                        src={img.preview}
                        alt={`New photo ${index + 1}`}
                        className="w-full h-full object-cover rounded-md border border-[#D3C3C5]"
                      />
                      <button
                        type="button"
                        aria-label={`Remove photo ${index + 1}`}
                        onClick={() => handleRemoveImage(index)}
                        className={`${pressable} absolute -top-2 -right-2 h-7 w-7 rounded-full bg-white text-[#2D141C] text-xs flex items-center justify-center shadow border border-[#D3C3C5] cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#78555E]`}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="bg-white p-6 border border-[#D3C3C5] rounded-lg space-y-6">
            <h2 className="text-lg font-semibold text-[#17222B]">
              Pricing &amp; Stock
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label htmlFor="price" className={label}>
                  Product Price ($)<span className="text-red-500">*</span>
                </label>
                <input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={product.price}
                  onChange={updateProduct("price")}
                  onBlur={markTouched("price")}
                  aria-invalid={Boolean(showError("price"))}
                  placeholder="0.00"
                  className={`${fieldClass} ${
                    showError("price") ? "border-red-400" : ""
                  }`}
                />
                {showError("price") && (
                  <p className="mt-1.5 text-sm text-red-600">
                    {showError("price")}
                  </p>
                )}
              </div>

              <div>
                <span className={label}>Stock</span>
                <div className="flex max-w-[180px] h-12 border border-[#D3C3C5] rounded-md overflow-hidden">
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    onClick={() => adjustQuantity(-1)}
                    className={`${pressable} w-14 flex items-center justify-center border-r border-[#D3C3C5] hover:bg-[#FFF8FA] cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#78555E]`}
                  >
                    <img src={minus} alt="" />
                  </button>

                  <div
                    aria-live="polite"
                    className="flex-1 flex items-center justify-center border-r border-[#D3C3C5] text-lg"
                  >
                    {product.quantity}
                  </div>

                  <button
                    type="button"
                    aria-label="Increase quantity"
                    onClick={() => adjustQuantity(1)}
                    className={`${pressable} w-14 flex items-center justify-center hover:bg-[#FFF8FA] cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#78555E]`}
                  >
                    <img src={plusicon} alt="" />
                  </button>
                </div>
              </div>
            </div>

            <div className="border-t border-[#D3C3C5] pt-4 flex justify-end">
              <div className="w-[260px] flex justify-between items-baseline">
                <p className="text-[#141D23] font-semibold text-xl">
                  Stock Value:
                </p>
                <p className="text-[#78555E] font-semibold text-xl">
                  ${grandTotal.toFixed(2)}
                </p>
              </div>
            </div>
          </section>
        </form>
      )}

      {/* Delete confirmation */}
      {pendingDelete && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Confirm delete"
          className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4"
          onClick={() => setPendingDelete(null)}
        >
          <div
            className="bg-white rounded-lg border border-[#D3C3C5] shadow-lg w-full max-w-sm p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h2 className="text-lg font-semibold text-[#17222B]">
                Delete product?
              </h2>
              <p className="text-sm text-[#5C5F60] mt-1">
                &ldquo;{pendingDelete.name}&rdquo; will be removed from the
                marketplace. This can&rsquo;t be undone.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                className={`${pressable} h-10 px-4 border border-[#D3C3C5] rounded-sm text-sm cursor-pointer hover:bg-[#FFF8FA] outline-none focus-visible:ring-2 focus-visible:ring-[#78555E]`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className={`${pressable} h-10 px-4 bg-red-600 hover:bg-red-700 text-white rounded-sm text-sm cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-red-700`}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewOrders;
