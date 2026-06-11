import { withApiBase } from "../../config/api.js";
import { authFetch } from "../../config/authFetch.js";
import { formatLocalDateForApi, formatLocalTimeForApi } from "../../utils/dateTime.js";
import React, {
  Suspense,
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import {
  FaCar,
  FaBuilding,
  FaRulerCombined,
  FaChevronLeft,
  FaChevronRight,
  FaFacebook,
  FaWhatsapp,
  FaGlobe,
  FaPhoneAlt,
  FaShareAlt,
  FaWalking,
  FaUtensils,
  FaTint,
  FaStar,
  FaClock,
  FaTicketAlt,
  FaChevronDown,
} from "react-icons/fa";
import styles from "./Proyecto.module.css";
import useImagePanZoom from "../../components/useImagePanZoom";

const Viewer360Modal = React.lazy(() => import("./Viewer360ModalCasa"));

gsap.registerPlugin(useGSAP);

const formatMoney = (value, currency = "S/") => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return `${currency} 0.00`;
  return `${currency} ${amount.toLocaleString("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const ProyectoSidebar = ({
  inmo,
  proyecto,
  imagenes,
  espacios = [],
  onClose,
  walkingInfo,
  drivingInfo,
  mapHeaderOffsetPx = 0,
  forceCompactForLote = false,
  isLoading = false,
  inPanel = false,
}) => {
  // 360
  const [show360, setShow360] = useState(false);
  const [images360, setImages360] = useState([]);
  const [images360Status, setImages360Status] = useState("idle");
  const [reviews, setReviews] = useState([]);
  const [reviewsStatus, setReviewsStatus] = useState("idle");

  const [expanded] = useState(false);
  const [currentImg, setCurrentImg] = useState(0);
  const [fullscreenImgIndex, setFullscreenImgIndex] = useState(null);
  const [isMobileView, setIsMobileView] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth <= 768 : false,
  );
  const [sheetMode, setSheetMode] = useState("mid");
  const [mobileSheetTop, setMobileSheetTop] = useState(null);
  const [isSheetDragging, setIsSheetDragging] = useState(false);
  const sidebarRef = useRef(null);
  const inmoFooterRef = useRef(null);
  const contentRef = useRef(null);
  const carouselTouchStartX = useRef(0);
  const carouselTouchEndX = useRef(0);
  const sheetTouchStartY = useRef(0);
  const sheetTouchDeltaY = useRef(0);
  const sheetTouchStartTop = useRef(0);
  const nestedTouchStartY = useRef(0);
  const nestedTouchDeltaY = useRef(0);
  const nestedStartAtTop = useRef(false);
  const nestedStartAtBottom = useRef(false);
  const nestedScrollableTarget = useRef(null);
  const previousSheetStateRef = useRef(null);
  const images360CacheRef = useRef(new Map());
  const imagesPending = imagenes === null;
  const validImages = useMemo(() => {
    const imageItems = Array.isArray(imagenes) ? imagenes : [];
    return imageItems.filter((img) => {
      const src = img?.imagenproyecto;
      if (typeof src !== "string") return false;
      const trimmed = src.trim();
      if (!trimmed) return false;
      return !trimmed.toLowerCase().includes("no hay imagenes referenciales");
    });
  }, [imagenes]);

  useEffect(() => {
    setShow360(false);
    setImages360([]);
    setImages360Status("idle");
  }, [proyecto?.idproyecto]);

  const loadImages360 = useCallback(async () => {
    const projectId = proyecto?.idproyecto;
    if (!projectId) return [];

    const cached = images360CacheRef.current.get(projectId);
    if (cached) {
      setImages360(cached);
      setImages360Status("ready");
      return cached;
    }

    setImages360Status("loading");
    try {
      const res = await fetch(
        withApiBase(
          `http://51.81.85.35:8002/api/get_imagen_360_casa/${projectId}/`,
        ),
      );
      const data = res.ok ? await res.json() : [];
      const normalized = Array.isArray(data) ? data : [];
      images360CacheRef.current.set(projectId, normalized);
      setImages360(normalized);
      setImages360Status("ready");
      return normalized;
    } catch (err) {
      console.error("Error cargando 360:", err);
      setImages360Status("error");
      return [];
    }
  }, [proyecto?.idproyecto]);

  const handleOpen360 = useCallback(async () => {
    const loadedImages = images360.length ? images360 : await loadImages360();
    if (loadedImages.length) {
      setShow360(true);
      return;
    }
    window.alert("Este proyecto no cuenta con vista 360° disponible.");
  }, [images360, loadImages360]);

  const mensajeWhatsapp = encodeURIComponent(
    `Hola, vengo desde GeoHabita.\n` +
    `Estoy interesado en el proyecto *"${proyecto.nombreproyecto}"*.\n` +
    `Me gustaría recibir más información sobre disponibilidad, valor y formas de pago.\n` +
    `¡Quedo atento(a)!`,
  );
  const phoneNumber = useMemo(() => {
    const raw =
      inmo?.telefono ||
      inmo?.celular ||
      inmo?.whatsapp ||
      inmo?.telefono1 ||
      "";
    return String(raw).replace(/[^\d+]/g, "");
  }, [inmo]);

  const parseMinutes = (durationText) => {
    if (!durationText) return "---";
    const hMatch = durationText.match(/(\d+)\s*h/i);
    const mMatch = durationText.match(/(\d+)\s*min/i);
    if (hMatch || mMatch) {
      const total = Number(hMatch?.[1] || 0) * 60 + Number(mMatch?.[1] || 0);
      return total > 0 ? `${total}` : "---";
    }
    const n = durationText.match(/[\d.,]+/);
    if (!n) return "---";
    return `${Math.round(Number(n[0].replace(",", ".")))}`;
  };

  const parseKm = (distanceText) => {
    if (!distanceText) return "---";
    const n = distanceText.match(/[\d.,]+/);
    if (!n) return "---";
    return n[0].replace(",", ".");
  };

  const carMinutes = parseMinutes(drivingInfo?.duration);
  const walkMinutes = parseMinutes(walkingInfo?.duration);
  const carKm = parseKm(drivingInfo?.distance);
  const walkKm = parseKm(walkingInfo?.distance);
  const whatsappHref = inmo?.whatsapp
    ? `https://wa.me/${inmo.whatsapp}?text=${mensajeWhatsapp}`
    : undefined;
  const facebookHref = inmo?.facebook || undefined;
  const webHref = inmo?.pagina || undefined;
  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    const proyectoId = proyecto?.idproyecto;
    if (!proyectoId) return "";
    const url = new URL(window.location.href);
    url.search = "";
    url.searchParams.set("proyecto", proyectoId);
    return url.toString();
  }, [proyecto?.idproyecto]);
  const projectNameWords = useMemo(
    () =>
      String(proyecto?.nombreproyecto || "")
        .trim()
        .split(/\s+/)
        .filter(Boolean),
    [proyecto?.nombreproyecto],
  );
  const [reviewText, setReviewText] = useState("");
  const [reviewerName, setReviewerName] = useState("");
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewHoverRating, setReviewHoverRating] = useState(0);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const avgRating = useMemo(() => {
    if (!reviews.length) return 0;
    return reviews.reduce((acc, r) => acc + (Number(r.calificacion) || 0), 0) / reviews.length;
  }, [reviews]);

  const isOpenNow = useMemo(() => {
    if (!proyecto?.horario_apertura || !proyecto?.horario_cierre) return null;
    const now = new Date();
    const [openH = 0, openM = 0] = proyecto.horario_apertura.split(":").map(Number);
    const [closeH = 0, closeM = 0] = proyecto.horario_cierre.split(":").map(Number);
    const cur = now.getHours() * 60 + now.getMinutes();
    return cur >= openH * 60 + openM && cur <= closeH * 60 + closeM;
  }, [proyecto?.horario_apertura, proyecto?.horario_cierre]);

  useEffect(() => {
    (async () => {
      const projectId = proyecto?.idproyecto;
      if (!projectId) return;
      setReviewsStatus("loading");
      try {
        const res = await fetch(withApiBase(`http://51.81.85.35:8002/api/proyecto/${projectId}/reviews/`));
        if (!res.ok) {
          setReviews([]);
          setReviewsStatus("error");
          return;
        }
        const data = await res.json();
        setReviews(Array.isArray(data) ? data : []);
        setReviewsStatus("ready");
      } catch (err) {
        console.error("Error cargando reseñas:", err);
        setReviews([]);
        setReviewsStatus("error");
      }
    })();
  }, [proyecto?.idproyecto]);
  const handleShare = async () => {
    if (!shareUrl) return;
    const title = `GeoHabita · ${proyecto?.nombreproyecto || "Proyecto"}`;
    const text = `Mira este proyecto en GeoHabita`;
    try {
      if (navigator.share) {
        await navigator.share({ title, text, url: shareUrl });
        return;
      }
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        window.alert("Link copiado");
        return;
      }
    } catch (error) {
      if (error?.name !== "AbortError") {
        console.warn("No se pudo compartir el enlace", error);
      }
    }
    window.prompt("Copia el link para compartir:", shareUrl);
  };

  const handleSubmitReview = async () => {
    if (!reviewRating || !reviewText.trim()) return;
    const projectId = proyecto?.idproyecto;
    if (!projectId) return;
    setReviewSubmitting(true);
    try {
      const res = await authFetch(
        withApiBase(`http://51.81.85.35:8002/api/proyecto/${projectId}/reviews/create/`),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            calificacion: reviewRating,
            comentario: reviewText.trim(),
            nombre: reviewerName.trim() || undefined,
          }),
        },
      );
      if (res.ok) {
        const newReview = await res.json();
        setReviews((prev) => [newReview, ...prev]);
        setReviewText("");
        setReviewerName("");
        setReviewRating(0);
      }
    } catch (err) {
      console.error("Error enviando reseña:", err);
    } finally {
      setReviewSubmitting(false);
    }
  };

  const prevImgIndex =
    validImages.length > 0
      ? currentImg === 0
        ? validImages.length - 1
        : currentImg - 1
      : 0;
  const nextImgIndex =
    validImages.length > 0
      ? currentImg === validImages.length - 1
        ? 0
        : currentImg + 1
      : 0;

  const carouselSwipeDistance = 40;
  const showNextFullscreenImage = useCallback(() => {
    setFullscreenImgIndex((prev) =>
      prev === validImages.length - 1 ? 0 : prev + 1,
    );
  }, [validImages.length]);

  const showPrevFullscreenImage = useCallback(() => {
    setFullscreenImgIndex((prev) =>
      prev === 0 ? validImages.length - 1 : prev - 1,
    );
  }, [validImages.length]);
  const fullscreenPanZoom = useImagePanZoom({
    onSwipeNext: validImages.length > 1 ? showNextFullscreenImage : undefined,
    onSwipePrev: validImages.length > 1 ? showPrevFullscreenImage : undefined,
  });

  const onCarouselTouchStart = (e) => {
    if (!isMobileView) return;
    carouselTouchStartX.current = e.targetTouches[0].clientX;
    carouselTouchEndX.current = e.targetTouches[0].clientX;
  };

  const onCarouselTouchMove = (e) => {
    if (!isMobileView) return;
    carouselTouchEndX.current = e.targetTouches[0].clientX;
  };

  const onCarouselTouchEnd = () => {
    if (!isMobileView || validImages.length < 2) return;
    const distance = carouselTouchStartX.current - carouselTouchEndX.current;
    carouselTouchStartX.current = 0;
    carouselTouchEndX.current = 0;

    if (Math.abs(distance) < carouselSwipeDistance) return;

    if (distance > 0) {
      setCurrentImg((prev) => (prev === validImages.length - 1 ? 0 : prev + 1));
    } else {
      setCurrentImg((prev) => (prev === 0 ? validImages.length - 1 : prev - 1));
    }
  };

  const nextSlide = (e) => {
    e.stopPropagation();
    setCurrentImg((prev) => (prev === validImages.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = (e) => {
    e.stopPropagation();
    setCurrentImg((prev) => (prev === 0 ? validImages.length - 1 : prev - 1));
  };

  const cerrarSidebar = useCallback(() => {
    onClose();
  }, [onClose]);

  const closeFullscreen = useCallback(() => {
    setFullscreenImgIndex(null);
    fullscreenPanZoom.reset();
  }, [fullscreenPanZoom]);

  const scrollToInmoFooter = useCallback(() => {
    inmoFooterRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, []);

  const registrarClickContacto = async (redSocial) => {
    try {
      await fetch(
        withApiBase("http://51.81.85.35:8002/api/registerClickContactos/"),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            idproyecto: proyecto.idproyecto,
            dia: formatLocalDateForApi(),
            hora: formatLocalTimeForApi(),
            redSocial: redSocial,
          }),
        },
      );
    } catch (error) {
      console.error("Error registrando click:", error);
    }
  };

  useEffect(() => {
    if (!validImages.length) return undefined;

    const indexesToPreload = new Set([currentImg, prevImgIndex, nextImgIndex]);
    const preloadVisibleImages = () => {
      indexesToPreload.forEach((index) => {
        const img = validImages[index];
        if (!img?.imagenproyecto) return;
        const image = new Image();
        image.decoding = "async";
        image.src = withApiBase(
          `http://51.81.85.35:8002${img.imagenproyecto}`,
        );
      });
    };

    if (typeof window !== "undefined" && window.requestIdleCallback) {
      const idleId = window.requestIdleCallback(preloadVisibleImages, {
        timeout: 900,
      });
      return () => window.cancelIdleCallback(idleId);
    }

    const timer = window.setTimeout(preloadVisibleImages, 120);
    return () => window.clearTimeout(timer);
  }, [validImages, currentImg, prevImgIndex, nextImgIndex]);
  useEffect(() => {
    fullscreenPanZoom.reset();
  }, [fullscreenImgIndex, fullscreenPanZoom.reset]);

  useEffect(() => {
    if (currentImg >= validImages.length) {
      setCurrentImg(0);
    }
    if (
      fullscreenImgIndex !== null &&
      fullscreenImgIndex >= validImages.length
    ) {
      setFullscreenImgIndex(validImages.length > 0 ? 0 : null);
    }
  }, [validImages, currentImg, fullscreenImgIndex]);

  useEffect(() => {
    const esc = (e) => {
      if (e.key !== "Escape") return;
      if (fullscreenImgIndex !== null) {
        closeFullscreen();
        return;
      }
      cerrarSidebar();
    };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [cerrarSidebar, closeFullscreen, fullscreenImgIndex]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const onResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobileView(mobile);
      if (!mobile) {
        setSheetMode("mid");
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useGSAP(
    () => {
      if (isLoading) return;
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.fromTo(
        sidebarRef.current,
        {
          autoAlpha: 0,
          y: isMobileView ? 80 : 40,
          x: isMobileView ? 0 : 20,
          scale: isMobileView ? 0.98 : 0.94,
          rotateX: isMobileView ? 0 : 8,
          filter: "blur(10px)",
        },
        {
          autoAlpha: 1,
          y: 0,
          x: 0,
          scale: 1,
          rotateX: 0,
          filter: "blur(0px)",
          duration: 0.75,
          ease: "expo.out",
        },
      )
        .fromTo(
          "[data-gsap='media']",
          {
            autoAlpha: 0,
            x: isMobileView ? 0 : -56,
            y: isMobileView ? 24 : 0,
            scale: 1.08,
            rotateZ: isMobileView ? 0 : -2,
            filter: "blur(12px)",
          },
          {
            autoAlpha: 1,
            x: 0,
            y: 0,
            scale: 1,
            rotateZ: 0,
            filter: "blur(0px)",
            duration: 0.8,
            ease: "expo.out",
          },
          "-=0.55",
        )
        .fromTo(
          "[data-gsap='card'], [data-gsap='metric'], [data-gsap='action']",
          {
            autoAlpha: 0,
            y: 34,
            scale: 0.92,
            rotateX: -18,
            transformOrigin: "50% 100%",
          },
          {
            autoAlpha: 1,
            y: 0,
            scale: 1,
            rotateX: 0,
            duration: 0.7,
            stagger: 0.09,
            ease: "back.out(1.9)",
          },
          "-=0.5",
        )
        .fromTo(
          "[data-gsap='tourist']",
          { autoAlpha: 0, y: 20 },
          { autoAlpha: 1, y: 0, stagger: 0.05, duration: 0.5, ease: "power3.out" },
          "-=0.35",
        );
    },
    {
      scope: sidebarRef,
      dependencies: [isLoading, isMobileView, proyecto?.idproyecto],
      revertOnUpdate: true,
    },
  );

  const getSheetAnchors = useCallback(() => {
    if (typeof window === "undefined") {
      return { expandedTop: 0, midTop: 360, collapsedTop: 0 };
    }
    const vh = window.innerHeight;
    const headerTop = Math.max(0, Number(mapHeaderOffsetPx) || 0);
    const available = Math.max(220, vh - headerTop);
    const collapsedHeight = 74;
    const expandedTop = headerTop;
    // Abre un poco mas alto que antes (mid mas grande de alto).
    const midTop = headerTop + available * 0.5;
    const collapsedTop = vh - collapsedHeight;

    return {
      expandedTop,
      midTop: Math.min(Math.max(midTop, expandedTop + 70), collapsedTop - 70),
      collapsedTop,
    };
  }, [mapHeaderOffsetPx]);

  const clampSheetTop = useCallback(
    (top) => {
      const { expandedTop, collapsedTop } = getSheetAnchors();
      return Math.min(Math.max(top, expandedTop), collapsedTop);
    },
    [getSheetAnchors],
  );

  const getModeByTop = useCallback(
    (top) => {
      const { expandedTop, collapsedTop } = getSheetAnchors();
      if (top <= expandedTop + 24) return "expanded";
      if (top >= collapsedTop - 24) return "collapsed";
      return "mid";
    },
    [getSheetAnchors],
  );

  const setSheetTopAndMode = useCallback(
    (nextTop) => {
      const safeTop = clampSheetTop(nextTop);
      setMobileSheetTop(safeTop);
      setSheetMode(getModeByTop(safeTop));
    },
    [clampSheetTop, getModeByTop],
  );

  useEffect(() => {
    if (!isMobileView || typeof window === "undefined") {
      setMobileSheetTop(null);
      return;
    }
    const { midTop } = getSheetAnchors();
    setMobileSheetTop(midTop);
    setSheetMode("mid");
  }, [isMobileView, proyecto?.idproyecto, getSheetAnchors]);

  useEffect(() => {
    if (!isMobileView) {
      previousSheetStateRef.current = null;
      return;
    }

    if (forceCompactForLote) {
      if (!previousSheetStateRef.current) {
        const { midTop } = getSheetAnchors();
        previousSheetStateRef.current = {
          top: mobileSheetTop ?? midTop,
        };
      }
      const { collapsedTop } = getSheetAnchors();
      setSheetTopAndMode(collapsedTop);
      return;
    }

    if (previousSheetStateRef.current) {
      setSheetTopAndMode(previousSheetStateRef.current.top);
      previousSheetStateRef.current = null;
    }
  }, [
    forceCompactForLote,
    isMobileView,
    mobileSheetTop,
    getSheetAnchors,
    setSheetTopAndMode,
  ]);

  const onSheetTouchStart = (e) => {
    if (!isMobileView) return;
    sheetTouchStartY.current = e.targetTouches[0].clientY;
    sheetTouchDeltaY.current = 0;
    sheetTouchStartTop.current = mobileSheetTop ?? getSheetAnchors().midTop;
    setIsSheetDragging(true);
    e.stopPropagation();
  };

  const onSheetTouchMove = (e) => {
    if (!isMobileView || !sheetTouchStartY.current) return;
    sheetTouchDeltaY.current =
      e.targetTouches[0].clientY - sheetTouchStartY.current;
    setSheetTopAndMode(sheetTouchStartTop.current + sheetTouchDeltaY.current);
    e.preventDefault();
    e.stopPropagation();
  };

  const onSheetTouchEnd = () => {
    if (!isMobileView) return;
    if (mobileSheetTop !== null) {
      setSheetMode(getModeByTop(mobileSheetTop));
    }
    setIsSheetDragging(false);
    sheetTouchStartY.current = 0;
    sheetTouchDeltaY.current = 0;
    sheetTouchStartTop.current = 0;
  };

  const stepSheetUp = () => {
    const { expandedTop, midTop } = getSheetAnchors();
    const currentTop = mobileSheetTop ?? midTop;
    if (currentTop > midTop + 12) {
      setSheetTopAndMode(midTop);
      return;
    }
    setSheetTopAndMode(expandedTop);
  };

  const stepSheetDown = () => {
    const { midTop, collapsedTop } = getSheetAnchors();
    const currentTop = mobileSheetTop ?? midTop;
    if (currentTop < midTop - 12) {
      setSheetTopAndMode(midTop);
      return;
    }
    setSheetTopAndMode(collapsedTop);
  };

  const onNestedTouchStart = (e) => {
    if (!isMobileView) return;
    nestedTouchStartY.current = e.targetTouches[0].clientY;
    nestedTouchDeltaY.current = 0;
    const contentEl = contentRef.current;
    const sidebarEl = sidebarRef.current;
    const contentScrollable =
      !!contentEl && contentEl.scrollHeight > contentEl.clientHeight + 2;
    const target = contentScrollable ? contentEl : sidebarEl;
    nestedScrollableTarget.current = target;
    if (target) {
      nestedStartAtTop.current = target.scrollTop <= 0;
      nestedStartAtBottom.current =
        target.scrollTop + target.clientHeight >= target.scrollHeight - 2;
    } else {
      nestedStartAtTop.current = false;
      nestedStartAtBottom.current = false;
    }
    e.stopPropagation();
  };

  const onNestedTouchMove = (e) => {
    if (!isMobileView || !nestedTouchStartY.current) return;
    nestedTouchDeltaY.current =
      e.targetTouches[0].clientY - nestedTouchStartY.current;

    const scrollEl = nestedScrollableTarget.current;
    const atTop = (scrollEl?.scrollTop || 0) <= 0;
    const atBottom =
      !!scrollEl &&
      scrollEl.scrollTop + scrollEl.clientHeight >= scrollEl.scrollHeight - 2;
    const sheetAtTop = (sidebarRef.current?.scrollTop || 0) <= 0;

    if (nestedTouchDeltaY.current > 0 && atTop && sheetAtTop) {
      e.preventDefault();
    }
    if (nestedTouchDeltaY.current < 0 && atBottom) {
      e.preventDefault();
    }
  };

  const onNestedTouchEnd = () => {
    if (!isMobileView) return;
    const scrollEl = nestedScrollableTarget.current;
    const atTop = (scrollEl?.scrollTop || 0) <= 0;
    const atBottom =
      !!scrollEl &&
      scrollEl.scrollTop + scrollEl.clientHeight >= scrollEl.scrollHeight - 2;
    const sheetAtTop = (sidebarRef.current?.scrollTop || 0) <= 0;

    if (nestedTouchDeltaY.current > 50 && atTop && sheetAtTop) {
      stepSheetDown();
    }
    if (nestedTouchDeltaY.current < -40 && atBottom) {
      stepSheetUp();
    }

    nestedTouchStartY.current = 0;
    nestedTouchDeltaY.current = 0;
    nestedStartAtTop.current = false;
    nestedStartAtBottom.current = false;
    nestedScrollableTarget.current = null;
  };

  const handleScroll = () => {
    return;
  };

  if (!proyecto) return null;

  const overlayActive = false;

  return (
    <>
      {!inPanel && (
        <div
          className={styles.overlay}
          style={{
            opacity: overlayActive ? 1 : 0,
            background: isMobileView ? "transparent" : "rgba(15, 23, 42, 0.2)",
            pointerEvents: isMobileView
              ? "none"
              : overlayActive
                ? "auto"
                : "none",
          }}
          onClick={isMobileView ? undefined : cerrarSidebar}
        />
      )}

      <div
        ref={sidebarRef}
        className={`${inPanel ? styles.sidebarInPanel : styles.sidebar} ${!inPanel && expanded ? styles.expanded : ""} ${!inPanel && isMobileView ? styles.mobileSidebar : ""} ${!inPanel && sheetMode === "collapsed" ? styles.mobileCollapsed : ""} ${!inPanel && sheetMode === "expanded" ? styles.mobileExpanded : ""}`}
        style={
          isMobileView && mobileSheetTop !== null
            ? {
              top: `${mobileSheetTop}px`,
              height: `calc(100dvh - ${mobileSheetTop}px)`,
              transition: isSheetDragging
                ? "none"
                : "top 0.22s cubic-bezier(0.22, 1, 0.36, 1), height 0.22s cubic-bezier(0.22, 1, 0.36, 1)",
            }
            : undefined
        }
      >
        {isMobileView && (
          <div
            className={styles.mobileTopHeader}
            onTouchStart={onSheetTouchStart}
            onTouchMove={onSheetTouchMove}
            onTouchEnd={onSheetTouchEnd}
          >
            <h3 className={styles.mobileHeaderTitle}>
              {proyecto.nombreproyecto}
            </h3>
            <button
              className={styles.mobileHeaderClose}
              onClick={cerrarSidebar}
              aria-label="Cerrar"
            >
              ✕
            </button>
            <div className={styles.mobileDragHandle} />
          </div>
        )}

        {!inPanel && (
          <button
            className={styles.closeBtn}
            onClick={cerrarSidebar}
            aria-label="Cerrar"
          >
            ✕
          </button>
        )}

        {inPanel && (
          <button
            className={styles.closeBtnPanel}
            onClick={cerrarSidebar}
            aria-label="Cerrar"
          >
            ✕
          </button>
        )}

        <div
          className={`${styles.splitLayout} ${sheetMode === "collapsed" ? styles.mobileHiddenContent : ""}`}
        >
          {/* SECCIÓN IMAGEN / SLIDER */}
          <div className={styles.imageSection} data-gsap="media">
            {isLoading || imagesPending ? (
              <div className={styles.skeletonImage} />
            ) : validImages.length === 0 ? null : isMobileView ? (
              <div
                className={styles.mobileCarouselWrap}
                onTouchStart={onCarouselTouchStart}
                onTouchMove={onCarouselTouchMove}
                onTouchEnd={onCarouselTouchEnd}
              >
                {validImages.length === 1 && (
                  <div className={styles.mobileSingleWrap}>
                    <img
                      key={currentImg}
                      src={withApiBase(
                        `http://51.81.85.35:8002${validImages[currentImg].imagenproyecto}`,
                      )}
                      alt="Propiedad"
                      className={styles.mobileSingleImage}
                      onClick={() => setFullscreenImgIndex(currentImg)}
                    />
                  </div>
                )}

                {validImages.length === 2 && (
                  <div className={styles.mobileDualTrack}>
                    <button
                      className={styles.mobileDualItem}
                      onClick={() => setFullscreenImgIndex(0)}
                      aria-label="Ver imagen 1"
                    >
                      <img
                        src={withApiBase(
                          `http://51.81.85.35:8002${validImages[0].imagenproyecto}`,
                        )}
                        alt="Imagen 1"
                        className={styles.mobileDualImage}
                      />
                    </button>
                    <button
                      className={styles.mobileDualItem}
                      onClick={() => setFullscreenImgIndex(1)}
                      aria-label="Ver imagen 2"
                    >
                      <img
                        src={withApiBase(
                          `http://51.81.85.35:8002${validImages[1].imagenproyecto}`,
                        )}
                        alt="Imagen 2"
                        className={styles.mobileDualImage}
                      />
                    </button>
                  </div>
                )}

                {validImages.length >= 3 && (
                  <div className={styles.mobileCarouselTrack}>
                    <button
                      className={`${styles.mobileSideSlide} ${styles.mobileSideLeft}`}
                      onClick={prevSlide}
                      aria-label="Imagen anterior"
                    >
                      <img
                        src={withApiBase(
                          `http://51.81.85.35:8002${validImages[prevImgIndex].imagenproyecto}`,
                        )}
                        alt="Anterior"
                        className={styles.mobileSideImage}
                      />
                    </button>
                    <img
                      key={currentImg}
                      src={withApiBase(
                        `http://51.81.85.35:8002${validImages[currentImg].imagenproyecto}`,
                      )}
                      alt="Propiedad"
                      className={styles.mobileMainImage}
                      onClick={() => setFullscreenImgIndex(currentImg)}
                    />
                    <button
                      className={`${styles.mobileSideSlide} ${styles.mobileSideRight}`}
                      onClick={nextSlide}
                      aria-label="Imagen siguiente"
                    >
                      <img
                        src={withApiBase(
                          `http://51.81.85.35:8002${validImages[nextImgIndex].imagenproyecto}`,
                        )}
                        alt="Siguiente"
                        className={styles.mobileSideImage}
                      />
                    </button>
                  </div>
                )}

                {validImages.length >= 3 && (
                  <div className={styles.mobileDots}>
                    {validImages.map((_, idx) => (
                      <button
                        key={`dot-${idx}`}
                        className={`${styles.mobileDot} ${idx === currentImg ? styles.mobileDotActive : ""}`}
                        onClick={() => setCurrentImg(idx)}
                        aria-label={`Ir a imagen ${idx + 1}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <>
                <img
                  key={currentImg}
                  src={withApiBase(
                    `http://51.81.85.35:8002${validImages[currentImg].imagenproyecto}`,
                  )}
                  alt="Propiedad"
                  className={styles.mainImage}
                  onClick={() => setFullscreenImgIndex(currentImg)}
                />
                {validImages.length > 1 && (
                  <div className={styles.sliderControls}>
                    <button onClick={prevSlide} className={styles.navArrow}>
                      <FaChevronLeft />
                    </button>
                    <button onClick={nextSlide} className={styles.navArrow}>
                      <FaChevronRight />
                    </button>
                  </div>
                )}
                <div className={styles.imageBadge}>
                  {currentImg + 1} / {validImages.length} FOTOS
                </div>
              </>
            )}
          </div>

          {/* SECCIÓN INFORMACIÓN */}
          <div
            className={styles.infoSection}
            ref={contentRef}
            onScroll={handleScroll}
            onTouchStart={onNestedTouchStart}
            onTouchMove={onNestedTouchMove}
            onTouchEnd={onNestedTouchEnd}
          >
            {isLoading ? (
              <div className={styles.skeletonStack}>
                <div className={styles.skeletonLine} style={{ width: "65%" }} />
                <div className={styles.skeletonLine} style={{ width: "45%" }} />
                <div className={styles.skeletonLine} style={{ width: "80%" }} />
                <div className={styles.skeletonCard} />
                <div className={styles.skeletonLine} style={{ width: "60%" }} />
                <div className={styles.skeletonLine} style={{ width: "70%" }} />
                <div className={styles.skeletonLine} style={{ width: "50%" }} />
              </div>
            ) : (
              <>



                {/* ── HEADER ───────────────────────────── */}
                <div className={styles.newSidebarHeader} data-gsap="card">
                  <p className={styles.newKicker}>Centro Turístico / Destino</p>
                  <h1 className={styles.newTitle}>{proyecto.nombreproyecto}</h1>
                  {proyecto?.categoria?.nombre && (
                    <span className={styles.newCategoryBadge}>
                      {proyecto.categoria.nombre}
                    </span>
                  )}
                  {proyecto?.breve_descripcion && (
                    <p className={styles.newTagline}>{proyecto.breve_descripcion}</p>
                  )}
                  <div className={styles.newInmoRow}>
                    <span className={styles.newInmoIcon}><FaBuilding /></span>
                    <span className={styles.newInmoName}>{inmo?.nombreinmobiliaria}</span>
                    <button type="button" className={styles.newInmoVerMas} onClick={scrollToInmoFooter}>
                      Ver más
                    </button>
                  </div>
                </div>
                <br />
                {/* ── 360° ────────────────────────────── */}
                {proyecto?.idproyecto && (
                  <button
                    onClick={handleOpen360}
                    className={styles.btn360}
                    data-gsap="action"
                    disabled={images360Status === "loading"}
                  >
                    <span className={styles.btn360Orbit}>
                      <FaGlobe className={styles.icon360} />
                    </span>
                    <span className={styles.btn360Text}>
                      <small>GeoHabita recomienda</small>
                      <strong>
                        {images360Status === "loading" ? "Cargando tour 360..." : "Recorrido en 360°"}
                      </strong>
                    </span>
                    <span className={styles.btn360Ping} aria-hidden="true" />
                  </button>
                )}

                {/* ── INFO GENERAL ─────────────────────── */}
                <div className={styles.infoGenCard} data-gsap="card">
                  <div className={styles.infoGenAccent} />
                  <p className={styles.infoGenKicker}>Información General</p>
                  <div className={styles.infoGenGrid}>
                    <div className={styles.infoGenMetric}>
                      <div className={`${styles.infoGenIconWrap} ${styles.infoGenIconWrapBlue}`}>
                        <FaCar />
                      </div>
                      <strong>{carMinutes} min</strong>
                      <span>Desde tu ubicación</span>
                    </div>
                    <div className={`${styles.infoGenMetric} ${styles.infoGenMetricMid}`}>
                      <div className={`${styles.infoGenIconWrap} ${styles.infoGenIconWrapAmber}`}>
                        <FaStar />
                      </div>
                      <strong>{avgRating > 0 ? avgRating.toFixed(1) : "---"}</strong>
                      <span>Calificación</span>
                    </div>
                    <div className={styles.infoGenMetric}>
                      <div className={`${styles.infoGenIconWrap} ${styles.infoGenIconWrapTeal}`}>
                        <FaClock />
                      </div>
                      <strong>
                        {proyecto?.horario_apertura && proyecto?.horario_cierre
                          ? `${proyecto.horario_apertura.slice(0, 5)} – ${proyecto.horario_cierre.slice(0, 5)}`
                          : "---"}
                      </strong>
                      {isOpenNow === true && (
                        <span className={styles.openNowBadge}>● Abierto</span>
                      )}
                      {isOpenNow === false && (
                        <span className={styles.closedNowBadge}>● Cerrado</span>
                      )}
                      {isOpenNow === null && <span>Sin horario</span>}
                    </div>
                  </div>
                </div>

                {/* ── PRECIO + COMPRAR ENTRADA ─────────── */}
                {(() => {
                  const precioFinal = proyecto?.precio_entrada > 0
                    ? proyecto.precio_entrada
                    : proyecto?.precio > 0
                      ? proyecto.precio
                      : null;
                  return (
                    <div className={styles.entradaCard} data-gsap="card">
                      {precioFinal ? (
                        <div className={styles.entradaPriceBlock}>
                          <div className={styles.entradaTicketIcon}>
                            <FaTicketAlt />
                          </div>
                          <div>
                            <span className={styles.entradaLabel}>Precio de entrada</span>
                            <span className={styles.entradaPrice}>
                              {formatMoney(precioFinal, proyecto.moneda || "S/")}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className={styles.entradaPriceBlock}>
                          <div className={`${styles.entradaTicketIcon} ${styles.entradaTicketFree}`}>
                            <FaTicketAlt />
                          </div>
                          <div>
                            <span className={styles.entradaLabel}>Entrada</span>
                            <span className={styles.entradaFree}>Acceso libre</span>
                          </div>
                        </div>
                      )}
                      <button type="button" className={styles.buyEntradaBtn}>
                        <FaTicketAlt /> Comprar entrada
                      </button>
                    </div>
                  );
                })()}

                {/* ── SERVICIOS ────────────────────────── */}
                {(proyecto?.tiene_restaurante || proyecto?.tiene_bebidas) && (
                  <div className={styles.servicesCard} data-gsap="card">
                    <p className={styles.servicesKicker}>Servicios disponibles</p>
                    <div className={styles.servicesTags}>
                      {proyecto.tiene_restaurante && (
                        <span className={styles.serviceBadge}><FaUtensils /> Restaurante</span>
                      )}
                      {proyecto.tiene_bebidas && (
                        <span className={styles.serviceBadge}><FaTint /> Bebidas</span>
                      )}
                    </div>
                  </div>
                )}

                {/* ── CONTACTO ─────────────────────────── */}
                <div className={styles.ctaGrid} data-gsap="card">
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noreferrer"
                    className={styles.ctaBtnWhatsapp}
                    onClick={() => registrarClickContacto("Whatsapp")}
                  >
                    <FaWhatsapp className={styles.ctaBtnIcon} />
                    <div>
                      <strong>WhatsApp</strong>
                      <small>Contáctanos</small>
                    </div>
                  </a>
                  <a
                    href={phoneNumber ? `tel:${phoneNumber}` : undefined}
                    className={`${styles.ctaBtn} ${!phoneNumber ? styles.ctaBtnDisabled : ""}`}
                    onClick={() => registrarClickContacto("Llamada")}
                  >
                    <FaPhoneAlt className={styles.ctaBtnIcon} />
                    <div>
                      <strong>Llamar</strong>
                      <small>Atención directa</small>
                    </div>
                  </a>
                  <button
                    type="button"
                    className={styles.ctaBtn}
                    onClick={handleShare}
                    disabled={!shareUrl}
                  >
                    <FaShareAlt className={styles.ctaBtnIcon} />
                    <div>
                      <strong>Compartir</strong>
                      <small>Compartir lugar</small>
                    </div>
                  </button>
                  {facebookHref && (
                    <a
                      href={facebookHref}
                      target="_blank"
                      rel="noreferrer"
                      className={styles.ctaBtn}
                      onClick={() => registrarClickContacto("Facebook")}
                    >
                      <FaFacebook className={styles.ctaBtnIcon} />
                      <div>
                        <strong>Facebook</strong>
                        <small>Ver Perfil</small>
                      </div>
                    </a>
                  )}
                  {webHref && (
                    <a
                      href={webHref}
                      target="_blank"
                      rel="noreferrer"
                      className={styles.ctaBtn}
                      onClick={() => registrarClickContacto("Web")}
                    >
                      <FaGlobe className={styles.ctaBtnIcon} />
                      <div>
                        <strong>Sitio web</strong>
                        <small>Ver más</small>
                      </div>
                    </a>
                  )}
                </div>

                {/* ── ACERCA DEL CENTRO ────────────────── */}
                {proyecto?.descripcion && (
                  <div className={styles.aboutCard} data-gsap="card">
                    <h3 className={styles.sectionTitle}>Acerca del Centro</h3>
                    <p className={styles.fullDescription}>{proyecto.descripcion}</p>
                  </div>
                )}

                {/* ── ÁREA ─────────────────────────────── */}
                {proyecto.area_total_m2 > 0 && (
                  <div className={styles.areaChip} data-gsap="card">
                    <FaRulerCombined />
                    <strong>{proyecto.area_total_m2} m²</strong>
                    <span>Área total</span>
                  </div>
                )}

                {/* ── RESEÑAS ──────────────────────────── */}
                <div className={styles.reviewsCard} data-gsap="card">
                  <div className={styles.reviewsCardHeader}>
                    <h3 className={styles.reviewsCardTitle}>Reseñas</h3>
                    {avgRating > 0 && (
                      <div className={styles.reviewsAvgBadge}>
                        <FaStar className={styles.starFilled} />
                        <strong>{avgRating.toFixed(1)}</strong>
                        <span>({reviews.length})</span>
                      </div>
                    )}
                  </div>

                  {/* Formulario */}
                  <div className={styles.reviewForm}>
                    <p className={styles.reviewFormTitle}>Comparte tu experiencia</p>
                    <input
                      type="text"
                      className={styles.reviewNameInput}
                      placeholder="Tu nombre"
                      value={reviewerName}
                      onChange={(e) => setReviewerName(e.target.value)}
                    />
                    <div className={styles.reviewStarPicker}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          type="button"
                          className={styles.reviewStarBtn}
                          onMouseEnter={() => setReviewHoverRating(s)}
                          onMouseLeave={() => setReviewHoverRating(0)}
                          onClick={() => setReviewRating(s)}
                          aria-label={`${s} estrella${s > 1 ? "s" : ""}`}
                        >
                          <FaStar
                            className={
                              s <= (reviewHoverRating || reviewRating)
                                ? styles.starFilled
                                : styles.starEmpty
                            }
                          />
                        </button>
                      ))}
                      {reviewRating > 0 && (
                        <span className={styles.reviewRatingLabel}>{reviewRating}/5</span>
                      )}
                    </div>
                    <textarea
                      className={styles.reviewTextarea}
                      rows={3}
                      placeholder="Cuenta cómo fue tu visita..."
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                    />
                    <button
                      type="button"
                      className={styles.reviewSubmitBtn}
                      onClick={handleSubmitReview}
                      disabled={reviewSubmitting || !reviewRating || !reviewText.trim()}
                    >
                      {reviewSubmitting ? "Enviando..." : "Publicar reseña"}
                    </button>
                  </div>

                  {/* Lista de reseñas */}
                  {reviewsStatus === "loading" && (
                    <p className={styles.reviewsEmpty}>Cargando reseñas...</p>
                  )}
                  {reviewsStatus === "error" && (
                    <p className={styles.reviewsEmpty}>No se pudieron cargar las reseñas.</p>
                  )}
                  {reviewsStatus === "ready" && reviews.length === 0 && (
                    <p className={styles.reviewsEmpty}>Sé el primero en dejar una reseña.</p>
                  )}
                  {reviews.length > 0 && (
                    <ul className={styles.reviewsList}>
                      {reviews.map((r) => (
                        <li key={r.id} className={styles.reviewItem}>
                          <div className={styles.reviewItemTop}>
                            <div className={styles.reviewAvatar}>
                              {((r.nombre || r.usuario?.nombre || r.usuario?.username || "U")[0] || "U").toUpperCase()}
                            </div>
                            <div className={styles.reviewItemMeta}>
                              <strong className={styles.reviewAuthor}>
                                {r.nombre || r.usuario?.nombre || r.usuario?.username || "Usuario"}
                              </strong>
                              <div className={styles.reviewStarsRow}>
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <FaStar
                                    key={s}
                                    className={s <= r.calificacion ? styles.starFilled : styles.starEmpty}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                          {r.comentario && (
                            <p className={styles.reviewBody}>{r.comentario}</p>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* ── ORGANIZADOR ──────────────────────── */}
                <div
                  ref={inmoFooterRef}
                  className={styles.inmoCardFooter}
                  data-gsap="card"
                >
                  <div className={styles.inmoFooterIntro}>
                    <span className={styles.inmoLabel}>Organizado por</span>
                    <h3 className={styles.inmoFooterName}>{inmo?.nombreinmobiliaria}</h3>
                    {inmo?.descripcion && (
                      <p className={styles.inmoFooterDescription}>{inmo.descripcion}</p>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {fullscreenImgIndex !== null && validImages.length > 0 && (
        <div
          className={styles.fullscreenOverlay}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeFullscreen();
            }
          }}
        >
          <button
            type="button"
            className={styles.closeFsBtn}
            onClick={(e) => {
              e.stopPropagation();
              closeFullscreen();
            }}
            aria-label="Cerrar visor"
          >
            ✕
          </button>

          {validImages.length > 1 && (
            <>
              {/* Navegación Pantalla Completa */}
              <button
                className={`${styles.navArrowFS} ${styles.prevFS}`}
                onClick={(e) => {
                  e.stopPropagation();
                  showPrevFullscreenImage();
                }}
              >
                <FaChevronLeft />
              </button>

              <button
                className={`${styles.navArrowFS} ${styles.nextFS}`}
                onClick={(e) => {
                  e.stopPropagation();
                  showNextFullscreenImage();
                }}
              >
                <FaChevronRight />
              </button>
            </>
          )}

          <div
            ref={fullscreenPanZoom.stageRef}
            className={styles.fullscreenStage}
            onClick={(e) => {
              e.stopPropagation();
              if (fullscreenPanZoom.consumeSuppressedClick()) {
                e.preventDefault();
                return;
              }
            }}
            {...fullscreenPanZoom.bind}
          >
            <img
              ref={fullscreenPanZoom.imageRef}
              src={withApiBase(
                `http://51.81.85.35:8002${validImages[fullscreenImgIndex].imagenproyecto}`,
              )}
              className={styles.fullscreenImg}
              alt="Zoom"
              draggable={false}
              onDragStart={(e) => e.preventDefault()}
              onClick={(e) => e.stopPropagation()}
              style={{
                transform: `translate3d(${fullscreenPanZoom.offsetX}px, ${fullscreenPanZoom.offsetY}px, 0) scale(${fullscreenPanZoom.scale})`,
              }}
            />
          </div>

          <div className={styles.fsBadge}>
            {fullscreenImgIndex + 1} / {validImages.length}
          </div>

          <div className={styles.fsHint}>
            Pellizca o usa la rueda para zoom. Arrastra para moverte.
          </div>

          <button
            type="button"
            className={styles.fsResetBtn}
            onClick={(e) => {
              e.stopPropagation();
              fullscreenPanZoom.reset();
            }}
          >
            Reset
          </button>
        </div>
      )}
      {show360 && (
        <Suspense
          fallback={
            <div className={styles.loadingOverlayInline}>
              Cargando vista 360...
            </div>
          }
        >
          <Viewer360Modal
            images360={images360}
            projectName={proyecto?.nombreproyecto || ""}
            onClose={() => setShow360(false)}
          />
        </Suspense>
      )}
    </>
  );
};

export default ProyectoSidebar;
