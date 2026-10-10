(function () {
'use strict';

// ----- Ajustes fáciles de cambiar -----
var TARGET = new Date(2026, 10, 13, 0, 0, 0); // 13 de noviembre de 2026, hora local
var REPLY_YES = 'Trato hecho. El viernes 13 trae las llaves de la moto y muchas ganas. Apenas estemos completamente libres, salimos hacia el lugar.';
// --------------------------------------

var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var $ = function (s) { return document.querySelector(s); };

/* ===== Cuenta regresiva ===== */
var elD = $('#cd-d'), elH = $('#cd-h'), elM = $('#cd-m'), elS = $('#cd-s');
var timer = null;
function pad(n) { return n < 10 ? '0' + n : String(n); }
function tick() {
  var diff = TARGET.getTime() - Date.now();
  if (diff <= 0) {
    $('#count').hidden = true;
    $('#countLabel').hidden = true;
    $('#countDone').hidden = false;
    if (timer) clearInterval(timer);
    return;
  }
  var s = Math.floor(diff / 1000);
  elD.textContent = pad(Math.floor(s / 86400));
  elH.textContent = pad(Math.floor((s % 86400) / 3600));
  elM.textContent = pad(Math.floor((s % 3600) / 60));
  elS.textContent = pad(s % 60);
}
tick();
timer = setInterval(tick, 1000);

/* ===== Muescas del pase (alineadas con la línea punteada) ===== */
var ticket = $('#ticket'), stub = $('#stub');
function setCut() { ticket.style.setProperty('--cut', stub.offsetTop + 'px'); }
setCut();
window.addEventListener('resize', setCut);
if (window.ResizeObserver) new ResizeObserver(setCut).observe(ticket);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { setCut(); if (!touched) { lastW = 0; paintFoil(); } });

/* ===== Confeti de corazones y estrellas ===== */
var cc = $('#confetti'), cx = cc.getContext('2d');
var parts = [], raf = null;
function sizeConfetti() {
  var d = Math.min(window.devicePixelRatio || 1, 2);
  cc.width = window.innerWidth * d;
  cc.height = window.innerHeight * d;
  cx.setTransform(d, 0, 0, d, 0, 0);
}
function drawHeart(s) {
  cx.beginPath();
  cx.moveTo(0, s * 0.35);
  cx.bezierCurveTo(-s, -s * 0.4, -s * 0.6, -s, 0, -s * 0.45);
  cx.bezierCurveTo(s * 0.6, -s, s, -s * 0.4, 0, s * 0.35);
  cx.fill();
}
function drawStar(s) {
  cx.beginPath();
  for (var i = 0; i < 10; i++) {
    var r = i % 2 === 0 ? s : s * 0.45;
    var a = (Math.PI / 5) * i - Math.PI / 2;
    cx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  cx.closePath();
  cx.fill();
}
function loop() {
  cx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  parts = parts.filter(function (p) { return p.life < p.max; });
  parts.forEach(function (p) {
    p.vy += 0.16; p.vx *= 0.99;
    p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life++;
    cx.save();
    cx.translate(p.x, p.y);
    cx.rotate(p.rot);
    cx.globalAlpha = Math.max(0, 1 - p.life / p.max);
    cx.fillStyle = p.c;
    if (p.heart) drawHeart(p.r); else drawStar(p.r);
    cx.restore();
  });
  if (parts.length) { raf = requestAnimationFrame(loop); }
  else { raf = null; cx.clearRect(0, 0, window.innerWidth, window.innerHeight); }
}
function burst(n, ox, oy) {
  if (reduce) return;
  sizeConfetti();
  var cols = ['#ff6b8b', '#ffc857', '#ffffff', '#8fb7ff'];
  for (var i = 0; i < n; i++) {
    var a = Math.random() * Math.PI * 2, v = 3 + Math.random() * 7;
    parts.push({
      x: ox, y: oy, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 5,
      r: 6 + Math.random() * 7, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3,
      c: cols[i % cols.length], heart: Math.random() < 0.55,
      life: 0, max: 110 + Math.random() * 70
    });
  }
  if (!raf) loop();
}

/* ===== Rasca y descubre ===== */
var box = $('#scratch'), cv = $('#foil'), ctx = cv.getContext('2d', { willReadFrequently: true });
var revealed = false, drawing = false, touched = false, last = null, lastW = 0;

function paintFoil() {
  if (revealed) return;
  var r = box.getBoundingClientRect();
  var w = Math.round(r.width), h = Math.round(r.height);
  if (!w || (w === lastW && cv.width)) return;
  lastW = w;
  var d = Math.min(window.devicePixelRatio || 1, 2);
  cv.width = w * d; cv.height = h * d;
  ctx.setTransform(d, 0, 0, d, 0, 0);
  ctx.globalCompositeOperation = 'source-over';
  var g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, '#98a4c3');
  g.addColorStop(0.5, '#e1e6f3');
  g.addColorStop(1, '#8c98b8');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  for (var i = 0; i < 70; i++) {
    ctx.fillStyle = 'rgba(255,255,255,' + (Math.random() * 0.5).toFixed(2) + ')';
    ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
  }
  ctx.fillStyle = '#2f3b5a';
  ctx.font = '800 15px "Bricolage Grotesque", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Rasca para descubrir el destino', w / 2, h / 2);
}
paintFoil();
window.addEventListener('resize', paintFoil);

function pos(e) {
  var r = cv.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top };
}
function scratchLine(a, b) {
  ctx.globalCompositeOperation = 'destination-out';
  ctx.lineWidth = 32; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
}
function cleared() {
  var data = ctx.getImageData(0, 0, cv.width, cv.height).data;
  var total = 0, clear = 0;
  for (var i = 3; i < data.length; i += 16) { total++; if (data[i] < 20) clear++; }
  return total ? clear / total : 0;
}
function reveal() {
  if (revealed) return;
  revealed = true;
  box.classList.add('done');
  var r = box.getBoundingClientRect();
  burst(45, r.left + r.width / 2, r.top + r.height / 2);
}
cv.addEventListener('pointerdown', function (e) {
  if (revealed) return;
  drawing = true; touched = true;
  try { cv.setPointerCapture(e.pointerId); } catch (_) {}
  last = pos(e);
  scratchLine(last, last);
  e.preventDefault();
});
cv.addEventListener('pointermove', function (e) {
  if (!drawing) return;
  var p = pos(e);
  scratchLine(last, p);
  last = p;
});
function endScratch() {
  if (!drawing) return;
  drawing = false;
  if (cleared() > 0.45) reveal();
}
cv.addEventListener('pointerup', endScratch);
cv.addEventListener('pointercancel', endScratch);

/* ===== Respuesta ===== */
var yes = $('#yes'), maybe = $('#maybe'), reply = $('#reply');
var accepted = false;

function accept() {
  if (accepted) return;
  accepted = true;
  ticket.classList.add('accepted');
  reply.textContent = REPLY_YES;
  yes.disabled = true;
  yes.textContent = 'Aceptado';
  var r = yes.getBoundingClientRect();
  burst(110, r.left + r.width / 2, r.top);
}
yes.addEventListener('click', accept);
// "Tal vez" está a la vista pero no se puede presionar: solo se sacude.
maybe.addEventListener('click', function (e) {
  e.preventDefault();
  maybe.classList.remove('shake');
  void maybe.offsetWidth;
  maybe.classList.add('shake');
});
})();
