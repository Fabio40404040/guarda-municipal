const STORAGE_KEY = "guardaMunicipalNoticiasV1";
// Chave de identificação usada apenas como referência para o backend real, no futuro.
const AUTH_SESSION_KEY = "guardaMunicipalAdminSessionV1";
// A sessão do login fica só na memória da página (não usa sessionStorage/localStorage).
// Isso garante que o formulário de login sempre apareça de novo a cada carregamento
// da página ou nova tentativa de acesso ao painel — importante para a demonstração.
let adminSessionEmail = null;

// Credenciais fictícias apenas para demonstração da área administrativa.
// Quando o backend real for implementado, este login deve ser substituído
// por uma autenticação de verdade (ex.: chamada de API + token de sessão).
const DEMO_ADMIN_CREDENTIALS = {
  email: "admin@guardamunicipal.gov.br",
  password: "guarda2026"
};
const patrolImage = new URL("./imagens/DALL.E.webp", import.meta.url).href;
const trafficImage = new URL("./imagens/istockphoto-2156735637-1024x1024.jpg", import.meta.url).href;

const seedNews = [
  {
    id: "demo-1",
    title: "Guarda Municipal amplia patrulhamento preventivo em áreas públicas",
    category: "Operações",
    date: "2025-05-16",
    summary: "Rondas estratégicas reforçam a presença da Guarda em praças, escolas e equipamentos municipais.",
    content: "A Guarda Municipal ampliou o patrulhamento preventivo em áreas de grande circulação. A iniciativa fortalece a presença dos agentes em praças, escolas e equipamentos municipais, contribuindo para a proteção do patrimônio e para o atendimento mais próximo à população.\n\nAs equipes atuam de forma integrada e orientada pelas necessidades de cada região.",
    image: patrolImage,
    featured: true
  },
  {
    id: "demo-2",
    title: "Ação educativa orienta condutores para um trânsito mais seguro",
    category: "Campanhas",
    date: "2025-05-08",
    summary: "Atividade de conscientização levou informação e orientações de segurança viária à comunidade.",
    content: "Uma ação educativa reuniu agentes e moradores em uma atividade voltada à segurança no trânsito. Durante a mobilização, condutores e pedestres receberam orientações sobre convivência, atenção nas vias e atitudes preventivas.\n\nA iniciativa faz parte das atividades de apoio ao trânsito e educação cidadã realizadas pela instituição.",
    image: trafficImage,
    featured: false
  },
  {
    id: "demo-3",
    title: "Guarda comunitária fortalece diálogo com moradores",
    category: "Comunidade",
    date: "2025-04-29",
    summary: "Encontro aproxima equipes da população e apoia iniciativas locais de prevenção e cidadania.",
    content: "Representantes da Guarda Municipal participaram de um encontro comunitário para ouvir moradores e compartilhar orientações preventivas. O diálogo ajuda a identificar as necessidades locais e a construir ações mais próximas da realidade de cada bairro.\n\nA participação da comunidade é parte essencial de uma cidade mais segura e acolhedora.",
    image: "",
    featured: false
  }
];

const elements = {
  publicSite: document.querySelector("#public-site"),
  adminLogin: document.querySelector("#admin-login"),
  adminApp: document.querySelector("#admin-app"),
  newsGrid: document.querySelector("#news-grid"),
  publicEmpty: document.querySelector("#public-empty"),
  adminNewsList: document.querySelector("#admin-news-list"),
  recentNewsList: document.querySelector("#recent-news-list"),
  adminEmpty: document.querySelector("#admin-empty"),
  newsCardTemplate: document.querySelector("#news-card-template"),
  adminNewsTemplate: document.querySelector("#admin-news-template"),
  newsDialog: document.querySelector("#news-dialog"),
  confirmDialog: document.querySelector("#confirm-dialog"),
  newsForm: document.querySelector("#news-form"),
  editorPanel: document.querySelector("#editor-panel"),
  editorTitle: document.querySelector("#editor-title"),
  imageInput: document.querySelector("#news-image"),
  imagePreview: document.querySelector("#image-preview"),
  uploadPlaceholder: document.querySelector("#upload-placeholder"),
  removeImage: document.querySelector("#remove-image"),
  search: document.querySelector("#news-search"),
  categoryFilter: document.querySelector("#category-filter"),
  toast: document.querySelector("#toast"),
  toastMessage: document.querySelector("#toast-message"),
  menu: document.querySelector("#main-nav"),
  menuToggle: document.querySelector("#menu-toggle"),
  adminSidebar: document.querySelector(".admin-sidebar"),
  adminMenuToggle: document.querySelector("#admin-menu-toggle"),
  loginForm: document.querySelector("#admin-login-form"),
  loginEmail: document.querySelector("#login-email"),
  loginPassword: document.querySelector("#login-password"),
  loginError: document.querySelector("#login-error"),
  togglePassword: document.querySelector("#toggle-password"),
  adminLoginExit: document.querySelector("#admin-login-exit"),
  adminLogout: document.querySelector("#admin-logout"),
  adminUserInitials: document.querySelector("#admin-user-initials"),
  adminUserEmail: document.querySelector("#admin-user-email")
};

let newsItems = loadNews();
let currentImage = "";
let pendingDeleteId = null;
let showAllNews = false;
let toastTimer = null;

function cloneSeedNews() {
  return seedNews.map((item) => ({ ...item }));
}

function loadNews() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      const initial = cloneSeedNews();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }

    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return cloneSeedNews();
    return parsed.map((item) => {
      if (item.image === "/imagens/DALL.E.webp") return { ...item, image: patrolImage };
      if (item.image === "/imagens/istockphoto-2156735637-1024x1024.jpg") return { ...item, image: trafficImage };
      return item;
    });
  } catch {
    return cloneSeedNews();
  }
}

function saveNews() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newsItems));
    return true;
  } catch {
    showToast("O navegador está sem espaço. Tente usar uma imagem menor.");
    return false;
  }
}

function sortedNews(items = newsItems) {
  return [...items].sort((first, second) => {
    if (first.featured !== second.featured) return Number(second.featured) - Number(first.featured);
    return new Date(second.date) - new Date(first.date);
  });
}

function formatDate(dateString) {
  if (!dateString) return "Sem data";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(`${dateString}T12:00:00`)).replace(". de", "");
}

function showToast(message) {
  clearTimeout(toastTimer);
  elements.toastMessage.textContent = message;
  elements.toast.hidden = false;
  toastTimer = window.setTimeout(() => {
    elements.toast.hidden = true;
  }, 3600);
}

function renderPublicNews() {
  elements.newsGrid.replaceChildren();
  const visibleNews = showAllNews ? sortedNews() : sortedNews().slice(0, 3);
  elements.publicEmpty.hidden = visibleNews.length > 0;

  visibleNews.forEach((item) => {
    const fragment = elements.newsCardTemplate.content.cloneNode(true);
    const card = fragment.querySelector(".news-card");
    const button = fragment.querySelector(".news-card-action");
    const image = fragment.querySelector(".news-card-image");

    if (item.image) {
      image.src = item.image;
      image.alt = `Imagem de capa: ${item.title}`;
    } else {
      card.classList.add("no-image");
    }

    fragment.querySelector(".news-category").textContent = item.category;
    fragment.querySelector(".news-date").textContent = formatDate(item.date);
    fragment.querySelector(".news-date").dateTime = item.date;
    fragment.querySelector(".news-title").textContent = item.title;
    fragment.querySelector(".news-summary").textContent = item.summary;
    button.addEventListener("click", () => openNewsDialog(item));
    elements.newsGrid.append(fragment);
  });

  const showAllButton = document.querySelector("#show-all-news");
  showAllButton.hidden = newsItems.length <= 3;
  showAllButton.firstChild.nodeValue = showAllNews ? "Mostrar menos " : "Ver todas as notícias ";
}

function openNewsDialog(item) {
  const image = document.querySelector("#dialog-image");
  image.hidden = !item.image;
  image.src = item.image || "";
  image.alt = item.image ? `Imagem de capa: ${item.title}` : "";
  document.querySelector("#dialog-category").textContent = item.category;
  document.querySelector("#dialog-title").textContent = item.title;
  document.querySelector("#dialog-date").textContent = formatDate(item.date);
  document.querySelector("#dialog-date").dateTime = item.date;
  document.querySelector("#dialog-content").textContent = item.content;
  elements.newsDialog.showModal();
}

function renderAdminItem(item, container, compact = false) {
  const fragment = elements.adminNewsTemplate.content.cloneNode(true);
  const article = fragment.querySelector(".admin-news-item");
  const image = fragment.querySelector(".admin-item-image");
  const placeholder = fragment.querySelector(".admin-item-placeholder");

  if (item.image) {
    image.src = item.image;
    image.alt = "";
    placeholder.hidden = true;
  } else {
    image.hidden = true;
  }

  fragment.querySelector(".admin-item-category").textContent = item.category;
  fragment.querySelector(".admin-item-title").textContent = item.title;
  fragment.querySelector(".admin-item-date").textContent = `${item.featured ? "Destaque · " : ""}${formatDate(item.date)}`;
  fragment.querySelector(".admin-item-date").dateTime = item.date;

  fragment.querySelector(".edit-news").addEventListener("click", () => {
    if (compact) switchAdminSection("news");
    editNews(item.id);
  });
  fragment.querySelector(".delete-news").addEventListener("click", () => requestDelete(item.id));
  container.append(article);
}

function renderAdminNews() {
  const query = elements.search.value.trim().toLocaleLowerCase("pt-BR");
  const category = elements.categoryFilter.value;
  const filtered = sortedNews().filter((item) => {
    const matchesText = `${item.title} ${item.category}`.toLocaleLowerCase("pt-BR").includes(query);
    const matchesCategory = category === "all" || item.category === category;
    return matchesText && matchesCategory;
  });

  elements.adminNewsList.replaceChildren();
  filtered.forEach((item) => renderAdminItem(item, elements.adminNewsList));
  elements.adminEmpty.hidden = filtered.length > 0;

  elements.recentNewsList.replaceChildren();
  sortedNews().slice(0, 4).forEach((item) => renderAdminItem(item, elements.recentNewsList, true));

  document.querySelector("#stat-total").textContent = String(newsItems.length);
  document.querySelector("#stat-published").textContent = String(newsItems.length);
  document.querySelector("#stat-images").textContent = String(newsItems.filter((item) => item.image).length);
}

function renderAll() {
  renderPublicNews();
  renderAdminNews();
}

function isAdminAuthenticated() {
  return adminSessionEmail !== null;
}

function getAdminSessionEmail() {
  return adminSessionEmail || "";
}

function showPublicSite() {
  elements.adminLogin.hidden = true;
  elements.adminApp.hidden = true;
  elements.publicSite.hidden = false;
  document.body.classList.remove("admin-open");
  elements.adminSidebar.classList.remove("open");
  history.replaceState(null, "", `${location.pathname}${location.search}#inicio`);
  document.title = "Guarda Municipal | Proteção e cidadania";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function showAdminLogin() {
  elements.publicSite.hidden = true;
  elements.adminApp.hidden = true;
  elements.adminLogin.hidden = false;
  document.body.classList.remove("admin-open");
  history.replaceState(null, "", `${location.pathname}${location.search}#admin-login`);
  document.title = "Entrar no painel | Guarda Municipal";
  hideLoginError();
  window.scrollTo(0, 0);
  window.setTimeout(() => elements.loginEmail.focus(), 200);
}

function openAdminArea() {
  if (isAdminAuthenticated()) {
    showAdminDashboard();
  } else {
    showAdminLogin();
  }
}

function showAdminDashboard() {
  elements.adminLogin.hidden = true;
  elements.publicSite.hidden = true;
  elements.adminApp.hidden = false;
  document.body.classList.add("admin-open");
  history.replaceState(null, "", `${location.pathname}${location.search}#painel`);
  document.title = "Painel administrativo | Guarda Municipal";
  updateAdminUserBadge();
  switchAdminSection("dashboard");
  renderAdminNews();
  window.scrollTo(0, 0);
}

function updateAdminUserBadge() {
  const email = getAdminSessionEmail();
  const localPart = email.split("@")[0] || "admin";
  elements.adminUserInitials.textContent = localPart.slice(0, 2).toUpperCase();
  elements.adminUserEmail.textContent = email || "Acesso demonstrativo";
}

function hideLoginError() {
  elements.loginError.hidden = true;
  elements.loginError.textContent = "";
}

function showLoginError(message) {
  elements.loginError.textContent = message;
  elements.loginError.hidden = false;
}

function handleLoginSubmit(event) {
  event.preventDefault();
  const email = elements.loginEmail.value.trim().toLocaleLowerCase("pt-BR");
  const password = elements.loginPassword.value;

  const validEmail = email === DEMO_ADMIN_CREDENTIALS.email;
  const validPassword = password === DEMO_ADMIN_CREDENTIALS.password;

  if (!validEmail || !validPassword) {
    showLoginError("E-mail ou senha incorretos. Confira os dados de demonstração abaixo.");
    elements.loginPassword.value = "";
    elements.loginPassword.focus();
    return;
  }

  adminSessionEmail = email;
  elements.loginForm.reset();
  hideLoginError();
  showAdminDashboard();
  showToast("Login realizado com sucesso.");
}

function handleLogout() {
  adminSessionEmail = null;
  showAdminLogin();
}

function togglePasswordVisibility() {
  const isHidden = elements.loginPassword.type === "password";
  elements.loginPassword.type = isHidden ? "text" : "password";
  elements.togglePassword.setAttribute("aria-pressed", String(isHidden));
  elements.togglePassword.setAttribute("aria-label", isHidden ? "Ocultar senha" : "Mostrar senha");
  elements.togglePassword.innerHTML = "";
  const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  icon.setAttribute("class", "icon");
  icon.setAttribute("aria-hidden", "true");
  const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
  use.setAttributeNS("http://www.w3.org/1999/xlink", "href", isHidden ? "#icon-eye-off" : "#icon-eye");
  use.setAttribute("href", isHidden ? "#icon-eye-off" : "#icon-eye");
  icon.append(use);
  elements.togglePassword.append(icon);
}

function switchAdminSection(sectionName) {
  document.querySelectorAll("[data-section-panel]").forEach((panel) => {
    const active = panel.dataset.sectionPanel === sectionName;
    panel.classList.toggle("active", active);
    panel.hidden = !active;
  });

  document.querySelectorAll(".admin-nav-item").forEach((button) => {
    button.classList.toggle("active", button.dataset.adminSection === sectionName);
  });

  document.querySelector("#admin-page-title").textContent = sectionName === "news" ? "Notícias" : "Visão geral";
  elements.adminSidebar.classList.remove("open");
  elements.adminMenuToggle.setAttribute("aria-expanded", "false");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function todayValue() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now - offset).toISOString().slice(0, 10);
}

function updateImagePreview() {
  elements.imagePreview.hidden = !currentImage;
  elements.imagePreview.src = currentImage || "";
  elements.uploadPlaceholder.hidden = Boolean(currentImage);
  elements.removeImage.hidden = !currentImage;
}

function updateCounters() {
  document.querySelector("#title-count").textContent = String(document.querySelector("#news-title").value.length);
  document.querySelector("#summary-count").textContent = String(document.querySelector("#news-summary").value.length);
}

function resetEditor(focusTitle = false) {
  elements.newsForm.reset();
  document.querySelector("#news-id").value = "";
  document.querySelector("#news-date").value = todayValue();
  elements.editorTitle.textContent = "Nova notícia";
  currentImage = "";
  elements.imageInput.value = "";
  updateImagePreview();
  updateCounters();
  if (focusTitle) document.querySelector("#news-title").focus();
}

function openNewEditor() {
  switchAdminSection("news");
  resetEditor();
  elements.editorPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  window.setTimeout(() => document.querySelector("#news-title").focus(), 350);
}

function editNews(id) {
  const item = newsItems.find((news) => news.id === id);
  if (!item) return;

  document.querySelector("#news-id").value = item.id;
  document.querySelector("#news-title").value = item.title;
  document.querySelector("#news-category").value = item.category;
  document.querySelector("#news-date").value = item.date;
  document.querySelector("#news-summary").value = item.summary;
  document.querySelector("#news-content").value = item.content;
  document.querySelector("#news-featured").checked = Boolean(item.featured);
  currentImage = item.image || "";
  elements.editorTitle.textContent = "Editar notícia";
  updateImagePreview();
  updateCounters();
  elements.editorPanel.scrollIntoView({ behavior: "smooth", block: "start" });
}

function requestDelete(id) {
  pendingDeleteId = id;
  elements.confirmDialog.showModal();
}

function confirmDelete() {
  if (!pendingDeleteId) return;
  const nextNews = newsItems.filter((item) => item.id !== pendingDeleteId);
  const previousNews = newsItems;
  newsItems = nextNews;

  if (!saveNews()) {
    newsItems = previousNews;
    return;
  }

  if (document.querySelector("#news-id").value === pendingDeleteId) resetEditor();
  pendingDeleteId = null;
  elements.confirmDialog.close();
  renderAll();
  showToast("Notícia excluída do portal demonstrativo.");
}

function createId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return `news-${Date.now()}`;
}

function handleNewsSubmit(event) {
  event.preventDefault();
  const formData = new FormData(elements.newsForm);
  const id = formData.get("id") || createId();
  const item = {
    id,
    title: String(formData.get("title")).trim(),
    category: String(formData.get("category")),
    date: String(formData.get("date")),
    summary: String(formData.get("summary")).trim(),
    content: String(formData.get("content")).trim(),
    image: currentImage,
    featured: formData.get("featured") === "on"
  };
  const existingIndex = newsItems.findIndex((news) => news.id === id);
  const previousNews = newsItems;

  if (existingIndex >= 0) {
    newsItems = newsItems.map((news) => news.id === id ? item : news);
  } else {
    newsItems = [item, ...newsItems];
  }

  if (!saveNews()) {
    newsItems = previousNews;
    return;
  }

  renderAll();
  resetEditor();
  showToast(existingIndex >= 0 ? "Notícia atualizada com sucesso." : "Notícia publicada com sucesso.");
}

function processImage(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Selecione um arquivo de imagem válido."));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      reject(new Error("A imagem deve ter no máximo 5 MB."));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Não foi possível ler a imagem."));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("Não foi possível processar a imagem."));
      image.onload = () => {
        const maxWidth = 1920;
        const maxHeight = 1440;
        const scale = Math.min(1, maxWidth / image.naturalWidth, maxHeight / image.naturalHeight);
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        const context = canvas.getContext("2d");

        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = "high";
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/webp", 0.92));
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

async function handleImageSelection() {
  const file = elements.imageInput.files?.[0];
  if (!file) return;

  try {
    currentImage = await processImage(file);
    updateImagePreview();
    showToast("Imagem pronta para ser salva com a notícia.");
  } catch (error) {
    elements.imageInput.value = "";
    showToast(error.message);
  }
}

function closeDialogOnBackdrop(event) {
  const dialog = event.currentTarget;
  const rect = dialog.getBoundingClientRect();
  const outside = event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
  if (outside) dialog.close();
}

function restoreDemoContent() {
  const confirmed = window.confirm("Restaurar as notícias de demonstração? As alterações locais serão substituídas.");
  if (!confirmed) return;
  newsItems = cloneSeedNews();
  saveNews();
  resetEditor();
  renderAll();
  showToast("Conteúdo de demonstração restaurado.");
}

function bindEvents() {
  document.querySelector("#current-year").textContent = String(new Date().getFullYear());

  elements.menuToggle.addEventListener("click", () => {
    const open = elements.menu.classList.toggle("open");
    elements.menuToggle.setAttribute("aria-expanded", String(open));
  });

  elements.menu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      elements.menu.classList.remove("open");
      elements.menuToggle.setAttribute("aria-expanded", "false");
    });
  });

  document.querySelectorAll("#open-admin-top, #open-admin-footer").forEach((button) => button.addEventListener("click", openAdminArea));
  document.querySelector("#back-to-site").addEventListener("click", showPublicSite);
  elements.adminLogout.addEventListener("click", handleLogout);
  elements.adminLoginExit.addEventListener("click", showPublicSite);
  document.querySelector("#admin-login-brand").addEventListener("click", (event) => {
    event.preventDefault();
    showPublicSite();
  });
  elements.loginForm.addEventListener("submit", handleLoginSubmit);
  elements.togglePassword.addEventListener("click", togglePasswordVisibility);
  document.querySelector("#quick-new-post").addEventListener("click", openNewEditor);
  document.querySelector("#new-post-button").addEventListener("click", openNewEditor);
  document.querySelector("#show-all-news").addEventListener("click", () => {
    showAllNews = !showAllNews;
    renderPublicNews();
    if (!showAllNews) document.querySelector("#noticias").scrollIntoView({ behavior: "smooth" });
  });

  document.querySelectorAll("[data-admin-section]").forEach((button) => {
    button.addEventListener("click", () => switchAdminSection(button.dataset.adminSection));
  });

  elements.adminMenuToggle.addEventListener("click", () => {
    const open = elements.adminSidebar.classList.toggle("open");
    elements.adminMenuToggle.setAttribute("aria-expanded", String(open));
  });

  elements.newsForm.addEventListener("submit", handleNewsSubmit);
  elements.imageInput.addEventListener("change", handleImageSelection);
  elements.removeImage.addEventListener("click", () => {
    currentImage = "";
    elements.imageInput.value = "";
    updateImagePreview();
  });
  document.querySelector("#news-title").addEventListener("input", updateCounters);
  document.querySelector("#news-summary").addEventListener("input", updateCounters);
  document.querySelector("#cancel-edit").addEventListener("click", () => resetEditor());
  document.querySelector("#close-editor").addEventListener("click", () => resetEditor());
  elements.search.addEventListener("input", renderAdminNews);
  elements.categoryFilter.addEventListener("change", renderAdminNews);
  document.querySelector("#reset-demo").addEventListener("click", restoreDemoContent);

  document.querySelector("#confirm-delete").addEventListener("click", confirmDelete);
  document.querySelector("#cancel-delete").addEventListener("click", () => {
    pendingDeleteId = null;
    elements.confirmDialog.close();
  });

  document.querySelector("[data-close-dialog]").addEventListener("click", () => elements.newsDialog.close());
  elements.newsDialog.addEventListener("click", closeDialogOnBackdrop);
  elements.confirmDialog.addEventListener("click", closeDialogOnBackdrop);

  document.querySelector("#contact-form").addEventListener("submit", (event) => {
    event.preventDefault();
    event.currentTarget.reset();
    showToast("Mensagem registrada apenas para demonstração.");
  });

  document.querySelectorAll("[data-demo-link]").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      showToast("Documento demonstrativo. O arquivo poderá ser vinculado no backend.");
    });
  });

  window.addEventListener("hashchange", () => {
    if (location.hash === "#painel" && elements.adminApp.hidden) openAdminArea();
  });
}

bindEvents();
resetEditor();
renderAll();

// Todo novo carregamento começa no portal público, mesmo que o navegador
// tenha mantido uma rota administrativa da sessão anterior.
adminSessionEmail = null;
showPublicSite();

window.addEventListener("pageshow", (event) => {
  if (!event.persisted) return;
  adminSessionEmail = null;
  showPublicSite();
});
