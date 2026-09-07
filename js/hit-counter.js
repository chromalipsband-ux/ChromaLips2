/**
 * Retro sitewide hit counter via counterapi.dev
 * (spiritual successor to the old free CGI counters).
 * Increments once per browser session so page-hopping
 * doesn't inflate the count like a bot farm.
 */
(function () {
  var el = document.getElementById("hit-count");
  if (!el) return;

  var NS = "chromalips";
  var KEY = "visits";
  var BASE = "https://api.counterapi.dev/v1/" + NS + "/" + KEY;
  var SESSION_FLAG = "chromaLipsHitCounted";
  // Y2K starting point — original site ran for years; real count unknown.
  var START_AT = 2000;

  function pad(n) {
    var s = String(Math.max(0, Number(n) || 0));
    while (s.length < 8) s = "0" + s;
    return s;
  }

  function show(n) {
    el.textContent = pad(START_AT + n);
  }

  var shouldIncrement = false;
  try {
    shouldIncrement = !sessionStorage.getItem(SESSION_FLAG);
  } catch (e) {
    shouldIncrement = true;
  }

  var url = shouldIncrement ? BASE + "/up" : BASE + "/";

  fetch(url)
    .then(function (res) {
      if (!res.ok) throw new Error("counter " + res.status);
      return res.json();
    })
    .then(function (data) {
      if (shouldIncrement) {
        try {
          sessionStorage.setItem(SESSION_FLAG, "1");
        } catch (e) { /* private mode, etc. */ }
      }
      show(data.count);
    })
    .catch(function () {
      el.textContent = "????????";
    });
})();
