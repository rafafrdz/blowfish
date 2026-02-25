const root = document.documentElement;
const sitePreference = root.getAttribute("data-default-appearance") || "light";
const autoAppearance = root.getAttribute("data-auto-appearance") === "true";
const appearanceStorageKey = "appearance";
const prefersDarkQuery = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;

function getUserPreference() {
  try {
    const preference = localStorage.getItem(appearanceStorageKey);
    if (preference === "light" || preference === "dark") {
      return preference;
    }
  } catch (_) {
    // Ignore storage failures (e.g. privacy mode restrictions)
  }
  return null;
}

function setUserPreference(preference) {
  try {
    localStorage.setItem(appearanceStorageKey, preference);
  } catch (_) {
    // Ignore storage failures (e.g. privacy mode restrictions)
  }
}

function clearUserPreference() {
  try {
    localStorage.removeItem(appearanceStorageKey);
  } catch (_) {
    // Ignore storage failures (e.g. privacy mode restrictions)
  }
}

function applyAppearance(targetAppearance) {
  root.classList.toggle("dark", targetAppearance === "dark");
}

function getSystemAppearance() {
  return prefersDarkQuery?.matches ? "dark" : "light";
}

function getTargetAppearance() {
  return root.classList.contains("dark") ? "dark" : "light";
}

function resolveAppearance() {
  const userPreference = getUserPreference();
  if (userPreference) {
    return userPreference;
  }
  if (autoAppearance) {
    return getSystemAppearance();
  }
  return sitePreference === "dark" ? "dark" : "light";
}

function syncAppearance(nextAppearance) {
  applyAppearance(nextAppearance);
  if (typeof updateMeta === "function") {
    updateMeta();
  }
  if (typeof updateMermaidTheme === "function") {
    updateMermaidTheme();
  }
  if (typeof updateLogo === "function") {
    updateLogo(nextAppearance);
  }
}

syncAppearance(resolveAppearance());

if (autoAppearance && prefersDarkQuery) {
  const applySystemChange = (event) => {
    if (getUserPreference()) {
      return;
    }
    syncAppearance(event.matches ? "dark" : "light");
  };

  if (typeof prefersDarkQuery.addEventListener === "function") {
    prefersDarkQuery.addEventListener("change", applySystemChange);
  } else if (typeof prefersDarkQuery.addListener === "function") {
    prefersDarkQuery.addListener(applySystemChange);
  }
}

// Mermaid dark mode support
var updateMermaidTheme = () => {
  if (typeof mermaid !== 'undefined') {
    const isDark = document.documentElement.classList.contains("dark");

    const mermaids = document.querySelectorAll('pre.mermaid');
    mermaids.forEach(e => {
      if (e.getAttribute('data-processed')) {
        // Already rendered, clean the processed attributes
        e.removeAttribute('data-processed');
        // Replace the rendered HTML with the stored text
        e.innerHTML = e.getAttribute('data-graph');
      } else {
        // First time, store the text
        e.setAttribute('data-graph', e.textContent);
      }
    });

    if (isDark) {
      initMermaidDark();
      mermaid.run();
    } else {
      initMermaidLight();
      mermaid.run();
    }
  }
}

window.addEventListener("DOMContentLoaded", (event) => {
  const switcher = document.getElementById("appearance-switcher");
  const switcherMobile = document.getElementById("appearance-switcher-mobile");

  // Initialize mermaid theme on page load
  updateMermaidTheme();

  if (typeof updateLogo === "function") {
    updateLogo(getTargetAppearance());
  }

  if (switcher) {
    switcher.addEventListener("click", () => {
      const targetAppearance = getTargetAppearance() === "dark" ? "light" : "dark";
      setUserPreference(targetAppearance);
      syncAppearance(targetAppearance);
    });
    switcher.addEventListener("contextmenu", (event) => {
      event.preventDefault();
      clearUserPreference();
      syncAppearance(resolveAppearance());
    });
  }
  if (switcherMobile) {
    switcherMobile.addEventListener("click", () => {
      const targetAppearance = getTargetAppearance() === "dark" ? "light" : "dark";
      setUserPreference(targetAppearance);
      syncAppearance(targetAppearance);
    });
    switcherMobile.addEventListener("contextmenu", (event) => {
      event.preventDefault();
      clearUserPreference();
      syncAppearance(resolveAppearance());
    });
  }
});


var updateMeta = () => {
  var elem, style;
  elem = document.querySelector('body');
  style = getComputedStyle(elem);
  document.querySelector('meta[name="theme-color"]').setAttribute('content', style.backgroundColor);
}

{{ if and (.Site.Params.Logo) (.Site.Params.SecondaryLogo) }}
{{ $primaryLogo := resources.Get .Site.Params.Logo }}
{{ $secondaryLogo := resources.Get .Site.Params.SecondaryLogo }}
{{ if and ($primaryLogo) ($secondaryLogo) }}
var updateLogo = (targetAppearance) => {
  var imgElems = document.querySelectorAll("img.logo");
  var logoContainers = document.querySelectorAll("span.logo");
  
  targetLogoPath = 
    targetAppearance == "{{ .Site.Params.DefaultAppearance }}" ?
    "{{ $primaryLogo.RelPermalink }}" : "{{ $secondaryLogo.RelPermalink }}"
  for (const elem of imgElems) {
    elem.setAttribute("src", targetLogoPath)
  }

  {{ if eq $primaryLogo.MediaType.SubType "svg" }}
  targetContent = 
    targetAppearance == "{{ .Site.Params.DefaultAppearance }}" ?
    `{{ $primaryLogo.Content | safeHTML }}` : `{{ $secondaryLogo.Content | safeHTML }}`
  for (const container of logoContainers) {
    container.innerHTML = targetContent;
  }
  {{ end }}
}
{{ end }}
{{- end }}

window.addEventListener("DOMContentLoaded", (event) => {
  const scroller = document.getElementById("top-scroller");
  const footer = document.getElementById("site-footer");
  if(scroller && footer && scroller.getBoundingClientRect().top > footer.getBoundingClientRect().top) {
    scroller.hidden = true;
  }
});
