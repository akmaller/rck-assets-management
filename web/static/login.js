(() => {
  const form = document.getElementById("login-form");
  const message = document.getElementById("login-message");
  const brandName = document.getElementById("brand-name");
  const brandLogo = document.getElementById("brand-logo");
  const faviconLink = document.getElementById("favicon-link");

  if (!form) return;

  const setMessage = (text, mode = "") => {
    message.textContent = text;
    message.className = `inline-message ${mode}`.trim();
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    setMessage("");

    const payload = {
      username: form.username.value.trim(),
      password: form.password.value,
    };

    if (!payload.username || !payload.password) {
      setMessage("Username dan password wajib diisi.", "error");
      return;
    }

    const submitButton = form.querySelector("button[type='submit']");
    submitButton.disabled = true;

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(data.error || "Login gagal.", "error");
        return;
      }

      setMessage("Login berhasil, mengarahkan ke dashboard...", "success");
      window.location.href = "/dashboard";
    } catch (error) {
      setMessage("Terjadi gangguan jaringan.", "error");
    } finally {
      submitButton.disabled = false;
    }
  });

  const loadPublicBranding = async () => {
    try {
      const response = await fetch("/api/settings/company/public");
      const data = await response.json();
      const setting = data.setting || {};
      if (setting.company_name && brandName) brandName.textContent = setting.company_name;
      if (setting.logo_url && brandLogo) brandLogo.src = setting.logo_url;
      if (setting.favicon_url && faviconLink) faviconLink.href = setting.favicon_url;
    } catch (_) {
      // ignore branding errors
    }
  };

  loadPublicBranding();
})();
