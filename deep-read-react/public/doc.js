// Reading-progress hairline for the document pages (static, no framework).
(function () {
  var bar = document.getElementById('docprog');
  if (!bar) return;
  function update() {
    var h = document.documentElement;
    var max = h.scrollHeight - h.clientHeight;
    var p = max > 0 ? h.scrollTop / max : 0;
    bar.style.width = (Math.max(0, Math.min(1, p)) * 100) + '%';
  }
  update();
  addEventListener('scroll', update, { passive: true });
  addEventListener('resize', update, { passive: true });
})();
