/**
 * INVITATION INTERACTIONS
 * -----------------------
 * This file controls the opening, music, scratch card, gallery, countdown,
 * reveal animations, and demo RSVP state. Client content lives in config.js.
 */
 
 document.addEventListener("contextmenu", (event) => {
  event.preventDefault();
});

document.addEventListener("dragstart", (event) => {
  if (event.target instanceof HTMLImageElement) {
    event.preventDefault();
  }
});

(function () {
  "use strict";

  const config = window.INVITATION_CONFIG;

  if (!config) {
    throw new Error("Invitation config was not loaded. Check assets/js/config.js.");
  }

  const select = (selector, root = document) => root.querySelector(selector);
  const selectAll = (selector, root = document) => [...root.querySelectorAll(selector)];

  function getValue(path) {
    return path.split(".").reduce(
      (value, key) => (value == null ? undefined : value[key]),
      config,
    );
  }

  // The built-in replaceChildren is missing on older iPhones (iOS 13 and below)
  function replaceChildren(element, ...children) {
    if (!element) return;
    while (element.firstChild) element.removeChild(element.firstChild);
    children.forEach((child) => {
      element.append(child);
    });
  }

  function createElement(tagName, className, text) {
    const element = document.createElement(tagName);

    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;

    return element;
  }

  function setName(element, fullName) {
    const [firstName, ...remainingNames] = fullName.split(" ");
    const firstNameElement = createElement("span", "", firstName);

    replaceChildren(element, firstNameElement, ` ${remainingNames.join(" ")}`);
  }

  function setWelcomeSignature(element) {
    replaceChildren(
      element,
      document.createTextNode(config.copy.welcomeSignature),
    );
  }

  function setCoupleNames(element) {
    replaceChildren(
      element,
      document.createTextNode(config.couple.bride.name.split(" ")[0]),
      document.createTextNode(" "),
      createElement("span", "", "&"),
      document.createTextNode(" "),
      document.createTextNode(config.couple.groom.name.split(" ")[0]),
    );
  }

  function applyConfig() {
    document.title = config.site.title;

    const description = select('meta[name="description"]');
    const ogTitle = select('meta[property="og:title"]');
    const ogDescription = select('meta[property="og:description"]');

    if (description) description.setAttribute("content", config.site.description);
    if (ogTitle) ogTitle.setAttribute("content", config.site.title);
    if (ogDescription) ogDescription.setAttribute("content", config.site.description);

    const root = document.documentElement;

Object.entries(config.theme).forEach(([name, value]) => {
  root.style.setProperty(`--${name}`, value);
});

    selectAll("[data-bind]").forEach((element) => {
      const value = getValue(element.dataset.bind);
      element.textContent = value == null ? "" : value;
    });

    setName(select("#brideName"), config.couple.bride.name);
    setName(select("#groomName"), config.couple.groom.name);
    setWelcomeSignature(select("#welcomeSignature"));
    setWelcomeSignature(select("#closingNames"));

    select("#closingDetails").textContent =
      `${config.wedding.date} · ${config.venue.shortAddress}`;

    const closingContacts = select("#closingContacts");
    const contactNumbers = (config.contacts || []).filter(Boolean);

    replaceChildren(
      closingContacts,
      ...contactNumbers.flatMap((number, index) => {
        const link = createElement("a", "", number);
        link.href = `tel:${number.replace(/\s+/g, "")}`;

        return index === 0 ? [link] : [document.createTextNode(" · "), link];
      }),
    );

    select("#mapLink").href = config.venue.mapUrl;

    const audio = select("#backgroundMusic");
    const video = select("#introVideo");
    const videoSource = select("#introVideoSource");

    audio.src = config.media.music;

    // The video and poster are already in index.html so they start loading
    // immediately. Only reload if config.js points somewhere else.
    if (config.media.introPoster && video.getAttribute("poster") !== config.media.introPoster) {
      video.poster = config.media.introPoster;
    }
    if (config.media.introVideo && videoSource.getAttribute("src") !== config.media.introVideo) {
      videoSource.src = config.media.introVideo;
      video.load();
    }

    renderProgram();
    renderPreWeddingEvents();
    renderDressPalette();
    renderGallery();
  }

  function renderProgram() {
    const timeline = select("#programTimeline");

    config.program.forEach((item, index) => {
      const article = createElement("article");
      const number = createElement(
        "span",
        "timeline-index",
        String(index + 1).padStart(2, "0"),
      );
      const time = createElement("time", "", item.time);
      const details = createElement("div");

      details.append(
        createElement("h3", "", item.title),
        createElement("p", "", item.note),
      );

      article.append(number, time, details);
      timeline.append(article);
    });
  }

function renderPreWeddingEvents() {
  const eventList = select("#preWeddingEvents");

  config.preWeddingEvents.forEach((event) => {
    const article = createElement("article");

    const title = createElement("h3", "", event.name);

    const dateTime = createElement("p");
    dateTime.innerHTML = `
      <span>${event.date}</span>
      <span>⬩</span>
      <span>${event.time}</span>
    `;

    const location = createElement("small", "", event.location);

    const mapLink = createElement(
      "a",
      "event-map-link",
      "View on Google Maps"
    );

    mapLink.href = event.mapLink;
    mapLink.target = "_blank";
    mapLink.rel = "noreferrer";

    article.append(
      title,
      dateTime,
      location,
      mapLink
    );

    eventList.append(article);
  });
}

  function renderDressPalette() {
    const palette = select("#dressPalette");

    config.dressCode.swatches.forEach((color, index) => {
      const swatch = createElement("i");
      swatch.style.background = color;
      swatch.style.setProperty("--swatch-delay", `${index * 0.08}s`);
      palette.append(swatch);
    });
  }
let activeSlide = 0;
let galleryTimer;
let touchStartX = 0;
let touchStartY = 0;

function renderGallery() {
  const slides = select("#gallerySlides");
  const dots = select("#galleryDots");

  config.media.gallery.forEach((image, index) => {
    const figure = createElement(
      "figure",
      `gallery-slide${index === 0 ? " is-active" : ""}`,
    );

    const photo = createElement("img");

    photo.src = image.src;
    photo.alt = image.alt;
    photo.loading = index === 0 ? "eager" : "lazy";

    figure.append(
      photo,
      createElement("figcaption", "", image.caption)
    );

    slides.append(figure);

    const dot = createElement(
      "button",
      index === 0 ? "is-active" : ""
    );

    dot.type = "button";
    dot.setAttribute("aria-label", `Show image ${index + 1}`);
    dot.addEventListener("click", () => showSlide(index));

    dots.append(dot);
  });

  const frame = select("#galleryFrame");

  frame.addEventListener("pointerdown", (event) => {
    touchStartX = event.clientX;
    touchStartY = event.clientY;
  });

  frame.addEventListener("pointerup", (event) => {
    const distanceX = touchStartX - event.clientX;
    const distanceY = touchStartY - event.clientY;

    /* Horizontal swipe */
    if (Math.abs(distanceX) >= 45) {
      showSlide(
        distanceX > 0
          ? (activeSlide + 1) % config.media.gallery.length
          : (activeSlide - 1 + config.media.gallery.length) %
              config.media.gallery.length
      );

      return;
    }

    /* Ignore vertical page scrolling */
    if (Math.abs(distanceY) > 20) return;

    /* Tap anywhere on image = next */
    showSlide(
      (activeSlide + 1) % config.media.gallery.length
    );
  });

  galleryTimer = window.setInterval(() => {
    showSlide(
      (activeSlide + 1) % config.media.gallery.length
    );
  }, 5200);
}

function showSlide(index) {
  activeSlide = index;

  selectAll(".gallery-slide").forEach((slide, slideIndex) => {
    slide.classList.toggle(
      "is-active",
      slideIndex === index
    );
  });

  selectAll("#galleryDots button").forEach((dot, dotIndex) => {
    dot.classList.toggle(
      "is-active",
      dotIndex === index
    );

    dot.toggleAttribute(
      "aria-current",
      dotIndex === index
    );
  });
} 
  function updateMusicControl() {
  const audio = select("#backgroundMusic");
  const button = select("#musicToggle");
  const label = select("#musicLabel");
  const playing = !audio.paused;

  button.classList.toggle("is-playing", playing);
  button.setAttribute(
    "aria-label",
    playing ? "Pause background music" : "Play background music",
  );
  label.textContent = playing ? "Music" : "Music";
}

  function initializeOpening() {
    const hero = select("#hero");
    const video = select("#introVideo");
    const reduceMotion =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let opened = false;
    let revealed = false;
    let safetyTimer;

    video.addEventListener("playing", () => {
      hero.classList.add("video-playing");
    });

    // Show the names. If the video didn't reach its last frame,
    // swap in the still image of that frame so the arch is always behind the text.
    function revealContent(videoFinished) {
      if (revealed) return;
      revealed = true;
      window.clearTimeout(safetyTimer);

      // Always switch to the still image of the last frame and stop the video.
      // On iPhones the browser drops a finished video's picture when it is
      // scrolled off screen and shows the "tap to open" poster again, which
      // then appeared behind the names after scrolling back up.
      hero.classList.add("show-still");
      try {
        video.pause();
        video.poster = "./intro-final.webp";
      } catch (error) {
        /* ignore */
      }
      // Then remove the video and the "tap to open" image from the page
      // completely, so no browser (Safari, Chrome, WhatsApp on iPhone) can
      // ever paint them again when scrolling back to the top.
      window.setTimeout(() => {
        hero.classList.add("video-done");
        const poster = hero.querySelector(".hero-poster");
        if (poster && poster.parentNode) poster.parentNode.removeChild(poster);
        try {
          video.removeAttribute("poster");
          while (video.firstChild) video.removeChild(video.firstChild);
          video.removeAttribute("src");
          video.load();
        } catch (error) {
          /* ignore */
        }
        if (video.parentNode) video.parentNode.removeChild(video);
      }, 900);

      hero.classList.add("is-revealed");
    }

    video.addEventListener("ended", () => revealContent(true));
    video.addEventListener("timeupdate", () => {
      if (video.duration && video.currentTime >= video.duration - 0.12) {
        revealContent(true);
      }
    });
    video.addEventListener("error", () => {
      if (opened) revealContent(false);
    });

    function openInvitation() {
      if (opened) return;

      opened = true;
      hero.classList.remove("is-closed");
      hero.classList.add("is-open");
      hero.removeAttribute("role");
      hero.removeAttribute("aria-label");
      hero.tabIndex = -1;
      select("#openingMark").setAttribute("aria-hidden", "true");
      document.body.classList.remove("intro-locked");

      const audio = select("#backgroundMusic");
      const musicPlay = audio.play();
      if (musicPlay && musicPlay.then) {
        musicPlay.then(updateMusicControl).catch(updateMusicControl);
      }

      if (reduceMotion) {
        revealContent(false);
        return;
      }

      // Never leave guests waiting: if the video is slow or blocked
      // (low-power mode, data saver, in-app browsers), show the card anyway.
      safetyTimer = window.setTimeout(() => revealContent(false), 11000);

      let playAttempt;
      try {
        playAttempt = video.play();
      } catch (error) {
        revealContent(false);
        return;
      }

      if (playAttempt && playAttempt.catch) {
        playAttempt.catch(() => revealContent(false));
      }
    }

    hero.addEventListener("click", openInvitation);
    hero.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") openInvitation();
    });

    select(".scroll-cue").addEventListener("click", (event) => {
      event.stopPropagation();
    });
  }

  // Keep the small text lines between the gold pillars on every screen.
  // The background video is 9:16 and fills the hero with object-fit: cover,
  // so its drawn width is max(heroWidth, heroHeight * 9/16). The space between
  // the pillars is ~62% of that (more once the intro zoom finishes);
  // we use 60%, which leaves a small gap on each side.
  function fitTextToArch() {
    const hero = select("#hero");
    if (!hero) return;

    // Keep the last two words together so a line never ends with one
    // lonely word (e.g. "OF" or "DUAS.") on its own.
    hero.querySelectorAll(".hero-welcome, .hero-closing").forEach((line) => {
      line.textContent = line.textContent.trim().replace(/ (\S+)$/, "\u00A0$1");
    });

    function update() {
      const rect = hero.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      // Phones use "cover" (picture fills the screen); wide screens use
      // "contain" (whole picture shown in the middle). See styles.css.
      const still = hero.querySelector(".hero-still");
      const fit = still ? getComputedStyle(still).objectFit : "cover";
      const tallWidth = rect.height * (720 / 1280);
      const drawnWidth =
        (fit === "contain"
          ? Math.min(rect.width, tallWidth)
          : Math.max(rect.width, tallWidth)) * 1.025;
      const textWidth = Math.round(drawnWidth * 0.6);
      hero.style.setProperty("--arch-text", textWidth + "px");
    }

    update();
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    window.addEventListener("load", update);
    hero.addEventListener("click", () => window.setTimeout(update, 50));
  }

  function initializeMusic() {
  const audio = select("#backgroundMusic");
  const button = select("#musicToggle");

  button.addEventListener("click", async (event) => {
    event.stopPropagation();

    if (audio.paused) {
      try {
        await audio.play();
      } catch (error) {
        // Playback can fail if the music file is missing.
      }
    } else {
      audio.pause();
    }

    updateMusicControl();
  });

  audio.addEventListener("play", updateMusicControl);
  audio.addEventListener("pause", updateMusicControl);

  // Stop the music when the guest leaves: switching apps, closing the tab,
  // locking the phone or going back to WhatsApp. Resume when they return,
  // but only if it was playing before (never if they paused it themselves).
  let resumeOnReturn = false;

  function pauseForBackground() {
    if (!audio.paused) {
      resumeOnReturn = true;
      audio.pause();
    }
  }

  // iPhones and in-app browsers can come back from another app (e.g. Google
  // Maps) with the music "playing" but silent. Reloading the track before
  // resuming gives it a fresh sound output. If the browser blocks playback,
  // the music starts again on the guest's next tap anywhere on the page.
  let waitingForTap = false;

  function resumeOnNextTap() {
    if (waitingForTap) return;
    waitingForTap = true;
    const onTap = (event) => {
      document.removeEventListener("touchend", onTap, true);
      document.removeEventListener("click", onTap, true);
      waitingForTap = false;
      // The music button handles its own tap.
      if (event.target.closest && event.target.closest("#musicToggle")) return;
      if (audio.paused) {
        const retry = audio.play();
        if (retry && retry.catch) retry.catch(updateMusicControl);
      }
    };
    document.addEventListener("touchend", onTap, true);
    document.addEventListener("click", onTap, true);
  }

  function restartAudio() {
    const time = audio.currentTime || 0;
    try {
      audio.pause();
      audio.load();
      const seek = () => {
        try {
          audio.currentTime = time;
        } catch (error) {
          /* ignore */
        }
      };
      if (audio.readyState >= 1) seek();
      else audio.addEventListener("loadedmetadata", seek, { once: true });
    } catch (error) {
      /* ignore */
    }
    let attempt;
    try {
      attempt = audio.play();
    } catch (error) {
      resumeOnNextTap();
      return;
    }
    if (attempt && attempt.then) {
      attempt.then(updateMusicControl).catch(() => {
        updateMusicControl();
        resumeOnNextTap();
      });
    }
  }

  function resumeFromBackground() {
    if (resumeOnReturn && document.visibilityState === "visible") {
      resumeOnReturn = false;
      restartAudio();
    }
  }

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") pauseForBackground();
    else resumeFromBackground();
  });
  document.addEventListener("webkitvisibilitychange", () => {
    if (document.webkitHidden) pauseForBackground();
  });
  window.addEventListener("pagehide", pauseForBackground);
  window.addEventListener("blur", () => {
    // Some in-app browsers only fire blur when the app goes to background.
    window.setTimeout(() => {
      if (document.visibilityState === "hidden") pauseForBackground();
    }, 300);
  });
  window.addEventListener("pageshow", resumeFromBackground);
  window.addEventListener("focus", resumeFromBackground);

  updateMusicControl();
}

  function initializeRevealAnimations() {
    const revealElements = selectAll(".reveal");

    if (
      !("IntersectionObserver" in window) ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      document.documentElement.classList.add("no-io");
      revealElements.forEach((element) => element.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.13 },
    );

    revealElements.forEach((element) => observer.observe(element));
  }

  function initializeScratchCard() {
    const canvas = select("#scratchCanvas");
    const card = select("#scratchCard");
    const heading = select("#scratchHeading");
    const note = select("#scratchNote");
    let drawing = false;
    let revealed = false;

    function prepareCanvas() {
  if (revealed || !canvas.isConnected) return;

  const rect = canvas.getBoundingClientRect();
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const context = canvas.getContext("2d", {
    willReadFrequently: true,
  });

  canvas.width = Math.round(rect.width * ratio);
  canvas.height = Math.round(rect.height * ratio);

  context.setTransform(ratio, 0, 0, ratio, 0, 0);

  const width = rect.width;
  const height = rect.height;

  /* =========================
     BURGUNDY BASE
     ========================= */

  const gradient = context.createLinearGradient(
    0,
    0,
    width,
    height,
  );

  gradient.addColorStop(0, config.theme.plum);
  gradient.addColorStop(0.45, config.theme.lavender);
  gradient.addColorStop(0.72, config.theme.mauve);
  gradient.addColorStop(1, config.theme.plum);

  context.globalCompositeOperation = "source-over";
  context.globalAlpha = 1;

  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);


  /* =========================
     SOFT METALLIC SHIMMER
     ========================= */

  const shimmer = context.createLinearGradient(
    0,
    0,
    width,
    height,
  );

  shimmer.addColorStop(0, "rgba(255,255,255,0)");
  shimmer.addColorStop(0.35, "rgba(255,235,190,0.07)");
  shimmer.addColorStop(0.5, "rgba(255,255,255,0.13)");
  shimmer.addColorStop(0.65, "rgba(255,220,160,0.06)");
  shimmer.addColorStop(1, "rgba(255,255,255,0)");

  context.fillStyle = shimmer;
  context.fillRect(0, 0, width, height);


  /* =========================
     FINE GOLD GLITTER
     ========================= */

  const glitterCount = Math.min(
    1100,
    Math.round((width * height) / 120),
  );

  for (let i = 0; i < glitterCount; i += 1) {
    const x = Math.random() * width;
    const y = Math.random() * height;

    const size = 0.25 + Math.random() * 1.15;
    const brightness = 0.15 + Math.random() * 0.55;

    context.globalAlpha = brightness;

    /*
      Mostly champagne,
      with occasional ivory sparkles.
    */
    context.fillStyle =
      Math.random() > 0.18
        ? config.theme.champagne
        : config.theme.ivory;

    context.beginPath();
    context.arc(
      x,
      y,
      size,
      0,
      Math.PI * 2,
    );
    context.fill();
  }


  /* =========================
     SMALL BRIGHT SPARKLES
     ========================= */

  const sparkleCount = Math.max(
    20,
    Math.round(width / 12),
  );

  for (let i = 0; i < sparkleCount; i += 1) {
    const x = Math.random() * width;
    const y = Math.random() * height;

    const size = 1 + Math.random() * 2.1;

    context.globalAlpha =
      0.3 + Math.random() * 0.5;

    context.strokeStyle =
      Math.random() > 0.25
        ? config.theme.champagne
        : config.theme.ivory;

    context.lineWidth = 0.55;

    context.beginPath();

    /* horizontal glint */
    context.moveTo(x - size, y);
    context.lineTo(x + size, y);

    /* vertical glint */
    context.moveTo(x, y - size);
    context.lineTo(x, y + size);

    context.stroke();
  }


  /* =========================
     VERY FINE TEXTURE
     ========================= */

  for (let i = 0; i < 350; i += 1) {
    const x = Math.random() * width;
    const y = Math.random() * height;

    context.globalAlpha =
      0.06 + Math.random() * 0.1;

    context.fillStyle = config.theme.ivory;

    context.fillRect(
      x,
      y,
      Math.random() * 0.7 + 0.15,
      Math.random() * 0.7 + 0.15,
    );
  }


  /* reset */
  context.globalAlpha = 1;


  /* =========================
     SCRATCHING MODE
     ========================= */

  context.globalCompositeOperation = "destination-out";

  context.lineCap = "round";
  context.lineJoin = "round";
  context.lineWidth = 42;
}

    function pointerPosition(event) {
      const rect = canvas.getBoundingClientRect();
      return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };
    }

    function beginScratch(event) {
      if (revealed) return;

      drawing = true;
      try {
        canvas.setPointerCapture(event.pointerId);
      } catch (error) {
        /* ignore */
      }

      const position = pointerPosition(event);
      const context = canvas.getContext("2d", { willReadFrequently: true });

      context.beginPath();
      context.moveTo(position.x, position.y);
    }

    function continueScratch(event) {
      if (!drawing || revealed) return;

      const position = pointerPosition(event);
      const context = canvas.getContext("2d", { willReadFrequently: true });

      context.lineTo(position.x, position.y);
      context.stroke();

      if (scratchCompletion(context) > 0.42) finishReveal();
    }

    function scratchCompletion(context) {
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
      let transparentSamples = 0;
      let totalSamples = 0;

      for (let alphaIndex = 3; alphaIndex < pixels.length; alphaIndex += 64) {
        totalSamples += 1;
        if (pixels[alphaIndex] < 30) transparentSamples += 1;
      }

      return transparentSamples / totalSamples;
    }

    function finishReveal() {
      if (revealed) return;

      revealed = true;
      drawing = false;

      // Keep both classes: is-revealed handles celebration styling, while
      // is-visible prevents the scroll-reveal animation from hiding the card.
      card.classList.add("is-revealed", "is-visible");
      heading.textContent = "Scratch to Reveal";
      note.textContent =
        "Save the date — we would be honoured to have you with us.";
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
      createPetalShower();
    }

    canvas.addEventListener("pointerdown", beginScratch);
    canvas.addEventListener("pointermove", continueScratch);
    canvas.addEventListener("pointerup", () => {
      drawing = false;
    });
    canvas.addEventListener("pointercancel", () => {
      drawing = false;
    });
    canvas.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") finishReveal();
    });

    // Mobile browsers fire "resize" while scrolling (the address bar hides/shows).
    // Only redraw the scratch layer when the width really changes,
    // otherwise half-scratched cards get covered again.
    let lastWidth = 0;
    function refreshCanvas() {
      const width = Math.round(canvas.getBoundingClientRect().width);
      if (!width || width === lastWidth) return;
      lastWidth = width;
      prepareCanvas();
    }

    // Very old browsers without pointer events: a tap reveals the date.
    if (!window.PointerEvent) {
      canvas.addEventListener("click", finishReveal);
    }

    refreshCanvas();
    window.addEventListener("resize", refreshCanvas);
    window.addEventListener("load", refreshCanvas);
  }

function createPetalShower() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  const oldShower = document.querySelector(".petal-shower");
  if (oldShower && oldShower.parentNode) oldShower.parentNode.removeChild(oldShower);

  const shower = createElement("div", "petal-shower");
  shower.setAttribute("aria-hidden", "true");

  const rootStyles = getComputedStyle(document.documentElement);

  const mauve =
    rootStyles.getPropertyValue("--mauve").trim() || "#A51520";

  const lavender =
    rootStyles.getPropertyValue("--lavender").trim() || "#6F0B17";

  const champagne =
    rootStyles.getPropertyValue("--champagne").trim() || "#C9A35F";

  const colors = [
    mauve,
    lavender,
    mauve,
    lavender,
    mauve,
    champagne,
  ];

  const shapes = [
    "80% 20% 70% 30% / 65% 35% 65% 35%",
    "70% 30% 85% 15% / 55% 45% 70% 30%",
    "90% 10% 60% 40% / 70% 30% 80% 20%",
    "60% 40% 75% 25% / 80% 20% 60% 40%",
  ];

  const random = (min, max) =>
    Math.random() * (max - min) + min;

  const randomItem = (items) =>
    items[Math.floor(Math.random() * items.length)];

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  const petalCount = Math.min(
    60,
    Math.max(38, Math.round(viewportWidth / 9)),
  );

  const petals = [];

  for (let index = 0; index < petalCount; index += 1) {
    const element = createElement("i");

    const size = random(7, 14);

    const x = random(-25, viewportWidth + 25);
    const y = random(-100, -25);

    const rotation = random(0, 360);
    const rotationX = random(0, 360);
    const rotationY = random(0, 360);

    const scale = random(0.65, 1.2);

    element.style.width = `${size}px`;
    element.style.height = `${size * random(1.2, 1.7)}px`;

    element.style.background = randomItem(colors);
    element.style.borderRadius = randomItem(shapes);

    /*
      Important:
      Put the petal in its real starting position BEFORE
      it gets inserted into the document.
    */
    element.style.opacity = "0";

    element.style.transform = `
      translate3d(${x}px, ${y}px, 0)
      rotate(${rotation}deg)
      rotateX(${rotationX}deg)
      rotateY(${rotationY}deg)
      scale(${scale})
    `;

    shower.append(element);

    petals.push({
      element,

      x,
      y,

      vx: random(-30, 30),
      vy: random(65, 120),

      gravity: random(12, 26),

      wind: random(-8, 8),

      sway: random(15, 55),
      swaySpeed: random(1.4, 3.5),
      swayPhase: random(0, Math.PI * 2),

      rotation,
      rotationX,
      rotationY,

      spin: random(-220, 220),
      spinX: random(-190, 190),
      spinY: random(-260, 260),

      scale,
      baseOpacity: random(0.55, 0.9),

      delay: random(0, 700),

      lifetime: random(5800, 8600),
    });
  }

  /*
    Append only after every petal already has
    its initial position and opacity.
  */
  document.body.append(shower);

  let startTime = null;
  let previousTime = null;

  function animate(currentTime) {
    if (startTime === null) {
      startTime = currentTime;
      previousTime = currentTime;
    }

    const elapsed = currentTime - startTime;

    const delta = Math.min(
      (currentTime - previousTime) / 1000,
      0.032,
    );

    previousTime = currentTime;

    petals.forEach((petal) => {
      /*
        Keep delayed petals completely invisible.
      */
      if (elapsed < petal.delay) {
        petal.element.style.opacity = "0";
        return;
      }

      const age = elapsed - petal.delay;

      if (age >= petal.lifetime) {
        petal.element.style.display = "none";
        return;
      }

      const time = age / 1000;

      petal.vy += petal.gravity * delta;

      petal.vx +=
        Math.sin(
          time * 0.75 + petal.swayPhase,
        ) *
        petal.wind *
        delta;

      petal.x += petal.vx * delta;
      petal.y += petal.vy * delta;

      petal.rotation += petal.spin * delta;
      petal.rotationX += petal.spinX * delta;
      petal.rotationY += petal.spinY * delta;

      const sway =
        Math.sin(
          time * petal.swaySpeed + petal.swayPhase,
        ) * petal.sway;

      const flutterY =
        Math.sin(
          time * petal.swaySpeed * 2.2 +
          petal.swayPhase,
        ) * 5;

      const flip =
        0.35 +
        Math.abs(
          Math.cos(
            time * petal.swaySpeed * 1.8 +
            petal.swayPhase,
          ),
        ) *
          0.65;

      /*
        Soft fade-in.
        Prevents petals popping into existence.
      */
      const fadeInDuration = 250;

      let opacity =
        petal.baseOpacity *
        Math.min(1, age / fadeInDuration);

      const fadeStart = viewportHeight * 0.82;

      if (petal.y > fadeStart) {
        const bottomFade =
          1 -
          (petal.y - fadeStart) /
            (viewportHeight + 100 - fadeStart);

        opacity *= Math.max(0, bottomFade);
      }

      if (age > petal.lifetime * 0.82) {
        const lifeFade =
          1 -
          (age - petal.lifetime * 0.82) /
            (petal.lifetime * 0.18);

        opacity *= Math.max(0, lifeFade);
      }

      petal.element.style.opacity =
        Math.max(0, opacity);

      petal.element.style.transform = `
        translate3d(
          ${petal.x + sway}px,
          ${petal.y + flutterY}px,
          0
        )
        rotate(${petal.rotation}deg)
        rotateX(${petal.rotationX}deg)
        rotateY(${petal.rotationY}deg)
        scale(${petal.scale})
        scaleX(${flip})
      `;

      if (petal.y > viewportHeight + 120) {
        petal.element.style.display = "none";
      }
    });

    if (elapsed < 10000) {
      requestAnimationFrame(animate);
    } else {
      shower.remove();
    }
  }

  requestAnimationFrame(animate);
}

  function initializeCountdown() {
    const targetDate = new Date(config.wedding.isoDate).getTime();

    function updateCountdown() {
      const difference = Math.max(0, targetDate - Date.now());
      const values = {
        countdownDays: Math.floor(difference / 86400000),
        countdownHours: Math.floor((difference / 3600000) % 24),
        countdownMinutes: Math.floor((difference / 60000) % 60),
        countdownSeconds: Math.floor((difference / 1000) % 60),
      };

      Object.entries(values).forEach(([id, value]) => {
        select(`#${id}`).textContent = String(value).padStart(2, "0");
      });
    }

    updateCountdown();
    window.setInterval(updateCountdown, 1000);
  }

  function prepareRsvpFields() {
    select("#rsvpName").placeholder = config.rsvp.fields.name;
    select("#rsvpEmail").placeholder = config.rsvp.fields.email;
    select("#rsvpNote").placeholder = config.rsvp.fields.note;

    const attendance = select("#rsvpAttendance");
    const prompt = createElement("option", "", "Select your response");

    prompt.value = "";
    prompt.disabled = true;
    prompt.selected = true;
    attendance.append(prompt);

    config.rsvp.fields.attendance.forEach((option) => {
      attendance.append(createElement("option", "", option));
    });

    const guests = select("#rsvpGuests");

    config.rsvp.fields.guests.forEach((option) => {
      guests.append(createElement("option", "", option));
    });
  }

  function initializeRsvp() {
    const form = select("#rsvpForm");
    const success = select("#rsvpSuccess");

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      form.hidden = true;
      success.hidden = false;
      success.classList.add("is-visible");
    });

    select("#editRsvp").addEventListener("click", () => {
      success.hidden = true;
      form.hidden = false;
    });
  }

  function initialize() {
    applyConfig();
    initializeOpening();
    fitTextToArch();
    initializeMusic();
    initializeRevealAnimations();
    initializeScratchCard();
    initializeCountdown();
  }

  document.addEventListener("DOMContentLoaded", initialize);
})();
