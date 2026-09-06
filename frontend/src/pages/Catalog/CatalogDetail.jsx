// frontend/src/pages/Catalog/CatalogDetail.jsx
import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
} from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { addToCart } from "../../slices/cartSlice";
import stockProductService from "../../api/stockProductService";
import { Helmet } from 'react-helmet-async';

const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || "http://localhost:5000";

const STOCK_LABELS = {
  in_stock: { label: "În stoc", color: "success" },
  in_supplier_stock: { label: "Stoc furnizor", color: "warning" },
  not_in_stock: { label: "Indisponibil", color: "danger" },
};

// Wrapper care stilizeaza HTML dinamic, inclusiv tabelele venite din MongoDB
function RichContent({ html }) {
  const wrapperRef = useRef(null);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    el.querySelectorAll("table").forEach((table) => {
      table.removeAttribute("width");
      table.removeAttribute("cellpadding");
      table.removeAttribute("cellspacing");
      table.removeAttribute("border");

      table.style.removeProperty("width");
      table.style.removeProperty("height");
      table.style.removeProperty("min-width");
      table.style.removeProperty("max-width");

      table.style.setProperty("border-collapse", "collapse", "important");
      table.style.setProperty("table-layout", "auto", "important");
      table.style.setProperty("width", "auto", "important");
      table.style.setProperty("max-width", "100%", "important");
      table.style.setProperty("font-size", "0.9rem", "important");
      table.style.setProperty("margin-bottom", "1rem", "important");
      table.style.setProperty("display", "inline-table", "important");

      if (!table.parentElement?.classList.contains("rich-table-wrap")) {
        const wrap = document.createElement("div");

        wrap.className = "rich-table-wrap";
        wrap.style.overflowX = "auto";
        wrap.style.maxWidth = "100%";
        wrap.style.marginBottom = "1rem";

        table.parentNode.insertBefore(wrap, table);
        wrap.appendChild(table);
      }
    });

    el.querySelectorAll("tr").forEach((row) => {
      const cells = row.querySelectorAll("th, td");

      cells.forEach((cell, index) => {
        cell.removeAttribute("width");

        cell.style.removeProperty("width");
        cell.style.removeProperty("height");
        cell.style.removeProperty("min-width");
        cell.style.removeProperty("max-width");

        if (
          cell.childNodes.length === 1 &&
          cell.childNodes[0].nodeType === Node.TEXT_NODE
        ) {
          cell.textContent = cell.textContent.replace(/\u00a0/g, " ").trim();
        }

        cell.style.setProperty("border", "1px solid #dee2e6", "important");
        cell.style.setProperty("padding", "6px 10px", "important");
        cell.style.setProperty("text-align", "left", "important");
        cell.style.setProperty("vertical-align", "top", "important");
        cell.style.setProperty("color", "#212529", "important");
        cell.style.setProperty("opacity", "1", "important");
        cell.style.setProperty("background-color", "#ffffff", "important");
        cell.style.setProperty("white-space", "normal", "important");
        cell.style.setProperty("word-break", "normal", "important");
        cell.style.setProperty("overflow-wrap", "break-word", "important");

        if (index === 0) {
          cell.style.setProperty("width", "1%", "important");
          cell.style.setProperty("max-width", "220px", "important");
          cell.style.setProperty("font-weight", "600", "important");
          cell.style.setProperty("background-color", "#f8f9fa", "important");
        } else {
          cell.style.setProperty("max-width", "260px", "important");
        }
      });
    });

    el.querySelectorAll("img").forEach((img) => {
      img.style.setProperty("max-width", "100%", "important");
      img.style.setProperty("height", "auto", "important");
    });
  }, [html]);

  return (
    <div
      ref={wrapperRef}
      className="rich-content"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export default function CatalogDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  const requestIdRef = useRef(0);

  const getImageUrl = useCallback((image) => {
    if (!image) return null;

    if (image.startsWith("http://") || image.startsWith("https://")) {
      return image;
    }

    return `${API_ORIGIN}${image.startsWith("/") ? image : `/${image}`}`;
  }, []);

  const fetchProduct = useCallback(async () => {
    const currentRequestId = ++requestIdRef.current;
    setLoading(true);

    try {
      const data = await stockProductService.getById(id);

      if (currentRequestId !== requestIdRef.current) return;

      if (!data || !data._id) {
        setProduct(null);
        toast.error("Produsul nu a fost găsit.");
        navigate("/catalog", { replace: true });
        return;
      }

      setProduct(data);
    } catch (err) {
      if (currentRequestId !== requestIdRef.current) return;

      console.error("Eroare la încărcare produs:", err);
      toast.error("Nu am putut încărca produsul.");
      navigate("/catalog", { replace: true });
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setLoading(false);
        setInitialized(true);
      }
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  const stockInfo = useMemo(() => {
    return STOCK_LABELS[product?.stock] || STOCK_LABELS.not_in_stock;
  }, [product?.stock]);

  const imageUrl = useMemo(() => {
    return getImageUrl(product?.image);
  }, [product?.image, getImageUrl]);

  const hasPrice = useMemo(() => {
    return typeof product?.price === "number" && Number.isFinite(product.price);
  }, [product?.price]);

  const handleAddToCart = useCallback(() => {
    if (!product) return;

    dispatch(addToCart(product));
    toast.success(`${product.title} a fost adăugat în coș.`);
  }, [dispatch, product]);

  const handleGoBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  if (loading && !initialized) {
    return (
      <div className="container py-4 py-lg-5">
        <div className="mb-4">
          <span className="placeholder col-2 btn btn-outline-secondary disabled"></span>
        </div>

        <div className="row g-4">
          <div className="col-md-5 col-lg-4">
            <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
              <div className="placeholder-glow p-3">
                <span
                  className="placeholder w-100 rounded-3"
                  style={{
                    height: "360px",
                    display: "block",
                  }}
                ></span>
              </div>
            </div>
          </div>

          <div className="col-md-7 col-lg-8">
            <div className="placeholder-glow mb-3">
              <span className="placeholder col-3"></span>
            </div>

            <div className="placeholder-glow mb-3">
              <span className="placeholder col-8"></span>
            </div>

            <div className="placeholder-glow mb-3">
              <span className="placeholder col-2"></span>
            </div>

            <div className="placeholder-glow mb-4">
              <span className="placeholder col-4 btn btn-success disabled"></span>
            </div>

            <div className="placeholder-glow mb-2">
              <span className="placeholder col-12"></span>
            </div>

            <div className="placeholder-glow mb-2">
              <span className="placeholder col-10"></span>
            </div>

            <div className="placeholder-glow">
              <span className="placeholder col-9"></span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container py-5">
        <div className="card border-0 shadow-sm rounded-4">
          <div className="card-body text-center py-5">
            <i className="ri-file-search-line display-5 text-muted mb-3"></i>

            <h4 className="fw-bold">Produsul nu a fost găsit</h4>

            <p className="text-muted mb-4">
              Este posibil ca produsul să nu mai fie disponibil sau linkul să
              fie invalid.
            </p>

            <Link to="/catalog" className="btn btn-primary">
              Înapoi la catalog
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4 py-lg-5">
      <Helmet>
        <title>{product.title} - Piese Auto America</title>
        <meta
          name="description"
          content={
            product.short_description
              ? product.short_description.slice(0, 160)
              : `${product.title} – Cod: ${product.code || 'N/A'}. Disponibil în stoc la Piese Auto America.`
          }
        />
        <meta property="og:title" content={`${product.title} - Piese Auto America`} />
        <meta
          property="og:description"
          content={
            product.short_description
              ? product.short_description.slice(0, 160)
              : `${product.title} disponibil în stoc. Livrare rapidă.`
          }
        />
        {imageUrl && <meta property="og:image" content={imageUrl} />}
        <meta property="og:type" content="product" />
      </Helmet>
      <div className="d-flex flex-wrap gap-2 mb-4">
        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={handleGoBack}
        >
          <i className="ri-arrow-left-line me-1"></i>
          Înapoi
        </button>

        <Link to="/cart" className="btn btn-outline-primary">
          <i className="ri-shopping-cart-line me-1"></i>
          Vezi coșul
        </Link>
      </div>

      <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
        <div className="card-body p-3 p-md-4 p-lg-5">
          <div className="row g-4 g-lg-5 align-items-start">
            <div className="col-md-5 col-lg-4">
              <div className="border rounded-4 bg-white d-flex align-items-center justify-content-center p-3">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={product.title || "Produs"}
                    className="img-fluid"
                    style={{
                      maxHeight: "420px",
                      width: "100%",
                      objectFit: "contain",
                    }}
                  />
                ) : (
                  <div
                    className="bg-light rounded-4 d-flex align-items-center justify-content-center w-100"
                    style={{
                      minHeight: "320px",
                    }}
                  >
                    <div className="text-center text-muted">
                      <i
                        className="ri-image-line"
                        style={{
                          fontSize: 64,
                        }}
                      ></i>

                      <div className="mt-2">Fără imagine disponibilă</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="col-md-7 col-lg-8">
              <div className="text-muted mb-2">
                Cod: <strong>{product.code || "—"}</strong>
              </div>

              <h1 className="h2 fw-bold mb-3">
                {product.title || "Produs fără denumire"}
              </h1>

              <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
                <span className={`badge bg-${stockInfo.color} px-3 py-2`}>
                  {stockInfo.label}
                </span>

                {hasPrice ? (
                  <div className="d-flex flex-column">
                    <span className="fs-4 fw-bold text-primary">
                      {(product.price * 1.21).toFixed(2)} {product.currency || "RON"} (cu TVA)
                    </span>
                    <span className="text-muted small">
                      {product.price.toFixed(2)} {product.currency || "RON"} (fără TVA)
                    </span>
                  </div>
                ) : (
                  <span className="fs-5 fw-semibold text-muted">
                    Preț la cerere
                  </span>
                )}
              </div>

              <div className="d-flex flex-wrap gap-2 mb-4">
                <button
                  type="button"
                  className="btn btn-success px-4 py-2"
                  onClick={handleAddToCart}
                >
                  <i className="ri-shopping-cart-2-line me-1"></i>
                  Adaugă în coș
                </button>
              </div>

              {product.short_description && (
                <div className="mb-4">
                  <p
                    className="text-muted mb-0"
                    style={{
                      whiteSpace: "pre-line",
                    }}
                  >
                    {product.short_description}
                  </p>
                </div>
              )}

              {product.content && (
                <div className="border-top pt-4">
                  <h5 className="fw-bold mb-3">Descriere produs</h5>

                  <RichContent html={product.content} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}