import { withApiBase } from "../../config/api.js";
import { authFetch } from "../../config/authFetch.js";
import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import "./PanelInmo.css";
import {
  PlusCircle,
  Home,
  Layers,
  LogOut,
  Copy,
  Link,
  ExternalLink,
  Eye,
  Edit,
  MapPin,
  Trash2,
  Search,
  Smile,
  Globe,
  ExternalLinkIcon,
  Link2,
  Link2Icon,
  Share,
  Share2Icon,
  PersonStanding,
  User,
  Check,
  CheckCheck,
  CheckCheckIcon,
  CheckCircle,
  CheckCircle2,
  CheckCircle2Icon,
  CheckCircleIcon,
  ChevronLeft,
  ChevronRight,
  ChevronDownIcon,
  ChevronUpIcon,
  Timer,
  TimerIcon,
  TimerReset,
  ClockFading,
  TagIcon,
  FoldersIcon,
  ChartSplineIcon,
  MessageCircle,
  MessageCircleHeartIcon,
  LogsIcon,
  LogInIcon,
  MapIcon,
  PointerIcon,
  PointerOffIcon,
  PinIcon,
  MapPinIcon,
  MapPlus,
  EyeOff,
} from "lucide-react";
import { FaWhatsapp, FaFacebook, FaGlobe } from "react-icons/fa";

import Loader from "../../components/Loading";
import GeoHabitaLoader from "../../components/GeoHabitaLoader";
const ProyectoModal = React.lazy(
  () => import("../inmobiliaria/proyecto/agregarProyecto"),
);
const LotesModal = React.lazy(() => import("../inmobiliaria/lote/LotesModal"));
const EditLoteModal = React.lazy(() => import("../inmobiliaria/lote/editLote"));
const EditProyectoModal = React.lazy(
  () => import("../inmobiliaria/proyecto/editProyecto"),
);
const FinancingModal = React.lazy(
  () => import("../inmobiliaria/proyecto/FinancingModal"),
);
const IconoModal = React.lazy(
  () => import("../inmobiliaria/proyecto/icono/IconoModal"),
);
const EspaciosModal = React.lazy(
  () => import("../inmobiliaria/proyecto/espacio/EspaciosModal"),
);
const Modal360 = React.lazy(() => import("../casa360/Modal360"));
import ThemeSwitch from "../../components/ThemeSwitch";
import { useTheme } from "../../context/ThemeContext";

const resolveProjectImageUrl = (rawPath) => {
  if (!rawPath || typeof rawPath !== "string") return null;
  if (rawPath.startsWith("http")) return rawPath;
  const normalizedPath = rawPath.startsWith("/") ? rawPath : `/${rawPath}`;
  return withApiBase(`http://127.0.0.1:8000${normalizedPath}`);
};

const fetchProjectImages = async (projectId) => {
  if (!projectId) return [];
  try {
    const res = await fetch(
      withApiBase(
        `http://127.0.0.1:8000/api/list_imagen_proyecto/${projectId}`,
      ),
    );
    if (!res.ok) return [];
    const items = await res.json();
    if (!Array.isArray(items)) return [];
    return items
      .map((item) => resolveProjectImageUrl(item?.imagenproyecto))
      .filter(Boolean);
  } catch (error) {
    console.error("No se pudo resolver la galería del proyecto:", error);
    return [];
  }
};

const hasFinancingConfigValue = (value) => {
  if (!value) return false;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed || trimmed === "{}" || trimmed === "null") return false;
    try {
      const parsed = JSON.parse(trimmed);
      return !!parsed && typeof parsed === "object" && Object.keys(parsed).length > 0;
    } catch {
      return true;
    }
  }
  return typeof value === "object" ? Object.keys(value).length > 0 : Boolean(value);
};

const CardProyecto = ({
  proyecto,
  loteStats,
  onViewLotes,
  onEdit,
  onFinancing,
  onSpaces,
  onIcon,
  onDelete,
  onTogglePublic,
  isUpdatingPublic,
  onOpen360
}) => {
  const imageCandidates = useMemo(
    () => {
      const candidates = [
        proyecto.hero_image_resolved,
        ...(Array.isArray(proyecto.gallery_images) ? proyecto.gallery_images : []),
        proyecto.hero_image_resolved,
        proyecto.hero_image,
        proyecto.imagenproyecto,
        proyecto.imagen,
        proyecto.portada,
      ]
        .map(resolveProjectImageUrl)
        .filter(Boolean);

      return Array.from(new Set(candidates));
    },
    [
      proyecto.hero_image_resolved,
      proyecto.gallery_images,
      proyecto.hero_image,
      proyecto.imagenproyecto,
      proyecto.imagen,
      proyecto.portada,
    ],
  );
  const [imageIndex, setImageIndex] = useState(0);
  const spaceStats = proyecto.space_stats || {};
  const imageSrc = imageCandidates[imageIndex] || null;

  const estadosMap = { 0: "Vendido", 1: "Disponible", 2: "Agotado" };
  const isPublic = proyecto.publico_mapa !== 0;
  const totalLotes = loteStats?.total ?? 0;
  const lotesDisponibles = loteStats?.disponible ?? 0;
  const lotesReservados = loteStats?.reservado ?? 0;
  const lotesVendidos = loteStats?.vendido ?? 0;
  const totalContactos = proyecto.total_contactos ?? 0;
  const isFinancingConfigured = hasFinancingConfigValue(
    proyecto.financing_config || proyecto.financing_config_full,
  );

  useEffect(() => {
    setImageIndex(0);
  }, [proyecto.idproyecto, imageCandidates.length]);

  return (
    <div className="proyecto-card">
      <div className="card-image-container">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={proyecto.nombreproyecto}
            className="img-carousel"
            onError={() => {
              setImageIndex((prev) =>
                prev + 1 < imageCandidates.length ? prev + 1 : prev,
              );
            }}
          />
        ) : (
          <div className="no-image-placeholder">
            <Globe size={48} opacity={0.2} />
            <span className="card-loading-text">Sin imagen de portada</span>
          </div>
        )}
        <div className="estado-badge">
          {estadosMap[proyecto.estado] || "ACTIVO"}
        </div>
        <button
          type="button"
          className={`public-toggle ${isPublic ? "" : "public-toggle--off"}`}
          onClick={() => onTogglePublic?.(proyecto, !isPublic)}
          disabled={isUpdatingPublic}
          title={
            isPublic
              ? "Visible en mapa público"
              : "Oculto del mapa público"
          }
        >
          <span className="public-toggle-dot">
            {!isPublic && <EyeOff size={11} strokeWidth={2.4} />}
          </span>
          <span className="public-toggle-label">
            {isUpdatingPublic ? "Guardando..." : isPublic ? "Público" : "Incógnito"}
          </span>
        </button>
      </div>

      <div className="card-info-content">
        <div className="card-info-panel">
          <div className="card-title-row">
            <div className="card-title-block">
              <div className="card-title-kicker">Centro Turístico publicado en GeoHabita</div>
              <h3 className="card-title">{proyecto.nombreproyecto}</h3>
            </div>
            <div className="card-header-actions">
              <div className="card-minor-metric card-minor-metric-visits">
                <span className="card-minor-metric-dot" />
                <div className="card-minor-metric-copy">
                  <strong>{proyecto.total_clicks ?? 0}</strong>
                  <span>Vistas del centro turístico</span>
                </div>
              </div>
              <button
                onClick={() => onDelete && onDelete(proyecto.idproyecto)}
                className="btn-icon-overlay btn-danger"
                title="Eliminar"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>

          <div className="card-location">
            <MapPin size={14} />
            <span>
              Coordenadas: {proyecto.latitud || "—"}, {proyecto.longitud || "—"}
            </span>
          </div>

          <div className="card-overview-grid">
            <div className="card-overview-pill card-overview-pill--blue">
              <span className="card-overview-icon">
                <MessageCircle size={15} />
              </span>
              <span className="card-overview-label">Contactos</span>
              <strong>{totalContactos}</strong>
            </div>
          </div>

          <div className="card-meta-grid">
            <div className="card-meta-card card-meta-card--space">
              <span className="card-meta-kicker">Espacios</span>
              <strong>{spaceStats?.total ?? 0}</strong>
              <small>
                {Math.round(Number(spaceStats?.area_total || 0)).toLocaleString("es-PE")} m²
              </small>
            </div>
          </div>

          <div className="card-space-strip">
            {Array.isArray(spaceStats?.top_types) && spaceStats.top_types.length > 0 ? (
              spaceStats.top_types.map((item, index) => (
                <span
                  key={`space-top-${item.nombre}-${item.total}-${index}`}
                  className="card-space-top-types"
                >
                  {item.nombre} · {item.total}
                </span>
              ))
            ) : (
              <span className="card-space-metric">Sin espacios destacados</span>
            )}
          </div>

          <div className="card-footer">
            <div className="card-footer-head">
              <span className="card-footer-title">Acciones rápidas</span>
              <span className="card-footer-subtitle">
                Gestiona proyecto, espacios, financiamiento y tour
              </span>
            </div>
            <div className="card-actions-left">
              <button
                onClick={() => onEdit(proyecto.idproyecto)}
                className="btn-gestionar-unidades"
                title="Editar"
                aria-label="Editar centro turístico"
              >
                <Edit size={16} />
                <span className="btn-action-text">Centro</span>
              </button>
              <button
                onClick={() => onIcon(proyecto.idproyecto)}
                className="btn-gestionar-unidades"
                title="Íconos"
                aria-label="Agregar iconos"
              >
                <MapPlus size={16} />
                <span className="btn-action-text">Íconos</span>
              </button>
              <button
                type="button"
                onClick={() => onSpaces(proyecto.idproyecto)}
                className="btn-gestionar-unidades btn-space"
                title="Gestionar espacios"
              >
                <PinIcon size={16} />
                <span className="btn-action-text">Espacios</span>
              </button>
              <button
                type="button"
                onClick={() => onOpen360(proyecto.idproyecto)} // <--- 3. Llama a la función pasando el ID
                className="btn-gestionar-unidades"
                title="360"
              >
                <Globe size={16} />
                <span className="btn-action-text">Tour 360</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const PanelInmo = ({ setAppLoading }) => {
  const [showModal360, setShowModal360] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const { isDark, toggleTheme } = useTheme();
  const [resumen, setResumen] = useState(null);
  const [clicks, setClicks] = useState(null);
  const [proyectos, setProyectos] = useState([]);
  const [lotes, setLotes] = useState([]);
  const [lotesLoading, setLotesLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dashboardLoaded, setDashboardLoaded] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [areaMin, setAreaMin] = useState("");
  const [areaMax, setAreaMax] = useState("");
  const [sortKey, setSortKey] = useState("nombre");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [lotesPage, setLotesPage] = useState(1);
  const [lotesMeta, setLotesMeta] = useState({
    page: 1,
    page_size: 20,
    total: 0,
    total_pages: 1,
  });
  const [lotesRefreshKey, setLotesRefreshKey] = useState(0);
  const [showRedes, setShowRedes] = useState(false);
  const token = localStorage.getItem("access");
  const nombre = localStorage.getItem("nombre");
  const nombreInmo = localStorage.getItem("nombreinmobiliaria");
  const idInmo = localStorage.getItem("idinmobiliaria");

  const [showModal, setShowModal] = useState(false);
  const [showLotes, setShowLotes] = useState(false);
  const [showModalEditProyecto, setShowModalEditProyecto] = useState(null);
  const [showFinancingModal, setShowFinancingModal] = useState(null);
  const [showIconoModal, setShowIconoModal] = useState(false);
  const [showEspaciosModal, setShowEspaciosModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [showEditLote, setShowEditLote] = useState(false);
  const [selectedLote, setSelectedLote] = useState(null);
  const [publicoUpdating, setPublicoUpdating] = useState({});
  const tutorialScrollRef = useRef(null);
  const [tutorialScroll, setTutorialScroll] = useState({
    left: false,
    right: false,
  });

  const mapUrl = `${window.location.origin}/mapa/${idInmo}`;
  const publicBase =
    import.meta.env.BASE_URL === "./" ? "/" : import.meta.env.BASE_URL;
  const tutoriales = [
    {
      href: "https://www.youtube.com/watch?v=lZNPDIBqyCg",
      titulo: "Agregar proyectos de lotes, casas y departamentos",
      descripcion: "Crea proyectos completos paso a paso en GeoHabita.",
      imagen: `${publicBase}1.jpg`,
    },
    {
      href: "https://www.youtube.com/watch?v=PEvwYZO2BtU",
      titulo: "Agregar PDF para trazado, después de crear proyecto",
      descripcion: "Sube planos en PDF para dibujar lotes correctamente.",
      imagen: `${publicBase}2.jpg`,
    },
    {
      href: "https://www.youtube.com/watch?v=gzZHYnXD_5Q",
      titulo: "Registrar Casa Individual en el Mapa",
      descripcion: "Agrega propiedades individuales fácilmente.",
      imagen: `${publicBase}3.jpg`,
    },
    {
      href: "https://www.youtube.com/watch?v=zOIoX1ZvAM0",
      titulo: "Agregar lotes, después de crear el proyecto",
      descripcion: "Aprende a añadir más lotes cuando tu proyecto ya existe.",
      imagen: `${publicBase}4.jpg`,
    },
    {
      href: "https://www.youtube.com/watch?v=JHP9YWTIgJs",
      titulo: "Registro de Proyecto de Departamentos",
      descripcion:
        "Aprende paso a paso cómo crear y configurar un proyecto inmobiliario de departamentos dentro de GeoHabita.",
      imagen: `${publicBase}5.jpg`,
    },
  ];

  const updateTutorialScrollState = () => {
    const container = tutorialScrollRef.current;
    if (!container) return;

    const maxScroll = container.scrollWidth - container.clientWidth;
    setTutorialScroll({
      left: container.scrollLeft > 4,
      right: maxScroll - container.scrollLeft > 4,
    });
  };

  const scrollTutorials = (direction) => {
    const container = tutorialScrollRef.current;
    if (!container) return;

    const step = Math.max(container.clientWidth * 0.82, 260);
    container.scrollBy({
      left: direction === "left" ? -step : step,
      behavior: "smooth",
    });
  };

  const fetchData = async ({ silent = false } = {}) => {
    if (!token || !idInmo) {
      window.location.href = "/";
      return;
    }
    try {
      if (!silent) {
        setLoading(true);
      }
      const [resOverview, resProjects] = await Promise.all([
        authFetch(
          withApiBase(
            `http://127.0.0.1:8000/api/dashboard_overview_inmobiliaria/${idInmo}/`,
          ),
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        ),
        authFetch(
          withApiBase(`http://127.0.0.1:8000/api/getProyectoInmo/${idInmo}`),
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        ),
      ]);

      const overview = resOverview.ok ? await resOverview.json() : {};
      const rawProjects = resProjects.ok ? await resProjects.json() : [];
      const projectById = new Map(
        (Array.isArray(rawProjects) ? rawProjects : []).map((project) => [
          Number(project?.idproyecto),
          project,
        ]),
      );
      const overviewProjects = Array.isArray(overview?.proyectos)
        ? overview.proyectos
        : [];
      const normalizedProjects = await Promise.all(
        overviewProjects.map(async (project) => {
          const fullProject = projectById.get(Number(project?.idproyecto)) || {};
          const directImage =
            resolveProjectImageUrl(
              project.hero_image ||
              project.imagenproyecto ||
              project.imagen ||
              project.portada,
            ) || null;
          const galleryImages = await fetchProjectImages(project.idproyecto);
          return {
            ...project,
            financing_config_full: fullProject?.financing_config ?? null,
            gallery_images: galleryImages,
            hero_image_resolved: directImage || galleryImages[0] || null,
          };
        }),
      );

      setProyectos(normalizedProjects);
      setResumen(overview?.resumen || null);
      setClicks(overview?.clicks || null);
      setDashboardLoaded(true);
    } catch (err) {
      console.error(err);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDashboardRefresh = (options = {}) => {
    if (!options?.refreshed) return;
    fetchData({ silent: true });
    if (options?.refreshLotes) {
      setLotesRefreshKey((prev) => prev + 1);
    }
  };

  useEffect(() => {
    setLotesPage(1);
  }, [searchTerm, statusFilter, projectFilter, priceMin, priceMax, areaMin, areaMax, sortKey]);

  useEffect(() => {
    if (!token || !idInmo) return;

    const controller = new AbortController();
    const fetchLotesPage = async () => {
      try {
        setLotesLoading(true);
        const query = new URLSearchParams({
          page: String(lotesPage),
          page_size: "20",
          search: searchTerm,
          status: statusFilter,
          project: projectFilter,
          sort: sortKey,
          price_min: priceMin,
          price_max: priceMax,
          area_min: areaMin,
          area_max: areaMax,
        });

        const res = await authFetch(
          withApiBase(
            `http://127.0.0.1:8000/api/dashboard_lotes_inmobiliaria/${idInmo}/?${query.toString()}`,
          ),
          {
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal,
          },
        );
        const data = res.ok ? await res.json() : null;
        if (!controller.signal.aborted) {
          setLotes(Array.isArray(data?.items) ? data.items : []);
          setLotesMeta({
            page: data?.page || 1,
            page_size: data?.page_size || 20,
            total: data?.total || 0,
            total_pages: data?.total_pages || 1,
          });
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error(err);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLotesLoading(false);
        }
      }
    };

    fetchLotesPage();
    return () => controller.abort();
  }, [
    token,
    idInmo,
    lotesPage,
    lotesRefreshKey,
    searchTerm,
    statusFilter,
    projectFilter,
    sortKey,
    priceMin,
    priceMax,
    areaMin,
    areaMax,
  ]);

  useEffect(() => {
    document.body.classList.add("panel-inmo-body");
    return () => {
      document.body.classList.remove("panel-inmo-body");
    };
  }, []);

  useEffect(() => {
    const container = tutorialScrollRef.current;
    if (!container) return;

    updateTutorialScrollState();
    container.addEventListener("scroll", updateTutorialScrollState);
    window.addEventListener("resize", updateTutorialScrollState);

    return () => {
      container.removeEventListener("scroll", updateTutorialScrollState);
      window.removeEventListener("resize", updateTutorialScrollState);
    };
  }, [tutoriales.length]);


  const handleLogout = () => {
    const doLogout = async () => {
      try {
        await authFetch(withApiBase("http://127.0.0.1:8000/api/logout/"), {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
      } catch (err) {
        console.error("Error al cerrar sesión:", err);
      } finally {
        localStorage.clear();
        window.location.href = "/";
      }
    };
    doLogout();
  };

  const handleDeleteProyecto = async (idproyecto) => {
    try {
      const res = await authFetch(
        withApiBase(
          `http://127.0.0.1:8000/api/deleteProyecto/${idproyecto}/`,
        ),
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!res.ok) {
        window.alertError?.("No se pudo eliminar el proyecto âŒ");
        return;
      }

      setProyectos((prev) => prev.filter((p) => p.idproyecto !== idproyecto));
      setLotes((prev) => prev.filter((l) => l.idproyecto !== idproyecto));
      window.alertSuccess?.("Proyecto eliminado âœ…");
      fetchData();
      setLotesRefreshKey((prev) => prev + 1);
    } catch (err) {
      console.error("Error eliminando proyecto:", err);
      window.alertError?.("Error de red al eliminar proyecto ðŸš«");
    } finally {
      setProjectToDelete(null);
    }
  };

  const handleTogglePublicoMapa = async (proyecto, nextValue) => {
    if (!proyecto?.idproyecto) return;
    const id = proyecto.idproyecto;
    const nextPublico = nextValue ? 1 : 0;

    setPublicoUpdating((prev) => ({ ...prev, [id]: true }));
    setProyectos((prev) =>
      prev.map((p) =>
        p.idproyecto === id ? { ...p, publico_mapa: nextPublico } : p,
      ),
    );

    try {
      const res = await authFetch(
        withApiBase(`http://127.0.0.1:8000/api/updateProyecto/${id}/`),
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ publico_mapa: nextPublico }),
        },
      );
      if (!res.ok) {
        throw new Error("No se pudo actualizar visibilidad.");
      }
    } catch (error) {
      console.error(error);
      setProyectos((prev) =>
        prev.map((p) =>
          p.idproyecto === id ? { ...p, publico_mapa: proyecto.publico_mapa } : p,
        ),
      );
      window.alertError?.("No se pudo actualizar la visibilidad.");
    } finally {
      setPublicoUpdating((prev) => ({ ...prev, [id]: false }));
    }
  };

  const totalLotes = resumen?.totalLotes || 0;
  const totalContactos = clicks?.total_clicks_contactos || 0;
  const totalInteres = clicks?.total_clicks_proyectos || 0;
  const engagementRate = useMemo(() => {
    if (!proyectos.length) return 0;
    return Math.round((totalContactos / proyectos.length) * 10) / 10;
  }, [totalContactos, proyectos.length]);

  const proyectoNombrePorId = useMemo(() => {
    const map = new Map();
    proyectos.forEach((p) => map.set(p.idproyecto, p.nombreproyecto));
    return map;
  }, [proyectos]);

  const lotesStatsPorProyecto = useMemo(() => {
    const map = new Map();
    proyectos.forEach((p) => {
      map.set(p.idproyecto, p.lote_stats || {
        total: 0,
        disponible: 0,
        reservado: 0,
        vendido: 0,
      });
    });
    return map;
  }, [proyectos]);

  const getEstadoLote = (vendido) => {
    const value = Number(vendido);
    if (value === 0) return { label: "Disponible", className: "status-available" };
    if (value === 2) return { label: "Reservado", className: "status-reserved" };
    if (value === 1) return { label: "Vendido", className: "status-sold" };
    return { label: "Sin estado", className: "status-unknown" };
  };

  const parseDateSafe = (value) => {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const isNewLote = (lote) => {
    const date =
      parseDateSafe(lote.created_at) ||
      parseDateSafe(lote.fecha_creacion) ||
      parseDateSafe(lote.fecha_registro) ||
      parseDateSafe(lote.createdAt) ||
      parseDateSafe(lote.fecha);
    if (!date) return false;
    const diffDays = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= 7;
  };

  const handleEstadoChange = async (idlote, nuevoEstado) => {
    try {
      const res = await authFetch(
        withApiBase(
          `http://127.0.0.1:8000/api/updateLoteVendido/${idlote}/`,
        ),
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ vendido: nuevoEstado }),
        },
      );
      if (res.ok) {
        fetchData();
        setLotesRefreshKey((prev) => prev + 1);
      } else {
        window.alertError?.("No se pudo actualizar el estado âŒ");
      }
    } catch (err) {
      console.error(err);
      window.alertError?.("Error al actualizar el estado ðŸš«");
    }
  };
  useEffect(() => {
    if (!setAppLoading) return;
    setAppLoading(loading);
  }, [loading, setAppLoading]);

  // if (loading) return <Loader />;
  if (loading && !setAppLoading) return <GeoHabitaLoader autoHide={false} />;

  const redes = [
    { nombre: "Whatsapp", icono: <FaWhatsapp color="green" /> },
    { nombre: "Facebook", icono: <FaFacebook color="#1877f2" /> },
    { nombre: "Web", icono: <FaGlobe color="#0077b6" /> },
  ];

  return (
    <div className="panel-inmo-container">
      {/* HEADER */}
      <header className="dashboard-header">
        <div className="header-brand">
          <div className="brand-icon">
            <Home size={24} />
          </div>
          <div>
            <h1 className="brand-title">{nombreInmo}</h1>
            <p className="brand-subtitle">Gestión Inmobiliaria</p>
          </div>
        </div>
        <div className="header-user">
          <ThemeSwitch
            checked={isDark}
            onChange={toggleTheme}
            className="theme-switch-horizontal"
          />
          <div className="user-info">
            <div className="user-avatar">
              <User size={20} />
            </div>
            <span className="user-greeting">Bienvenid@,</span>
            <span className="user-name">{nombre}</span>
          </div>
          <button onClick={handleLogout} className="btn-logout">
            <LogOut size={18} /> Salir
          </button>
        </div>
      </header>

      <main className="dashboard-content">
        {/* <section className="dashboard-hero-card">
          <div className="dashboard-hero-copy">
            <p className="dashboard-hero-eyebrow">Panel Comercial</p>
            <h2>Impulsa tus conversiones con una vista clara del negocio</h2>
            <p>
              Monitorea inventario, interés y contactos en tiempo real para
              tomar decisiones más rápidas.
            </p>
          </div>
          <div className="dashboard-hero-metrics">
            <div className="hero-metric">
              <span className="hero-metric-label">Inventario total</span>
              <strong>{totalLotes}</strong>
            </div>
            <div className="hero-metric">
              <span className="hero-metric-label">Interacciones</span>
              <strong>{totalInteres}</strong>
            </div>
            <div className="hero-metric">
              <span className="hero-metric-label">Contactos / proyecto</span>
              <strong>{engagementRate}</strong>
            </div>
          </div>
        </section> */}
        {/* {Videos} */}
        <div className="tutorial-section">
          <h3 className="tutorial-title">
            Videotutoriales para aprender de GeoHabita
          </h3>

          <div className="tutorial-carousel-wrapper">
            <button
              type="button"
              className={`tutorial-nav tutorial-nav-left ${tutorialScroll.left ? "is-visible" : ""}`}
              onClick={() => scrollTutorials("left")}
              aria-label="Deslizar tutoriales a la izquierda"
            >
              <ChevronLeft size={18} />
            </button>

            <div className="tutorial-grid" ref={tutorialScrollRef}>
              {tutoriales.map((tutorial) => (
                <a
                  key={tutorial.href}
                  href={tutorial.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tutorial-card"
                  style={{ "--tutorial-bg": `url(${tutorial.imagen})` }}
                >
                  <div className="tutorial-content">
                    <h4>{tutorial.titulo}</h4>
                    <p>{tutorial.descripcion}</p>
                  </div>
                </a>
              ))}
            </div>

            <button
              type="button"
              className={`tutorial-nav tutorial-nav-right ${tutorialScroll.right ? "is-visible" : ""}`}
              onClick={() => scrollTutorials("right")}
              aria-label="Deslizar tutoriales a la derecha"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
        {/* ENLACE COMPARTIR */}
        <section className="link-share-card">
          <div className="link-icon-box">
            <Link size={32} />
          </div>
          <div className="input-group">
            <label className="link-label">
              Enlace Exclusivo de tus Proyectos
            </label>
            <div className="link-input-wrapper">
              <input className="input-styled" readOnly value={mapUrl} />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(mapUrl);
                  window.alertSuccess?.("Copiado");
                }}
                className="btn-copy share-action-btn"
              >
                <Copy size={18} />
                <span className="share-btn-text">Copiar</span>
              </button>
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator
                      .share({
                        title: "GeoHabita",
                        text: "Accede a mis proyectos en GeoHabita",
                        url: mapUrl,
                      })
                      .then(() => window.alertSuccess?.("Enlace compartido"))
                      .catch((error) =>
                        console.log("Error al compartir:", error),
                      );
                  } else {
                    navigator.clipboard.writeText(mapUrl);
                    window.alertInfo?.(
                      "El navegador no soporta compartir. Enlace copiado al portapapeles.",
                    );
                  }
                }}
                className="btn-share share-action-btn"
              >
                <Share2Icon size={18} />
                <span className="share-btn-text">Compartir</span>
              </button>
              <button
                onClick={() => {
                  window.open(mapUrl, "_blank");
                }}
                className="btn-map share-action-btn"
              >
                <MapPin size={18} />
                <span className="share-btn-text">Ver en Mapa</span>
              </button>
            </div>
          </div>
        </section>
        <div className="stats-grid">
          <div className="stat-box">
            <div className="stat-label">Centros Turísticos</div>
            <div className="stat-value">
              {proyectos.length} <FoldersIcon size={24} color="#cbd5e1" />
            </div>
          </div>

          <div className="stat-box accent-blue">
            <div className="stat-label">Interés en Centros</div>
            <div className="stat-value stat-value-blue">
              {clicks?.total_clicks_proyectos || 0}
              <ChartSplineIcon size={24} />
            </div>
          </div>
          <div className="stat-box accent-black contact-card">
            <div className="stat-label">Contactos</div>
            <div className="stat-value stat-value-black">
              {clicks?.total_clicks_contactos || 0}
              <MessageCircleHeartIcon size={24} />
            </div>
            <button
              onClick={() => setShowRedes(!showRedes)}
              className="contact-toggle-btn"
            >
              {showRedes ? (
                <ChevronUpIcon size={18} />
              ) : (
                <ChevronDownIcon size={18} />
              )}
            </button>

            {showRedes && (
              <div className="contact-details">
                {redes.map((rs) => {
                  const red = clicks?.detalle_contactos?.find(
                    (r) => r.redSocial === rs.nombre,
                  );
                  return (
                    <div key={rs.nombre} className="contact-row">
                      {rs.icono}
                      <span>
                        <strong>{rs.nombre}:</strong> {red ? red.total : 0}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* GALERÍA */}
        <section>
          <div className="section-header">
            <h2 className="section-title">Mis Centros Turísticos</h2>
            <button onClick={() => setShowModal(true)} className="btn-copy">
              <PlusCircle size={18} /> Agregar Centro Turístico
            </button>
          </div>
          <div className="projects-grid">
            {proyectos.map((p) => (
              <CardProyecto
                key={p.idproyecto}
                proyecto={p}
                loteStats={lotesStatsPorProyecto.get(p.idproyecto)}
                onViewLotes={setShowLotes}
                onEdit={(idproyecto) =>
                  setShowModalEditProyecto({
                    idproyecto,
                    initialSection: "info",
                  })
                }
                onFinancing={setShowFinancingModal}
                onSpaces={setShowEspaciosModal}
                onIcon={setShowIconoModal}
                onDelete={setProjectToDelete}
                onTogglePublic={handleTogglePublicoMapa}
                isUpdatingPublic={!!publicoUpdating[p.idproyecto]}
                onOpen360={(id) => {
                  setSelectedProjectId(id);
                  setShowModal360(true);
                }}
              />
            ))}
          </div>
        </section>

      </main>

      {/* MODALES ORIGINALES */}
      {showModal && (
        <Suspense fallback={<Loader />}>
          <ProyectoModal
            onClose={(options) => {
              setShowModal(false);
              handleDashboardRefresh({
                refreshed: Boolean(options?.refreshed),
                refreshLotes: true,
              });
            }}
            idinmobiliaria={idInmo}
          />
        </Suspense>
      )}

      {showModalEditProyecto && (
        <Suspense fallback={<Loader />}>
          <EditProyectoModal
            onClose={(options) => {
              setShowModalEditProyecto(null);
              handleDashboardRefresh({
                refreshed: Boolean(options?.refreshed),
                refreshLotes: true,
              });
            }}
            idinmobiliaria={idInmo}
            proyecto={proyectos.find(
              (p) => p.idproyecto === showModalEditProyecto?.idproyecto,
            )}
          />
        </Suspense>
      )}

      {showIconoModal && (
        <Suspense fallback={<Loader />}>
          <IconoModal
            onClose={(options) => {
              setShowIconoModal(false);
              handleDashboardRefresh({
                refreshed: Boolean(options?.refreshed),
              });
            }}
            idproyecto={showIconoModal}
          />
        </Suspense>
      )}
      {showEspaciosModal && (
        <Suspense fallback={<Loader />}>
          <EspaciosModal
            onClose={(options) => {
              setShowEspaciosModal(false);
              handleDashboardRefresh({
                refreshed: Boolean(options?.refreshed),
              });
            }}
            idproyecto={showEspaciosModal}
          />
        </Suspense>
      )}

      {projectToDelete && (
        <div
          className="confirm-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setProjectToDelete(null);
          }}
        >
          <div className="confirm-card" role="dialog" aria-modal="true">
            <h3>Eliminar proyecto</h3>
            <p>
              Esta acción eliminará el proyecto y sus datos relacionados. No se
              puede deshacer.
            </p>
            <div className="confirm-actions">
              <button
                type="button"
                className="confirm-btn confirm-btn-cancel"
                onClick={() => setProjectToDelete(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="confirm-btn confirm-btn-danger"
                onClick={() => handleDeleteProyecto(projectToDelete)}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 360 */}
      {showModal360 && (
        <Suspense fallback={<Loader />}>
          <Modal360
            idproyecto={selectedProjectId}
            onClose={() => {
              setShowModal360(false);
              setSelectedProjectId(null);
            }}
          />
        </Suspense>
      )}
    </div>
  );
};

export default PanelInmo;



