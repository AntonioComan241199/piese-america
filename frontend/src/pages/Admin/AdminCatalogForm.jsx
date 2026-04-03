// frontend/src/pages/Admin/AdminCatalogForm.jsx
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import stockProductService from "../../api/stockProductService";

const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || "http://localhost:5000";

const INITIAL_FORM = {
  code: "",
  title: "",
  slug: "",
  short_description: "",
  content: "",
  stock: "in_stock",
  active: "active",
  type: "",
  manufacturer_id: "",
  catalog_id: "",
  first_page: false,
  offer: false,
  price: "",
};

const INITIAL_ERRORS = {
  code: "",
  title: "",
  slug: "",
  price: "",
  manufacturer_id: "",
  catalog_id: "",
};

const slugify = (value = "") =>
  value
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

export default function AdminCatalogForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(INITIAL_FORM);
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);

  const [loadingProduct, setLoadingProduct] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState(INITIAL_ERRORS);

  const previewUrlRef = useRef(null);
  const requestIdRef = useRef(0);

  const pageTitle = useMemo(
    () => (isEdit ? "Editează produs" : "Adaugă produs nou"),
    [isEdit]
  );

  const validateField = useCallback((name, value) => {
    switch (name) {
      case "code":
        if (!String(value).trim()) return "Codul este obligatoriu.";
        if (String(value).trim().length < 2) return "Codul este prea scurt.";
        return "";

      case "title":
        if (!String(value).trim()) return "Denumirea este obligatorie.";
        if (String(value).trim().length < 3) return "Denumirea este prea scurtă.";
        return "";

      case "slug":
        if (value && !/^[a-z0-9-]+$/.test(String(value).trim())) {
          return "Slug-ul poate conține doar litere mici, cifre și cratimă.";
        }
        return "";

      case "price":
        if (value === "" || value === null) return "";
        if (Number(value) < 0) return "Prețul nu poate fi negativ.";
        return "";

      case "manufacturer_id":
      case "catalog_id":
        if (value === "" || value === null) return "";
        if (!/^\d+$/.test(String(value))) return "Valoarea trebuie să fie numerică.";
        return "";

      default:
        return "";
    }
  }, []);

  const validateForm = useCallback(() => {
    const nextErrors = {
      code: validateField("code", form.code),
      title: validateField("title", form.title),
      slug: validateField("slug", form.slug),
      price: validateField("price", form.price),
      manufacturer_id: validateField("manufacturer_id", form.manufacturer_id),
      catalog_id: validateField("catalog_id", form.catalog_id),
    };

    setErrors(nextErrors);

    return !Object.values(nextErrors).some(Boolean);
  }, [form, validateField]);

  const setFieldValue = useCallback((name, value) => {
    setForm((prev) => {
      const next = { ...prev, [name]: value };

      if (name === "title" && !prev.slug.trim()) {
        next.slug = slugify(value);
      }

      return next;
    });

    setErrors((prev) => ({
      ...prev,
      [name]: validateField(name, value),
    }));
  }, [validateField]);

  useEffect(() => {
    if (!isEdit) return;

    const fetchProduct = async () => {
      const currentRequestId = ++requestIdRef.current;
      setLoadingProduct(true);

      try {
        const product = await stockProductService.getById(id);

        if (currentRequestId !== requestIdRef.current) return;

        setForm({
          code: product.code || "",
          title: product.title || "",
          slug: product.slug || "",
          short_description: product.short_description || "",
          content: product.content || "",
          stock: product.stock || "in_stock",
          active: product.active || "active",
          type: product.type || "",
          manufacturer_id: product.manufacturer_id || "",
          catalog_id: product.catalog_id || "",
          first_page: Boolean(product.first_page),
          offer: Boolean(product.offer),
          price: product.price ?? "",
        });

        if (product.image) {
          setPreview(
            product.image.startsWith("http://") || product.image.startsWith("https://")
              ? product.image
              : `${API_ORIGIN}${product.image}`
          );
        }
      } catch (err) {
        console.error("Eroare la încărcarea produsului:", err);
        toast.error("Nu am putut încărca produsul.");
        navigate("/admin/catalog", { replace: true });
      } finally {
        if (currentRequestId === requestIdRef.current) {
          setLoadingProduct(false);
        }
      }
    };

    fetchProduct();
  }, [id, isEdit, navigate]);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    const nextValue = type === "checkbox" ? checked : value;
    setFieldValue(name, nextValue);
  }, [setFieldValue]);

  const handleImage = useCallback((e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Te rog selectează un fișier imagine valid.");
      return;
    }

    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
    }

    const localPreviewUrl = URL.createObjectURL(file);
    previewUrlRef.current = localPreviewUrl;

    setImage(file);
    setPreview(localPreviewUrl);
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Te rog verifică formularul.");
      return;
    }

    setSaving(true);

    try {
      const normalizedForm = {
        ...form,
        code: form.code.trim(),
        title: form.title.trim(),
        slug: form.slug.trim() || slugify(form.title),
        short_description: form.short_description.trim(),
        content: form.content.trim(),
        type: form.type.trim(),
        manufacturer_id: form.manufacturer_id === "" ? "" : Number(form.manufacturer_id),
        catalog_id: form.catalog_id === "" ? "" : Number(form.catalog_id),
        price: form.price === "" ? "" : Number(form.price),
      };

      const fd = new FormData();

      Object.entries(normalizedForm).forEach(([key, value]) => {
        fd.append(key, value);
      });

      if (image) {
        fd.append("image", image);
      }

      if (isEdit) {
        await stockProductService.update(id, fd);
        toast.success("Produsul a fost actualizat.");
      } else {
        await stockProductService.create(fd);
        toast.success("Produsul a fost adăugat.");
      }

      navigate("/admin/catalog");
    } catch (err) {
      console.error("Eroare la salvare:", err);
      toast.error(err?.response?.data?.error || "Eroare la salvare.");
    } finally {
      setSaving(false);
    }
  }, [form, id, image, isEdit, navigate, validateForm]);

  const handleCancel = useCallback(() => {
    navigate("/admin/catalog");
  }, [navigate]);

  if (loadingProduct) {
    return (
      <div className="container py-4" style={{ maxWidth: 900 }}>
        <div className="card border-0 shadow-sm rounded-4">
          <div className="card-body py-5 text-center">
            <div className="spinner-border text-primary mb-3" role="status" aria-hidden="true" />
            <div>Se încarcă datele produsului...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4" style={{ maxWidth: 900 }}>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h4 className="mb-1 fw-bold">{pageTitle}</h4>
          <p className="text-muted mb-0">
            Completează informațiile necesare pentru produs.
          </p>
        </div>
      </div>

      <div className="card border-0 shadow-sm rounded-4">
        <div className="card-body p-4">
          <form onSubmit={handleSubmit} noValidate>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label fw-semibold">Cod *</label>
                <input
                  name="code"
                  className={`form-control ${errors.code ? "is-invalid" : ""}`}
                  value={form.code}
                  onChange={handleChange}
                  placeholder="Ex: FILTRU-ULEI-001"
                />
                {errors.code && <div className="invalid-feedback">{errors.code}</div>}
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold">Denumire *</label>
                <input
                  name="title"
                  className={`form-control ${errors.title ? "is-invalid" : ""}`}
                  value={form.title}
                  onChange={handleChange}
                  placeholder="Ex: Filtru ulei Mann"
                />
                {errors.title && <div className="invalid-feedback">{errors.title}</div>}
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold">Slug</label>
                <input
                  name="slug"
                  className={`form-control ${errors.slug ? "is-invalid" : ""}`}
                  value={form.slug}
                  onChange={handleChange}
                  placeholder="Se poate genera automat"
                />
                {errors.slug && <div className="invalid-feedback">{errors.slug}</div>}
                <div className="form-text">
                  Dacă îl lași gol, va fi generat automat din denumire.
                </div>
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold">Preț (RON)</label>
                <input
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  className={`form-control ${errors.price ? "is-invalid" : ""}`}
                  value={form.price}
                  onChange={handleChange}
                  placeholder="Ex: 149.99"
                />
                {errors.price && <div className="invalid-feedback">{errors.price}</div>}
              </div>

              <div className="col-md-3">
                <label className="form-label fw-semibold">Stoc</label>
                <select
                  name="stock"
                  className="form-select"
                  value={form.stock}
                  onChange={handleChange}
                >
                  <option value="in_stock">În stoc</option>
                  <option value="in_supplier_stock">Stoc furnizor</option>
                  <option value="not_in_stock">Indisponibil</option>
                </select>
              </div>

              <div className="col-md-3">
                <label className="form-label fw-semibold">Status</label>
                <select
                  name="active"
                  className="form-select"
                  value={form.active}
                  onChange={handleChange}
                >
                  <option value="active">Activ</option>
                  <option value="inactive">Inactiv</option>
                </select>
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold">Tip</label>
                <input
                  name="type"
                  className="form-control"
                  value={form.type}
                  onChange={handleChange}
                  placeholder="Ex: consumabil"
                />
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold">ID Producător</label>
                <input
                  name="manufacturer_id"
                  type="number"
                  min="1"
                  className={`form-control ${errors.manufacturer_id ? "is-invalid" : ""}`}
                  value={form.manufacturer_id}
                  onChange={handleChange}
                  placeholder="Ex: 12"
                />
                {errors.manufacturer_id && (
                  <div className="invalid-feedback">{errors.manufacturer_id}</div>
                )}
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold">ID Catalog</label>
                <input
                  name="catalog_id"
                  type="number"
                  min="1"
                  className={`form-control ${errors.catalog_id ? "is-invalid" : ""}`}
                  value={form.catalog_id}
                  onChange={handleChange}
                  placeholder="Ex: 3"
                />
                {errors.catalog_id && (
                  <div className="invalid-feedback">{errors.catalog_id}</div>
                )}
              </div>

              <div className="col-12">
                <label className="form-label fw-semibold">Descriere scurtă</label>
                <textarea
                  name="short_description"
                  className="form-control"
                  rows={3}
                  value={form.short_description}
                  onChange={handleChange}
                  placeholder="Scurt rezumat pentru listare"
                />
              </div>

              <div className="col-12">
                <label className="form-label fw-semibold">Conținut (HTML)</label>
                <textarea
                  name="content"
                  className="form-control"
                  rows={8}
                  value={form.content}
                  onChange={handleChange}
                  placeholder="<p>Descriere detaliată produs...</p>"
                />
              </div>

              <div className="col-12">
                <div className="d-flex flex-wrap gap-4 pt-2">
                  <div className="form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="first_page"
                      name="first_page"
                      checked={form.first_page}
                      onChange={handleChange}
                    />
                    <label className="form-check-label" htmlFor="first_page">
                      Prima pagină
                    </label>
                  </div>

                  <div className="form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="offer"
                      name="offer"
                      checked={form.offer}
                      onChange={handleChange}
                    />
                    <label className="form-check-label" htmlFor="offer">
                      Ofertă
                    </label>
                  </div>
                </div>
              </div>

              <div className="col-12">
                <label className="form-label fw-semibold">Imagine</label>
                <input
                  type="file"
                  className="form-control"
                  accept="image/*"
                  onChange={handleImage}
                />

                {preview && (
                  <div className="mt-3">
                    <img
                      src={preview}
                      alt="Preview produs"
                      className="rounded border"
                      style={{ maxHeight: 220, maxWidth: "100%", objectFit: "contain" }}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="d-flex flex-wrap gap-2 mt-4">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Se salvează...
                  </>
                ) : isEdit ? (
                  "Salvează modificările"
                ) : (
                  "Adaugă produs"
                )}
              </button>

              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={handleCancel}
                disabled={saving}
              >
                Anulează
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}