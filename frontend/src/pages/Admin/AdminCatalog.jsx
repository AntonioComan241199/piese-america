// frontend/src/pages/Admin/AdminCatalog.jsx
import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Modal } from "react-bootstrap";
import { toast } from "react-toastify";
import stockProductService from "../../api/stockProductService";

const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || "http://localhost:5000";
const PAGE_SIZE = 20;

const STOCK_LABELS = {
  in_stock: { label: "În stoc", color: "success" },
  in_supplier_stock: { label: "Stoc furnizor", color: "warning" },
  not_in_stock: { label: "Indisponibil", color: "danger" },
};

// ─── ActionButtons component ────────────────────────────────────────────────
function ActionButtons({ product, deletingId, openDeleteModal, returnTo }) {
  const isDeleting = deletingId === product._id;

  return (
    <div className="d-flex flex-wrap gap-2">
      <Link
        to={`/admin/catalog/${product._id}/edit`}
        state={{ returnTo }}
        className="btn btn-sm btn-outline-primary"
        aria-label={`Editează ${product.title || "produs"}`}
        style={{ cursor: "pointer" }}
        onClick={(e) => e.stopPropagation()}
      >
        <i className="ri-edit-line me-1"></i>
        <span className="d-inline d-xl-none">Editează</span>
      </Link>

      <button
        type="button"
        className="btn btn-sm btn-outline-danger"
        style={{ cursor: "pointer" }}
        onClick={(e) => {
          e.stopPropagation();
          openDeleteModal(product);
        }}
        disabled={isDeleting}
        aria-label={`Șterge ${product.title || "produs"}`}
      >
        {isDeleting ? (
          <span
            className="spinner-border spinner-border-sm"
            role="status"
            aria-hidden="true"
          />
        ) : (
          <>
            <i className="ri-delete-bin-line me-1"></i>
            <span className="d-inline d-xl-none">Șterge</span>
          </>
        )}
      </button>
    </div>
  );
}
// ────────────────────────────────────────────────────────────────────────────

export default function AdminCatalog() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const returnTo = `${location.pathname}${location.search}`;

  const initialPage = Number(searchParams.get("page")) || 1;
  const initialSearch = searchParams.get("search") || "";

  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(initialPage);
  const [pages, setPages] = useState(1);

  const [search, setSearch] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);

  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  const requestIdRef = useRef(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 350);

    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const params = {};

    if (page > 1) params.page = String(page);
    if (debouncedSearch) params.search = debouncedSearch;

    setSearchParams(params, { replace: true });
  }, [page, debouncedSearch, setSearchParams]);


  const getImageUrl = useCallback((image) => {
    if (!image) return null;

    if (image.startsWith("http://") || image.startsWith("https://")) {
      return image;
    }

    return `${API_ORIGIN}${image.startsWith("/") ? image : `/${image}`}`;
  }, []);

  const loadProducts = useCallback(
    async (pageNum = page, searchValue = debouncedSearch) => {
      const currentRequestId = ++requestIdRef.current;
      setLoading(true);

      try {
        const res = await stockProductService.getAll({
          page: pageNum,
          limit: PAGE_SIZE,
          search: searchValue,
        });

        if (currentRequestId !== requestIdRef.current) return;

        const safeProducts = Array.isArray(res?.products) ? res.products : [];

        const totalProducts =
          res?.total ?? res?.pagination?.totalProducts ?? safeProducts.length;

        const totalPages = res?.pages ?? res?.pagination?.totalPages ?? 1;

        setProducts(safeProducts);
        setTotal(totalProducts);
        setPages(totalPages);
      } catch (err) {
        if (currentRequestId !== requestIdRef.current) return;

        console.error("Eroare la încărcare produse:", err);
        setProducts([]);
        setTotal(0);
        setPages(1);
        toast.error("Eroare la încărcarea produselor.");
      } finally {
        if (currentRequestId === requestIdRef.current) {
          setLoading(false);
          setInitialized(true);
        }
      }
    },
    [page, debouncedSearch]
  );

  useEffect(() => {
    loadProducts(page, debouncedSearch);
  }, [page, debouncedSearch, loadProducts]);

  const handleSearchChange = useCallback((e) => {
    setSearch(e.target.value);
    setPage(1);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearch("");
    setPage(1);
  }, []);

  const openDeleteModal = useCallback((product) => {
    setProductToDelete(product);
    setShowDeleteModal(true);
  }, []);

  const closeDeleteModal = useCallback(() => {
    if (deletingId) return;

    setShowDeleteModal(false);
    setProductToDelete(null);
  }, [deletingId]);

  const goToEditPage = useCallback(
    (productId) => {
      if (!productId) return;

      navigate(`/admin/catalog/${productId}/edit`, {
        state: { returnTo },
      });
    },
    [navigate, returnTo]
  );

  const handleRowClick = useCallback(
    (productId) => {
      goToEditPage(productId);
    },
    [goToEditPage]
  );

  const handleRowKeyDown = useCallback(
    (e, productId) => {
      if (e.key !== "Enter" && e.key !== " ") return;

      e.preventDefault();
      goToEditPage(productId);
    },
    [goToEditPage]
  );

  const confirmDelete = useCallback(async () => {
    if (!productToDelete?._id) return;

    setDeletingId(productToDelete._id);

    try {
      await stockProductService.remove(productToDelete._id);

      toast.success("Produsul a fost șters.");

      const isLastItemOnPage = products.length === 1 && page > 1;
      const nextPage = isLastItemOnPage ? page - 1 : page;

      setShowDeleteModal(false);
      setProductToDelete(null);

      if (nextPage !== page) {
        setPage(nextPage);
      } else {
        loadProducts(nextPage, debouncedSearch);
      }
    } catch (err) {
      console.error("Eroare la ștergere:", err);
      toast.error("Eroare la ștergerea produsului.");
    } finally {
      setDeletingId(null);
    }
  }, [productToDelete, products.length, page, loadProducts, debouncedSearch]);

  const goToPage = useCallback(
    (pageNum) => {
      if (loading || pageNum < 1 || pageNum > pages || pageNum === page) {
        return;
      }

      setPage(pageNum);
    },
    [loading, page, pages]
  );

  const paginationItems = useMemo(() => {
    if (pages <= 1) return [];

    const items = [];

    const addPage = (value) => {
      items.push({
        type: "page",
        value,
        active: value === page,
      });
    };

    const addEllipsis = (key) => {
      items.push({
        type: "ellipsis",
        value: key,
      });
    };

    addPage(1);

    const start = Math.max(2, page - 2);
    const end = Math.min(pages - 1, page + 2);

    if (start > 2) addEllipsis("left");

    for (let i = start; i <= end; i++) {
      addPage(i);
    }

    if (end < pages - 1) addEllipsis("right");

    if (pages > 1) addPage(pages);

    return items;
  }, [page, pages]);

  return (
    <div className="container-fluid py-4">
      <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 mb-4">
        <div>
          <h4 className="mb-1 fw-bold">
            Catalog Piese în Stoc{" "}
            <span className="badge bg-secondary align-middle">{total}</span>
          </h4>

          <p className="text-muted mb-0">
            Administrează produsele din catalogul de piese.
          </p>
        </div>

        <Link to="/admin/catalog/add" className="btn btn-primary">
          <i className="ri-add-line me-1"></i>
          Adaugă produs
        </Link>
      </div>

      <div className="card border-0 shadow-sm rounded-4 mb-4">
        <div className="card-body p-3 p-md-4">
          <div className="row g-3 align-items-end">
            <div className="col-md-8 col-lg-5">
              <label
                htmlFor="admin-catalog-search"
                className="form-label fw-semibold"
              >
                Caută produs
              </label>

              <input
                id="admin-catalog-search"
                type="text"
                className="form-control"
                placeholder="Caută după nume sau cod..."
                value={search}
                onChange={handleSearchChange}
              />
            </div>

            <div className="col-md-4 col-lg-2">
              <button
                type="button"
                className="btn btn-outline-secondary w-100"
                onClick={handleClearSearch}
                disabled={!search}
              >
                Resetează
              </button>
            </div>
          </div>
        </div>
      </div>

      {!initialized && loading ? (
        <div className="card border-0 shadow-sm rounded-4">
          <div className="card-body py-5 text-center">
            <div
              className="spinner-border text-primary mb-3"
              role="status"
              aria-hidden="true"
            />

            <div>Se încarcă produsele...</div>
          </div>
        </div>
      ) : (
        <div className="card border-0 shadow-sm rounded-4">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th style={{ minWidth: 110 }}>Cod</th>
                  <th style={{ minWidth: 260 }}>Denumire</th>
                  <th style={{ minWidth: 120 }}>Stoc</th>
                  <th style={{ minWidth: 120 }}>Preț</th>
                  <th style={{ minWidth: 90 }}>Activ</th>

                  <th
                    className="d-none d-xl-table-cell"
                    style={{
                      minWidth: 110,
                      position: "sticky",
                      right: 0,
                      background: "#f8f9fa",
                      zIndex: 2,
                      boxShadow: "-2px 0 6px rgba(0,0,0,0.06)",
                    }}
                  >
                    Acțiuni
                  </th>
                </tr>
              </thead>

              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center text-muted py-5">
                      Niciun produs găsit.
                    </td>
                  </tr>
                ) : (
                  products.map((product) => {
                    const stockInfo =
                      STOCK_LABELS[product.stock] ||
                      STOCK_LABELS.not_in_stock;

                    const imageUrl = getImageUrl(product.image);

                    const hasPrice =
                      typeof product.price === "number" &&
                      Number.isFinite(product.price);

                    return (
                      <tr
                        key={product._id}
                        onClick={() => handleRowClick(product._id)}
                        onKeyDown={(e) => handleRowKeyDown(e, product._id)}
                        tabIndex={0}
                        role="button"
                        style={{ cursor: "pointer" }}
                      >
                        <td>
                          <code>{product.code || "—"}</code>
                        </td>

                        <td>
                          <div
                            className="d-flex align-items-start gap-2"
                            style={{ minWidth: 0 }}
                          >
                            {imageUrl ? (
                              <img
                                src={imageUrl}
                                alt={product.title || "Produs"}
                                style={{
                                  width: 40,
                                  height: 40,
                                  objectFit: "cover",
                                  flexShrink: 0,
                                }}
                                className="rounded border"
                              />
                            ) : (
                              <div
                                className="d-flex align-items-center justify-content-center rounded border bg-light"
                                style={{
                                  width: 40,
                                  height: 40,
                                  flexShrink: 0,
                                }}
                              >
                                <i className="ri-image-line text-muted"></i>
                              </div>
                            )}

                            <div style={{ minWidth: 0 }}>
                              <div
                                className="fw-semibold text-truncate d-flex align-items-center gap-1"
                                style={{ maxWidth: 260 }}
                                title={product.title || "Produs fără denumire"}
                              >
                                <span className="text-truncate">
                                  {product.title || "Produs fără denumire"}
                                </span>
                                <i
                                  className="ri-pencil-line d-xl-none text-muted"
                                  style={{ fontSize: "0.75rem", flexShrink: 0 }}
                                  title="Click pentru editare"
                                ></i>
                              </div>

                              <div className="d-xl-none mt-2">
                                <ActionButtons
                                  product={product}
                                  deletingId={deletingId}
                                  openDeleteModal={openDeleteModal}
                                  returnTo={returnTo}
                                />
                              </div>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span className={`badge bg-${stockInfo.color}`}>
                            {stockInfo.label}
                          </span>
                        </td>

                        <td>
                          {hasPrice
                            ? `${product.price.toFixed(2)} ${
                                product.currency || "RON"
                              }`
                            : "Preț la cerere"}
                        </td>

                        <td>
                          <span
                            className={`badge bg-${
                              product.active === "active"
                                ? "success"
                                : "secondary"
                            }`}
                          >
                            {product.active === "active" ? "Activ" : "Inactiv"}
                          </span>
                        </td>

                        <td
                          className="d-none d-xl-table-cell"
                          style={{
                            position: "sticky",
                            right: 0,
                            background: "var(--bs-table-bg, #fff)",
                            zIndex: 1,
                            boxShadow: "-2px 0 6px rgba(0,0,0,0.06)",
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ActionButtons
                            product={product}
                            deletingId={deletingId}
                            openDeleteModal={openDeleteModal}
                            returnTo={returnTo}
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {loading && initialized && (
        <div className="text-center text-muted small mt-3">
          Se actualizează rezultatele...
        </div>
      )}

      {pages > 1 && (
        <div className="mt-4">
          <nav aria-label="Paginare catalog admin">
            <ul className="pagination justify-content-center flex-wrap mb-0">
              <li
                className={`page-item ${
                  page === 1 || loading ? "disabled" : ""
                }`}
              >
                <button
                  type="button"
                  className="page-link"
                  onClick={() => goToPage(page - 1)}
                  disabled={page === 1 || loading}
                >
                  &laquo; Anterior
                </button>
              </li>

              {paginationItems.map((item, index) => {
                if (item.type === "ellipsis") {
                  return (
                    <li
                      key={`${item.value}-${index}`}
                      className="page-item disabled"
                    >
                      <span className="page-link">...</span>
                    </li>
                  );
                }

                return (
                  <li
                    key={item.value}
                    className={`page-item ${item.active ? "active" : ""}`}
                  >
                    <button
                      type="button"
                      className="page-link"
                      onClick={() => goToPage(item.value)}
                      disabled={loading}
                    >
                      {item.value}
                    </button>
                  </li>
                );
              })}

              <li
                className={`page-item ${
                  page === pages || loading ? "disabled" : ""
                }`}
              >
                <button
                  type="button"
                  className="page-link"
                  onClick={() => goToPage(page + 1)}
                  disabled={page === pages || loading}
                >
                  Următor &raquo;
                </button>
              </li>
            </ul>
          </nav>
        </div>
      )}

      <Modal show={showDeleteModal} onHide={closeDeleteModal} centered>
        <Modal.Header closeButton={!deletingId}>
          <Modal.Title>Confirmare ștergere</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          Ești sigur că vrei să ștergi produsul{" "}
          <strong>{productToDelete?.title || "fără denumire"}</strong>?

          <div className="text-muted small mt-2">
            Această acțiune nu poate fi anulată.
          </div>
        </Modal.Body>

        <Modal.Footer>
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={closeDeleteModal}
            disabled={!!deletingId}
          >
            Anulează
          </button>

          <button
            type="button"
            className="btn btn-danger"
            onClick={confirmDelete}
            disabled={!!deletingId}
          >
            {deletingId ? "Se șterge..." : "Șterge produsul"}
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}