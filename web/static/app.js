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
    bottomNav: document.getElementById("mobile-bottom-nav"),
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
    printModal: document.getElementById("print-modal"),
    printBackdrop: document.getElementById("print-backdrop"),
    printPreview: document.getElementById("print-preview"),
    printClose: document.getElementById("print-close"),
    printDownload: document.getElementById("print-download"),
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
    scanTitle: document.getElementById("scan-title"),
    scanVideo: document.getElementById("scan-video"),
    scanClose: document.getElementById("scan-close"),
    scanStatus: document.getElementById("scan-status"),
    scanUseCamera: document.getElementById("scan-use-camera"),
    scanCapture: document.getElementById("scan-capture"),
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

  const syncModalState = () => {
    const modalActive = Boolean(
      document.querySelector(
        ".modal.show, .modal-backdrop.show, .scan-modal.active, .select-mobile-sheet.show, .select-mobile-backdrop.show",
      ),
    );
    document.body.classList.toggle("modal-open", modalActive);
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
      syncModalState();
    });
  };

  const closeConfirm = (result) => {
    if (!els.confirmModal || !els.confirmBackdrop) return;
    els.confirmModal.classList.remove("show");
    els.confirmBackdrop.classList.remove("show");
    syncModalState();
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
      syncModalState();
    });
  };

  const closeAssetPhotoPreview = () => {
    if (!els.assetPhotoModal || !els.assetPhotoBackdrop || !els.assetPhotoPreview) return;
    els.assetPhotoModal.classList.remove("show");
    els.assetPhotoBackdrop.classList.remove("show");
    syncModalState();
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

  const PRINT_MODAL_ANIM_MS = 180;
  let currentPrintURL = "";
  let currentPrintName = "";

  const buildPrintCanvas = (asset) => {
    const canvas = document.createElement("canvas");
    canvas.width = 700;
    canvas.height = 160;
    const ctx = canvas.getContext("2d");
    if (!ctx) return canvas;

    const companyName =
      state.company?.company_name ||
      els.sidebarBrandName?.textContent ||
      "Nama Perusahaan";
    const assetName = asset?.name || "Nama Aset";
    const assetCode = asset?.asset_code || "-";

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const qrSize = 150;
    const qrX = 6;
    const qrY = Math.round((canvas.height - qrSize) / 2);
    drawQRCode(ctx, assetCode, qrX, qrY, qrSize);

    const textX = qrX + qrSize + 10;
    const textWidth = canvas.width - textX - 10;

    ctx.fillStyle = "#111111";
    ctx.font = '600 28px "Space Grotesk", "Segoe UI", sans-serif';
    ctx.fillText(fitCanvasText(ctx, companyName, textWidth), textX, 46);

    ctx.font = '600 30px "Space Grotesk", "Segoe UI", sans-serif';
    ctx.fillText(fitCanvasText(ctx, assetName, textWidth), textX, 92);

    ctx.font = '700 34px "IBM Plex Mono", monospace';
    ctx.fillStyle = "#000000";
    ctx.fillText(fitCanvasText(ctx, assetCode, textWidth), textX, 136);

    return canvas;
  };

  const openPrintModal = (asset) => {
    if (!els.printModal || !els.printBackdrop || !els.printPreview) return;
    try {
      const canvas = buildPrintCanvas(asset);
      currentPrintURL = canvas.toDataURL("image/png");
      currentPrintName = `label-${asset?.asset_code || "aset"}.png`;
      els.printPreview.src = currentPrintURL;
      els.printPreview.alt = `Label ${asset?.asset_code || "Aset"}`;
      els.printModal.hidden = false;
      els.printBackdrop.hidden = false;
      requestAnimationFrame(() => {
        els.printModal.classList.add("show");
        els.printBackdrop.classList.add("show");
        syncModalState();
      });
    } catch (error) {
      setFlash(error?.message || "Gagal membuat QR label.", "error");
    }
  };

  const closePrintModal = () => {
    if (!els.printModal || !els.printBackdrop) return;
    els.printModal.classList.remove("show");
    els.printBackdrop.classList.remove("show");
    syncModalState();
    setTimeout(() => {
      els.printModal.hidden = true;
      els.printBackdrop.hidden = true;
      if (els.printPreview) {
        els.printPreview.src = "";
      }
      currentPrintURL = "";
      currentPrintName = "";
    }, PRINT_MODAL_ANIM_MS);
  };

  const downloadPrint = () => {
    if (!currentPrintURL) return;
    const link = document.createElement("a");
    link.href = currentPrintURL;
    link.download = currentPrintName || "label-aset.png";
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const setupPrintModal = () => {
    if (!els.printModal || !els.printBackdrop) return;
    els.printClose?.addEventListener("click", closePrintModal);
    els.printBackdrop.addEventListener("click", closePrintModal);
    els.printModal.addEventListener("click", (event) => {
      if (event.target === els.printModal) {
        closePrintModal();
      }
    });
    els.printDownload?.addEventListener("click", downloadPrint);
    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !els.printModal.hidden) {
        closePrintModal();
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

  let menuIndicator = null;
  const ensureMenuIndicator = () => {
    if (!els.menuNav) return null;
    if (menuIndicator && els.menuNav.contains(menuIndicator)) {
      return menuIndicator;
    }
    const indicator = document.createElement("span");
    indicator.className = "menu-indicator";
    indicator.setAttribute("aria-hidden", "true");
    els.menuNav.prepend(indicator);
    menuIndicator = indicator;
    return indicator;
  };

  const findActiveVisibleMenuLink = () => {
    if (!els.menuNav) return null;
    const links = Array.from(els.menuNav.querySelectorAll(".menu-link.active"));
    return links.find((link) => {
      if (!(link instanceof HTMLElement)) return false;
      if (link.style.display === "none") return false;
      if (window.getComputedStyle(link).display === "none") return false;
      return true;
    }) || null;
  };

  const syncMenuIndicator = () => {
    const indicator = ensureMenuIndicator();
    if (!indicator || !els.menuNav) return;
    const activeLink = findActiveVisibleMenuLink();
    if (!activeLink) {
      indicator.classList.remove("show");
      return;
    }

    const menuRect = els.menuNav.getBoundingClientRect();
    const linkRect = activeLink.getBoundingClientRect();
    const x = linkRect.left - menuRect.left;
    const y = linkRect.top - menuRect.top;
    indicator.style.width = `${Math.round(linkRect.width)}px`;
    indicator.style.height = `${Math.round(linkRect.height)}px`;
    indicator.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0)`;
    indicator.classList.add("show");
  };

  const queueMenuIndicatorSync = () => {
    requestAnimationFrame(() => {
      syncMenuIndicator();
    });
  };

  const setupMenuIndicator = () => {
    if (!els.menuNav) return;
    ensureMenuIndicator();
    queueMenuIndicatorSync();
    window.addEventListener("resize", queueMenuIndicatorSync);
    window.addEventListener("orientationchange", queueMenuIndicatorSync);
  };

  const CUSTOM_SELECT_MOBILE_BP = 980;
  const CUSTOM_SELECT_ANIM_MS = 180;
  const customSelectState = {
    instances: new Map(),
    activeDesktop: null,
    listenersBound: false,
    mobileOpen: false,
    mobileInstance: null,
    backdrop: null,
    sheet: null,
    title: null,
    list: null,
    close: null,
  };

  const isMobileSelectMode = () => window.innerWidth <= CUSTOM_SELECT_MOBILE_BP;

  const getSelectLabelText = (select) => {
    if (!(select instanceof HTMLSelectElement)) return "Pilih Opsi";
    const label = select.closest("label");
    if (!label) return "Pilih Opsi";
    const textNode = Array.from(label.childNodes).find(
      (node) => node.nodeType === Node.TEXT_NODE && String(node.textContent || "").trim() !== "",
    );
    const text = String(textNode?.textContent || "").trim();
    return text || "Pilih Opsi";
  };

  const getSelectedOptionText = (select) => {
    if (!(select instanceof HTMLSelectElement)) return "Pilih Opsi";
    const opt = select.options?.[select.selectedIndex];
    if (!opt) return "Pilih Opsi";
    return String(opt.textContent || opt.label || "Pilih Opsi").trim();
  };

  const closeDesktopSelect = (instance = customSelectState.activeDesktop) => {
    if (!instance) return;
    instance.wrapper.classList.remove("open");
    instance.trigger.setAttribute("aria-expanded", "false");
    if (customSelectState.activeDesktop === instance) {
      customSelectState.activeDesktop = null;
    }
  };

  const syncCustomSelectTrigger = (instance) => {
    const selectedText = getSelectedOptionText(instance.select);
    instance.trigger.textContent = selectedText;
    instance.trigger.classList.toggle("placeholder", instance.select.value === "");
    instance.trigger.disabled = Boolean(instance.select.disabled);
  };

  const applyCustomSelectValue = (instance, value) => {
    if (instance.select.disabled) return;
    const nextValue = String(value ?? "");
    if (instance.select.value !== nextValue) {
      instance.select.value = nextValue;
      instance.select.dispatchEvent(new Event("change", { bubbles: true }));
    }
    syncCustomSelectTrigger(instance);
    renderDesktopSelectOptions(instance);
  };

  const createCustomSelectOption = (instance, option, mode = "desktop") => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "custom-select-option";
    button.textContent = String(option.textContent || option.label || option.value || "").trim();
    button.dataset.value = option.value;
    button.disabled = Boolean(option.disabled);
    if (option.value === instance.select.value) {
      button.classList.add("selected");
    }
    if (option.value === "") {
      button.classList.add("placeholder");
    }
    button.addEventListener("click", () => {
      applyCustomSelectValue(instance, option.value);
      if (mode === "mobile") {
        closeMobileSelect();
      } else {
        closeDesktopSelect(instance);
      }
    });
    return button;
  };

  const renderDesktopSelectOptions = (instance) => {
    instance.menu.innerHTML = "";
    const options = Array.from(instance.select.options || []);
    options.forEach((option) => {
      instance.menu.appendChild(createCustomSelectOption(instance, option, "desktop"));
    });
  };

  const openDesktopSelect = (instance) => {
    if (instance.select.disabled) return;
    if (customSelectState.activeDesktop && customSelectState.activeDesktop !== instance) {
      closeDesktopSelect(customSelectState.activeDesktop);
    }
    instance.wrapper.classList.add("open");
    instance.trigger.setAttribute("aria-expanded", "true");
    customSelectState.activeDesktop = instance;
  };

  const ensureMobileSelectUI = () => {
    if (customSelectState.backdrop && customSelectState.sheet) {
      return;
    }

    const backdrop = document.createElement("div");
    backdrop.className = "select-mobile-backdrop";
    backdrop.hidden = true;

    const sheet = document.createElement("div");
    sheet.className = "select-mobile-sheet";
    sheet.hidden = true;

    const card = document.createElement("div");
    card.className = "select-mobile-card";

    const header = document.createElement("div");
    header.className = "select-mobile-header";

    const title = document.createElement("strong");
    title.className = "select-mobile-title";
    title.textContent = "Pilih Opsi";

    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "icon-btn select-mobile-close";
    closeBtn.setAttribute("aria-label", "Tutup pilihan");
    closeBtn.innerHTML = "<span></span><span></span>";

    const list = document.createElement("div");
    list.className = "select-mobile-list";

    header.appendChild(title);
    header.appendChild(closeBtn);
    card.appendChild(header);
    card.appendChild(list);
    sheet.appendChild(card);

    document.body.appendChild(backdrop);
    document.body.appendChild(sheet);

    customSelectState.backdrop = backdrop;
    customSelectState.sheet = sheet;
    customSelectState.title = title;
    customSelectState.list = list;
    customSelectState.close = closeBtn;

    backdrop.addEventListener("click", () => closeMobileSelect());
    closeBtn.addEventListener("click", () => closeMobileSelect());
    sheet.addEventListener("click", (event) => {
      if (event.target === sheet) {
        closeMobileSelect();
      }
    });
  };

  const closeMobileSelect = () => {
    if (!customSelectState.mobileOpen || !customSelectState.sheet || !customSelectState.backdrop) return;
    customSelectState.mobileOpen = false;
    customSelectState.mobileInstance = null;
    customSelectState.sheet.classList.remove("show");
    customSelectState.backdrop.classList.remove("show");
    document.body.classList.remove("select-mobile-open");
    syncModalState();
    setTimeout(() => {
      if (customSelectState.mobileOpen) return;
      customSelectState.sheet.hidden = true;
      customSelectState.backdrop.hidden = true;
      if (customSelectState.list) {
        customSelectState.list.innerHTML = "";
      }
    }, CUSTOM_SELECT_ANIM_MS);
  };

  const openMobileSelect = (instance) => {
    if (instance.select.disabled) return;
    ensureMobileSelectUI();
    if (!customSelectState.sheet || !customSelectState.backdrop || !customSelectState.list || !customSelectState.title) return;

    customSelectState.mobileInstance = instance;
    customSelectState.mobileOpen = true;
    customSelectState.title.textContent = getSelectLabelText(instance.select);
    customSelectState.list.innerHTML = "";

    const options = Array.from(instance.select.options || []);
    options.forEach((option) => {
      customSelectState.list.appendChild(createCustomSelectOption(instance, option, "mobile"));
    });

    customSelectState.backdrop.hidden = false;
    customSelectState.sheet.hidden = false;
    document.body.classList.add("select-mobile-open");
    requestAnimationFrame(() => {
      customSelectState.backdrop?.classList.add("show");
      customSelectState.sheet?.classList.add("show");
      syncModalState();
    });
  };

  const ensureCustomSelectInstance = (select) => {
    if (!(select instanceof HTMLSelectElement)) return null;
    if (customSelectState.instances.has(select)) {
      return customSelectState.instances.get(select);
    }
    if (select.closest(".custom-select")) {
      return null;
    }

    const wrapper = document.createElement("div");
    wrapper.className = "custom-select";
    select.parentNode?.insertBefore(wrapper, select);
    wrapper.appendChild(select);
    select.classList.add("custom-select-native");

    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "custom-select-trigger";
    trigger.setAttribute("aria-haspopup", "listbox");
    trigger.setAttribute("aria-expanded", "false");

    const menu = document.createElement("div");
    menu.className = "custom-select-menu";
    menu.setAttribute("role", "listbox");

    wrapper.appendChild(trigger);
    wrapper.appendChild(menu);

    const instance = {
      select,
      wrapper,
      trigger,
      menu,
    };

    trigger.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (isMobileSelectMode()) {
        closeDesktopSelect();
        openMobileSelect(instance);
        return;
      }
      if (instance.wrapper.classList.contains("open")) {
        closeDesktopSelect(instance);
        return;
      }
      openDesktopSelect(instance);
    });

    select.addEventListener("change", () => {
      syncCustomSelectTrigger(instance);
      renderDesktopSelectOptions(instance);
    });

    customSelectState.instances.set(select, instance);
    syncCustomSelectTrigger(instance);
    renderDesktopSelectOptions(instance);
    return instance;
  };

  const refreshCustomSelects = () => {
    const allSelects = Array.from(document.querySelectorAll("select"));
    allSelects.forEach((select) => {
      ensureCustomSelectInstance(select);
    });

    for (const [select, instance] of customSelectState.instances.entries()) {
      if (!select.isConnected) {
        closeDesktopSelect(instance);
        customSelectState.instances.delete(select);
        continue;
      }
      syncCustomSelectTrigger(instance);
      renderDesktopSelectOptions(instance);
    }
  };

  const queueCustomSelectRefresh = () => {
    requestAnimationFrame(() => {
      refreshCustomSelects();
    });
  };

  const setupCustomSelects = () => {
    refreshCustomSelects();
    if (customSelectState.listenersBound) return;

    document.addEventListener("click", (event) => {
      if (!customSelectState.activeDesktop) return;
      const active = customSelectState.activeDesktop;
      if (!active.wrapper.contains(event.target)) {
        closeDesktopSelect(active);
      }
    });

    window.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      if (customSelectState.mobileOpen) {
        closeMobileSelect();
        return;
      }
      closeDesktopSelect();
    });

    window.addEventListener("resize", () => {
      if (isMobileSelectMode()) {
        closeDesktopSelect();
      } else if (customSelectState.mobileOpen) {
        closeMobileSelect();
      }
      queueCustomSelectRefresh();
    });

    window.addEventListener("orientationchange", () => {
      closeDesktopSelect();
      if (customSelectState.mobileOpen) {
        closeMobileSelect();
      }
      queueCustomSelectRefresh();
    });

    window.addEventListener(
      "scroll",
      (event) => {
        const active = customSelectState.activeDesktop;
        if (!active) return;
        const target = event.target;
        if (target instanceof Node && active.wrapper.contains(target)) {
          return;
        }
        closeDesktopSelect(active);
      },
      { passive: true, capture: true },
    );

    customSelectState.listenersBound = true;
  };

  const getSectionLinks = () =>
    Array.from(document.querySelectorAll(".menu-link, .bottom-nav-item"));

  const setActiveLinks = (name) => {
    const links = getSectionLinks();
    links.forEach((link) => {
      const isActive = link.dataset.section === name;
      link.classList.toggle("active", isActive);
      if (isActive) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  };

  const activateSection = (name) => {
    setActiveLinks(name);
    els.panels.forEach((panel) => panel.classList.toggle("active", panel.id === `section-${name}`));
    queueMenuIndicatorSync();
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
    els.bottomNav?.addEventListener("click", (event) => {
      const button = event.target.closest(".bottom-nav-item");
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
      setActiveLinks(name);
      queueMenuIndicatorSync();
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
      const proceed = await confirmDialog("Yakin ingin keluar?", {
        title: "Konfirmasi Keluar",
        confirmText: "Keluar",
        cancelText: "Batal",
      });
      if (!proceed) return;
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
    queueMenuIndicatorSync();
    queueCustomSelectRefresh();
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
        syncModalState();
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
      syncModalState();
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
    queueCustomSelectRefresh();
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
    queueCustomSelectRefresh();
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
        queueCustomSelectRefresh();
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
                <button class="tiny-btn icon" data-action="print-asset" data-id="${asset.id}" aria-label="Unduh label aset" title="Unduh">
                  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 3v11"/>
                    <path d="M8 10.5 12 14.5 16 10.5"/>
                    <path d="M5 19h14"/>
                  </svg>
                </button>
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
    queueCustomSelectRefresh();
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

      if (button.dataset.action === "print-asset") {
        openPrintModal(asset);
        return;
      }

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
        queueCustomSelectRefresh();
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
        syncModalState();
      });
    };

    const closeLoanModal = () => {
      if (!els.loanModal || !els.loanBackdrop) return;
      els.loanModal.classList.remove("show");
      els.loanBackdrop.classList.remove("show");
      syncModalState();
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
      queueCustomSelectRefresh();
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
        queueCustomSelectRefresh();
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
        syncModalState();
      });
    };

    const closeImportModal = () => {
      if (importUploading) return;
      els.importModal.classList.remove("show");
      els.importBackdrop.classList.remove("show");
      syncModalState();
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
    let activePhotoInput = null;
    let mode = "barcode";
    let controls = null;
    let mediaStream = null;
    let detectFrameID = 0;
    let nativeDetector = null;
    let assistTimerID = 0;
    let assistBusy = false;
    let assistAttempt = 0;

    const isLocalHost =
      location.hostname === "localhost" ||
      location.hostname === "127.0.0.1" ||
      location.hostname === "::1";

    const cameraConstraintCandidates = [
      {
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30, max: 60 },
        },
        audio: false,
      },
      {
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 24, max: 30 },
        },
        audio: false,
      },
      {
        video: {
          facingMode: { ideal: "environment" },
        },
        audio: false,
      },
    ];

    const openCameraStream = async () => {
      if (!navigator.mediaDevices?.getUserMedia) return null;
      for (const constraints of cameraConstraintCandidates) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia(constraints);
          return stream;
        } catch (_) {
        }
      }
      return null;
    };

    const tuneCameraTrack = async () => {
      if (!mediaStream) return;
      const [track] = mediaStream.getVideoTracks();
      if (!track || typeof track.applyConstraints !== "function") return;
      if (typeof track.getCapabilities !== "function") return;
      try {
        const caps = track.getCapabilities();
        const advanced = [];
        if (Array.isArray(caps?.focusMode) && caps.focusMode.includes("continuous")) {
          advanced.push({ focusMode: "continuous" });
        }
        if (caps?.zoom && Number.isFinite(caps.zoom.max) && caps.zoom.max > 1) {
          advanced.push({ zoom: Math.min(2, caps.zoom.max) });
        }
        if (advanced.length > 0) {
          await track.applyConstraints({ advanced });
        }
      } catch (_) {
      }
    };

    const toBlob = (canvas, type = "image/jpeg", quality = 0.94) =>
      new Promise((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Gagal menyiapkan gambar."));
              return;
            }
            resolve(blob);
          },
          type,
          quality,
        );
      });

    const buildScanCanvases = (source, width, height) => {
      if (!source || !width || !height) return [];
      const variants = [
        { crop: 1, upscale: 1 },
        { crop: 0.82, upscale: 1.4 },
        { crop: 0.66, upscale: 1.9 },
        { crop: 0.5, upscale: 2.35 },
      ];

      return variants
        .map((variant) => {
          const cropW = Math.max(1, Math.round(width * variant.crop));
          const cropH = Math.max(1, Math.round(height * variant.crop));
          const sx = Math.max(0, Math.floor((width - cropW) / 2));
          const sy = Math.max(0, Math.floor((height - cropH) / 2));
          const outW = Math.min(2200, Math.max(360, Math.round(cropW * variant.upscale)));
          const outH = Math.min(2200, Math.max(360, Math.round(cropH * variant.upscale)));

          const canvas = document.createElement("canvas");
          canvas.width = outW;
          canvas.height = outH;
          const context = canvas.getContext("2d");
          if (!context) return null;
          context.imageSmoothingEnabled = false;
          context.drawImage(source, sx, sy, cropW, cropH, 0, 0, outW, outH);
          return canvas;
        })
        .filter(Boolean);
    };

    const decodeCanvasLocal = async (canvas) => {
      if (!canvas) return "";

      if ("BarcodeDetector" in window) {
        try {
          const detector = nativeDetector || new window.BarcodeDetector({ formats: barcodeFormats });
          const results = await detector.detect(canvas);
          if (results.length > 0) {
            const value = String(results[0].rawValue || "").trim();
            if (value) return value;
          }
        } catch (_) {
        }
      }

      const reader = getCodeReader();
      if (!reader) return "";
      let url = "";
      try {
        const blob = await toBlob(canvas);
        url = URL.createObjectURL(blob);
        const result = await reader.decodeFromImageUrl(url);
        const value = String(result?.text || "").trim();
        if (value) return value;
      } catch (_) {
      } finally {
        if (url) URL.revokeObjectURL(url);
      }

      return "";
    };

    const decodeCanvasServer = async (canvas) => {
      if (!canvas) return "";
      try {
        const blob = await toBlob(canvas);
        const file = new File([blob], `scan-${Date.now()}.jpg`, { type: "image/jpeg" });
        const value = await decodeBarcodeFromPhoto(file);
        return String(value || "").trim();
      } catch (_) {
        return "";
      }
    };

    const robustDecodeFromSource = async (source, width, height, options = {}) => {
      const canvases = buildScanCanvases(source, width, height);
      if (canvases.length === 0) return "";
      const allowServer = Boolean(options.allowServer);
      const serverLimit = Math.max(0, Number(options.serverLimit || 0));
      let serverTried = 0;

      for (const canvas of canvases) {
        const localValue = await decodeCanvasLocal(canvas);
        if (localValue) return localValue;

        if (allowServer && serverTried < serverLimit) {
          const serverValue = await decodeCanvasServer(canvas);
          serverTried += 1;
          if (serverValue) return serverValue;
        }
      }
      return "";
    };

    const stopAssistLoop = () => {
      if (assistTimerID) {
        clearInterval(assistTimerID);
        assistTimerID = 0;
      }
      assistBusy = false;
      assistAttempt = 0;
    };

    const startAssistLoop = () => {
      if (mode !== "barcode") return;
      stopAssistLoop();
      assistTimerID = window.setInterval(async () => {
        if (assistBusy) return;
        if (!els.scanModal.classList.contains("active")) return;
        if (!els.scanVideo || els.scanVideo.readyState < 2) return;
        if (!els.scanVideo.videoWidth || !els.scanVideo.videoHeight) return;

        assistBusy = true;
        try {
          assistAttempt += 1;
          const value = await robustDecodeFromSource(
            els.scanVideo,
            els.scanVideo.videoWidth,
            els.scanVideo.videoHeight,
            {
              allowServer: assistAttempt % 4 === 0,
              serverLimit: 1,
            },
          );
          if (value) {
            applyScannedValue(value);
            closeModal();
            return;
          }
          if (assistAttempt % 2 === 0) {
            els.scanStatus.textContent = "Belum terbaca. Dekatkan barcode dan tahan kamera tetap stabil.";
          }
        } finally {
          assistBusy = false;
        }
      }, 750);
    };

    const setCaptureButton = (visible, text = "Ambil Frame") => {
      if (!els.scanCapture) return;
      els.scanCapture.hidden = !visible;
      if (visible) {
        els.scanCapture.textContent = text;
      }
    };

    const setMode = (nextMode) => {
      mode = nextMode === "photo" ? "photo" : "barcode";
      if (els.scanTitle) {
        els.scanTitle.textContent = mode === "photo" ? "Ambil Foto Aset" : "Scan Barcode";
      }
      if (els.scanUseCamera) {
        els.scanUseCamera.textContent = "Gunakan Kamera";
      }
      if (els.scanUpload) {
        els.scanUpload.textContent = mode === "photo" ? "Pilih dari File" : "Upload Foto";
      }
      els.scanStatus.textContent =
        mode === "photo"
          ? "Klik Gunakan Kamera lalu Ambil Gambar, atau pilih file."
          : "Pilih kamera atau upload foto barcode.";
      setCaptureButton(false);
    };

    const showModal = () => {
      els.scanModal.classList.add("active");
      els.scanModal.setAttribute("aria-hidden", "false");
      syncModalState();
    };

    const hideModal = () => {
      els.scanModal.classList.remove("active");
      els.scanModal.setAttribute("aria-hidden", "true");
      syncModalState();
    };

    const stopCamera = () => {
      stopAssistLoop();
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
      activePhotoInput = null;
      setMode("barcode");
    };

    const applyScannedValue = (value) => {
      if (!activeInput) return;
      activeInput.value = value || "";
      activeInput.dataset.auto = "0";
    };

    const applyPhotoFile = (file) => {
      if (!activePhotoInput || !file) return false;
      if (typeof DataTransfer === "undefined") return false;
      const transfer = new DataTransfer();
      transfer.items.add(file);
      activePhotoInput.files = transfer.files;
      activePhotoInput.dispatchEvent(new Event("change", { bubbles: true }));
      return true;
    };

    const captureVideoFrameAsFile = () =>
      new Promise((resolve, reject) => {
        if (!els.scanVideo || els.scanVideo.readyState < 2 || !els.scanVideo.videoWidth || !els.scanVideo.videoHeight) {
          reject(new Error("Kamera belum siap."));
          return;
        }
        const canvas = document.createElement("canvas");
        canvas.width = els.scanVideo.videoWidth;
        canvas.height = els.scanVideo.videoHeight;
        const context = canvas.getContext("2d");
        if (!context) {
          reject(new Error("Gagal mengambil frame kamera."));
          return;
        }
        context.drawImage(els.scanVideo, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Gagal membuat gambar dari kamera."));
              return;
            }
            resolve(new File([blob], `camera-${Date.now()}.jpg`, { type: "image/jpeg" }));
          },
          "image/jpeg",
          0.92,
        );
      });

    const startCameraPreview = async () => {
      try {
        mediaStream = await openCameraStream();
        if (!mediaStream) {
          return false;
        }
        els.scanVideo.srcObject = mediaStream;
        await els.scanVideo.play();
        await tuneCameraTrack();
        return true;
      } catch (_) {
        mediaStream = null;
        return false;
      }
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
        mediaStream = await openCameraStream();
        if (!mediaStream) {
          nativeDetector = null;
          return false;
        }
        els.scanVideo.srcObject = mediaStream;
        await els.scanVideo.play();
        await tuneCameraTrack();
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
      if (!window.isSecureContext && !isLocalHost) {
        setFlash("Akses kamera butuh HTTPS.", "error");
        return;
      }
      stopCamera();
      setCaptureButton(false);

      if (mode === "photo") {
        els.scanStatus.textContent = "Menyalakan kamera...";
        const previewStarted = await startCameraPreview();
        if (previewStarted) {
          setCaptureButton(true, "Ambil Gambar");
          els.scanStatus.textContent = "Kamera aktif. Klik Ambil Gambar.";
          return;
        }
        els.scanStatus.textContent = "Kamera tidak tersedia atau izin ditolak. Gunakan pilih file.";
        return;
      }

      els.scanStatus.textContent = "Arahkan kamera ke barcode.";

      const reader = getCodeReader();
      if (reader) {
        const onResult = (result, err) => {
          if (result) {
            applyScannedValue(String(result.text || "").trim());
            closeModal();
          } else if (err && err.name !== "NotFoundException") {
            els.scanStatus.textContent = "Barcode belum terbaca, arahkan kamera lebih dekat.";
          }
        };
        try {
          if (typeof reader.decodeFromConstraints === "function") {
            controls = await reader.decodeFromConstraints(cameraConstraintCandidates[0], els.scanVideo, onResult);
          } else {
            controls = await reader.decodeFromVideoDevice(null, els.scanVideo, onResult);
          }
          await tuneCameraTrack();
          setCaptureButton(true, "Ambil Frame");
          startAssistLoop();
          return;
        } catch (_) {
          try {
            controls = await reader.decodeFromVideoDevice(null, els.scanVideo, onResult);
            await tuneCameraTrack();
            setCaptureButton(true, "Ambil Frame");
            startAssistLoop();
            return;
          } catch (_) {
          }
        }
      }

      const nativeStarted = await startNativeCameraScan();
      if (nativeStarted) {
        setCaptureButton(true, "Ambil Frame");
        startAssistLoop();
        return;
      }

      const previewStarted = await startCameraPreview();
      if (previewStarted) {
        setCaptureButton(true, "Ambil Frame");
        startAssistLoop();
        els.scanStatus.textContent = "Kamera aktif. Memindai barcode, atau klik Ambil Frame.";
        return;
      }

      els.scanStatus.textContent = "Kamera tidak tersedia atau izin ditolak. Gunakan upload foto.";
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
        const img = new Image();
        img.src = url;
        await img.decode();

        const value = await robustDecodeFromSource(
          img,
          img.naturalWidth || img.width,
          img.naturalHeight || img.height,
          { allowServer: true, serverLimit: 2 },
        );
        if (value) {
          applyScannedValue(value);
          closeModal();
          return;
        }

        els.scanStatus.textContent = "Barcode tidak terdeteksi dari foto. Coba fokus lebih dekat atau gunakan pencahayaan lebih terang.";
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

    els.scanCapture?.addEventListener("click", async () => {
      try {
        if (mode === "photo") {
          const frameFile = await captureVideoFrameAsFile();
          if (!applyPhotoFile(frameFile)) {
            setFlash("Browser tidak mendukung auto-fill file input. Silakan pilih dari file.", "error");
            return;
          }
          closeModal();
          return;
        }

        if (!els.scanVideo || els.scanVideo.readyState < 2 || !els.scanVideo.videoWidth || !els.scanVideo.videoHeight) {
          els.scanStatus.textContent = "Kamera belum siap.";
          return;
        }

        els.scanStatus.textContent = "Memindai frame kamera...";
        const value = await robustDecodeFromSource(
          els.scanVideo,
          els.scanVideo.videoWidth,
          els.scanVideo.videoHeight,
          { allowServer: true, serverLimit: 2 },
        );
        if (value) {
          applyScannedValue(value);
          closeModal();
          return;
        }

        els.scanStatus.textContent = "Barcode belum terbaca. Coba dekatkan barcode ke kamera.";
      } catch (error) {
        els.scanStatus.textContent = error.message || "Kamera belum siap.";
      }
    });

    els.scanUpload?.addEventListener("click", () => {
      if (els.scanFile) {
        els.scanFile.value = "";
        els.scanFile.click();
      }
    });

    els.scanFile?.addEventListener("change", (event) => {
      const file = event.target?.files?.[0];
      if (!file) return;
      if (mode === "photo") {
        if (!applyPhotoFile(file)) {
          setFlash("Gagal memasukkan foto ke form.", "error");
          return;
        }
        closeModal();
        return;
      }
      decodeImageFile(file);
    });

    document.querySelectorAll(".scan-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const target = btn.dataset.scanTarget;
        const input =
          target === "quick" ? els.quickAssetForm?.barcode : els.assetForm?.barcode;
        if (!input) return;
        activeInput = input;
        activePhotoInput = null;
        setMode("barcode");
        showModal();
      });
    });

    document.querySelectorAll(".photo-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const target = btn.dataset.photoTarget;
        const input =
          target === "quick" ? els.quickAssetForm?.photo : els.assetForm?.photo;
        if (!input) return;
        activeInput = null;
        activePhotoInput = input;
        setMode("photo");
        showModal();
        startCameraScan();
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

  const QRCode = (() => {
    const PAD0 = 0xec;
    const PAD1 = 0x11;
    const G15 = 0x0537;
    const G18 = 0x1f25;
    const G15_MASK = 0x5412;

    const QRMath = {
      glog: (n) => {
        if (n < 1) throw new Error(`glog(${n})`);
        return QRMath.LOG_TABLE[n];
      },
      gexp: (n) => {
        while (n < 0) n += 255;
        while (n >= 256) n -= 255;
        return QRMath.EXP_TABLE[n];
      },
      EXP_TABLE: new Array(256),
      LOG_TABLE: new Array(256),
    };

    for (let i = 0; i < 8; i += 1) {
      QRMath.EXP_TABLE[i] = 1 << i;
    }
    for (let i = 8; i < 256; i += 1) {
      QRMath.EXP_TABLE[i] =
        QRMath.EXP_TABLE[i - 4] ^
        QRMath.EXP_TABLE[i - 5] ^
        QRMath.EXP_TABLE[i - 6] ^
        QRMath.EXP_TABLE[i - 8];
    }
    for (let i = 0; i < 255; i += 1) {
      QRMath.LOG_TABLE[QRMath.EXP_TABLE[i]] = i;
    }

    const QRPolynomial = (num, shift) => {
      let offset = 0;
      while (offset < num.length && num[offset] === 0) offset += 1;
      const next = new Array(num.length - offset + shift);
      for (let i = 0; i < num.length - offset; i += 1) {
        next[i] = num[i + offset];
      }
      return {
        get: (index) => next[index],
        getLength: () => next.length,
        multiply: (e) => {
          const result = new Array(next.length + e.getLength() - 1).fill(0);
          for (let i = 0; i < next.length; i += 1) {
            for (let j = 0; j < e.getLength(); j += 1) {
              result[i + j] ^= QRMath.gexp(QRMath.glog(next[i]) + QRMath.glog(e.get(j)));
            }
          }
          return QRPolynomial(result, 0);
        },
        mod: (e) => {
          if (next.length - e.getLength() < 0) return QRPolynomial(next, 0);
          const ratio = QRMath.glog(next[0]) - QRMath.glog(e.get(0));
          const result = next.slice();
          for (let i = 0; i < e.getLength(); i += 1) {
            result[i] ^= QRMath.gexp(QRMath.glog(e.get(i)) + ratio);
          }
          return QRPolynomial(result, 0).mod(e);
        },
      };
    };

    const QRUtil = {
      getBCHTypeInfo: (data) => {
        let d = data << 10;
        while (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(G15) >= 0) {
          d ^= G15 << (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(G15));
        }
        return ((data << 10) | d) ^ G15_MASK;
      },
      getBCHTypeNumber: (data) => {
        let d = data << 12;
        while (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(G18) >= 0) {
          d ^= G18 << (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(G18));
        }
        return (data << 12) | d;
      },
      getBCHDigit: (data) => {
        let digit = 0;
        while (data !== 0) {
          digit += 1;
          data >>>= 1;
        }
        return digit;
      },
      getPatternPosition: (typeNumber) => {
        return QRUtil.PATTERN_POSITION_TABLE[typeNumber - 1];
      },
      getMask: (maskPattern, i, j) => {
        switch (maskPattern) {
          case 0: return (i + j) % 2 === 0;
          case 1: return i % 2 === 0;
          case 2: return j % 3 === 0;
          case 3: return (i + j) % 3 === 0;
          case 4: return (Math.floor(i / 2) + Math.floor(j / 3)) % 2 === 0;
          case 5: return ((i * j) % 2) + ((i * j) % 3) === 0;
          case 6: return (((i * j) % 2) + ((i * j) % 3)) % 2 === 0;
          case 7: return (((i + j) % 2) + ((i * j) % 3)) % 2 === 0;
          default: return false;
        }
      },
      getErrorCorrectPolynomial: (errorCorrectLength) => {
        let a = QRPolynomial([1], 0);
        for (let i = 0; i < errorCorrectLength; i += 1) {
          a = a.multiply(QRPolynomial([1, QRMath.gexp(i)], 0));
        }
        return a;
      },
      getLengthInBits: (mode, type) => {
        if (1 <= type && type < 10) {
          switch (mode) {
            case 1: return 10;
            case 2: return 9;
            case 4: return 8;
            default: return 8;
          }
        } else if (type < 27) {
          switch (mode) {
            case 1: return 12;
            case 2: return 11;
            case 4: return 16;
            default: return 16;
          }
        }
        switch (mode) {
          case 1: return 14;
          case 2: return 13;
          case 4: return 16;
          default: return 16;
        }
      },
      getLostPoint: (qrcode) => {
        const moduleCount = qrcode.getModuleCount();
        let lostPoint = 0;
        for (let row = 0; row < moduleCount; row += 1) {
          for (let col = 0; col < moduleCount; col += 1) {
            let sameCount = 0;
            const dark = qrcode.isDark(row, col);
            for (let r = -1; r <= 1; r += 1) {
              if (row + r < 0 || moduleCount <= row + r) continue;
              for (let c = -1; c <= 1; c += 1) {
                if (col + c < 0 || moduleCount <= col + c) continue;
                if (r === 0 && c === 0) continue;
                if (dark === qrcode.isDark(row + r, col + c)) sameCount += 1;
              }
            }
            if (sameCount > 5) lostPoint += 3 + sameCount - 5;
          }
        }
        for (let row = 0; row < moduleCount - 1; row += 1) {
          for (let col = 0; col < moduleCount - 1; col += 1) {
            let count = 0;
            if (qrcode.isDark(row, col)) count += 1;
            if (qrcode.isDark(row + 1, col)) count += 1;
            if (qrcode.isDark(row, col + 1)) count += 1;
            if (qrcode.isDark(row + 1, col + 1)) count += 1;
            if (count === 0 || count === 4) lostPoint += 3;
          }
        }
        for (let row = 0; row < moduleCount; row += 1) {
          for (let col = 0; col < moduleCount - 6; col += 1) {
            if (
              qrcode.isDark(row, col) &&
              !qrcode.isDark(row, col + 1) &&
              qrcode.isDark(row, col + 2) &&
              qrcode.isDark(row, col + 3) &&
              qrcode.isDark(row, col + 4) &&
              !qrcode.isDark(row, col + 5) &&
              qrcode.isDark(row, col + 6)
            ) {
              lostPoint += 40;
            }
          }
        }
        for (let col = 0; col < moduleCount; col += 1) {
          for (let row = 0; row < moduleCount - 6; row += 1) {
            if (
              qrcode.isDark(row, col) &&
              !qrcode.isDark(row + 1, col) &&
              qrcode.isDark(row + 2, col) &&
              qrcode.isDark(row + 3, col) &&
              qrcode.isDark(row + 4, col) &&
              !qrcode.isDark(row + 5, col) &&
              qrcode.isDark(row + 6, col)
            ) {
              lostPoint += 40;
            }
          }
        }
        let darkCount = 0;
        for (let col = 0; col < moduleCount; col += 1) {
          for (let row = 0; row < moduleCount; row += 1) {
            if (qrcode.isDark(row, col)) darkCount += 1;
          }
        }
        const ratio = Math.abs((100 * darkCount) / moduleCount / moduleCount - 50) / 5;
        lostPoint += ratio * 10;
        return lostPoint;
      },
      PATTERN_POSITION_TABLE: [
        [],
        [6, 18],
        [6, 22],
        [6, 26],
        [6, 30],
        [6, 34],
        [6, 22, 38],
        [6, 24, 42],
        [6, 26, 46],
        [6, 28, 50],
        [6, 30, 54],
        [6, 32, 58],
        [6, 34, 62],
        [6, 26, 46, 66],
        [6, 26, 48, 70],
        [6, 26, 50, 74],
        [6, 30, 54, 78],
        [6, 30, 56, 82],
        [6, 30, 58, 86],
        [6, 34, 62, 90],
      ],
    };

    const QRRSBlock = {
      getRSBlocks: (typeNumber, errorCorrectLevel) => {
        const rsBlock = QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + errorCorrectLevel];
        if (!rsBlock) throw new Error(`bad rs block @ typeNumber:${typeNumber} / errorCorrectLevel:${errorCorrectLevel}`);
        const list = [];
        for (let i = 0; i < rsBlock.length / 3; i += 1) {
          const count = rsBlock[i * 3];
          const totalCount = rsBlock[i * 3 + 1];
          const dataCount = rsBlock[i * 3 + 2];
          for (let j = 0; j < count; j += 1) {
            list.push({ totalCount, dataCount });
          }
        }
        return list;
      },
      RS_BLOCK_TABLE: [
        [1, 26, 19],
        [1, 26, 16],
        [1, 26, 13],
        [1, 26, 9],
        [1, 44, 34],
        [1, 44, 28],
        [1, 44, 22],
        [1, 44, 16],
        [1, 70, 55],
        [1, 70, 44],
        [2, 35, 17],
        [2, 35, 13],
        [1, 100, 80],
        [2, 50, 32],
        [2, 50, 24],
        [4, 25, 9],
        [1, 134, 108],
        [2, 67, 43],
        [2, 33, 15, 2, 34, 16],
        [2, 33, 11, 2, 34, 12],
        [2, 86, 68],
        [4, 43, 27],
        [4, 43, 19],
        [4, 43, 15],
      ],
    };

    const QRBitBuffer = () => {
      const buffer = [];
      let length = 0;
      return {
        get: (index) => {
          const bufIndex = Math.floor(index / 8);
          return ((buffer[bufIndex] >>> (7 - (index % 8))) & 1) === 1;
        },
        put: (num, lengthInBits) => {
          for (let i = 0; i < lengthInBits; i += 1) {
            const bit = ((num >>> (lengthInBits - i - 1)) & 1) === 1;
            const bufIndex = Math.floor(length / 8);
            if (buffer.length <= bufIndex) buffer.push(0);
            if (bit) buffer[bufIndex] |= 0x80 >>> (length % 8);
            length += 1;
          }
        },
        putBit: (bit) => {
          const bufIndex = Math.floor(length / 8);
          if (buffer.length <= bufIndex) buffer.push(0);
          if (bit) buffer[bufIndex] |= 0x80 >>> (length % 8);
          length += 1;
        },
        getLengthInBits: () => length,
        getBuffer: () => buffer,
      };
    };

    const QRCodeModel = (typeNumber, errorCorrectLevel) => {
      const modules = [];
      let moduleCount = 0;
      const dataCache = null;
      const dataList = [];

      const addData = (data) => {
        dataList.push({ mode: 4, data: String(data) });
      };

      const isDark = (row, col) => modules[row][col];

      const getModuleCount = () => moduleCount;

      const makeImpl = (test, maskPattern) => {
        moduleCount = typeNumber * 4 + 17;
        for (let row = 0; row < moduleCount; row += 1) {
          modules[row] = new Array(moduleCount).fill(null);
        }

        const setupPositionProbePattern = (row, col) => {
          for (let r = -1; r <= 7; r += 1) {
            if (row + r <= -1 || moduleCount <= row + r) continue;
            for (let c = -1; c <= 7; c += 1) {
              if (col + c <= -1 || moduleCount <= col + c) continue;
              if ((0 <= r && r <= 6 && (c === 0 || c === 6)) ||
                (0 <= c && c <= 6 && (r === 0 || r === 6)) ||
                (2 <= r && r <= 4 && 2 <= c && c <= 4)) {
                modules[row + r][col + c] = true;
              } else {
                modules[row + r][col + c] = false;
              }
            }
          }
        };

        setupPositionProbePattern(0, 0);
        setupPositionProbePattern(moduleCount - 7, 0);
        setupPositionProbePattern(0, moduleCount - 7);

        const setupTimingPattern = () => {
          for (let i = 8; i < moduleCount - 8; i += 1) {
            if (modules[i][6] === null) modules[i][6] = i % 2 === 0;
            if (modules[6][i] === null) modules[6][i] = i % 2 === 0;
          }
        };

        const setupPositionAdjustPattern = () => {
          const pos = QRUtil.getPatternPosition(typeNumber);
          for (let i = 0; i < pos.length; i += 1) {
            for (let j = 0; j < pos.length; j += 1) {
              const row = pos[i];
              const col = pos[j];
              if (modules[row][col] !== null) continue;
              for (let r = -2; r <= 2; r += 1) {
                for (let c = -2; c <= 2; c += 1) {
                  modules[row + r][col + c] =
                    r === -2 || r === 2 || c === -2 || c === 2 || (r === 0 && c === 0);
                }
              }
            }
          }
        };

        const setupTypeInfo = (testMode, maskPatternValue) => {
          const data = (errorCorrectLevel << 3) | maskPatternValue;
          const bits = QRUtil.getBCHTypeInfo(data);
          for (let i = 0; i < 15; i += 1) {
            const mod = !testMode && ((bits >> i) & 1) === 1;
            if (i < 6) {
              modules[i][8] = mod;
            } else if (i < 8) {
              modules[i + 1][8] = mod;
            } else {
              modules[moduleCount - 15 + i][8] = mod;
            }
          }
          for (let i = 0; i < 15; i += 1) {
            const mod = !testMode && ((bits >> i) & 1) === 1;
            if (i < 8) {
              modules[8][moduleCount - i - 1] = mod;
            } else if (i < 9) {
              modules[8][15 - i - 1 + 1] = mod;
            } else {
              modules[8][15 - i - 1] = mod;
            }
          }
          modules[moduleCount - 8][8] = !testMode;
        };

        const setupTypeNumber = (testMode) => {
          const bits = QRUtil.getBCHTypeNumber(typeNumber);
          for (let i = 0; i < 18; i += 1) {
            const mod = !testMode && ((bits >> i) & 1) === 1;
            modules[Math.floor(i / 3)][(i % 3) + moduleCount - 8 - 3] = mod;
            modules[(i % 3) + moduleCount - 8 - 3][Math.floor(i / 3)] = mod;
          }
        };

        setupTimingPattern();
        setupPositionAdjustPattern();
        setupTypeInfo(test, maskPattern);
        if (typeNumber >= 7) setupTypeNumber(test);

        const mapData = (data, maskPatternValue) => {
          let inc = -1;
          let row = moduleCount - 1;
          let bitIndex = 7;
          let byteIndex = 0;
          for (let col = moduleCount - 1; col > 0; col -= 2) {
            if (col === 6) col -= 1;
            while (true) {
              for (let c = 0; c < 2; c += 1) {
                if (modules[row][col - c] === null) {
                  let dark = false;
                  if (byteIndex < data.length) {
                    dark = ((data[byteIndex] >>> bitIndex) & 1) === 1;
                  }
                  const mask = QRUtil.getMask(maskPatternValue, row, col - c);
                  if (mask) dark = !dark;
                  modules[row][col - c] = dark;
                  bitIndex -= 1;
                  if (bitIndex === -1) {
                    byteIndex += 1;
                    bitIndex = 7;
                  }
                }
              }
              row += inc;
              if (row < 0 || moduleCount <= row) {
                row -= inc;
                inc = -inc;
                break;
              }
            }
          }
        };

        const createData = () => {
          const buffer = QRBitBuffer();
          dataList.forEach((entry) => {
            buffer.put(entry.mode, 4);
            buffer.put(entry.data.length, QRUtil.getLengthInBits(entry.mode, typeNumber));
            for (let i = 0; i < entry.data.length; i += 1) {
              buffer.put(entry.data.charCodeAt(i), 8);
            }
          });

          const rsBlocks = QRRSBlock.getRSBlocks(typeNumber, errorCorrectLevel);
          let totalDataCount = 0;
          rsBlocks.forEach((block) => {
            totalDataCount += block.dataCount;
          });

          if (buffer.getLengthInBits() > totalDataCount * 8) {
            throw new Error("data overflow");
          }

          if (buffer.getLengthInBits() + 4 <= totalDataCount * 8) {
            buffer.put(0, 4);
          }

          while (buffer.getLengthInBits() % 8 !== 0) {
            buffer.putBit(false);
          }

          while (buffer.getBuffer().length < totalDataCount) {
            buffer.put(PAD0, 8);
            if (buffer.getBuffer().length >= totalDataCount) break;
            buffer.put(PAD1, 8);
          }

          const data = buffer.getBuffer();
          let offset = 0;
          const dcdata = [];
          const ecdata = [];

          rsBlocks.forEach((block, r) => {
            const dcCount = block.dataCount;
            const ecCount = block.totalCount - dcCount;
            dcdata[r] = new Array(dcCount);
            for (let i = 0; i < dcdata[r].length; i += 1) {
              dcdata[r][i] = data[i + offset];
            }
            offset += dcCount;
            const rsPoly = QRUtil.getErrorCorrectPolynomial(ecCount);
            const rawPoly = QRPolynomial(dcdata[r], rsPoly.getLength() - 1);
            const modPoly = rawPoly.mod(rsPoly);
            ecdata[r] = new Array(rsPoly.getLength() - 1);
            for (let i = 0; i < ecdata[r].length; i += 1) {
              const modIndex = i + modPoly.getLength() - ecdata[r].length;
              ecdata[r][i] = modIndex >= 0 ? modPoly.get(modIndex) : 0;
            }
          });

          const totalCodeCount = rsBlocks.reduce((sum, block) => sum + block.totalCount, 0);
          const dataBuffer = [];
          for (let i = 0; i < rsBlocks[0].dataCount; i += 1) {
            for (let r = 0; r < rsBlocks.length; r += 1) {
              if (i < dcdata[r].length) dataBuffer.push(dcdata[r][i]);
            }
          }
          for (let i = 0; i < rsBlocks[0].totalCount - rsBlocks[0].dataCount; i += 1) {
            for (let r = 0; r < rsBlocks.length; r += 1) {
              if (i < ecdata[r].length) dataBuffer.push(ecdata[r][i]);
            }
          }
          return dataBuffer;
        };

        const data = dataCache || createData();
        mapData(data, maskPattern);
      };

      const make = () => {
        let bestMask = 0;
        let minLostPoint = 0;
        for (let i = 0; i < 8; i += 1) {
          makeImpl(true, i);
          const lostPoint = QRUtil.getLostPoint({ getModuleCount, isDark });
          if (i === 0 || minLostPoint > lostPoint) {
            minLostPoint = lostPoint;
            bestMask = i;
          }
        }
        makeImpl(false, bestMask);
      };

      return { addData, isDark, getModuleCount, make };
    };

    return {
      create: (text) => {
        const typeNumber = 4;
        const errorCorrectLevel = 1;
        const qr = QRCodeModel(typeNumber, errorCorrectLevel);
        qr.addData(text);
        qr.make();
        return qr;
      },
    };
  })();

  const fitCanvasText = (ctx, text, maxWidth) => {
    const safeText = String(text || "").trim();
    if (!safeText) return "-";
    if (ctx.measureText(safeText).width <= maxWidth) return safeText;
    let trimmed = safeText;
    while (trimmed.length > 0 && ctx.measureText(`${trimmed}...`).width > maxWidth) {
      trimmed = trimmed.slice(0, -1);
    }
    return trimmed ? `${trimmed}...` : safeText;
  };

  const drawQRCode = (ctx, text, x, y, size) => {
    const value = String(text || "").trim();
    if (!value) return;
    if (typeof window.qrcode !== "function") {
      throw new Error("Library QR belum siap. Coba ulangi beberapa detik lagi.");
    }

    const qr = window.qrcode(0, "M");
    qr.addData(value, "Byte");
    qr.make();

    const count = qr.getModuleCount();
    const quietModules = 4;
    const totalModules = count + quietModules * 2;
    const cell = Math.max(1, Math.floor(size / totalModules));
    const qrSize = totalModules * cell;
    const offsetX = x + Math.floor((size - qrSize) / 2);
    const offsetY = y + Math.floor((size - qrSize) / 2);

    ctx.fillStyle = "#fff";
    ctx.fillRect(x, y, size, size);
    ctx.fillStyle = "#000";
    for (let row = 0; row < count; row += 1) {
      for (let col = 0; col < count; col += 1) {
        if (qr.isDark(row, col)) {
          ctx.fillRect(
            offsetX + (col + quietModules) * cell,
            offsetY + (row + quietModules) * cell,
            cell,
            cell,
          );
        }
      }
    }
  };

    const bootstrap = async () => {
      try {
        setupDrawer();
        setupMenu();
        setupMenuIndicator();
        setupCustomSelects();
        setupScrollSpy();
        setupMobileAdd();
      setupLogout();
      setupConfirmDialog();
      setupAssetPhotoPreview();
      setupPrintModal();
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
