import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import cameraicon from "../assets/cameraicon.webp";
import { toast } from "../components/Toast";
import { formatAddress, getInitials } from "../lib/format";
import apiClient, { getErrorMessage } from "../lib/api/client";
import { ENDPOINTS } from "../lib/api/endpoints";

const SCANNER_REGION_ID = "sku-scanner-region";

const ScanSku = () => {
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const scannerRef = useRef(null);

  const stopScanner = async () => {
    const scanner = scannerRef.current;
    scannerRef.current = null;
    if (scanner) {
      try {
        await scanner.stop();
        await scanner.clear();
      } catch {
        // scanner already stopped
      }
    }
  };

  const fetchBySku = async (sku) => {
    setLoading(true);
    try {
      const { data } = await apiClient.get(
        `${ENDPOINTS.orders.scan}?sku=${encodeURIComponent(sku)}`,
      );
      if (data.success === false) throw new Error(data.message || "SKU not found");

      const item = Array.isArray(data.data) ? data.data[0] : data.data;
      if (!item) throw new Error("SKU not found");

      setResult(item);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to fetch SKU details"));
    } finally {
      setLoading(false);
    }
  };

  const startScan = () => {
    setResult(null);
    setScanning(true);
  };

  useEffect(() => {
    if (!scanning) return;

    const scanner = new Html5Qrcode(SCANNER_REGION_ID);
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        async (decodedText) => {
          await stopScanner();
          setScanning(false);
          fetchBySku(decodedText);
        },
        () => {},
      )
      .catch((err) => {
        const insecure =
          typeof window !== "undefined" && !window.isSecureContext;
        toast.error(
          insecure
            ? "Camera needs HTTPS (or localhost) to work on this device"
            : `Unable to access camera: ${err?.message || err}`,
        );
        setScanning(false);
      });

    return () => {
      stopScanner();
    };
  }, [scanning]);

  const product = result?.productInformation;
  const customer = result?.customerInformation;

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4 text-center px-4">
      {scanning ? (
        <div className="w-full max-w-sm flex flex-col items-center gap-4">
          <div
            id={SCANNER_REGION_ID}
            className="w-full rounded-lg overflow-hidden"
          />
          <button
            onClick={() => {
              stopScanner();
              setScanning(false);
            }}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-[#D24D77] border hover:bg-[#FFE8EF] transition"
          >
            Cancel
          </button>
        </div>
      ) : loading ? (
        <p className="text-sm font-semibold text-[#5C5F60]">
          Fetching SKU details...
        </p>
      ) : result ? (
        <div className="w-full max-w-sm flex flex-col gap-4 text-left">
          {product && (
            <div className="border border-[#D3C3C5] rounded-xl p-4 bg-[#F6FAFF] flex gap-3">
              {product.photoUrl && (
                <img
                  src={product.photoUrl}
                  alt={product.productName}
                  className="h-16 w-16 rounded-lg object-cover shrink-0"
                />
              )}
              <div>
                <p className="text-sm font-bold text-[#141D23] leading-snug">
                  {product.productName}
                </p>
                <p className="text-xs text-[#5C5F60] mt-1">
                  SKU: {product.skuCode}
                </p>
                <p className="text-xs text-[#5C5F60] mt-0.5">
                  {[product.size, product.color].filter(Boolean).join(" / ")}
                  {product.quantity ? ` · Qty ${product.quantity}` : ""}
                </p>
                <p className="text-xs font-semibold text-[#8A6A72] mt-0.5">
                  ${product.promotionalPrice ?? product.price}
                  {product.promotionalPrice &&
                    product.promotionalPrice !== product.price && (
                      <span className="line-through text-[#8C959F] font-normal ml-1">
                        ${product.price}
                      </span>
                    )}
                </p>
              </div>
            </div>
          )}

          {customer && (
            <div className="border border-[#D3C3C5] rounded-xl p-4 bg-[#F6FAFF] flex flex-col gap-3">
              <div className="flex gap-3 items-center">
                <div className="h-10 w-10 rounded-full bg-[#FFE8EF] text-[#D24D77] flex items-center justify-center text-xs font-bold shrink-0">
                  {getInitials(customer.customerName)}
                </div>
                <div>
                  <p className="text-sm font-bold text-[#141D23]">
                    {customer.customerName}
                  </p>
                  <p className="text-xs text-[#5C5F60] mt-0.5">
                    Order {customer.orderId} · {customer.status}
                  </p>
                </div>
              </div>
              <div className="text-xs text-[#5C5F60] flex flex-col gap-1">
                {customer.customerPhone && <p>{customer.customerPhone}</p>}
                {customer.customerEmail && <p>{customer.customerEmail}</p>}
                {customer.customerAddress && (
                  <p>{formatAddress(customer.customerAddress)}</p>
                )}
                {customer.paymentMethod && (
                  <p>Payment: {customer.paymentMethod}</p>
                )}
                {customer.customerMessage && (
                  <p>Message: {customer.customerMessage}</p>
                )}
              </div>
            </div>
          )}

          <button
            onClick={startScan}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-[#D24D77] border hover:bg-[#FFE8EF] transition"
          >
            Scan Again
          </button>
        </div>
      ) : (
        <>
          <button onClick={startScan} className="cursor-pointer">
            <img src={cameraicon} alt="Scan SKU" className="h-16 w-16" />
          </button>
          <p className="text-sm font-semibold text-[#5C5F60]">
            Tap the camera to scan SKU for details
          </p>
        </>
      )}
    </div>
  );
};

export default ScanSku;
