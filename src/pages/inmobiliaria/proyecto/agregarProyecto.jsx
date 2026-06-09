import { withApiBase } from "../../../config/api.js";
import { authFetch } from "../../../config/authFetch.js";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { GoogleMap, Polygon, Marker } from "@react-google-maps/api";
import loader from "../../../components/loader";
import styles from "./addproyect.module.css";

const defaultCenter = { lat: -6.4882, lng: -76.365629 };

export default function ProyectoModal({ onClose, idinmobiliaria }) {
  const token = localStorage.getItem("access");
  const [isLoaded, setIsLoaded] = useState(
    () => typeof window !== "undefined" && !!window.google?.maps?.Map,
  );
  const [loadError, setLoadError] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [categorias, setCategorias] = useState([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [baseMapStyle, setBaseMapStyle] = useState("roadmap");
  const [reliefEnabled, setReliefEnabled] = useState(false);
  const [labelsEnabled, setLabelsEnabled] = useState(true);

  const [countries, setCountries] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [currencySymbol, setCurrencySymbol] = useState("");


  const [form, setForm] = useState({
    idinmobiliaria,
    idtipoinmobiliaria: 1,
    nombreproyecto: "",
    descripcion: "",
    latitud: "",
    longitud: "",
    puntos: [],
    imagenes: [],
    area_total_m2: "",
    precio_entrada: "",
    horario_apertura: "",
    horario_cierre: "",
    tiene_restaurante: 0,
    tiene_bebidas: 0,
    breve_descripcion: "",
    idcategoria: "",
    pais: "",
    bandera: "",
    moneda: "",
  });

  const mapRef = useRef(null);
  const fileInputRef = useRef(null);
  const autocompleteRef = useRef(null);

  useEffect(() => {
    fetch("https://restcountries.com/v3.1/all?fields=name,flags,currencies")
      .then((res) => res.json())
      .then((data) => {
        const formatted = data.map((c) => {
          const currencyKey = c.currencies ? Object.keys(c.currencies)[0] : null;

          return {
            pais: c.name.common,
            bandera: c.flags?.png,
            moneda: currencyKey ? c.currencies[currencyKey].symbol : "",
            codigo: currencyKey,
          };
        });

        setCountries(formatted.sort((a, b) => a.pais.localeCompare(b.pais)));
      })
      .catch((err) => console.error(err));
  }, []);




  // Cargar Google Maps
  useEffect(() => {
    if (window.google?.maps?.Map) {
      setIsLoaded(true);
      return;
    }
    loader
      .load()
      .then(() => setIsLoaded(true))
      .catch(() => {
        if (window.google?.maps?.Map) {
          setIsLoaded(true);
          return;
        }
        setLoadError(true);
      });
  }, []);

  // Cargar Categorías de centros turísticos
  useEffect(() => {
    fetch(withApiBase("http://127.0.0.1:8000/api/list_categorias/"))
      .then((res) => res.json())
      .then((data) => setCategorias(data))
      .catch((err) => console.error("Error categorías:", err));
  }, []);

  useEffect(() => {
    if (!isLoaded || !window.google) return;
    const input = document.getElementById("autocomplete-input");
    if (!input || !window.google.maps?.places?.Autocomplete) return;

    const autocomplete = new window.google.maps.places.Autocomplete(input, {
      fields: ["geometry", "name", "formatted_address"],
    });

    autocompleteRef.current = autocomplete;
    const listener = autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (!place?.geometry?.location) return;

      const loc = {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
      };

      if (mapRef.current) {
        mapRef.current.panTo(loc);
        mapRef.current.setZoom(17);
      }

      setForm((prev) => ({
        ...prev,
        latitud: loc.lat,
        longitud: loc.lng,
      }));
    });

    return () => {
      if (listener) {
        window.google.maps.event.removeListener(listener);
      }
    };
  }, [isLoaded]);

  const applyMapType = useCallback((map, baseStyle, labels, relief) => {
    if (!map) return;
    if (baseStyle === "satellite") {
      map.setMapTypeId(labels ? "hybrid" : "satellite");
      return;
    }
    map.setMapTypeId(relief ? "terrain" : "roadmap");
  }, []);

  useEffect(() => {
    applyMapType(mapRef.current, baseMapStyle, labelsEnabled, reliefEnabled);
  }, [applyMapType, baseMapStyle, labelsEnabled, reliefEnabled]);

  // --- Lógica de Dibujo Manual ---
  const handleMapClick = (e) => {
    if (!isDrawing) return;

    const newPoint = {
      latitud: e.latLng.lat(),
      longitud: e.latLng.lng(),
      orden: form.puntos.length + 1,
    };

    setForm((prev) => ({
      ...prev,
      puntos: [...prev.puntos, newPoint],
      latitud: prev.puntos.length === 0 ? newPoint.latitud : prev.latitud,
      longitud: prev.puntos.length === 0 ? newPoint.longitud : prev.longitud,
    }));
  };

  const clearPolygon = () => {
    setForm((prev) => ({ ...prev, puntos: [] }));
    setIsDrawing(false);
  };

  const undoLastPoint = () => {
    setForm((prev) => ({
      ...prev,
      puntos: prev.puntos.slice(0, -1),
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const normalizedValue =
      typeof value === "string" ? value.replace(",", ".") : value;
    setForm((prev) => ({
      ...prev,
      [name]: normalizedValue,
    }));
  };

  const handleImagenesChange = (e) => {
    const files = Array.from(e.target.files).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setForm({ ...form, imagenes: [...form.imagenes, ...files] });
  };

  const removeImagen = (index) => {
    const imgs = [...form.imagenes];
    URL.revokeObjectURL(imgs[index].preview);
    imgs.splice(index, 1);
    setForm({ ...form, imagenes: imgs });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validación del polígono
    if (form.puntos.length < 3) {
      alert(
        "Por favor, delimite el área del proyecto con al menos 3 puntos en el mapa.",
      );
      return;
    }
    setIsSubmitting(true);

    // Normalización de datos
    const precioEntrada = Number(form.precio_entrada) || 0;
    const normalizedForm = {
      ...form,
      precio: precioEntrada,
      precio_entrada: precioEntrada,
      area_total_m2: Number(form.area_total_m2) || 0,
      horario_apertura: form.horario_apertura || null,
      horario_cierre: form.horario_cierre || null,
      tiene_restaurante: form.tiene_restaurante === "1" || form.tiene_restaurante === 1 ? true : false,
      tiene_bebidas: form.tiene_bebidas === "1" || form.tiene_bebidas === 1 ? true : false,
      breve_descripcion: form.breve_descripcion,
      idcategoria: form.idcategoria || "",
    };

    const formData = new FormData();

    // 📦 Construcción segura del FormData
    Object.keys(normalizedForm).forEach((key) => {
      if (key === "puntos") {
        formData.append(key, JSON.stringify(normalizedForm[key]));
      } else if (key === "imagenes") {
        normalizedForm.imagenes.forEach((img) => {
          if (img?.file) {
            formData.append("imagenes", img.file);
          }
        });
      } else {
        formData.append(key, normalizedForm[key]);
      }
    });

    // 🧪 Debug FINAL (úsalo solo mientras pruebas)
    console.log("📤 FormData enviado:");
    for (let pair of formData.entries()) {
      console.log(pair[0], pair[1]);
    }

    try {
      const res = await authFetch(
        withApiBase("http://127.0.0.1:8000/api/registerProyecto/"),
        {
          method: "POST",
          body: formData,
          telegramContext: {
            action: `Intento de registrar proyecto: ${normalizedForm.nombreproyecto || "sin nombre"}`,
          },
          headers: {
            Authorization: `Bearer ${token}`,
            // ❌ NO pongas Content-Type con FormData
          },
        },
      );

      if (res.ok) {
        setSuccess(true);

        setTimeout(() => {
          setIsSubmitting(false);
          onClose?.({ refreshed: true });
        }, 500);
      } else {
        setIsSubmitting(false);
        alert("⚠️ Error en registro");
      }
    } catch (error) {
      console.error(error);
      setIsSubmitting(false);
      alert("🚫 Error de red");
    }
  };

  if (loadError) return <div className={styles.loaderMsg}>Error de mapa</div>;
  if (!isLoaded) return <div className={styles.loaderMsg}>Cargando...</div>;

  const mapControlOptions =
    typeof window !== "undefined" && window.google?.maps
      ? {
        mapTypeControlOptions: {
          style: window.google.maps.MapTypeControlStyle.DEFAULT,
          position: window.google.maps.ControlPosition.LEFT_BOTTOM,
        },
        fullscreenControlOptions: {
          position: window.google.maps.ControlPosition.RIGHT_TOP,
        },
      }
      : {};

  return (
    <div className={styles.modalOverlay}>
      {isSubmitting && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingModal}>
            {!success ? (
              <>
                <span className="material-icons-outlined styles.spinner">
                  autorenew
                </span>
                <h3>Subiendo proyecto...</h3>
                <p>Por favor espera, estamos procesando la información</p>
              </>
            ) : (
              <>
                <span className={styles.successIcon}>
                  <span className="material-icons-outlined">check_circle</span>
                </span>
                <h3>¡Proyecto subido con éxito!</h3>
                <p>Tu proyecto ya fue registrado correctamente</p>
              </>
            )}
          </div>
        </div>
      )}
      <div className={styles.modalContent}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Registrar Centro Turístico</h1>
            <p className={styles.subtitle}>
              Completa la información detallada para publicar tu nuevo centro turístico.
            </p>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose}>
            <span className="material-icons-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.formBody}>
          <div className={styles.gridContainer}>
            <div className={styles.leftColumn}>
              <section>
                <h2 className={styles.sectionTitle}>
                  <span className="material-icons-outlined">info</span>{" "}
                  Información
                </h2>

                <div className={styles.inputGroup}>
                  <label>Categoría</label>
                  <select
                    name="idcategoria"
                    value={form.idcategoria}
                    onChange={handleChange}
                    className={styles.select}
                    required
                  >
                    <option value="">Seleccione categoría...</option>
                    {categorias.map((c) => (
                      <option key={c.idcategoria} value={c.idcategoria}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.inputGroup}>
                  <label>Nombre</label>
                  <input
                    name="nombreproyecto"
                    value={form.nombreproyecto}
                    onChange={handleChange}
                    className={`${styles.input} ${styles.primaryCompactInput}`}
                    required
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label>Descripción</label>
                  <textarea
                    name="descripcion"
                    value={form.descripcion}
                    onChange={handleChange}
                    className={`${styles.textarea} ${styles.primaryCompactTextarea}`}
                    rows="2"
                    required
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label>Breve Descripción (Opcional)</label>
                  <input
                    name="breve_descripcion"
                    value={form.breve_descripcion}
                    onChange={handleChange}
                    className={styles.input}
                    placeholder="Una frase corta para destacar el centro"
                  />
                </div>

                <div className={styles.compactGrid}>
                  <div className={styles.compactField}>
                    <label>Horario Apertura</label>
                    <input
                      type="time"
                      name="horario_apertura"
                      value={form.horario_apertura}
                      onChange={handleChange}
                      className={`${styles.input} ${styles.compactInput}`}
                    />
                  </div>
                  <div className={styles.compactField}>
                    <label>Horario Cierre</label>
                    <input
                      type="time"
                      name="horario_cierre"
                      value={form.horario_cierre}
                      onChange={handleChange}
                      className={`${styles.input} ${styles.compactInput}`}
                    />
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label>¿Tiene Restaurante?</label>
                  <select
                    name="tiene_restaurante"
                    value={form.tiene_restaurante}
                    onChange={handleChange}
                    className={styles.select}
                  >
                    <option value={0}>No</option>
                    <option value={1}>Sí</option>
                  </select>
                </div>

                <div className={styles.inputGroup}>
                  <label>¿Venden Bebidas?</label>
                  <select
                    name="tiene_bebidas"
                    value={form.tiene_bebidas}
                    onChange={handleChange}
                    className={styles.select}
                  >
                    <option value={0}>No</option>
                    <option value={1}>Sí</option>
                  </select>
                </div>

                <div className={styles.inputGroup}>
                  <label>País y moneda</label>
                  <select
                    value={form.pais}
                    onChange={(e) => {
                      const country = countries.find(c => c.pais === e.target.value);
                      setForm(prev => ({
                        ...prev,
                        pais: country.pais,
                        bandera: country.bandera,
                        moneda: country.moneda,
                      }));
                      setSelectedCountry(country);
                      setCurrencySymbol(country.moneda);
                    }}
                    className={styles.select}
                  >
                    <option value="">Seleccione país</option>
                    {countries.map((c, i) => (
                      <option key={i} value={c.pais}>{c.pais}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.inputGroup}>
                  <label>Precio de Entrada</label>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    {selectedCountry && (
                      <img src={selectedCountry.bandera} width="24" alt="bandera" />
                    )}
                    <span style={{ fontWeight: "bold" }}>{currencySymbol}</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      name="precio_entrada"
                      value={form.precio_entrada}
                      onChange={handleChange}
                      className={styles.input}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label>Área total (m²)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    name="area_total_m2"
                    value={form.area_total_m2}
                    onChange={handleChange}
                    className={styles.input}
                  />
                </div>
              </section>



              <section>
                <h2 className={styles.sectionTitle}>
                  <span className="material-icons-outlined">collections</span>{" "}
                  Imágenes
                </h2>
                <div className={styles.imageUploadContainer}>
                  {/* Mostrar primera imagen grande si existe */}
                  {form.imagenes.length > 0 ? (
                    <div className={styles.mainImageWrapper}>
                      <div className={styles.mainImagePreview}>
                        <img src={form.imagenes[0].preview} alt="Principal" />
                        <button
                          type="button"
                          className={styles.removeMainImage}
                          onClick={() => removeImagen(0)}
                        >
                          <span className="material-icons-outlined">close</span>
                        </button>
                      </div>
                      <p className={styles.imageCounter}>
                        Fotos - {form.imagenes.length}/10
                      </p>
                    </div>
                  ) : null}

                  {/* Botón de subir y miniaturas */}
                  <div className={styles.uploadSection}>
                    <div
                      className={styles.uploadBox}
                      onClick={() => fileInputRef.current.click()}
                    >
                      <span className="material-icons-outlined">
                        add_photo_alternate
                      </span>
                      <p>Agregar foto</p>
                      <input
                        type="file"
                        ref={fileInputRef}
                        multiple
                        accept="image/*"
                        onChange={handleImagenesChange}
                        hidden
                      />
                    </div>

                    {/* Miniaturas de imágenes adicionales */}
                    {form.imagenes.length > 1 && (
                      <div className={styles.thumbnailGrid}>
                        {form.imagenes.slice(1).map((img, i) => (
                          <div key={i + 1} className={styles.thumbnailItem}>
                            <img src={img.preview} alt={`Foto ${i + 2}`} />
                            <button
                              type="button"
                              onClick={() => removeImagen(i + 1)}
                              className={styles.removeThumbnail}
                            >
                              <span className="material-icons-outlined">
                                close
                              </span>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </section>
            </div>

            <div className={styles.rightColumn}>
              <h2 className={styles.sectionTitle}>
                <span className="material-icons-outlined">map</span> Ubicación y
                Polígono
              </h2>

              <div className={styles.mapWrapper}>
                <div className={styles.searchWrapper}>
                  <input
                    id="autocomplete-input"
                    type="text"
                    placeholder="Buscar ubicación..."
                    className={styles.mapSearchInput}
                  />
                </div>

                <GoogleMap
                  mapContainerClassName={styles.googleMap}
                  center={defaultCenter}
                  zoom={14}
                  onLoad={(map) => {
                    mapRef.current = map;
                    applyMapType(
                      map,
                      baseMapStyle,
                      labelsEnabled,
                      reliefEnabled,
                    );
                  }}
                  onClick={handleMapClick}
                  options={{
                    disableDefaultUI: false,
                    streetViewControl: false,
                    mapTypeControl: false,
                    fullscreenControl: true,
                    gestureHandling: "greedy",
                    ...mapControlOptions,
                  }}
                >
                  {/* Dibujo del polígono en tiempo real */}
                  {form.puntos.length > 0 && (
                    <Polygon
                      paths={form.puntos.map((p) => ({
                        lat: p.latitud,
                        lng: p.longitud,
                      }))}
                      options={{
                        fillColor: "#1E40AF",
                        fillOpacity: 0.35,
                        strokeColor: "#1E40AF",
                        strokeWeight: 3,
                      }}
                    />
                  )}

                  {/* Marcadores de los vértices */}
                  {form.puntos.map((p, idx) => (
                    <Marker
                      key={idx}
                      position={{ lat: p.latitud, lng: p.longitud }}
                      label={`${idx + 1}`}
                    />
                  ))}

                  {/* Botonera Flotante del Mapa */}
                  <div className={styles.mapControls}>
                    {form.puntos.length > 0 ? (
                      <button
                        type="button"
                        className={`${styles.mapBtn} ${isDrawing ? styles.mapBtnActive : ""}`}
                        onClick={() => setIsDrawing(!isDrawing)}
                        title={isDrawing ? "Finalizar dibujo" : "Editar área"}
                        aria-label={
                          isDrawing ? "Finalizar dibujo" : "Editar área"
                        }
                      >
                        <span className="material-icons-outlined">
                          {isDrawing ? "check_circle" : "edit_location_alt"}
                        </span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        className={`${styles.mapBtn} ${isDrawing ? styles.mapBtnActive : ""}`}
                        onClick={() => setIsDrawing(true)}
                        title="Dibujar área"
                        aria-label="Dibujar área"
                      >
                        <span className="material-icons-outlined">
                          edit_location_alt
                        </span>
                      </button>
                    )}

                    <button
                      type="button"
                      className={styles.mapBtn}
                      onClick={undoLastPoint}
                      disabled={form.puntos.length === 0}
                      title="Deshacer último punto"
                    >
                      <span className="material-icons-outlined">undo</span>
                      {/* Deshacer */}
                    </button>

                    <button
                      type="button"
                      className={styles.mapBtn}
                      onClick={clearPolygon}
                      disabled={form.puntos.length === 0}
                      title="Eliminar todos los puntos"
                    >
                      <span className="material-icons-outlined">delete</span>
                      {/* Limpiar Todo */}
                    </button>
                  </div>
                </GoogleMap>
                <div className={styles.mapTypeControlWrap}>
                  <div className={styles.mapTypeTabs} aria-label="Tipo de mapa">
                    <button
                      type="button"
                      className={`${styles.mapTypeBtn} ${baseMapStyle === "roadmap" ? styles.mapTypeBtnActive : ""}`}
                      onClick={() => setBaseMapStyle("roadmap")}
                      aria-pressed={baseMapStyle === "roadmap"}
                    >
                      Mapa
                    </button>
                    <button
                      type="button"
                      className={`${styles.mapTypeBtn} ${baseMapStyle === "satellite" ? styles.mapTypeBtnActive : ""}`}
                      onClick={() => setBaseMapStyle("satellite")}
                      aria-pressed={baseMapStyle === "satellite"}
                    >
                      Satelite
                    </button>
                  </div>
                  <div className={styles.mapTypeSubMenu}>
                    <span className={styles.mapTypeSubLabel}>
                      {baseMapStyle === "satellite" ? "Etiquetas" : "Relieve"}
                    </span>
                    <div className={styles.mapTypeSubRow}>
                      {baseMapStyle === "satellite" ? (
                        <>
                          <button
                            type="button"
                            className={`${styles.mapTypeSubBtn} ${labelsEnabled ? styles.mapTypeSubBtnActive : ""}`}
                            onClick={() => setLabelsEnabled(true)}
                            aria-pressed={labelsEnabled}
                          >
                            On
                          </button>
                          <button
                            type="button"
                            className={`${styles.mapTypeSubBtn} ${!labelsEnabled ? styles.mapTypeSubBtnActive : ""}`}
                            onClick={() => setLabelsEnabled(false)}
                            aria-pressed={!labelsEnabled}
                          >
                            Off
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            className={`${styles.mapTypeSubBtn} ${reliefEnabled ? styles.mapTypeSubBtnActive : ""}`}
                            onClick={() => setReliefEnabled(true)}
                            aria-pressed={reliefEnabled}
                          >
                            On
                          </button>
                          <button
                            type="button"
                            className={`${styles.mapTypeSubBtn} ${!reliefEnabled ? styles.mapTypeSubBtnActive : ""}`}
                            onClick={() => setReliefEnabled(false)}
                            aria-pressed={!reliefEnabled}
                          >
                            Off
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <p className={styles.mapHint}>
                {isDrawing ? (
                  `Haz clic en el mapa para añadir vértices (${form.puntos.length} puntos). Usa 'Deshacer' para eliminar el último punto.`
                ) : (
                  <>
                    Presiona el botón{" "}
                    <span className="material-icons-outlined">
                      edit_location_alt
                    </span>{" "}
                    para trazar el polígono del proyecto
                  </>
                )}
              </p>
            </div>
          </div>

          <div className={styles.footer}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={onClose}
            >
              Cancelar
            </button>
            <button type="submit" className={styles.submitBtn}>
              Guardar Proyecto{" "}
              <span className="material-icons-outlined">arrow_forward</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
