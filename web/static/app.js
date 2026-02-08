(() => {
  const state = {
    me: null,
    company: null,
    users: [],
    assets: [],
    assetTypes: [],
    loans: [],
    auditLogs: [],
    assetTotal: 0,
    assetFilter: {
      date_from: "",
      date_to: "",
      type_id: "",
      condition: "",
    },
    assetPage: 1,
    assetHasMore: false,
    loanFilter: {
      date_from: "",
      date_to: "",
    },
    loanPage: 1,
    loanHasMore: false,
    auditFilter: {
      user: "",
      action: "",
      date_from: "",
      date_to: "",
    },
    auditPage: 1,
    auditHasMore: false,
    loanAssetResults: [],
  };

  let selectedLoanAssets = [];
  let selectedLoanCandidate = null;

  const els = {
    flash: document.getElementById("flash"),
    menuNav: document.getElementById("menu-nav"),
    panels: Array.from(document.querySelectorAll(".panel")),
    roleBadge: document.getElementById("role-badge"),
    welcomeUser: document.getElementById("welcome-user"),
    sidebarUser: document.getElementById("sidebar-user"),
    logoutBtn: document.getElementById("logout-btn"),
    statAssets: document.getElementById("stat-assets"),
    statUsers: document.getElementById("stat-users"),
    statCompany: document.getElementById("stat-company"),
    headerCompany: document.getElementById("header-company-name"),
    sidebarBrandName: document.getElementById("sidebar-brand-name"),
    mobileBrandName: document.getElementById("mobile-brand-name"),
    mobileLogo: document.getElementById("mobile-logo"),
    mobileAddAsset: document.getElementById("mobile-add-asset"),
    sidebarLogo: document.getElementById("sidebar-logo"),
    footerCompanyName: document.getElementById("footer-company-name"),
    faviconLink: document.getElementById("favicon-link"),
    companyForm: document.getElementById("company-form"),
    companyMediaModal: document.getElementById("company-media-modal"),
    companyMediaBackdrop: document.getElementById("company-media-backdrop"),
    companyMediaTitle: document.getElementById("company-media-title"),
    companyMediaClose: document.getElementById("company-media-close"),
    companyMediaUploadStage: document.getElementById("company-media-upload-stage"),
    companyMediaUploadLabel: document.getElementById("company-media-upload-label"),
    companyMediaUploadFill: document.getElementById("company-media-upload-fill"),
    companyMediaUploadText: document.getElementById("company-media-upload-text"),
    companyMediaCropStage: document.getElementById("company-media-crop-stage"),
    companyMediaCropCanvas: document.getElementById("company-media-crop-canvas"),
    companyMediaZoom: document.getElementById("company-media-zoom"),
    companyMediaCropNote: document.getElementById("company-media-crop-note"),
    companyMediaCancel: document.getElementById("company-media-cancel"),
    companyMediaApply: document.getElementById("company-media-apply"),
    quickAssetForm: document.getElementById("quick-asset-form"),
    typeForm: document.getElementById("type-form"),
    typeSubmit: document.getElementById("type-submit"),
    typeCancel: document.getElementById("type-cancel"),
    typesTable: document.getElementById("types-table"),
    userForm: document.getElementById("user-form"),
    userCancel: document.getElementById("user-cancel"),
    usersTable: document.getElementById("users-table"),
    auditTable: document.getElementById("audit-table"),
    auditFilter: document.getElementById("audit-filter"),
    auditReset: document.getElementById("audit-reset"),
    auditPrev: document.getElementById("audit-prev"),
    auditNext: document.getElementById("audit-next"),
    auditPageLabel: document.getElementById("audit-page"),
    assetForm: document.getElementById("asset-form"),
    assetCancel: document.getElementById("asset-cancel"),
    assetsTable: document.getElementById("assets-table"),
    assetFilter: document.getElementById("asset-filter"),
    assetFilterType: document.getElementById("asset-filter-type"),
    assetFilterReset: document.getElementById("asset-filter-reset"),
    assetFilterToggle: document.getElementById("asset-filter-toggle"),
    assetFormToggle: document.getElementById("asset-form-toggle"),
    assetPrev: document.getElementById("asset-prev"),
    assetNext: document.getElementById("asset-next"),
    assetPageLabel: document.getElementById("asset-page"),
    confirmModal: document.getElementById("confirm-modal"),
    confirmBackdrop: document.getElementById("confirm-backdrop"),
    confirmTitle: document.getElementById("confirm-title"),
    confirmMessage: document.getElementById("confirm-message"),
    confirmOk: document.getElementById("confirm-ok"),
    confirmCancel: document.getElementById("confirm-cancel"),
    assetPhotoModal: document.getElementById("asset-photo-modal"),
    assetPhotoBackdrop: document.getElementById("asset-photo-backdrop"),
    assetPhotoPreview: document.getElementById("asset-photo-preview"),
    assetPhotoTitle: document.getElementById("asset-photo-title"),
    assetPhotoClose: document.getElementById("asset-photo-close"),
    loanForm: document.getElementById("loan-form"),
    loanCancel: document.getElementById("loan-cancel"),
    loanCreateBtn: document.getElementById("loan-create-btn"),
    loanModal: document.getElementById("loan-modal"),
    loanBackdrop: document.getElementById("loan-backdrop"),
    loanClose: document.getElementById("loan-close"),
    loanModalTitle: document.getElementById("loan-modal-title"),
    loansTable: document.getElementById("loans-table"),
    loanFilter: document.getElementById("loan-filter"),
    loanFilterReset: document.getElementById("loan-filter-reset"),
    loanFilterToggle: document.getElementById("loan-filter-toggle"),
    loanPrev: document.getElementById("loan-prev"),
    loanNext: document.getElementById("loan-next"),
    loanPageLabel: document.getElementById("loan-page"),
    loanAssetSearch: document.getElementById("loan-asset-search"),
    loanAssetResults: document.getElementById("loan-asset-results"),
    loanAddAsset: document.getElementById("loan-add-asset"),
    loanSelectedAssets: document.getElementById("loan-selected-assets"),
    exportAssets: document.getElementById("export-assets"),
    importAssets: document.getElementById("import-assets"),
    exportTypes: document.getElementById("export-types"),
    importTypes: document.getElementById("import-types"),
    exportLoans: document.getElementById("export-loans"),
    importLoans: document.getElementById("import-loans"),
    importModal: document.getElementById("import-modal"),
    importBackdrop: document.getElementById("import-backdrop"),
    importTitle: document.getElementById("import-title"),
    importHint: document.getElementById("import-hint"),
    importClose: document.getElementById("import-close"),
    importFileInput: document.getElementById("import-file-input"),
    importFileName: document.getElementById("import-file-name"),
    importProgress: document.getElementById("import-progress"),
    importProgressFill: document.getElementById("import-progress-fill"),
    importProgressText: document.getElementById("import-progress-text"),
    importCancel: document.getElementById("import-cancel"),
    importSubmit: document.getElementById("import-submit"),
    scanModal: document.getElementById("scan-modal"),
    scanVideo: document.getElementById("scan-video"),
    scanClose: document.getElementById("scan-close"),
    scanStatus: document.getElementById("scan-status"),
    scanUseCamera: document.getElementById("scan-use-camera"),
    scanUpload: document.getElementById("scan-upload"),
    scanFile: document.getElementById("scan-file"),
    menuToggle: document.getElementById("menu-toggle"),
    drawerBackdrop: document.getElementById("drawer-backdrop"),
    layout: document.getElementById("dashboard-layout"),
  };

  let flashTimer = null;
  const setFlash = (text, mode = "") => {
    if (!els.flash) return;
    els.flash.textContent = text;
    const tone = mode || "info";
    els.flash.className = `flash ${tone}`.trim();
    if (text) {
      els.flash.classList.add("show");
      if (flashTimer) clearTimeout(flashTimer);
      flashTimer = setTimeout(() => {
        if (els.flash.textContent === text) {
          els.flash.textContent = "";
          els.flash.className = "flash";
          els.flash.classList.remove("show");
        }
      }, 3000);
      return;
    }
    els.flash.classList.remove("show");
  };

  let confirmResolver = null;
  const CONFIRM_ANIM_MS = 180;

  const openConfirm = () => {
    if (!els.confirmModal || !els.confirmBackdrop) return;
    els.confirmModal.hidden = false;
    els.confirmBackdrop.hidden = false;
    requestAnimationFrame(() => {
      els.confirmModal.classList.add("show");
      els.confirmBackdrop.classList.add("show");
    });
  };

  const closeConfirm = (result) => {
    if (!els.confirmModal || !els.confirmBackdrop) return;
    els.confirmModal.classList.remove("show");
    els.confirmBackdrop.classList.remove("show");
    setTimeout(() => {
      els.confirmModal.hidden = true;
      els.confirmBackdrop.hidden = true;
      if (confirmResolver) {
        confirmResolver(result);
        confirmResolver = null;
      }
    }, CONFIRM_ANIM_MS);
  };

  const confirmDialog = (message, options = {}) =>
    new Promise((resolve) => {
      if (!els.confirmModal || !els.confirmBackdrop) {
        resolve(true);
        return;
      }
      confirmResolver = resolve;
      if (els.confirmTitle) {
        els.confirmTitle.textContent = options.title || "Konfirmasi";
      }
      if (els.confirmMessage) {
        els.confirmMessage.textContent = message || "Apakah Anda yakin?";
      }
      if (els.confirmOk) {
        els.confirmOk.textContent = options.confirmText || "Lanjutkan";
      }
      if (els.confirmCancel) {
        els.confirmCancel.textContent = options.cancelText || "Batal";
      }
      openConfirm();
      setTimeout(() => {
        els.confirmOk?.focus();
      }, CONFIRM_ANIM_MS);
    });

  const setupConfirmDialog = () => {
    if (!els.confirmModal || !els.confirmBackdrop) return;
    els.confirmCancel?.addEventListener("click", () => closeConfirm(false));
    els.confirmOk?.addEventListener("click", () => closeConfirm(true));
    els.confirmBackdrop.addEventListener("click", () => closeConfirm(false));
    els.confirmModal.addEventListener("click", (event) => {
      if (event.target === els.confirmModal) {
        closeConfirm(false);
      }
    });
    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !els.confirmModal.hidden) {
        closeConfirm(false);
      }
    });
  };

  const ASSET_PHOTO_ANIM_MS = 180;
  const openAssetPhotoPreview = (fullURL, title = "Foto Aset") => {
    if (!els.assetPhotoModal || !els.assetPhotoBackdrop || !els.assetPhotoPreview) return;
    if (!fullURL) return;
    if (els.assetPhotoTitle) {
      els.assetPhotoTitle.textContent = title;
    }
    els.assetPhotoPreview.src = fullURL;
    els.assetPhotoPreview.alt = title;
    els.assetPhotoModal.hidden = false;
    els.assetPhotoBackdrop.hidden = false;
    requestAnimationFrame(() => {
      els.assetPhotoModal.classList.add("show");
      els.assetPhotoBackdrop.classList.add("show");
    });
  };

  const closeAssetPhotoPreview = () => {
    if (!els.assetPhotoModal || !els.assetPhotoBackdrop || !els.assetPhotoPreview) return;
    els.assetPhotoModal.classList.remove("show");
    els.assetPhotoBackdrop.classList.remove("show");
    setTimeout(() => {
      els.assetPhotoModal.hidden = true;
      els.assetPhotoBackdrop.hidden = true;
      els.assetPhotoPreview.src = "";
    }, ASSET_PHOTO_ANIM_MS);
  };

  const setupAssetPhotoPreview = () => {
    if (!els.assetPhotoModal || !els.assetPhotoBackdrop || !els.assetPhotoPreview) return;
    els.assetPhotoClose?.addEventListener("click", closeAssetPhotoPreview);
    els.assetPhotoBackdrop.addEventListener("click", closeAssetPhotoPreview);
    els.assetPhotoModal.addEventListener("click", (event) => {
      if (event.target === els.assetPhotoModal) {
        closeAssetPhotoPreview();
      }
    });
    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !els.assetPhotoModal.hidden) {
        closeAssetPhotoPreview();
      }
    });
  };

  const getCookie = (name) => {
    const value = document.cookie
      .split("; ")
      .find((row) => row.startsWith(`${name}=`));
    return value ? decodeURIComponent(value.split("=")[1]) : "";
  };

  const api = async (path, options = {}) => {
    const csrfToken = getCookie("rck_csrf");
    const response = await fetch(path, {
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
        ...(options.headers || {}),
      },
      ...options,
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(data.error || "Request gagal");
      error.status = response.status;
      throw error;
    }
    return data;
  };

  const activateSection = (name) => {
    const links = Array.from(document.querySelectorAll(".menu-link"));
    links.forEach((link) => link.classList.toggle("active", link.dataset.section === name));
    els.panels.forEach((panel) => panel.classList.toggle("active", panel.id === `section-${name}`));
    closeDrawer();
  };

  const openDrawer = () => {
    if (els.layout) {
      els.layout.classList.add("drawer-open");
    }
  };

  const closeDrawer = () => {
    if (els.layout) {
      els.layout.classList.remove("drawer-open");
    }
  };

  const setupDrawer = () => {
    if (els.menuToggle) {
      els.menuToggle.addEventListener("click", () => {
        if (!els.layout) return;
        els.layout.classList.toggle("drawer-open");
      });
    }
    if (els.drawerBackdrop) {
      els.drawerBackdrop.addEventListener("click", closeDrawer);
    }
    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeDrawer();
    });
  };

  const setupMenu = () => {
    els.menuNav?.addEventListener("click", (event) => {
      const button = event.target.closest(".menu-link");
      if (!button) return;
      activateSection(button.dataset.section);
    });
  };

  const setupMobileAdd = () => {
    if (!els.mobileAddAsset) return;
    els.mobileAddAsset.addEventListener("click", () => {
      activateSection("overview");
      const form = els.quickAssetForm;
      if (!form) return;
      form.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const setupScrollSpy = () => {
    const sections = Array.from(document.querySelectorAll(".panel[data-section]"));
    if (sections.length === 0) return;

    const setActiveBySection = (name) => {
      const links = Array.from(document.querySelectorAll(".menu-link"));
      links.forEach((link) => link.classList.toggle("active", link.dataset.section === name));
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible.length === 0) return;
        const sectionName = visible[0].target.getAttribute("data-section");
        if (sectionName) setActiveBySection(sectionName);
      },
      {
        root: null,
        rootMargin: "-20% 0px -60% 0px",
        threshold: [0.1, 0.25, 0.6],
      },
    );

    sections.forEach((section) => observer.observe(section));
  };

  const updateStats = () => {
    if (els.statAssets) {
      els.statAssets.textContent = String(state.assetTotal || 0);
    }
    if (els.statUsers) {
      els.statUsers.textContent = state.me?.role === "admin" ? String(state.users.length || 0) : "-";
    }
    if (els.statCompany) {
      els.statCompany.textContent = state.company?.company_name || "Belum diisi";
    }
  };

  const setupLogout = () => {
    els.logoutBtn?.addEventListener("click", async () => {
      try {
        await api("/api/auth/logout", { method: "POST" });
      } catch (_) {
      } finally {
        window.location.href = "/";
      }
    });
  };

  const isAdmin = () => String(state.me?.role || "").toLowerCase() === "admin";

  const setElementVisible = (el, visible) => {
    if (!el) return;
    el.style.display = visible ? "" : "none";
  };

  const applyRoleAccess = () => {
    const admin = isAdmin();

    const usersSection = document.getElementById("section-users");
    const userMenuBtn = document.querySelector(".menu-link[data-section='users']");
    const companySection = document.getElementById("section-company");
    const companyMenuBtn = document.querySelector(".menu-link[data-section='company']");
    const auditSection = document.getElementById("section-audit");
    const auditMenuBtn = document.querySelector(".menu-link[data-section='audit']");

    setElementVisible(usersSection, admin);
    setElementVisible(userMenuBtn, admin);
    setElementVisible(companySection, admin);
    setElementVisible(companyMenuBtn, admin);
    setElementVisible(auditSection, admin);
    setElementVisible(auditMenuBtn, admin);

    setElementVisible(els.typeForm, admin);
    setElementVisible(els.exportTypes, admin);
    setElementVisible(els.importTypes, admin);

    setElementVisible(els.exportAssets, admin);
    setElementVisible(els.importAssets, admin);
    setElementVisible(els.exportLoans, admin);
    setElementVisible(els.importLoans, admin);
  };

  const loadMe = async () => {
    try {
      const data = await api("/api/auth/me");
      state.me = data.user;
      if (els.welcomeUser) {
        els.welcomeUser.textContent = state.me.username;
      }
      if (els.sidebarUser) {
        els.sidebarUser.textContent = `Akun: ${state.me.username}`;
      }
      if (els.roleBadge) {
        els.roleBadge.textContent = state.me.role;
      }
    } catch (error) {
      window.location.href = "/";
      return;
    }

    applyRoleAccess();
  };

  const loadCompany = async () => {
    const endpoint = isAdmin() ? "/api/settings/company" : "/api/settings/company/public";
    const data = await api(endpoint);
    state.company = data.setting || {};

    const form = els.companyForm;
    if (isAdmin() && form) {
      form.company_name.value = state.company.company_name || "";
      form.address.value = state.company.address || "";
      form.email.value = state.company.email || "";
      form.phone.value = state.company.phone || "";
      form.website.value = state.company.website || "";
      if (form.asset_code_prefix) {
        form.asset_code_prefix.value = state.company.asset_code_prefix || "RCK";
      }
    }
    updateStats();
    applyBranding();
    applyDefaultPurchaseDates();
    if (form.purchase_date) {
      requestNextAssetCode(form.purchase_date.value, form.asset_code);
    }
  };

  const applyBranding = () => {
    const name = state.company?.company_name || "RCK-Assets";
    if (els.headerCompany) {
      els.headerCompany.textContent = name || "Dashboard";
    }
    if (els.sidebarBrandName) {
      els.sidebarBrandName.textContent = name;
    }
    if (els.mobileBrandName) {
      els.mobileBrandName.textContent = name;
    }
    if (els.footerCompanyName) {
      els.footerCompanyName.textContent = name;
    }
    if (state.company?.logo_url && els.sidebarLogo) {
      els.sidebarLogo.src = state.company.logo_url;
    }
    if (state.company?.logo_url && els.mobileLogo) {
      els.mobileLogo.src = state.company.logo_url;
    }
    if (state.company?.favicon_url && els.faviconLink) {
      els.faviconLink.href = state.company.favicon_url;
    }
  };

  const uploadCompanyMediaWithProgress = (type, file, onProgress) =>
    new Promise((resolve, reject) => {
      const csrfToken = getCookie("rck_csrf");
      const formData = new FormData();
      formData.append("photo", file);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", `/api/settings/company/${type}`, true);
      xhr.withCredentials = true;
      if (csrfToken) {
        xhr.setRequestHeader("X-CSRF-Token", csrfToken);
      }

      xhr.upload.onprogress = (event) => {
        if (!event.lengthComputable || typeof onProgress !== "function") return;
        onProgress((event.loaded / event.total) * 100);
      };
      xhr.onerror = () => reject(new Error("upload gagal, cek koneksi lalu coba lagi"));
      xhr.onload = () => {
        const data = (() => {
          try {
            return JSON.parse(xhr.responseText || "{}");
          } catch (_) {
            return {};
          }
        })();
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(data);
          return;
        }
        reject(new Error(data.error || "upload gagal"));
      };

      xhr.send(formData);
    });

  const setupCompanyMediaCrop = () => {
    if (!els.companyForm || !els.companyMediaModal || !els.companyMediaCropCanvas || !els.companyMediaZoom) return;

    const MEDIA_MODAL_ANIM_MS = 180;
    const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;
    const ALLOWED_COMPANY_MEDIA_EXT = [".png", ".jpg", ".jpeg", ".webp", ".svg"];
    const cropCanvas = els.companyMediaCropCanvas;
    const cropCtx = cropCanvas.getContext("2d", { alpha: true });
    if (!cropCtx) return;

    const cropState = {
      type: "",
      image: null,
      fileName: "",
      objectURL: "",
      minScale: 1,
      scale: 1,
      maxScale: 4,
      offsetX: 0,
      offsetY: 0,
      dragging: false,
      pointerId: 0,
      startX: 0,
      startY: 0,
      startOffsetX: 0,
      startOffsetY: 0,
      busy: false,
      flowId: 0,
    };

    const setBusy = (busy) => {
      cropState.busy = Boolean(busy);
      if (els.companyMediaApply) {
        els.companyMediaApply.disabled = cropState.busy;
      }
      if (els.companyMediaCancel) {
        els.companyMediaCancel.disabled = cropState.busy;
      }
      if (els.companyMediaClose) {
        els.companyMediaClose.disabled = cropState.busy;
      }
      if (els.companyMediaZoom) {
        els.companyMediaZoom.disabled = cropState.busy;
      }
    };

    const updateUploadProgress = (percent) => {
      const value = Math.max(0, Math.min(100, Number(percent) || 0));
      if (els.companyMediaUploadFill) {
        els.companyMediaUploadFill.style.width = `${value}%`;
      }
      if (els.companyMediaUploadText) {
        els.companyMediaUploadText.textContent = `${Math.round(value)}%`;
      }
    };

    const showUploadStage = (labelText) => {
      if (els.companyMediaUploadLabel) {
        els.companyMediaUploadLabel.textContent = labelText;
      }
      if (els.companyMediaUploadStage) {
        els.companyMediaUploadStage.hidden = false;
      }
      if (els.companyMediaCropStage) {
        els.companyMediaCropStage.hidden = true;
      }
      if (els.companyMediaApply) {
        els.companyMediaApply.hidden = true;
      }
      updateUploadProgress(0);
    };

    const showCropStage = () => {
      if (els.companyMediaUploadStage) {
        els.companyMediaUploadStage.hidden = true;
      }
      if (els.companyMediaCropStage) {
        els.companyMediaCropStage.hidden = false;
      }
      if (els.companyMediaApply) {
        els.companyMediaApply.hidden = false;
      }
    };

    const openMediaModal = (titleText) => {
      if (els.companyMediaTitle) {
        els.companyMediaTitle.textContent = titleText;
      }
      els.companyMediaModal.hidden = false;
      els.companyMediaBackdrop.hidden = false;
      requestAnimationFrame(() => {
        els.companyMediaModal.classList.add("show");
        els.companyMediaBackdrop.classList.add("show");
      });
    };

    const cleanupObjectURL = () => {
      if (cropState.objectURL) {
        URL.revokeObjectURL(cropState.objectURL);
        cropState.objectURL = "";
      }
    };

    const resetCropState = () => {
      cleanupObjectURL();
      cropState.type = "";
      cropState.image = null;
      cropState.fileName = "";
      cropState.minScale = 1;
      cropState.scale = 1;
      cropState.maxScale = 4;
      cropState.offsetX = 0;
      cropState.offsetY = 0;
      cropState.dragging = false;
      cropState.pointerId = 0;
      if (els.companyMediaZoom) {
        els.companyMediaZoom.value = "100";
      }
      cropCtx.clearRect(0, 0, cropCanvas.width, cropCanvas.height);
    };

    const closeMediaModal = () => {
      if (cropState.busy) return;
      els.companyMediaModal.classList.remove("show");
      els.companyMediaBackdrop.classList.remove("show");
      const closeFlowId = cropState.flowId + 1;
      cropState.flowId = closeFlowId;
      setTimeout(() => {
        if (cropState.flowId !== closeFlowId) return;
        els.companyMediaModal.hidden = true;
        els.companyMediaBackdrop.hidden = true;
        resetCropState();
      }, MEDIA_MODAL_ANIM_MS);
    };

    const clampOffsets = () => {
      if (!cropState.image) return;
      const width = cropCanvas.width;
      const height = cropCanvas.height;
      const scaledW = cropState.image.width * cropState.scale;
      const scaledH = cropState.image.height * cropState.scale;
      const minX = Math.min(0, width - scaledW);
      const minY = Math.min(0, height - scaledH);
      cropState.offsetX = Math.max(minX, Math.min(0, cropState.offsetX));
      cropState.offsetY = Math.max(minY, Math.min(0, cropState.offsetY));
    };

    const drawCropCanvas = () => {
      if (!cropState.image) return;
      clampOffsets();
      cropCtx.clearRect(0, 0, cropCanvas.width, cropCanvas.height);
      cropCtx.imageSmoothingEnabled = true;
      cropCtx.imageSmoothingQuality = "high";
      cropCtx.drawImage(
        cropState.image,
        cropState.offsetX,
        cropState.offsetY,
        cropState.image.width * cropState.scale,
        cropState.image.height * cropState.scale,
      );
    };

    const applyZoom = (sliderValue, anchorX = null, anchorY = null) => {
      if (!cropState.image) return;
      const ratio = Math.max(1, Number(sliderValue) || 100) / 100;
      const nextScale = cropState.minScale * ratio;
      const prevScale = cropState.scale;
      if (prevScale <= 0) return;

      const ax = anchorX === null ? cropCanvas.width / 2 : anchorX;
      const ay = anchorY === null ? cropCanvas.height / 2 : anchorY;
      const relX = (ax - cropState.offsetX) / prevScale;
      const relY = (ay - cropState.offsetY) / prevScale;

      cropState.scale = Math.max(cropState.minScale, Math.min(cropState.maxScale, nextScale));
      cropState.offsetX = ax - relX * cropState.scale;
      cropState.offsetY = ay - relY * cropState.scale;
      drawCropCanvas();
    };

    const prepareCropForImage = (image, inputFile, type) => {
      const width = cropCanvas.width;
      const height = cropCanvas.height;
      cropState.image = image;
      cropState.type = type;
      cropState.fileName = inputFile?.name || "";
      cropState.minScale = Math.max(width / image.width, height / image.height);
      cropState.scale = cropState.minScale;
      cropState.maxScale = cropState.minScale * 4;
      cropState.offsetX = (width - image.width * cropState.scale) / 2;
      cropState.offsetY = (height - image.height * cropState.scale) / 2;

      if (els.companyMediaZoom) {
        els.companyMediaZoom.value = "100";
      }
      if (els.companyMediaCropNote) {
        const isSVGInput = String(inputFile?.type || "").toLowerCase().includes("svg") ||
          String(inputFile?.name || "").toLowerCase().endsWith(".svg");
        els.companyMediaCropNote.textContent = isSVGInput
          ? "Input SVG tetap didukung. Hasil crop disimpan sebagai PNG transparan."
          : "Hasil crop akan disimpan sebagai PNG transparan.";
      }
      drawCropCanvas();
    };

    const readFileWithProgress = (file) =>
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onprogress = (event) => {
          if (!event.lengthComputable) return;
          updateUploadProgress((event.loaded / event.total) * 100);
        };
        reader.onerror = () => reject(new Error("gagal membaca file upload"));
        reader.onload = () => resolve();
        reader.readAsArrayBuffer(file);
      });

    const loadImageFromFile = (file) =>
      new Promise((resolve, reject) => {
        const objectURL = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => resolve({ img, objectURL });
        img.onerror = () => {
          URL.revokeObjectURL(objectURL);
          reject(new Error("file gambar tidak dapat diproses"));
        };
        img.src = objectURL;
      });

    const isAllowedCompanyMedia = (file) => {
      if (!file) return false;
      const type = String(file.type || "").toLowerCase();
      const fileName = String(file.name || "").toLowerCase();
      const allowedMime = [
        "image/png",
        "image/jpeg",
        "image/webp",
        "image/svg+xml",
      ];
      if (allowedMime.includes(type)) return true;
      return ALLOWED_COMPANY_MEDIA_EXT.some((ext) => fileName.endsWith(ext));
    };

    const uploadCroppedCompanyMedia = async () => {
      if (!cropState.image || !cropState.type) {
        setFlash("Gambar belum siap untuk diproses.", "error");
        return;
      }

      const targetSize = cropState.type === "favicon" ? 160 : 512;
      const outputCanvas = document.createElement("canvas");
      outputCanvas.width = targetSize;
      outputCanvas.height = targetSize;
      const outputCtx = outputCanvas.getContext("2d", { alpha: true });
      if (!outputCtx) {
        setFlash("Editor crop tidak tersedia.", "error");
        return;
      }

      const ratio = targetSize / cropCanvas.width;
      outputCtx.imageSmoothingEnabled = true;
      outputCtx.imageSmoothingQuality = "high";
      outputCtx.drawImage(
        cropState.image,
        cropState.offsetX * ratio,
        cropState.offsetY * ratio,
        cropState.image.width * cropState.scale * ratio,
        cropState.image.height * cropState.scale * ratio,
      );

      const blob = await new Promise((resolve, reject) => {
        outputCanvas.toBlob((value) => {
          if (!value) {
            reject(new Error("gagal membuat hasil crop"));
            return;
          }
          resolve(value);
        }, "image/png");
      });

      const croppedFile = new File([blob], `${cropState.type}-cropped.png`, { type: "image/png" });
      showUploadStage("Mengupload hasil crop...");
      setBusy(true);

      try {
        const data = await uploadCompanyMediaWithProgress(cropState.type, croppedFile, updateUploadProgress);
        updateUploadProgress(100);
        state.company = data.setting || state.company;
        applyBranding();
        setBusy(false);
        setFlash(data.message || "Media berhasil diperbarui.", "success");
        closeMediaModal();
      } catch (error) {
        setBusy(false);
        showCropStage();
        setFlash(error.message || "Upload media gagal.", "error");
      }
    };

    const beginCompanyMediaFlow = async (type, file) => {
      if (!file) return;
      if (!isAdmin()) {
        setFlash("Hanya admin yang bisa mengubah logo/favicon.", "error");
        return;
      }
      if (!isAllowedCompanyMedia(file)) {
        setFlash("Format file tidak didukung. Gunakan PNG, JPG, WEBP, atau SVG.", "error");
        return;
      }
      if (file.size > MAX_UPLOAD_SIZE_BYTES) {
        setFlash("Ukuran file maksimal 10 MB.", "error");
        return;
      }

      const flowId = cropState.flowId + 1;
      cropState.flowId = flowId;
      resetCropState();
      setBusy(false);
      openMediaModal(type === "favicon" ? "Upload Favicon" : "Upload Logo");
      showUploadStage("Menyiapkan file...");

      try {
        await readFileWithProgress(file);
        if (flowId !== cropState.flowId) return;
        updateUploadProgress(100);
        const loaded = await loadImageFromFile(file);
        if (flowId !== cropState.flowId) {
          URL.revokeObjectURL(loaded.objectURL);
          return;
        }
        cleanupObjectURL();
        cropState.objectURL = loaded.objectURL;
        prepareCropForImage(loaded.img, file, type);
        showCropStage();
      } catch (error) {
        if (flowId !== cropState.flowId) return;
        setFlash(error.message || "Gagal memproses file upload.", "error");
        closeMediaModal();
      }
    };

    cropCanvas.addEventListener("pointerdown", (event) => {
      if (els.companyMediaCropStage?.hidden || cropState.busy) return;
      cropState.dragging = true;
      cropState.pointerId = event.pointerId;
      cropState.startX = event.clientX;
      cropState.startY = event.clientY;
      cropState.startOffsetX = cropState.offsetX;
      cropState.startOffsetY = cropState.offsetY;
      cropCanvas.setPointerCapture(event.pointerId);
    });
    cropCanvas.addEventListener("pointermove", (event) => {
      if (!cropState.dragging || event.pointerId !== cropState.pointerId) return;
      const dx = event.clientX - cropState.startX;
      const dy = event.clientY - cropState.startY;
      cropState.offsetX = cropState.startOffsetX + dx;
      cropState.offsetY = cropState.startOffsetY + dy;
      drawCropCanvas();
    });
    const endDrag = (event) => {
      if (!cropState.dragging || event.pointerId !== cropState.pointerId) return;
      cropState.dragging = false;
      cropState.pointerId = 0;
    };
    cropCanvas.addEventListener("pointerup", endDrag);
    cropCanvas.addEventListener("pointercancel", endDrag);

    cropCanvas.addEventListener(
      "wheel",
      (event) => {
        if (els.companyMediaCropStage?.hidden || cropState.busy) return;
        event.preventDefault();
        const current = Number(els.companyMediaZoom?.value || 100);
        const delta = event.deltaY < 0 ? 8 : -8;
        const next = Math.max(100, Math.min(400, current + delta));
        if (els.companyMediaZoom) {
          els.companyMediaZoom.value = String(next);
        }
        const rect = cropCanvas.getBoundingClientRect();
        applyZoom(next, event.clientX - rect.left, event.clientY - rect.top);
      },
      { passive: false },
    );

    els.companyMediaZoom?.addEventListener("input", () => {
      applyZoom(els.companyMediaZoom.value);
    });

    els.companyMediaClose?.addEventListener("click", closeMediaModal);
    els.companyMediaCancel?.addEventListener("click", closeMediaModal);
    els.companyMediaBackdrop?.addEventListener("click", closeMediaModal);
    els.companyMediaModal?.addEventListener("click", (event) => {
      if (event.target === els.companyMediaModal) {
        closeMediaModal();
      }
    });
    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !els.companyMediaModal.hidden) {
        closeMediaModal();
      }
    });

    els.companyMediaApply?.addEventListener("click", () => {
      uploadCroppedCompanyMedia().catch((error) => {
        setBusy(false);
        setFlash(error.message || "Gagal memproses crop media.", "error");
      });
    });

    if (els.companyForm.logo) {
      els.companyForm.logo.addEventListener("change", () => {
        const file = els.companyForm.logo.files?.[0];
        els.companyForm.logo.value = "";
        beginCompanyMediaFlow("logo", file).catch((error) => {
          setFlash(error.message || "Gagal memproses logo.", "error");
        });
      });
    }

    if (els.companyForm.favicon) {
      els.companyForm.favicon.addEventListener("change", () => {
        const file = els.companyForm.favicon.files?.[0];
        els.companyForm.favicon.value = "";
        beginCompanyMediaFlow("favicon", file).catch((error) => {
          setFlash(error.message || "Gagal memproses favicon.", "error");
        });
      });
    }
  };

  const setupCompanyForm = () => {
    els.companyForm?.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!isAdmin()) {
        setFlash("Hanya admin yang bisa mengubah identitas perusahaan.", "error");
        return;
      }
      const payload = {
        company_name: els.companyForm.company_name.value.trim(),
        address: els.companyForm.address.value.trim(),
        email: els.companyForm.email.value.trim(),
        phone: els.companyForm.phone.value.trim(),
        website: els.companyForm.website.value.trim(),
        asset_code_prefix: els.companyForm.asset_code_prefix?.value?.trim(),
      };

      try {
        const data = await api("/api/settings/company", {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        state.company = data.setting;
        updateStats();
        setFlash(data.message || "Identitas perusahaan diperbarui.", "success");
      } catch (error) {
        setFlash(error.message, "error");
      }
    });
  };

  const todayISO = () => new Date().toISOString().slice(0, 10);

  const applyDefaultPurchaseDates = () => {
    const forms = [els.quickAssetForm, els.assetForm].filter(Boolean);
    forms.forEach((form) => {
      if (!form.purchase_date) return;
      if (!form.purchase_date.value) {
        form.purchase_date.value = todayISO();
      }
    });
  };

  const applyDefaultLoanDates = () => {
    if (!els.loanForm?.borrow_date) return;
    if (!els.loanForm.borrow_date.value) {
      els.loanForm.borrow_date.value = todayISO();
    }
  };

  const requestNextAssetCode = async (purchaseDate, input) => {
    if (!purchaseDate || !input) return;
    if (input.value && input.dataset.auto !== "1") return;
    try {
      const data = await api(`/api/assets/next-id?purchase_date=${encodeURIComponent(purchaseDate)}`);
      if (data.asset_code) {
        input.value = data.asset_code;
        input.dataset.auto = "1";
      }
    } catch (_) {
    }
  };

  const setupAutoAssetCodeInputs = () => {
    const configs = [
      { form: els.assetForm, date: "purchase_date", code: "asset_code" },
      { form: els.quickAssetForm, date: "purchase_date", code: "asset_code" },
    ];
    configs.forEach((cfg) => {
      const form = cfg.form;
      if (!form) return;
      const dateInput = form[cfg.date];
      const codeInput = form[cfg.code];
      if (!dateInput || !codeInput) return;

      const trigger = () => requestNextAssetCode(dateInput.value, codeInput);
      dateInput.addEventListener("change", trigger);
      dateInput.addEventListener("blur", trigger);
      codeInput.addEventListener("focus", trigger);
      codeInput.addEventListener("input", () => {
        if (codeInput.value) codeInput.dataset.auto = "0";
      });
      codeInput.addEventListener("blur", () => {
        if (!codeInput.value) {
          codeInput.dataset.auto = "1";
          trigger();
        }
      });
    });
  };

  const renderUsers = () => {
    if (!els.usersTable) return;

    if (state.users.length === 0) {
      els.usersTable.innerHTML = '<tr><td colspan="5">Belum ada user.</td></tr>';
      return;
    }

    els.usersTable.innerHTML = state.users
      .map(
        (user) => `
          <tr>
            <td>${escapeHtml(user.username)}</td>
            <td>${escapeHtml(user.full_name)}</td>
            <td>${escapeHtml(user.role)}</td>
            <td>${user.is_active ? "Aktif" : "Nonaktif"}</td>
            <td>
              <div class="row-actions">
                <button class="tiny-btn" data-action="edit-user" data-id="${user.id}">Edit</button>
                <button class="tiny-btn warn" data-action="delete-user" data-id="${user.id}">Hapus</button>
              </div>
            </td>
          </tr>
        `,
      )
      .join("");
  };

  const formatDateTime = (raw) => {
    if (!raw) return "-";
    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) {
      return raw;
    }
    return parsed.toLocaleString("id-ID");
  };

  const renderAuditLogs = () => {
    if (!els.auditTable) return;
    if (state.auditLogs.length === 0) {
      els.auditTable.innerHTML = '<tr><td colspan="7">Belum ada aktivitas.</td></tr>';
      return;
    }
    els.auditTable.innerHTML = state.auditLogs
      .map(
        (log) => `
          <tr>
            <td>${escapeHtml(formatDateTime(log.created_at))}</td>
            <td>${escapeHtml(log.username || "-")}</td>
            <td>${escapeHtml(log.role || "-")}</td>
            <td>${escapeHtml(log.action)}</td>
            <td>${escapeHtml(log.entity)}${log.entity_id ? `<br><small class="muted">ID ${log.entity_id}</small>` : ""}</td>
            <td><span class="audit-detail">${escapeHtml(log.detail || "-")}</span></td>
            <td><span class="audit-detail">${escapeHtml(log.ip || "-")}</span></td>
          </tr>
        `,
      )
      .join("");
  };

  const updateAuditPager = () => {
    if (!els.auditPageLabel) return;
    els.auditPageLabel.textContent = `Halaman ${state.auditPage}`;
    if (els.auditPrev) {
      els.auditPrev.disabled = state.auditPage <= 1;
    }
    if (els.auditNext) {
      els.auditNext.disabled = !state.auditHasMore;
    }
  };

  const renderTypes = () => {
    if (!els.typesTable) return;
    const admin = isAdmin();
    if (state.assetTypes.length === 0) {
      els.typesTable.innerHTML = '<tr><td colspan="4">Belum ada jenis aset.</td></tr>';
      return;
    }
    els.typesTable.innerHTML = state.assetTypes
      .map(
        (type) => `
          <tr>
            <td>${escapeHtml(type.name)}</td>
            <td>${escapeHtml(type.description || "-")}</td>
            <td>${escapeHtml(String(Number(type.asset_count || 0)))}</td>
            <td>
              ${
                admin
                  ? `<div class="row-actions">
                <button class="tiny-btn" data-action="edit-type" data-id="${type.id}">Edit</button>
                <button class="tiny-btn warn" data-action="delete-type" data-id="${type.id}">Hapus</button>
              </div>`
                  : '<span class="muted">-</span>'
              }
            </td>
          </tr>
        `,
      )
      .join("");
  };

  const populateTypeSelects = () => {
    const selects = [
      els.assetForm?.asset_type_id,
      els.quickAssetForm?.asset_type_id,
      els.assetFilterType,
    ].filter(Boolean);
    selects.forEach((select) => {
      const current = select.value;
      if (select === els.assetFilterType) {
        select.innerHTML = '<option value="">Semua jenis</option>';
      } else {
        select.innerHTML = '<option value="">Pilih jenis aset</option>';
      }
      state.assetTypes.forEach((type) => {
        const option = document.createElement("option");
        option.value = String(type.id);
        option.textContent = type.name;
        select.appendChild(option);
      });
      if (current) {
        select.value = current;
      }
    });
  };

  const renderLoanAssetResults = (items = null) => {
    if (!els.loanAssetResults || !els.loanAssetSearch) return;
    const results = items || state.loanAssetResults || [];
    if (results.length === 0) {
      els.loanAssetResults.innerHTML = '<div class="muted small">Tidak ada hasil.</div>';
      els.loanAssetResults.classList.add("active");
      return;
    }
    els.loanAssetResults.innerHTML = results
      .map(
        (asset) => `
          <button type="button" class="search-option" data-asset-id="${asset.id}">
            ${escapeHtml(asset.asset_code)} - ${escapeHtml(asset.name)}
            <small>${escapeHtml(asset.asset_type_name || "Jenis tidak diketahui")}</small>
          </button>
        `,
      )
      .join("");
    els.loanAssetResults.classList.add("active");
  };

  const renderSelectedLoanAssets = () => {
    if (!els.loanSelectedAssets) return;
    if (selectedLoanAssets.length === 0) {
      els.loanSelectedAssets.innerHTML = '<span class="muted small">Belum ada aset dipilih.</span>';
      return;
    }
    els.loanSelectedAssets.innerHTML = selectedLoanAssets
      .map(
        (asset) => `
          <span class="asset-chip">
            ${escapeHtml(asset.asset_code)} - ${escapeHtml(asset.name)}
            <button type="button" data-asset-id="${asset.id}" aria-label="Hapus aset">x</button>
          </span>
        `,
      )
      .join("");
  };

  const addLoanAsset = (asset) => {
    if (!asset) return;
    if (selectedLoanAssets.some((item) => item.id === asset.id)) return;
    selectedLoanAssets = [...selectedLoanAssets, asset];
    renderSelectedLoanAssets();
  };

  const loadAssetTypes = async () => {
    const data = await api("/api/asset-types");
    state.assetTypes = data.types || [];
    renderTypes();
    populateTypeSelects();
  };

  const loadUsers = async () => {
    if (state.me?.role !== "admin") return;
    const data = await api("/api/users");
    state.users = data.users || [];
    renderUsers();
    updateStats();
  };

  const loadAuditLogs = async (override = null) => {
    if (state.me?.role !== "admin") return;
    if (override) {
      state.auditFilter = { ...state.auditFilter, ...override };
    }
    const params = new URLSearchParams();
    params.set("limit", "100");
    params.set("page", String(state.auditPage));
    if (state.auditFilter?.user) params.set("user", state.auditFilter.user);
    if (state.auditFilter?.action) params.set("action", state.auditFilter.action);
    if (state.auditFilter?.date_from) params.set("date_from", state.auditFilter.date_from);
    if (state.auditFilter?.date_to) params.set("date_to", state.auditFilter.date_to);
    const data = await api(`/api/audit-logs?${params.toString()}`);
    state.auditLogs = data.logs || [];
    state.auditHasMore = Boolean(data.has_more);
    state.auditPage = Number(data.page || state.auditPage);
    renderAuditLogs();
    updateAuditPager();
  };

  const resetUserForm = () => {
    if (!els.userForm) return;
    els.userForm.reset();
    els.userForm.id.value = "";
    els.userForm.role.value = "staff";
    els.userForm.is_active.checked = true;
    document.getElementById("user-submit").textContent = "Simpan User";
  };

  const resetTypeForm = () => {
    if (!els.typeForm) return;
    const typeIDInput = els.typeForm.querySelector('input[name="id"]');
    els.typeForm.reset();
    if (typeIDInput) {
      typeIDInput.value = "";
    }
    if (els.typeSubmit) {
      els.typeSubmit.textContent = "Tambah Jenis";
    }
  };

  const setupUsers = () => {
    if (!els.userForm || !els.usersTable) return;

    els.userForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const id = els.userForm.id.value;
      const payload = {
        username: els.userForm.username.value.trim(),
        full_name: els.userForm.full_name.value.trim(),
        password: els.userForm.password.value,
        role: els.userForm.role.value,
        is_active: Boolean(els.userForm.is_active.checked),
      };

      if (!payload.username || !payload.full_name || !payload.role) {
        setFlash("Data user belum lengkap.", "error");
        return;
      }
      if (!id && payload.password.length < 6) {
        setFlash("Password minimal 6 karakter untuk user baru.", "error");
        return;
      }

      try {
        const endpoint = id ? `/api/users/${id}` : "/api/users";
        const method = id ? "PUT" : "POST";
        const data = await api(endpoint, { method, body: JSON.stringify(payload) });
        setFlash(data.message || "User berhasil disimpan.", "success");
        resetUserForm();
        await loadUsers();
      } catch (error) {
        setFlash(error.message, "error");
      }
    });

    els.userCancel.addEventListener("click", resetUserForm);

    els.usersTable.addEventListener("click", async (event) => {
      const button = event.target.closest("button[data-action]");
      if (!button) return;

      const id = Number(button.dataset.id);
      const user = state.users.find((item) => item.id === id);
      if (!user) return;

      if (button.dataset.action === "edit-user") {
        els.userForm.id.value = String(user.id);
        els.userForm.username.value = user.username;
        els.userForm.full_name.value = user.full_name;
        els.userForm.password.value = "";
        els.userForm.role.value = user.role;
        els.userForm.is_active.checked = Boolean(user.is_active);
        document.getElementById("user-submit").textContent = "Update User";
        activateSection("users");
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      if (button.dataset.action === "delete-user") {
      const ok = await confirmDialog(`Hapus user ${user.username}?`, {
        title: "Hapus User",
        confirmText: "Hapus",
      });
      if (!ok) return;
        try {
          const data = await api(`/api/users/${id}`, { method: "DELETE" });
          setFlash(data.message || "User dihapus.", "success");
          await loadUsers();
        } catch (error) {
          setFlash(error.message, "error");
        }
      }
    });
  };

  const setupTypes = () => {
    if (!els.typeForm || !els.typesTable) return;
    const typeIDInput = els.typeForm.querySelector('input[name="id"]');

    els.typeForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!isAdmin()) {
        setFlash("Hanya admin yang bisa mengubah jenis aset.", "error");
        return;
      }
      const id = typeIDInput?.value?.trim() || "";
      const payload = {
        name: els.typeForm.name.value.trim(),
        description: els.typeForm.description?.value?.trim() || "",
      };
      if (!payload.name) {
        setFlash("Nama jenis wajib diisi.", "error");
        return;
      }
      try {
        const endpoint = id ? `/api/asset-types/${id}` : "/api/asset-types";
        const method = id ? "PUT" : "POST";
        const data = await api(endpoint, { method, body: JSON.stringify(payload) });
        setFlash(data.message || (id ? "Jenis aset diubah." : "Jenis aset ditambahkan."), "success");
        resetTypeForm();
        await loadAssetTypes();
      } catch (error) {
        setFlash(error.message, "error");
      }
    });

    els.typeCancel?.addEventListener("click", resetTypeForm);

    els.typesTable.addEventListener("click", async (event) => {
      const button = event.target.closest("button[data-action]");
      if (!button) return;

      const id = Number(button.dataset.id);
      const type = state.assetTypes.find((item) => item.id === id);
      if (!type) return;

      if (button.dataset.action === "edit-type") {
        if (!isAdmin()) {
          setFlash("Hanya admin yang bisa mengubah jenis aset.", "error");
          return;
        }
        if (typeIDInput) {
          typeIDInput.value = String(type.id);
        }
        els.typeForm.name.value = type.name || "";
        if (els.typeForm.description) {
          els.typeForm.description.value = type.description || "";
        }
        if (els.typeSubmit) {
          els.typeSubmit.textContent = "Update Jenis";
        }
        activateSection("types");
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      if (button.dataset.action !== "delete-type") return;
      if (!isAdmin()) {
        setFlash("Hanya admin yang bisa menghapus jenis aset.", "error");
        return;
      }

      const ok = await confirmDialog(`Hapus jenis ${type.name}?`, {
        title: "Hapus Jenis Aset",
        confirmText: "Hapus",
      });
      if (!ok) return;
      try {
        const data = await api(`/api/asset-types/${id}`, { method: "DELETE" });
        setFlash(data.message || "Jenis aset dihapus.", "success");
        await loadAssetTypes();
      } catch (error) {
        setFlash(error.message, "error");
      }
    });
  };

  const renderAssets = () => {
    if (!els.assetsTable) return;
    const admin = isAdmin();

    if (state.assets.length === 0) {
      els.assetsTable.innerHTML = '<tr><td colspan="8">Belum ada aset.</td></tr>';
      return;
    }

      els.assetsTable.innerHTML = state.assets
        .map(
          (asset) => `
            <tr>
              <td>
                ${
                (asset.photo_thumb_url || asset.photo_url)
                  ? `<img class="thumb thumb-clickable" src="${escapeHtml(asset.photo_thumb_url || asset.photo_url)}" data-full-url="${escapeHtml(asset.photo_url || asset.photo_thumb_url || "")}" data-asset-code="${escapeHtml(asset.asset_code)}" alt="Foto ${escapeHtml(asset.asset_code)}">`
                  : `<div class="thumb"></div>`
              }
              </td>
            <td>${escapeHtml(asset.asset_code)}</td>
            <td>${escapeHtml(asset.name)}</td>
            <td>${escapeHtml(asset.asset_type_name || "-")}</td>
            <td>${escapeHtml(asset.purchase_date)}</td>
            <td>${escapeHtml(asset.condition)}</td>
            <td>
              <span class="status-pill ${asset.loan_status === "Dipinjam" ? "borrowed" : "available"}">
                ${escapeHtml(asset.loan_status || "Ada")}
              </span>
            </td>
            <td>
              <div class="row-actions">
                <button class="tiny-btn icon" data-action="edit-asset" data-id="${asset.id}" aria-label="Edit aset" title="Edit">
                  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm2.92 2.83H5v-.92l8.06-8.06.92.92L5.92 20.08zM20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z"/>
                  </svg>
                </button>
                ${
                  admin
                    ? `<button class="tiny-btn warn icon" data-action="delete-asset" data-id="${asset.id}" aria-label="Hapus aset" title="Hapus">
                  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <path d="M6 7h12l-1 14H7L6 7zm4-3h4l1 2H9l1-2z"/>
                  </svg>
                </button>`
                    : ""
                }
              </div>
            </td>
          </tr>
        `,
      )
      .join("");
  };

  const updateAssetPager = () => {
    if (!els.assetPageLabel) return;
    els.assetPageLabel.textContent = `Halaman ${state.assetPage}`;
    if (els.assetPrev) {
      els.assetPrev.disabled = state.assetPage <= 1;
    }
    if (els.assetNext) {
      els.assetNext.disabled = !state.assetHasMore;
    }
  };

  const loadAssets = async () => {
    const params = new URLSearchParams();
    params.set("limit", "20");
    params.set("page", String(state.assetPage));
    if (state.assetFilter?.date_from) params.set("date_from", state.assetFilter.date_from);
    if (state.assetFilter?.date_to) params.set("date_to", state.assetFilter.date_to);
    if (state.assetFilter?.type_id) params.set("type_id", state.assetFilter.type_id);
    if (state.assetFilter?.condition) params.set("condition", state.assetFilter.condition);
    const data = await api(`/api/assets?${params.toString()}`);
    state.assets = data.assets || [];
    state.assetTotal = Number(data.total || state.assets.length || 0);
    state.assetHasMore = Boolean(data.has_more);
    state.assetPage = Number(data.page || state.assetPage);
    renderAssets();
    updateStats();
    updateAssetPager();
  };

  const uploadAssetPhoto = async (assetID, file) => {
    if (!file) return;

    const csrfToken = getCookie("rck_csrf");
    const formData = new FormData();
    formData.append("photo", file);

    const response = await fetch(`/api/assets/${assetID}/photo`, {
      method: "POST",
      body: formData,
      credentials: "same-origin",
      headers: csrfToken ? { "X-CSRF-Token": csrfToken } : undefined,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(data.error || "Upload foto gagal");
      error.status = response.status;
      throw error;
    }
    return data;
  };

  const decodeBarcodeFromPhoto = async (file) => {
    if (!file) return "";
    const csrfToken = getCookie("rck_csrf");
    const formData = new FormData();
    formData.append("photo", file);

    const response = await fetch("/api/barcode/decode", {
      method: "POST",
      body: formData,
      credentials: "same-origin",
      headers: csrfToken ? { "X-CSRF-Token": csrfToken } : undefined,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(data.error || "Barcode tidak terdeteksi dari foto.");
      error.status = response.status;
      throw error;
    }
    return String(data.value || "").trim();
  };

  const resetAssetForm = () => {
    els.assetForm.reset();
    els.assetForm.id.value = "";
    els.assetForm.photo.value = "";
    if (els.assetForm.condition) {
      els.assetForm.condition.value = "Baik";
    }
    if (els.assetForm.asset_type_id) {
      els.assetForm.asset_type_id.value = "";
    }
    if (els.assetForm.purchase_date) {
      if (!els.assetForm.purchase_date.value) {
        els.assetForm.purchase_date.value = todayISO();
      }
      requestNextAssetCode(els.assetForm.purchase_date.value, els.assetForm.asset_code);
    }
    document.getElementById("asset-submit").textContent = "Simpan Aset";
  };

  const setupAssets = () => {
    if (!els.assetForm || !els.assetsTable) return;

    const showForm = () => {
      els.assetForm.classList.add("active");
    };

    const hideForm = () => {
      els.assetForm.classList.remove("active");
    };

    els.assetFormToggle?.addEventListener("click", () => {
      if (els.assetForm.classList.contains("active")) {
        hideForm();
        return;
      }
      resetAssetForm();
      showForm();
      els.assetForm.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    els.assetForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const id = els.assetForm.id.value;
      const payload = {
        asset_code: els.assetForm.asset_code.value.trim(),
        name: els.assetForm.name.value.trim(),
        purchase_date: els.assetForm.purchase_date.value,
        condition: els.assetForm.condition.value.trim(),
        asset_type_id: Number(els.assetForm.asset_type_id.value || 0),
        barcode: els.assetForm.barcode.value.trim(),
      };

      if (!payload.asset_code || !payload.name || !payload.purchase_date || !payload.condition || payload.asset_type_id <= 0) {
        setFlash("Semua field aset wajib diisi.", "error");
        return;
      }

      try {
        const endpoint = id ? `/api/assets/${id}` : "/api/assets";
        const method = id ? "PUT" : "POST";
        const data = await api(endpoint, { method, body: JSON.stringify(payload) });
        const assetID = data.asset?.id || Number(id);
        if (assetID) {
          await uploadAssetPhoto(assetID, els.assetForm?.photo?.files?.[0]);
        }
        setFlash(data.message || "Aset berhasil disimpan.", "success");
        resetAssetForm();
        hideForm();
        await loadAssets();
      } catch (error) {
        setFlash(error.message, "error");
      }
    });

    els.assetCancel.addEventListener("click", () => {
      resetAssetForm();
      hideForm();
    });

    els.assetsTable.addEventListener("click", async (event) => {
      const thumb = event.target.closest(".thumb-clickable");
      if (thumb) {
        const fullURL = thumb.dataset.fullUrl;
        const assetCode = thumb.dataset.assetCode || "Aset";
        if (fullURL) {
          openAssetPhotoPreview(fullURL, `Foto ${assetCode}`);
        }
        return;
      }

      const button = event.target.closest("button[data-action]");
      if (!button) return;

      const id = Number(button.dataset.id);
      const asset = state.assets.find((item) => item.id === id);
      if (!asset) return;

      if (button.dataset.action === "edit-asset") {
        els.assetForm.id.value = String(asset.id);
        els.assetForm.asset_code.value = asset.asset_code;
        els.assetForm.name.value = asset.name;
        els.assetForm.purchase_date.value = asset.purchase_date;
        els.assetForm.condition.value = asset.condition;
        if (els.assetForm.asset_type_id) {
          els.assetForm.asset_type_id.value = String(asset.asset_type_id || "");
        }
        els.assetForm.barcode.value = asset.barcode;
        els.assetForm.photo.value = "";
        document.getElementById("asset-submit").textContent = "Update Aset";
        showForm();
        activateSection("assets");
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      if (button.dataset.action === "delete-asset") {
        if (!isAdmin()) {
          setFlash("Hanya admin yang bisa menghapus aset.", "error");
          return;
        }
        const ok = await confirmDialog(`Hapus aset ${asset.asset_code}?`, {
          title: "Hapus Aset",
          confirmText: "Hapus",
        });
        if (!ok) return;
        try {
          const data = await api(`/api/assets/${id}`, { method: "DELETE" });
          setFlash(data.message || "Aset dihapus.", "success");
          await loadAssets();
        } catch (error) {
          setFlash(error.message, "error");
        }
      }
    });
  };

  const setupLoanAssetSearch = () => {
    if (!els.loanAssetSearch || !els.loanAssetResults) return;
    renderSelectedLoanAssets();

    const hideResults = () => {
      els.loanAssetResults.classList.remove("active");
    };

    let searchTimer = null;
    const searchAssets = async (term) => {
      if (!term || term.trim().length < 1) {
        state.loanAssetResults = [];
        renderLoanAssetResults([]);
        return;
      }
      try {
        const data = await api(`/api/assets/search?q=${encodeURIComponent(term)}&limit=20`);
        state.loanAssetResults = data.assets || [];
        renderLoanAssetResults();
      } catch (error) {
        setFlash(error.message, "error");
      }
    };

    const debouncedSearch = (term) => {
      if (searchTimer) clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        searchAssets(term);
      }, 250);
    };

    els.loanAssetSearch.addEventListener("focus", () => {
      debouncedSearch(els.loanAssetSearch.value);
    });

    els.loanAssetSearch.addEventListener("input", () => {
      selectedLoanCandidate = null;
      debouncedSearch(els.loanAssetSearch.value);
    });

    els.loanAssetResults.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-asset-id]");
      if (!button) return;
      const assetID = button.dataset.assetId;
      const asset = (state.loanAssetResults || []).find((item) => String(item.id) === String(assetID));
      if (!asset) return;
      selectedLoanCandidate = asset;
      els.loanAssetSearch.value = `${asset.asset_code} - ${asset.name}`;
      addLoanAsset(asset);
      selectedLoanCandidate = null;
      els.loanAssetSearch.value = "";
      hideResults();
    });

    els.loanAddAsset?.addEventListener("click", () => {
      if (selectedLoanCandidate) {
        addLoanAsset(selectedLoanCandidate);
        selectedLoanCandidate = null;
        els.loanAssetSearch.value = "";
        hideResults();
        return;
      }
      if (els.loanAssetSearch.value.trim()) {
        const term = els.loanAssetSearch.value.trim().toLowerCase();
        const match = (state.loanAssetResults || []).find((asset) => {
          const label = `${asset.asset_code} ${asset.name}`.toLowerCase();
          return label.includes(term);
        });
        if (match) {
          addLoanAsset(match);
          els.loanAssetSearch.value = "";
          selectedLoanCandidate = null;
          hideResults();
        }
      }
    });

    els.loanSelectedAssets?.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-asset-id]");
      if (!button) return;
      const assetID = Number(button.dataset.assetId);
      selectedLoanAssets = selectedLoanAssets.filter((item) => item.id !== assetID);
      renderSelectedLoanAssets();
    });

    document.addEventListener("click", (event) => {
      if (!els.loanAssetResults.classList.contains("active")) return;
      if (event.target === els.loanAssetSearch) return;
      if (els.loanAssetResults.contains(event.target)) return;
      hideResults();
    });
  };

  const renderLoans = () => {
    if (!els.loansTable) return;
    const admin = isAdmin();

    if (state.loans.length === 0) {
      els.loansTable.innerHTML = '<tr><td colspan="6">Belum ada peminjaman.</td></tr>';
      return;
    }

    const rows = [];
    state.loans.forEach((loan) => {
      const items = loan.items || [];
      if (items.length === 0) {
        rows.push(`
          <tr>
            <td>${escapeHtml(loan.borrower_name)}</td>
            <td>${escapeHtml(loan.borrower_contact || "-")}</td>
            <td>${escapeHtml(loan.borrow_date)}</td>
            <td>-</td>
            <td><span class="status-pill active">Dipinjam</span></td>
            <td>
              <div class="row-actions">
                <button class="tiny-btn" data-action="edit-loan" data-id="${loan.id}">Edit</button>
                ${admin ? `<button class="tiny-btn warn" data-action="delete-loan" data-id="${loan.id}">Hapus</button>` : ""}
              </div>
            </td>
          </tr>
        `);
        return;
      }
      items.forEach((item, idx) => {
        const returned = Boolean(item.return_date);
        const statusText = returned ? `Dikembalikan ${item.return_date}` : "Dipinjam";
        const statusClass = returned ? "returned" : "active";
        rows.push(`
          <tr>
            ${idx === 0 ? `<td>${escapeHtml(loan.borrower_name)}</td>` : "<td></td>"}
            ${idx === 0 ? `<td>${escapeHtml(loan.borrower_contact || "-")}</td>` : "<td></td>"}
            ${idx === 0 ? `<td>${escapeHtml(loan.borrow_date)}</td>` : "<td></td>"}
            <td>${escapeHtml(item.asset_code)}<br><small class="muted">${escapeHtml(item.asset_name)}</small></td>
            <td><span class="status-pill ${statusClass}">${escapeHtml(statusText)}</span></td>
            <td>
              <div class="row-actions">
                ${idx === 0 ? `<button class="tiny-btn" data-action="edit-loan" data-id="${loan.id}">Edit</button>` : ""}
                ${
                  returned
                    ? ""
                    : `<button class="tiny-btn" data-action="return-loan" data-id="${loan.id}" data-item-id="${item.id}">Kembalikan</button>`
                }
                ${idx === 0 && admin ? `<button class="tiny-btn warn" data-action="delete-loan" data-id="${loan.id}">Hapus</button>` : ""}
              </div>
            </td>
          </tr>
        `);
      });
    });
    els.loansTable.innerHTML = rows.join("");
  };

  const updateLoanPager = () => {
    if (!els.loanPageLabel) return;
    els.loanPageLabel.textContent = `Halaman ${state.loanPage}`;
    if (els.loanPrev) {
      els.loanPrev.disabled = state.loanPage <= 1;
    }
    if (els.loanNext) {
      els.loanNext.disabled = !state.loanHasMore;
    }
  };

  const loadLoans = async () => {
    const params = new URLSearchParams();
    params.set("limit", "20");
    params.set("page", String(state.loanPage));
    if (state.loanFilter?.date_from) params.set("date_from", state.loanFilter.date_from);
    if (state.loanFilter?.date_to) params.set("date_to", state.loanFilter.date_to);
    const data = await api(`/api/loans?${params.toString()}`);
    state.loans = data.loans || [];
    state.loanHasMore = Boolean(data.has_more);
    state.loanPage = Number(data.page || state.loanPage);
    renderLoans();
    updateLoanPager();
  };

  const resetLoanForm = () => {
    if (!els.loanForm) return;
    els.loanForm.reset();
    els.loanForm.id.value = "";
    selectedLoanAssets = [];
    selectedLoanCandidate = null;
    if (els.loanAssetSearch) els.loanAssetSearch.value = "";
    if (els.loanAssetResults) els.loanAssetResults.classList.remove("active");
    renderSelectedLoanAssets();
    if (els.loanForm.borrow_date && !els.loanForm.borrow_date.value) {
      els.loanForm.borrow_date.value = todayISO();
    }
    document.getElementById("loan-submit").textContent = "Simpan Peminjaman";
    if (els.loanModalTitle) {
      els.loanModalTitle.textContent = "Buat Pinjaman";
    }
  };

  const setupLoans = () => {
    if (!els.loanForm || !els.loansTable) return;

    const LOAN_MODAL_ANIM_MS = 180;
    const openLoanModal = (title = "Buat Pinjaman") => {
      if (!els.loanModal || !els.loanBackdrop) return;
      if (els.loanModalTitle) {
        els.loanModalTitle.textContent = title;
      }
      els.loanModal.hidden = false;
      els.loanBackdrop.hidden = false;
      requestAnimationFrame(() => {
        els.loanModal.classList.add("show");
        els.loanBackdrop.classList.add("show");
      });
    };

    const closeLoanModal = () => {
      if (!els.loanModal || !els.loanBackdrop) return;
      els.loanModal.classList.remove("show");
      els.loanBackdrop.classList.remove("show");
      setTimeout(() => {
        els.loanModal.hidden = true;
        els.loanBackdrop.hidden = true;
      }, LOAN_MODAL_ANIM_MS);
    };

    const cancelLoanForm = () => {
      resetLoanForm();
      closeLoanModal();
    };

    els.loanCreateBtn?.addEventListener("click", () => {
      resetLoanForm();
      openLoanModal("Buat Pinjaman");
    });

    els.loanClose?.addEventListener("click", cancelLoanForm);
    els.loanBackdrop?.addEventListener("click", cancelLoanForm);
    els.loanModal?.addEventListener("click", (event) => {
      if (event.target === els.loanModal) {
        cancelLoanForm();
      }
    });
    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && els.loanModal && !els.loanModal.hidden) {
        cancelLoanForm();
      }
    });

    els.loanForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const id = els.loanForm.id.value;
      const payload = {
        borrower_name: els.loanForm.borrower_name.value.trim(),
        borrower_contact: els.loanForm.borrower_contact.value.trim(),
        borrow_date: els.loanForm.borrow_date.value,
        notes: els.loanForm.notes.value.trim(),
        asset_ids: selectedLoanAssets.map((asset) => asset.id),
      };

      if (!payload.borrower_name || !payload.borrow_date || payload.asset_ids.length === 0) {
        setFlash("Data peminjaman belum lengkap.", "error");
        return;
      }

      try {
        const endpoint = id ? `/api/loans/${id}` : "/api/loans";
        const method = id ? "PUT" : "POST";
        const data = await api(endpoint, { method, body: JSON.stringify(payload) });
        setFlash(data.message || "Peminjaman tersimpan.", "success");
        resetLoanForm();
        closeLoanModal();
        await loadLoans();
      } catch (error) {
        setFlash(error.message, "error");
      }
    });

    els.loanCancel?.addEventListener("click", cancelLoanForm);

    els.loansTable.addEventListener("click", async (event) => {
      const button = event.target.closest("button[data-action]");
      if (!button) return;

      const id = Number(button.dataset.id);
      const loan = state.loans.find((item) => item.id === id);
      if (!loan) return;

      if (button.dataset.action === "edit-loan") {
        els.loanForm.id.value = String(loan.id);
        selectedLoanAssets = (loan.items || []).map((item) => ({
          id: item.asset_id,
          asset_code: item.asset_code,
          name: item.asset_name,
        }));
        renderSelectedLoanAssets();
        if (els.loanAssetSearch) els.loanAssetSearch.value = "";
        els.loanForm.borrower_name.value = loan.borrower_name;
        els.loanForm.borrower_contact.value = loan.borrower_contact || "";
        els.loanForm.borrow_date.value = loan.borrow_date;
        els.loanForm.notes.value = loan.notes || "";
        document.getElementById("loan-submit").textContent = "Update Peminjaman";
        if (els.loanModalTitle) {
          els.loanModalTitle.textContent = "Edit Pinjaman";
        }
        openLoanModal("Edit Pinjaman");
        activateSection("loans");
        return;
      }

      if (button.dataset.action === "return-loan") {
        const ok = await confirmDialog("Tandai aset sudah dikembalikan?", {
          title: "Konfirmasi Pengembalian",
          confirmText: "Ya, kembalikan",
        });
        if (!ok) return;
        try {
          const itemId = button.dataset.itemId;
          const data = await api(`/api/loans/${id}/items/${itemId}/return`, { method: "POST" });
          setFlash(data.message || "Aset dikembalikan.", "success");
          await loadLoans();
        } catch (error) {
          setFlash(error.message, "error");
        }
        return;
      }

      if (button.dataset.action === "delete-loan") {
        if (!isAdmin()) {
          setFlash("Hanya admin yang bisa menghapus peminjaman.", "error");
          return;
        }
        const ok = await confirmDialog("Hapus data peminjaman ini?", {
          title: "Hapus Peminjaman",
          confirmText: "Hapus",
        });
        if (!ok) return;
        try {
          const data = await api(`/api/loans/${id}`, { method: "DELETE" });
          setFlash(data.message || "Peminjaman dihapus.", "success");
          await loadLoans();
        } catch (error) {
          setFlash(error.message, "error");
        }
      }
    });
  };

  const setupAssetsFilter = () => {
    if (!els.assetFilter) return;

    const applyFilter = () => {
      const form = els.assetFilter;
      state.assetFilter = {
        date_from: form.date_from.value,
        date_to: form.date_to.value,
        type_id: form.type_id.value,
        condition: form.condition.value,
      };
      state.assetPage = 1;
      loadAssets().catch((error) => {
        setFlash(error.message, "error");
      });
    };

    els.assetFilter.addEventListener("submit", (event) => {
      event.preventDefault();
      applyFilter();
    });

    els.assetFilterToggle?.addEventListener("click", () => {
      els.assetFilter.classList.toggle("active");
    });

    els.assetFilterReset?.addEventListener("click", () => {
      els.assetFilter.reset();
      state.assetFilter = { date_from: "", date_to: "", type_id: "", condition: "" };
      state.assetPage = 1;
      loadAssets().catch((error) => {
        setFlash(error.message, "error");
      });
    });

    els.assetPrev?.addEventListener("click", () => {
      if (state.assetPage <= 1) return;
      state.assetPage -= 1;
      loadAssets().catch((error) => {
        setFlash(error.message, "error");
      });
    });

    els.assetNext?.addEventListener("click", () => {
      if (!state.assetHasMore) return;
      state.assetPage += 1;
      loadAssets().catch((error) => {
        setFlash(error.message, "error");
      });
    });
  };

  const setupLoanFilter = () => {
    if (!els.loanFilter) return;

    const applyFilter = () => {
      const form = els.loanFilter;
      state.loanFilter = {
        date_from: form.date_from.value,
        date_to: form.date_to.value,
      };
      state.loanPage = 1;
      loadLoans().catch((error) => {
        setFlash(error.message, "error");
      });
    };

    els.loanFilter.addEventListener("submit", (event) => {
      event.preventDefault();
      applyFilter();
    });

    els.loanFilterToggle?.addEventListener("click", () => {
      els.loanFilter.classList.toggle("active");
    });

    els.loanFilterReset?.addEventListener("click", () => {
      els.loanFilter.reset();
      state.loanFilter = { date_from: "", date_to: "" };
      state.loanPage = 1;
      loadLoans().catch((error) => {
        setFlash(error.message, "error");
      });
    });

    els.loanPrev?.addEventListener("click", () => {
      if (state.loanPage <= 1) return;
      state.loanPage -= 1;
      loadLoans().catch((error) => {
        setFlash(error.message, "error");
      });
    });

    els.loanNext?.addEventListener("click", () => {
      if (!state.loanHasMore) return;
      state.loanPage += 1;
      loadLoans().catch((error) => {
        setFlash(error.message, "error");
      });
    });
  };

  const setupAuditFilter = () => {
    if (!els.auditFilter) return;
    const applyFilterFromForm = () => {
      const form = els.auditFilter;
      const payload = {
        user: form.user.value.trim(),
        action: form.action.value.trim(),
        date_from: form.date_from.value,
        date_to: form.date_to.value,
      };
      state.auditPage = 1;
      loadAuditLogs(payload).catch((error) => {
        setFlash(error.message, "error");
      });
    };

    els.auditFilter.addEventListener("submit", (event) => {
      event.preventDefault();
      applyFilterFromForm();
    });

    els.auditReset?.addEventListener("click", () => {
      els.auditFilter.reset();
      state.auditPage = 1;
      loadAuditLogs({
        user: "",
        action: "",
        date_from: "",
        date_to: "",
      }).catch((error) => {
        setFlash(error.message, "error");
      });
    });

    els.auditPrev?.addEventListener("click", () => {
      if (state.auditPage <= 1) return;
      state.auditPage -= 1;
      loadAuditLogs().catch((error) => {
        setFlash(error.message, "error");
      });
    });

    els.auditNext?.addEventListener("click", () => {
      if (!state.auditHasMore) return;
      state.auditPage += 1;
      loadAuditLogs().catch((error) => {
        setFlash(error.message, "error");
      });
    });
  };

  const setupQuickAssetForm = () => {
    if (!els.quickAssetForm) return;
    els.quickAssetForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const payload = {
        asset_code: els.quickAssetForm.asset_code.value.trim(),
        name: els.quickAssetForm.name.value.trim(),
        purchase_date: els.quickAssetForm.purchase_date.value,
        condition: els.quickAssetForm.condition.value.trim(),
        asset_type_id: Number(els.quickAssetForm.asset_type_id.value || 0),
        barcode: els.quickAssetForm.barcode.value.trim(),
      };

      if (!payload.asset_code || !payload.name || !payload.purchase_date || !payload.condition || payload.asset_type_id <= 0) {
        setFlash("Semua field aset wajib diisi.", "error");
        return;
      }

      try {
        const data = await api("/api/assets", { method: "POST", body: JSON.stringify(payload) });
        const assetID = data.asset?.id;
        if (assetID) {
          await uploadAssetPhoto(assetID, els.quickAssetForm?.photo?.files?.[0]);
        }
        setFlash(data.message || "Aset berhasil ditambahkan.", "success");
        els.quickAssetForm.reset();
        if (els.quickAssetForm.condition) {
          els.quickAssetForm.condition.value = "Baik";
        }
        if (els.quickAssetForm.asset_type_id) {
          els.quickAssetForm.asset_type_id.value = "";
        }
        if (els.quickAssetForm.purchase_date) {
          if (!els.quickAssetForm.purchase_date.value) {
            els.quickAssetForm.purchase_date.value = todayISO();
          }
          requestNextAssetCode(els.quickAssetForm.purchase_date.value, els.quickAssetForm.asset_code);
        }
        await loadAssets();
      } catch (error) {
        setFlash(error.message, "error");
      }
    });
  };

  const setupImportDialog = () => {
    if (!els.importModal || !els.importBackdrop || !els.importSubmit || !els.importFileInput) return;

    const IMPORT_ANIM_MS = 180;
    const importConfigs = {
      assets: {
        key: "assets",
        title: "Import CSV Manajemen Aset",
        hint: "Gunakan file hasil Export CSV dari menu Manajemen Aset.",
        endpoint: "/api/assets/import.csv",
      },
      types: {
        key: "types",
        title: "Import CSV Jenis Aset",
        hint: "Gunakan file hasil Export CSV dari menu Jenis Aset.",
        endpoint: "/api/asset-types/import.csv",
      },
      loans: {
        key: "loans",
        title: "Import CSV Peminjaman",
        hint: "Gunakan file hasil Export CSV dari menu Peminjaman.",
        endpoint: "/api/loans/import.csv",
      },
    };

    let activeImportConfig = null;
    let importUploading = false;

    const parseJSON = (raw) => {
      try {
        return JSON.parse(raw || "{}");
      } catch (_) {
        return {};
      }
    };

    const updateProgress = (percent) => {
      const value = Math.max(0, Math.min(100, Number(percent) || 0));
      if (els.importProgressFill) {
        els.importProgressFill.style.width = `${value}%`;
      }
      if (els.importProgressText) {
        els.importProgressText.textContent = `${Math.round(value)}%`;
      }
    };

    const resetImportForm = () => {
      if (els.importFileInput) {
        els.importFileInput.value = "";
      }
      if (els.importFileName) {
        els.importFileName.textContent = "Belum ada file dipilih.";
      }
      if (els.importProgress) {
        els.importProgress.hidden = true;
      }
      updateProgress(0);
    };

    const setImportBusy = (busy) => {
      importUploading = Boolean(busy);
      if (els.importSubmit) {
        els.importSubmit.disabled = importUploading;
        els.importSubmit.textContent = importUploading ? "Mengupload..." : "Upload";
      }
      if (els.importCancel) {
        els.importCancel.disabled = importUploading;
      }
      if (els.importClose) {
        els.importClose.disabled = importUploading;
      }
      if (els.importFileInput) {
        els.importFileInput.disabled = importUploading;
      }
    };

    const openImportModal = (key) => {
      if (!isAdmin()) {
        setFlash("Hanya admin yang bisa import CSV.", "error");
        return;
      }
      const config = importConfigs[key];
      if (!config) return;
      activeImportConfig = config;
      setImportBusy(false);
      resetImportForm();
      if (els.importTitle) {
        els.importTitle.textContent = config.title;
      }
      if (els.importHint) {
        els.importHint.textContent = config.hint;
      }
      els.importModal.hidden = false;
      els.importBackdrop.hidden = false;
      requestAnimationFrame(() => {
        els.importModal.classList.add("show");
        els.importBackdrop.classList.add("show");
      });
    };

    const closeImportModal = () => {
      if (importUploading) return;
      els.importModal.classList.remove("show");
      els.importBackdrop.classList.remove("show");
      setTimeout(() => {
        els.importModal.hidden = true;
        els.importBackdrop.hidden = true;
        activeImportConfig = null;
        resetImportForm();
      }, IMPORT_ANIM_MS);
    };

    const uploadCSVWithProgress = (endpoint, file, onProgress) =>
      new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", endpoint, true);
        xhr.withCredentials = true;
        const csrfToken = getCookie("rck_csrf");
        if (csrfToken) {
          xhr.setRequestHeader("X-CSRF-Token", csrfToken);
        }

        xhr.upload.onprogress = (event) => {
          if (!event.lengthComputable) return;
          const percent = (event.loaded / event.total) * 100;
          onProgress(percent);
        };

        xhr.onerror = () => reject(new Error("upload gagal, cek koneksi lalu coba lagi"));
        xhr.onload = () => {
          const data = parseJSON(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(data);
            return;
          }
          reject(new Error(data.error || "import gagal"));
        };

        const formData = new FormData();
        formData.append("file", file);
        xhr.send(formData);
      });

    const runImport = async () => {
      if (!isAdmin()) {
        setFlash("Hanya admin yang bisa import CSV.", "error");
        return;
      }
      if (!activeImportConfig) return;
      const file = els.importFileInput?.files?.[0];
      if (!file) {
        setFlash("Pilih file CSV terlebih dahulu.", "error");
        return;
      }

      if (els.importProgress) {
        els.importProgress.hidden = false;
      }
      updateProgress(0);
      setImportBusy(true);

      try {
        const data = await uploadCSVWithProgress(activeImportConfig.endpoint, file, (progress) => {
          updateProgress(progress);
        });
        updateProgress(100);
        setFlash(data.message || "Import selesai.", "success");

        setImportBusy(false);
        const importKey = activeImportConfig.key;
        closeImportModal();

        if (importKey === "assets") {
          await loadAssetTypes();
          await loadAssets();
        } else if (importKey === "types") {
          await loadAssetTypes();
        } else if (importKey === "loans") {
          await loadLoans();
        }
      } catch (error) {
        setImportBusy(false);
        setFlash(error.message || "Import gagal.", "error");
      }
    };

    els.importAssets?.addEventListener("click", () => openImportModal("assets"));
    els.importTypes?.addEventListener("click", () => openImportModal("types"));
    els.importLoans?.addEventListener("click", () => openImportModal("loans"));
    els.importCancel?.addEventListener("click", closeImportModal);
    els.importClose?.addEventListener("click", closeImportModal);
    els.importBackdrop?.addEventListener("click", closeImportModal);
    els.importModal.addEventListener("click", (event) => {
      if (event.target === els.importModal) {
        closeImportModal();
      }
    });
    els.importFileInput?.addEventListener("change", () => {
      const file = els.importFileInput.files?.[0];
      if (els.importFileName) {
        els.importFileName.textContent = file ? file.name : "Belum ada file dipilih.";
      }
    });
    els.importSubmit?.addEventListener("click", () => {
      runImport().catch((error) => {
        setImportBusy(false);
        setFlash(error.message || "Import gagal.", "error");
      });
    });

    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !els.importModal.hidden) {
        closeImportModal();
      }
    });
  };

  const setupExport = () => {
    if (els.exportAssets) {
      els.exportAssets.addEventListener("click", () => {
        if (!isAdmin()) {
          setFlash("Hanya admin yang bisa export CSV.", "error");
          return;
        }
        window.location.href = "/api/assets/export.csv";
      });
    }
    if (els.exportTypes) {
      els.exportTypes.addEventListener("click", () => {
        if (!isAdmin()) {
          setFlash("Hanya admin yang bisa export CSV.", "error");
          return;
        }
        window.location.href = "/api/asset-types/export.csv";
      });
    }
    if (els.exportLoans) {
      els.exportLoans.addEventListener("click", () => {
        if (!isAdmin()) {
          setFlash("Hanya admin yang bisa export CSV.", "error");
          return;
        }
        window.location.href = "/api/loans/export.csv";
      });
    }
  };

  const setupSSE = () => {
    if (typeof EventSource === "undefined") return;
    const pending = new Set();
    let timer = null;

    const flush = async () => {
      const types = Array.from(pending);
      pending.clear();
      timer = null;
      if (types.includes("all") || types.includes("company")) {
        await loadCompany();
      }
      if (types.includes("all") || types.includes("assets")) {
        if (state.assetPage === 1) {
          await loadAssets();
        }
      }
      if (types.includes("all") || types.includes("asset_types")) {
        await loadAssetTypes();
      }
      if (types.includes("all") || types.includes("loans")) {
        if (state.loanPage === 1) {
          await loadLoans();
        }
      }
      if (state.me?.role === "admin" && (types.includes("all") || types.includes("users"))) {
        await loadUsers();
      }
      if (state.me?.role === "admin" && (types.includes("all") || types.includes("audit"))) {
        if (state.auditPage === 1) {
          await loadAuditLogs();
        }
      }
    };

    const schedule = (type) => {
      pending.add(type);
      if (timer) return;
      timer = setTimeout(() => {
        flush().catch(() => {
        });
      }, 250);
    };

    const source = new EventSource("/api/events");
    source.onmessage = (event) => {
      if (!event.data) return;
      try {
        const payload = JSON.parse(event.data);
        if (payload?.type) schedule(payload.type);
      } catch (_) {
      }
    };
  };

  const setupBarcodeScanner = () => {
    if (!els.scanModal || !els.scanVideo || !els.scanStatus) return;
    let codeReader = null;
    const barcodeFormats = [
      "code_128",
      "ean_13",
      "ean_8",
      "code_39",
      "codabar",
      "itf",
      "upc_a",
      "upc_e",
      "qr_code",
      "data_matrix",
    ];
    const getCodeReader = () => {
      if (codeReader) return codeReader;
      const ZXingBrowser = window.ZXingBrowser;
      if (ZXingBrowser && ZXingBrowser.BrowserMultiFormatReader) {
        codeReader = new ZXingBrowser.BrowserMultiFormatReader();
      }
      return codeReader;
    };
    let activeInput = null;
    let controls = null;
    let mediaStream = null;
    let detectFrameID = 0;
    let nativeDetector = null;

    const showModal = () => {
      els.scanModal.classList.add("active");
      els.scanModal.setAttribute("aria-hidden", "false");
    };

    const hideModal = () => {
      els.scanModal.classList.remove("active");
      els.scanModal.setAttribute("aria-hidden", "true");
    };

    const stopCamera = () => {
      if (controls) {
        controls.stop();
        controls = null;
      }
      if (detectFrameID) {
        cancelAnimationFrame(detectFrameID);
        detectFrameID = 0;
      }
      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop());
        mediaStream = null;
      }
      if (els.scanVideo) {
        els.scanVideo.pause();
        els.scanVideo.srcObject = null;
      }
      nativeDetector = null;
    };

    const closeModal = () => {
      stopCamera();
      hideModal();
      activeInput = null;
    };

    const applyScannedValue = (value) => {
      if (!activeInput) return;
      activeInput.value = value || "";
      activeInput.dataset.auto = "0";
    };

    const startNativeCameraScan = async () => {
      if (!("BarcodeDetector" in window) || !navigator.mediaDevices?.getUserMedia) {
        return false;
      }
      try {
        nativeDetector = new window.BarcodeDetector({ formats: barcodeFormats });
      } catch (_) {
        nativeDetector = null;
        return false;
      }

      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
        });
        els.scanVideo.srcObject = mediaStream;
        await els.scanVideo.play();
      } catch (_) {
        mediaStream = null;
        nativeDetector = null;
        return false;
      }

      const tick = async () => {
        if (!nativeDetector || !mediaStream) return;
        try {
          const results = await nativeDetector.detect(els.scanVideo);
          if (results.length > 0) {
            const value = String(results[0].rawValue || "").trim();
            if (value) {
              applyScannedValue(value);
              closeModal();
              return;
            }
          }
        } catch (_) {
        }
        detectFrameID = requestAnimationFrame(tick);
      };

      detectFrameID = requestAnimationFrame(tick);
      return true;
    };

    const startCameraScan = async () => {
      if (!window.isSecureContext && location.hostname !== "localhost") {
        setFlash("Scan kamera butuh HTTPS.", "error");
        return;
      }
      stopCamera();
      els.scanStatus.textContent = "Arahkan kamera ke barcode.";

      const reader = getCodeReader();
      if (reader) {
        try {
          controls = await reader.decodeFromVideoDevice(null, els.scanVideo, (result, err) => {
            if (result) {
              applyScannedValue(String(result.text || "").trim());
              closeModal();
            } else if (err && err.name !== "NotFoundException") {
              els.scanStatus.textContent = "Barcode belum terbaca, arahkan kamera lebih dekat.";
            }
          });
          return;
        } catch (_) {
        }
      }

      const nativeStarted = await startNativeCameraScan();
      if (nativeStarted) {
        return;
      }

      // Fallback terakhir: buka kamera/file picker lalu decode dari foto.
      if (els.scanFile) {
        els.scanStatus.textContent = "Live scanner tidak tersedia. Gunakan foto barcode.";
        els.scanFile.value = "";
        els.scanFile.click();
        return;
      }

      setFlash("Kamera tidak tersedia atau izin ditolak.", "error");
    };

    const decodeImageFile = async (file) => {
      if (!file) return;
      els.scanStatus.textContent = "Memindai foto barcode...";

      // Prioritaskan decode di backend agar tetap jalan meski scanner browser tidak siap.
      try {
        const value = await decodeBarcodeFromPhoto(file);
        if (value) {
          applyScannedValue(value);
          closeModal();
          return;
        }
      } catch (_) {
      }

      const url = URL.createObjectURL(file);
      try {
        const reader = getCodeReader();
        if (reader) {
          const result = await reader.decodeFromImageUrl(url);
          applyScannedValue(String(result.text || "").trim());
          closeModal();
          return;
        }

        if ("BarcodeDetector" in window) {
          const img = new Image();
          img.src = url;
          await img.decode();
          const detector = new window.BarcodeDetector({ formats: barcodeFormats });
          const results = await detector.detect(img);
          if (results.length > 0) {
            applyScannedValue(String(results[0].rawValue || "").trim());
            closeModal();
            return;
          }
        }

        els.scanStatus.textContent = "Barcode tidak terdeteksi dari foto.";
      } catch (_) {
        els.scanStatus.textContent = "Barcode tidak terdeteksi dari foto.";
      } finally {
        URL.revokeObjectURL(url);
      }
    };

    els.scanClose.addEventListener("click", closeModal);
    els.scanModal.addEventListener("click", (event) => {
      if (event.target === els.scanModal) closeModal();
    });

    els.scanUseCamera?.addEventListener("click", () => {
      stopCamera();
      startCameraScan();
    });

    els.scanUpload?.addEventListener("click", () => {
      if (els.scanFile) {
        els.scanFile.value = "";
        els.scanFile.click();
      }
    });

    els.scanFile?.addEventListener("change", (event) => {
      const file = event.target?.files?.[0];
      decodeImageFile(file);
    });

    document.querySelectorAll(".scan-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const target = btn.dataset.scanTarget;
        const input =
          target === "quick" ? els.quickAssetForm?.barcode : els.assetForm?.barcode;
        if (!input) return;
        activeInput = input;
        els.scanStatus.textContent = "Pilih kamera atau upload foto barcode.";
        showModal();
      });
    });
  };

  const setupPhotoCameraButtons = () => {
    document.querySelectorAll(".photo-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const target = btn.dataset.photoTarget;
        const input =
          target === "quick" ? els.quickAssetForm?.photo : els.assetForm?.photo;
        if (!input) return;
        input.click();
      });
    });
  };

  const escapeHtml = (raw) =>
    String(raw)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

    const bootstrap = async () => {
      try {
        setupDrawer();
        setupMenu();
        setupScrollSpy();
        setupMobileAdd();
        setupLogout();
        setupConfirmDialog();
        setupAssetPhotoPreview();
        setupCompanyForm();
        setupCompanyMediaCrop();
        setupAutoAssetCodeInputs();
        setupTypes();
      setupUsers();
      setupAssets();
      setupAssetsFilter();
      setupLoanAssetSearch();
      setupLoans();
      setupLoanFilter();
      setupAuditFilter();
      setupQuickAssetForm();
      setupImportDialog();
      setupExport();
      setupBarcodeScanner();
      setupPhotoCameraButtons();

      await loadMe();
      await loadCompany();
      applyDefaultPurchaseDates();
      if (els.quickAssetForm?.purchase_date) {
        requestNextAssetCode(els.quickAssetForm.purchase_date.value, els.quickAssetForm.asset_code);
      }
      if (els.assetForm?.purchase_date) {
        requestNextAssetCode(els.assetForm.purchase_date.value, els.assetForm.asset_code);
      }
      await loadAssetTypes();
      await loadAssets();
      applyDefaultLoanDates();
      await loadLoans();
      if (state.me?.role === "admin") {
        await loadUsers();
        await loadAuditLogs();
      }
      setupSSE();

      activateSection("overview");
    } catch (error) {
      setFlash(error.message || "Gagal memuat data.", "error");
    }
  };

  bootstrap();
})();
