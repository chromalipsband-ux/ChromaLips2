/**
 * Live shows from data/events.json (CMS-editable).
 */
(function () {
  var EVENTS_URL = "data/events.json";

  var listEl = document.getElementById("show-list");
  var pastWrapEl = document.getElementById("past-shows");
  var pastListEl = document.getElementById("past-show-list");
  var flyerEl = document.getElementById("featured-flyer");
  if (!listEl) return;

  function parseDate(value) {
    var raw = String(value).trim();
    var iso = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (iso) {
      return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
    }
    var us = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/);
    if (us) {
      var year = Number(us[3]);
      if (year < 100) year += 2000;
      return new Date(year, Number(us[1]) - 1, Number(us[2]));
    }
    return null;
  }

  function startOfToday() {
    var now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  function formatLabel(date) {
    var days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return days[date.getDay()] + " " + months[date.getMonth()] + " " + date.getDate();
  }

  function upcomingShows(shows) {
    var today = startOfToday();
    return shows
      .map(function (show) {
        return { show: show, date: parseDate(show.date) };
      })
      .filter(function (item) {
        return item.date && item.date >= today;
      })
      .sort(function (a, b) {
        return a.date - b.date;
      });
  }

  function previousShows(shows) {
    var today = startOfToday();
    return shows
      .map(function (show) {
        return { show: show, date: parseDate(show.date) };
      })
      .filter(function (item) {
        return item.date && item.date < today;
      })
      .sort(function (a, b) {
        return b.date - a.date;
      });
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderFlyer(items) {
    if (!flyerEl) return;
    var featured = null;
    for (var i = 0; i < items.length; i++) {
      if (items[i].show.flyer) {
        featured = items[i];
        break;
      }
    }

    if (!featured) {
      flyerEl.hidden = true;
      flyerEl.removeAttribute("href");
      return;
    }

    var show = featured.show;
    var img = flyerEl.querySelector("img");
    if (img) {
      img.src = show.flyer;
      img.alt = show.title + " — " + formatLabel(featured.date);
    }
    if (show.tickets) {
      flyerEl.href = show.tickets;
    } else {
      flyerEl.removeAttribute("href");
    }
    flyerEl.hidden = false;
  }

  function appendShowItem(list, item, opts) {
    var show = item.show;
    var li = document.createElement("li");
    var linkTickets = opts && opts.linkTickets;

    var body =
      '<span class="show-line"><strong>' +
      escapeHtml(formatLabel(item.date)) +
      "</strong> — " +
      escapeHtml(show.title) +
      "</span>";

    if (show.venue) {
      body += '<span class="show-venue">' + escapeHtml(show.venue) + "</span>";
    }

    if (linkTickets && show.tickets) {
      var link = document.createElement("a");
      link.className = "show-item";
      link.href = show.tickets;
      link.target = "_blank";
      link.rel = "noopener";
      link.innerHTML = body;
      li.appendChild(link);
    } else {
      li.className = "show-item show-item--static";
      li.innerHTML = body;
    }

    list.appendChild(li);
  }

  function renderPastShows(shows) {
    if (!pastWrapEl || !pastListEl) return;

    var items = previousShows(shows);
    pastListEl.innerHTML = "";

    if (!items.length) {
      pastWrapEl.hidden = true;
      return;
    }

    items.forEach(function (item) {
      appendShowItem(pastListEl, item, { linkTickets: false });
    });
    pastWrapEl.hidden = false;
  }

  function emptyMessage() {
    return (
      window.CHROMA_LIVE_EMPTY ||
      "No upcoming shows — check back soon (or grab tickets on DICE)."
    );
  }

  function renderShows(shows) {
    var items = upcomingShows(shows);
    renderFlyer(items);
    renderPastShows(shows);

    listEl.innerHTML = "";

    if (!items.length) {
      var empty = document.createElement("li");
      empty.className = "show-list-status";
      empty.textContent = emptyMessage();
      listEl.appendChild(empty);
      return;
    }

    items.forEach(function (item) {
      appendShowItem(listEl, item, { linkTickets: true });
    });
  }

  function normalizeShows(data) {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.shows)) return data.shows;
    if (data && Array.isArray(data.events)) return data.events;
    return [];
  }

  function load() {
    fetch(EVENTS_URL + "?t=" + Date.now(), { cache: "no-store" })
      .then(function (res) {
        if (!res.ok) throw new Error("events " + res.status);
        return res.json();
      })
      .then(function (data) {
        var shows = normalizeShows(data);
        if (!shows.length) throw new Error("empty events");
        renderShows(shows);
      })
      .catch(function (err) {
        console.error("Shows load failed:", err);
        listEl.innerHTML = "";
        var empty = document.createElement("li");
        empty.className = "show-list-status";
        empty.textContent = "Could not load shows — try again soon.";
        listEl.appendChild(empty);
      });
  }

  load();
})();
