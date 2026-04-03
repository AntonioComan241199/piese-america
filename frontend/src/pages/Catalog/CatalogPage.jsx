import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { addToCart } from "../../slices/cartSlice";
import stockProductService from "../../api/stockProductService";

const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || "http://localhost:5000";
const PAGE_SIZE = 12;

const SORT_OPTIONS = [
  { value: "default", label: "Relevanță" },
  { value: "price_asc", label: "Preț crescător" },
  { value: "price_desc", label: "Preț descrescător" },
  { value: "title_asc", label: "Nume A-Z" },
  { value: "title_desc", label: "Nume Z-A" },
];

export default function CatalogPage() {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialSearch = searchParams.get("search") || "";
  const initialPage = Number(searchParams.get("page")) || 1;
  const initialSort = searchParams.get("sort") || "default";

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const [filters, setFilters] = useState({
    search: initialSearch,
    manufacturer: "",
    catalog: "",
  });

  const [sortBy, setSortBy] = useState(initialSort);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);

  const [pagination, setPagination] = useState({
    currentPage: initialPage,
    totalPages: 1,
    totalProducts: 0,
  });

  const [page, setPage] = useState(initialPage);

  const requestIdRef = useRef(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search.trim());
    }, 350);

    return () => clearTimeout(timer);
  }, [filters.search]);

  const effectiveFilters = useMemo(() => {
    return {
      search: debouncedSearch,
      manufacturer: filters.manufacturer,
      catalog: filters.catalog,
    };
  }, [debouncedSearch, filters.manufacturer, filters.catalog]);

  const updateUrlParams = useCallback(
    ({ nextSearch = debouncedSearch, nextPage = page, nextSort = sortBy }) => {
      const params = {};

      if (nextSearch) params.search = nextSearch;
      if (nextPage > 1) params.page = String(nextPage);
      if (nextSort && nextSort !== "default") params.sort = nextSort;

      setSearchParams(params, { replace: true });
    },
    [debouncedSearch, page, sortBy, setSearchParams]
  );

  useEffect(() => {
    updateUrlParams({
      nextSearch: debouncedSearch,
      nextPage: page,
      nextSort: sortBy,
    });
  }, [debouncedSearch, page, sortBy, updateUrlParams]);

  const getImageUrl = useCallback((image) => {
    if (!image) return null;
    if (image.startsWith("http://") || image.startsWith("https://")) return image;
    return `${API_ORIGIN}${image.startsWith("/") ? image : `/${image}`}`;
  }, []);

  const sortProducts = useCallback((list, sortValue) => {
    const safeList = Array.isArray(list) ? [...list] : [];

    switch (sortValue) {
      case "price_asc":
        return safeList.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));

      case "price_desc":
        return safeList.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));

      case "title_asc":
        return safeList.sort((a, b) => (a.title || "").localeCompare(b.title || "", "ro"));

      case "title_desc":
        return safeList.sort((a, b) => (b.title || "").localeCompare(a.title || "", "ro"));

      default:
        return safeList;
    }
  }, []);

  const fetchProducts = useCallback(
    async (pageNum = 1, activeFilters = effectiveFilters, activeSort = sortBy) => {
      const currentRequestId = ++requestIdRef.current;
      setLoading(true);

      try {
        const data = await stockProductService.getAll({
          ...activeFilters,
          page: pageNum,
          limit: PAGE_SIZE,
        });

        if (currentRequestId !== requestIdRef.current) return;

        const rawProducts = Array.isArray(data?.products) ? data.products : [];
        const sortedProducts = sortProducts(rawProducts, activeSort);

        setProducts(sortedProducts);
        setPagination(
          data?.pagination || {
            currentPage: pageNum,
            totalPages: 1,
            totalProducts: 0,
          }
        );
      } catch (err) {
        if (currentRequestId !== requestIdRef.current) return;

        console.error("Eroare la încărcare produse:", err);
        setProducts([]);
        setPagination({
          currentPage: 1,
          totalPages: 1,
          totalProducts: 0,
        });
        toast.error("Nu am putut încărca produsele.");
      } finally {
        if (currentRequestId === requestIdRef.current) {
          setLoading(false);
          setInitialized(true);
        }
      }
    },
    [effectiveFilters, sortBy, sortProducts]
  );

  useEffect(() => {
    setPage(1);
    fetchProducts(1, effectiveFilters, sortBy);
  }, [effectiveFilters, sortBy, fetchProducts]);

  const handleFilterChange = useCallback((e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  const handleSortChange = useCallback((e) => {
    setSortBy(e.target.value);
    setPage(1);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({
      search: "",
      manufacturer: "",
      catalog: "",
    });
    setSortBy("default");
    setPage(1);
  }, []);

  const goToPage = useCallback(
    (pageNum) => {
      const totalPages = pagination.totalPages || 1;

      if (loading || pageNum < 1 || pageNum > totalPages || pageNum === page) {
        return;
      }

      setPage(pageNum);
      fetchProducts(pageNum, effectiveFilters, sortBy);
    },
    [loading, pagination.totalPages, page, fetchProducts, effectiveFilters, sortBy]
  );

  const handleAddToCart = useCallback(
    (product) => {
      dispatch(addToCart(product));
      toast.success(`${product.title} a fost adăugat în coș.`);
    },
    [dispatch]
  );

  const paginationItems = useMemo(() => {
    const currentPage = pagination.currentPage || 1;
    const totalPages = pagination.totalPages || 1;

    if (totalPages <= 1) return [];

    const pages = [];

    const addPage = (pageNumber) => {
      pages.push({
        type: "page",
        value: pageNumber,
        active: pageNumber === currentPage,
      });
    };

    const addEllipsis = (key) => {
      pages.push({
        type: "ellipsis",
        value: key,
      });
    };

    addPage(1);

    const startPage = Math.max(2, currentPage - 2);
    const endPage = Math.min(totalPages - 1, currentPage + 2);

    if (startPage > 2) addEllipsis("left");

    for (let i = startPage; i <= endPage; i++) {
      addPage(i);
    }

    if (endPage < totalPages - 1) addEllipsis("right");

    if (totalPages > 1) addPage(totalPages);

    return pages;
  }, [pagination]);

  const skeletonCards = useMemo(() => {
    return Array.from({ length: 6 }, (_, index) => (
      <div key={index} className="col-md-6 col-xl-4">
        <div className="card h-100 shadow-sm border-0 rounded-4 overflow-hidden">
          <div
            className="placeholder-glow bg-white border-bottom p-3"
            style={{ minHeight: "240px" }}
          >
            <span
              className="placeholder w-100 rounded-3"
              style={{ height: "200px", display: "block" }}
            ></span>
          </div>

          <div className="card-body p-4">
            <p className="placeholder-glow mb-3">
              <span className="placeholder col-10"></span>
            </p>
            <p className="placeholder-glow mb-3">
              <span className="placeholder col-6"></span>
            </p>
            <p className="placeholder-glow mb-4">
              <span className="placeholder col-4"></span>
            </p>
            <div className="d-flex gap-2">
              <span className="placeholder col-6 btn btn-outline-secondary disabled"></span>
              <span className="placeholder col-6 btn btn-outline-secondary disabled"></span>
            </div>
          </div>
        </div>
      </div>
    ));
  }, []);

  return (
    <div className="container py-4 py-lg-5">
      <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 mb-4">
        <div>
          <h2 className="mb-1 fw-bold">Catalog Piese în Stoc</h2>
          <p className="text-muted mb-0">
            Caută rapid produsele disponibile și adaugă-le în coș.
          </p>
        </div>

        <div className="text-muted small">
          {initialized ? `${pagination.totalProducts || products.length} produse găsite` : ""}
        </div>
      </div>

      <div className="card shadow-sm border-0 rounded-4 mb-4">
        <div className="card-body p-3 p-md-4">
          <div className="row g-3 align-items-end">
            <div className="col-md-6 col-lg-5">
              <label htmlFor="search" className="form-label fw-semibold">
                Caută produs
              </label>
              <input
                id="search"
                type="text"
                name="search"
                className="form-control"
                placeholder="Caută după nume sau cod..."
                value={filters.search}
                onChange={handleFilterChange}
              />
            </div>

            <div className="col-md-3 col-lg-3">
              <label htmlFor="sort" className="form-label fw-semibold">
                Sortează după
              </label>
              <select
                id="sort"
                className="form-select"
                value={sortBy}
                onChange={handleSortChange}
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-3 col-lg-2">
              <button
                type="button"
                className="btn btn-outline-secondary w-100"
                onClick={handleClearFilters}
                disabled={!filters.search && sortBy === "default"}
              >
                Resetează
              </button>
            </div>
          </div>
        </div>
      </div>

      {!initialized && loading ? (
        <div className="row g-4">{skeletonCards}</div>
      ) : products.length === 0 ? (
        <div className="card border-0 shadow-sm rounded-4">
          <div className="card-body text-center py-5">
            <i className="ri-search-line display-5 text-muted mb-3"></i>
            <h5 className="fw-bold">Nu s-au găsit produse</h5>
            <p className="text-muted mb-3">
              Încearcă un alt termen de căutare sau resetează căutarea.
            </p>
            <button
              type="button"
              className="btn btn-outline-primary"
              onClick={handleClearFilters}
            >
              Resetează filtrele
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="row g-4">
            {products.map((product) => {
              const imageUrl = getImageUrl(product.image);
              const hasPrice = typeof product.price === "number";

              return (
                <div key={product._id} className="col-md-6 col-xl-4">
                  <div className="card h-100 shadow-sm border-0 rounded-4 overflow-hidden">
                    <div
                      className="bg-white border-bottom d-flex align-items-center justify-content-center p-3"
                      style={{ minHeight: "240px" }}
                    >
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          className="img-fluid"
                          alt={product.title}
                          style={{ maxHeight: "200px", objectFit: "contain" }}
                        />
                      ) : (
                        <div className="text-center text-muted">
                          <i className="ri-image-line fs-1 d-block mb-2"></i>
                          <small>Fără imagine</small>
                        </div>
                      )}
                    </div>

                    <div className="card-body d-flex flex-column p-4">
                      <h5 className="card-title fw-semibold mb-2">
                        {product.title}
                      </h5>

                      <p className="card-text text-muted small mb-3">
                        Cod: {product.code || "—"}
                      </p>

                      <div className="mt-auto">
                        <p className="mb-3 fs-5 fw-bold text-primary">
                          {hasPrice ? `${product.price.toFixed(2)} RON` : "Preț la cerere"}
                        </p>

                        <div className="d-flex gap-2">
                          <Link
                            to={`/catalog/${product._id}`}
                            className="btn btn-outline-primary btn-sm flex-fill"
                          >
                            Detalii
                          </Link>

                          <button
                            type="button"
                            className="btn btn-success btn-sm flex-fill"
                            onClick={() => handleAddToCart(product)}
                          >
                            Adaugă în coș
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {loading && initialized && (
            <div className="row g-4 mt-1 opacity-75">
              {skeletonCards}
            </div>
          )}

          {(pagination.totalPages || 1) > 1 && (
            <div className="mt-5">
              <nav aria-label="Paginare catalog">
                <ul className="pagination justify-content-center flex-wrap">
                  <li className={`page-item ${page === 1 || loading ? "disabled" : ""}`}>
                    <button
                      type="button"
                      className="page-link"
                      onClick={() => goToPage(page - 1)}
                      disabled={page === 1 || loading}
                    >
                      Înapoi
                    </button>
                  </li>

                  {paginationItems.map((item, index) => {
                    if (item.type === "ellipsis") {
                      return (
                        <li key={`${item.value}-${index}`} className="page-item disabled">
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
                      page === (pagination.totalPages || 1) || loading ? "disabled" : ""
                    }`}
                  >
                    <button
                      type="button"
                      className="page-link"
                      onClick={() => goToPage(page + 1)}
                      disabled={page === (pagination.totalPages || 1) || loading}
                    >
                      Înainte
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          )}
        </>
      )}
    </div>
  );
}