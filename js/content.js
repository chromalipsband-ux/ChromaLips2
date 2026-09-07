/**
 * Loads editable site content from data/*.json and fills page shells.
 * Shared chrome (tagline, marquee, Bandcamp follow, footer) runs on every page.
 */
(function () {
  var DATA = "data/";

  function fetchJson(path) {
    return fetch(path + (path.indexOf("?") >= 0 ? "&" : "?") + "t=" + Date.now(), {
      cache: "no-store"
    }).then(function (res) {
      if (!res.ok) throw new Error(path + " " + res.status);
      return res.json();
    });
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function formatInline(text) {
    // Allow **bold** markers from JSON; escape everything else.
    var parts = String(text).split(/\*\*/);
    var out = "";
    for (var i = 0; i < parts.length; i++) {
      out += i % 2 === 1 ? "<strong>" + escapeHtml(parts[i]) + "</strong>" : escapeHtml(parts[i]);
    }
    return out;
  }

  function nl2brEscaped(text) {
    return escapeHtml(text).replace(/\n/g, "<br>");
  }

  function resolveUrl(social, urlKey) {
    if (!social || !urlKey) return "";
    return social[urlKey] || "";
  }

  function applyChrome(site, social) {
    var tagline = document.querySelector(".tagline");
    if (tagline && site.tagline) tagline.textContent = site.tagline;

    var marquee = document.querySelector(".marquee-wrap marquee");
    if (marquee && site.marquee) {
      var gap =
        "\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0";
      marquee.textContent = site.marquee + gap + site.marquee;
    }

    var iframe = document.querySelector(".bc-follow iframe");
    if (iframe && social.bandcampFollowId) {
      iframe.src =
        "https://bandcamp.com/band_follow_button_classic/" + encodeURIComponent(social.bandcampFollowId);
    }

    var footer = document.querySelector(".site-footer");
    if (footer) {
      var copy = footer.querySelector("p");
      if (copy) {
        var year = site.copyrightYear || new Date().getFullYear();
        var name = site.bandName || "Chroma Lips";
        var email = social.email || "";
        copy.innerHTML =
          "&copy; " +
          escapeHtml(String(year)) +
          " " +
          escapeHtml(name) +
          (email ? " · " + escapeHtml(email) : "");
      }
      var note = footer.querySelector(".footer-note");
      if (note && site.footerNote) note.textContent = site.footerNote;
    }
  }

  function renderHome(site) {
    var home = site.home;
    if (!home) return;

    var hero = document.querySelector(".hero-banner img");
    if (hero) {
      if (home.heroImage) hero.src = home.heroImage;
      if (home.heroAlt) hero.alt = home.heroAlt;
    }

    var headline = document.querySelector("[data-home-headline]");
    if (headline && home.headline) {
      headline.innerHTML =
        '<span class="blink">★</span> ' +
        escapeHtml(home.headline) +
        ' <span class="blink">★</span>';
    }

    var body = document.querySelector("[data-home-body]");
    if (body && home.bodyHtml) body.innerHTML = home.bodyHtml;
  }

  function renderListen(site, social) {
    var platforms = document.querySelector("[data-listen-platforms]");
    if (platforms && social.listen && social.listen.length) {
      platforms.innerHTML = "";
      social.listen.forEach(function (item) {
        var url = item.url || resolveUrl(social, item.urlKey) || "#";
        var a = document.createElement("a");
        a.className = "media-card listen-platform";
        a.href = url;
        a.target = "_blank";
        a.rel = "noopener";
        a.setAttribute("aria-label", "Play on " + item.name);
        a.innerHTML =
          '<img src="' +
          escapeHtml(item.image) +
          '" alt="' +
          escapeHtml(item.alt || "") +
          '">' +
          '<span class="listen-platform-name"><span class="listen-play" aria-hidden="true">▶</span> ' +
          escapeHtml(item.name) +
          "</span>";
        platforms.appendChild(a);
      });
    }

    var listen = site.listen;
    if (!listen) return;
    var heading = document.querySelector("[data-listen-heading]");
    if (heading && listen.heading) heading.textContent = listen.heading;
    var body = document.querySelector("[data-listen-body]");
    if (body && listen.bodyHtml) body.innerHTML = listen.bodyHtml;
  }

  function renderLive(site, social) {
    var live = site.live || {};
    var intro = document.querySelector("[data-live-intro]");
    if (intro && live.intro) intro.textContent = live.intro;

    var diceBtn = document.querySelector("[data-live-dice]");
    if (diceBtn) {
      if (social.dice) diceBtn.href = social.dice;
      if (live.diceButtonLabel) diceBtn.textContent = live.diceButtonLabel;
    }

    if (live.emptyMessage) {
      window.CHROMA_LIVE_EMPTY = live.emptyMessage;
    }
  }

  function renderMerch(merch, social) {
    if (!merch) return;
    var heading = document.querySelector("[data-merch-heading]");
    if (heading && merch.heading) heading.textContent = merch.heading;

    var blurb = document.querySelector("[data-merch-blurb]");
    if (blurb && merch.blurb) blurb.innerHTML = nl2brEscaped(merch.blurb);

    var storeUrl = social.bandcampMerch || "#";
    var storeBtn = document.querySelector("[data-merch-store]");
    if (storeBtn) {
      storeBtn.href = storeUrl;
      if (merch.storeLabel) storeBtn.textContent = merch.storeLabel;
    }

    var showcase = document.querySelector("[data-merch-items]");
    if (!showcase || !merch.items) return;
    showcase.innerHTML = "";
    merch.items.forEach(function (item) {
      var a = document.createElement("a");
      a.className = "media-card";
      a.href = item.url || storeUrl;
      a.target = "_blank";
      a.rel = "noopener";
      if (item.label) a.setAttribute("aria-label", item.label);
      a.innerHTML =
        '<img src="' +
        escapeHtml(item.image) +
        '" alt="' +
        escapeHtml(item.alt || "") +
        '">';
      showcase.appendChild(a);
    });
  }

  function renderVideos(site, social) {
    var videos = site.videos;
    if (!videos) return;

    var intro = document.querySelector("[data-videos-intro]");
    if (intro && videos.intro) intro.textContent = videos.intro;

    var channelBtn = document.querySelector("[data-videos-channel]");
    if (channelBtn) {
      if (social.youtube) channelBtn.href = social.youtube;
      if (videos.channelButtonLabel) channelBtn.textContent = videos.channelButtonLabel;
    }

    var showcase = document.querySelector("[data-videos-items]");
    if (!showcase || !videos.items) return;
    var channel = social.youtube || "#";
    var label = videos.cardLabel || "Watch on YouTube";
    showcase.innerHTML = "";
    videos.items.forEach(function (item) {
      var a = document.createElement("a");
      a.className = "media-card";
      a.href = item.url || channel;
      a.target = "_blank";
      a.rel = "noopener";
      a.style.textDecoration = "none";
      a.style.color = "inherit";
      a.innerHTML =
        '<img src="' +
        escapeHtml(item.image) +
        '" alt="' +
        escapeHtml(item.alt || "") +
        '">' +
        '<span style="font-family:\'Comic Sans MS\',\'Comic Sans\',\'Comic Neue\',sans-serif;font-size:12px;color:var(--lime);">' +
        escapeHtml(label) +
        "</span>";
      showcase.appendChild(a);
    });
  }

  function renderGallery(gallery) {
    if (!gallery) return;
    var intro = document.querySelector("[data-gallery-intro]");
    if (intro && gallery.intro) {
      intro.innerHTML =
        '<span class="blink">★</span> ' +
        escapeHtml(gallery.intro) +
        ' <span class="blink">★</span>';
    }

    var grid = document.querySelector("[data-gallery-grid]");
    if (!grid || !gallery.photos) return;
    grid.innerHTML = "";
    gallery.photos.forEach(function (photo) {
      var cell = document.createElement("div");
      var sizeClass = "";
      if (photo.size === "hero") sizeClass = " photo-cell--hero";
      else if (photo.size === "wide") sizeClass = " photo-cell--wide";
      cell.className = "photo-cell" + sizeClass;
      cell.innerHTML =
        '<img src="' +
        escapeHtml(photo.src) +
        '" alt="' +
        escapeHtml(photo.alt || "") +
        '">';
      grid.appendChild(cell);
    });
  }

  function renderAbout(site, social) {
    var about = site.about;
    var panel = document.querySelector("[data-about-panel]");
    if (!about || !panel || !about.sections) return;

    panel.innerHTML = "";
    about.sections.forEach(function (section) {
      var h3 = document.createElement("h3");
      var headingText = escapeHtml(section.heading || "");
      if (section.headingLink && section.headingLink.label) {
        var href = section.headingLink.url || resolveUrl(social, section.headingLink.urlKey) || "#";
        var linkLabel = escapeHtml(section.headingLink.label);
        var linkHtml =
          '<a href="' +
          escapeHtml(href) +
          '" target="_blank" rel="noopener">' +
          linkLabel +
          "</a>";
        if (section.headingLink.quoted) {
          h3.innerHTML = headingText + ' "' + linkHtml + '"';
        } else {
          h3.innerHTML = headingText + " " + linkHtml;
        }
      } else {
        h3.textContent = section.heading || "";
      }
      panel.appendChild(h3);

      (section.paragraphs || []).forEach(function (para) {
        var p = document.createElement("p");
        p.innerHTML = formatInline(para);
        panel.appendChild(p);
      });
    });
  }

  function renderContact(site, social) {
    var contact = site.contact;
    if (!contact) return;

    var bookingHeading = document.querySelector("[data-contact-booking-heading]");
    if (bookingHeading) {
      bookingHeading.textContent = String(contact.bookingLabel || "Booking").replace(/:\s*$/, "");
    }

    var booking = document.querySelector("[data-contact-booking]");
    if (booking) {
      var email = social.email || "";
      booking.innerHTML =
        '<a href="mailto:' +
        escapeHtml(email) +
        '">' +
        escapeHtml(email) +
        "</a>";
    }

    var newsLabel = document.querySelector("[data-contact-newsletter-label]");
    if (newsLabel && contact.newsletterLabel) newsLabel.textContent = contact.newsletterLabel;

    var form = document.querySelector("[data-contact-form]");
    if (form && contact.newsletterAction) form.action = contact.newsletterAction;

    var input = document.querySelector("[data-contact-form] input[type='email']");
    if (input && contact.newsletterPlaceholder) input.placeholder = contact.newsletterPlaceholder;

    var button = document.querySelector("[data-contact-form] button[type='submit']");
    if (button && contact.newsletterButton) button.textContent = contact.newsletterButton;
  }

  function pageName() {
    var file = (location.pathname.split("/").pop() || "index.html").toLowerCase();
    if (!file || file === "") return "index";
    return file.replace(/\.html$/, "");
  }

  function boot() {
    var page = pageName();
    var needs = {
      site: true,
      social: true,
      merch: page === "merch",
      gallery: page === "gallery"
    };

    var tasks = [
      fetchJson(DATA + "site.json"),
      fetchJson(DATA + "social.json")
    ];
    if (needs.merch) tasks.push(fetchJson(DATA + "merch.json"));
    if (needs.gallery) tasks.push(fetchJson(DATA + "gallery.json"));

    Promise.all(tasks)
      .then(function (results) {
        var site = results[0];
        var social = results[1];
        var idx = 2;
        var merch = needs.merch ? results[idx++] : null;
        var gallery = needs.gallery ? results[idx++] : null;

        applyChrome(site, social);

        if (page === "index") renderHome(site);
        if (page === "listen") renderListen(site, social);
        if (page === "live") renderLive(site, social);
        if (page === "merch") renderMerch(merch, social);
        if (page === "videos") renderVideos(site, social);
        if (page === "gallery") renderGallery(gallery);
        if (page === "about") renderAbout(site, social);
        if (page === "contact") renderContact(site, social);
      })
      .catch(function (err) {
        console.error("Content load failed:", err);
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
