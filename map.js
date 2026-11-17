(() => {
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const mix = (a, b, fraction) => a + (b - a) * fraction;
  const project = ([lon, lat]) => [lon * .8, -lat];
  const toRadians = degrees => degrees * Math.PI / 180;
  const meters = (a, b) => {
    const lat = toRadians(b[1] - a[1]);
    const lon = toRadians(b[0] - a[0]);
    const h = Math.sin(lat / 2) ** 2 + Math.cos(toRadians(a[1])) * Math.cos(toRadians(b[1])) * Math.sin(lon / 2) ** 2;
    return 12742000 * Math.asin(Math.min(1, Math.sqrt(h)));
  };

  function measure(coordinates) {
    const points = coordinates.map(project);
    const cumulative = [0];
    for (let i = 1; i < points.length; i++) {
      cumulative.push(cumulative[i - 1] + meters(coordinates[i - 1], coordinates[i]));
    }
    return { points, cumulative, length: cumulative.at(-1) };
  }

  function position(line, fraction) {
    const distance = clamp(fraction, 0, 1) * line.length;
    let low = 1;
    let high = line.cumulative.length - 1;
    while (low < high) {
      const mid = (low + high) >>> 1;
      if (line.cumulative[mid] < distance) low = mid + 1;
      else high = mid;
    }
    const before = line.cumulative[low - 1];
    const progress = (distance - before) / (line.cumulative[low] - before || 1);
    const a = line.points[low - 1];
    const b = line.points[low];
    return { point: [mix(a[0], b[0], progress), mix(a[1], b[1], progress)], index: low };
  }

  function createMap(canvas, geography, callbacks) {
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas 2D unavailable");
    let camera = null;
    let target = null;
    let frame = null;
    let snapshot = null;
    let layout = { width: 0, height: 0, ratio: 1, x: 0, y: 0 };
    let focusDay = null;
    let overview = false;
    let manual = false;
    let lastFrame = 0;
    let arrivalPulse = null;
    const arrivalWaves = [
      { delay: 0, radius: 30, opacity: .66 },
      { delay: 135, radius: 38, opacity: .77 },
      { delay: 270, radius: 54, opacity: .94 }
    ];
    const waveDuration = 360;
    const arrivalPulseDuration = arrivalWaves.at(-1).delay + waveDuration;
    let moved = false;
    const drag = new Map();
    const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
    const land = geography.land.map(polygon => polygon.map(project));
    const lake = geography.lake.map(project);
    const rivers = geography.rivers.map(river => river.map(project));
    const cities = geography.cities.map(([name, lon, lat, type]) => ({ name, point: project([lon, lat]), type }));
    const relief = geography.relief.map(([lon, lat, rx, ry], index) => {
      const rings = Array.from({ length: 10 }, (_, ring) => {
        const size = (ring + 4) / 13;
        return Array.from({ length: 65 }, (_, spot) => {
          const a = spot * Math.PI / 32;
          const shift = 1 + .12 * Math.cos(a * 3 + index) + .1 * Math.sin(a * 5 + index * .51) + .04 * Math.sin(a * 11);
          return project([lon + Math.cos(a) * rx * size * shift, lat + Math.sin(a) * ry * size * shift]);
        });
      });
      return { point: project([lon, lat]), radius: Math.max(rx, ry), rings };
    });

    const screen = point => [(point[0] - camera.x) * camera.scale + layout.x, (point[1] - camera.y) * camera.scale + layout.y - camera.lift];
    const world = ([x, y]) => [(x - layout.x) / camera.scale + camera.x, (y - layout.y + camera.lift) / camera.scale + camera.y];

    function resize() {
      const { width, height } = canvas.getBoundingClientRect();
      if (!width || !height) return;
      const ratio = Math.min(devicePixelRatio || 1, 2);
      layout = { width, height, ratio, x: width * .49, y: 74 + (height - 125) / 2 };
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      if (snapshot) update(snapshot, { snap: true });
    }

    function fit(points) {
      const x = points.map(point => point[0]);
      const y = points.map(point => point[1]);
      const left = Math.min(...x);
      const right = Math.max(...x);
      const top = Math.min(...y);
      const bottom = Math.max(...y);
      const width = Math.max(146, layout.width - 126);
      const height = Math.max(110, layout.height - 128);
      const scale = Math.min(15500, width / (right - left || .016), height / (bottom - top || .016));
      return { x: (left + right) / 2, y: (top + bottom) / 2, scale };
    }

    function update(view, options = {}) {
      snapshot = view;
      if (!view.showArrival || reduceMotion.matches) arrivalPulse = null;
      else if (options.pulseArrival) arrivalPulse = { startAt: null };
      if (focusDay !== view.day || options.resetCamera) {
        focusDay = view.day;
        manual = false;
        overview = false;
      }
      if (typeof options.overview === "boolean") {
        overview = options.overview;
        manual = false;
      }
      if (options.follow) {
        manual = false;
        overview = false;
      }
      const fitted = fit(overview ? view.allFit : view.fit);
      if (!manual) {
        target = fitted;
        if (!overview && !view.complete && view.follow) {
          const [x, y] = view.point;
          const localZoom = view.close && view.day === 0 ? Math.max(fitted.scale * 1.7, view.close) : fitted.scale * 1.48;
          target = { x, y, scale: view.day === 1 ? view.stayScale : Math.min(15500, localZoom) };
        }
      }
      target.lift = clamp((view.arrivalInset || 0) * .5, 0, Math.max(0, (layout.height - 230) * .48));
      if (!camera || options.snap || reduceMotion.matches) camera = { ...target };
      requestDraw();
    }

    function path(points, from = 0, to = points.length) {
      const start = screen(points[from]);
      context.moveTo(...start);
      for (let i = from + 1; i < to; i++) context.lineTo(...screen(points[i]));
    }

    function region(points, fill, stroke) {
      context.beginPath();
      path(points);
      context.closePath();
      context.fillStyle = fill;
      context.fill();
      context.strokeStyle = stroke;
      context.lineWidth = 1;
      context.stroke();
    }

    function terrain() {
      const { width, height } = layout;
      context.fillStyle = "#0a1423";
      context.fillRect(0, 0, width, height);
      context.save();
      for (const coast of land) region(coast, "#111f30", "#30445a");

      const step = camera.scale > 5000 ? .01 : camera.scale > 1000 ? .05 : .125;
      const corner = world([0, 0]);
      const end = world([width, height]);
      context.beginPath();
      for (let x = Math.floor(corner[0] / step) * step; x <= end[0]; x += step) {
        const [px] = screen([x, 0]);
        context.moveTo(px, 0);
        context.lineTo(px, height);
      }
      for (let y = Math.floor(corner[1] / step) * step; y <= end[1]; y += step) {
        const [, py] = screen([0, y]);
        context.moveTo(0, py);
        context.lineTo(width, py);
      }
      context.strokeStyle = "#8099b912";
      context.lineWidth = 1;
      context.stroke();
      region(lake, "#102d42", "#315772");
      context.beginPath();
      for (const river of rivers) path(river);
      context.strokeStyle = "#26516b";
      context.lineWidth = camera.scale > 1600 ? 1.25 : .75;
      context.stroke();

      for (const { point, radius, rings } of relief) {
        const [x, y] = screen(point);
        const spread = radius * camera.scale * 1.45;
        if (x + spread < 0 || x - spread > width || y + spread < 0 || y - spread > height || spread > width * 2.5) continue;
        const haze = context.createRadialGradient(x, y, 0, x, y, spread);
        haze.addColorStop(0, "#2c4b5d5a");
        haze.addColorStop(1, "#29405300");
        context.fillStyle = haze;
        context.fillRect(x - spread, y - spread, spread * 2, spread * 2);
        context.beginPath();
        for (const ring of rings) path(ring);
        context.strokeStyle = "#57778a2e";
        context.lineWidth = .68;
        context.stroke();
      }

      context.textAlign = "center";
      context.textBaseline = "middle";
      context.font = "500 11px sans-serif";
      for (const city of cities) {
        if (camera.scale > 5000 && city.type !== 1) continue;
        if (camera.scale < 650 && city.type === 1) continue;
        const [x, y] = screen(city.point);
        if (x < 12 || x > width - 12 || y < 91 || y > height - 27) continue;
        if (x > width - 65 && y > height - 240) continue;
        if (city.type === 2) {
          context.fillStyle = "#55758e";
          context.fillText(city.name, x, y);
          continue;
        }
        context.fillStyle = "#587187";
        context.fillRect(x - 1, y + 5, 2, 2);
        context.fillStyle = "#869eb6";
        context.fillText(city.name, x, y - 3);
      }
      context.restore();
    }

    function strokeLeg(leg, progress, bright) {
      const { line, color, preview } = leg;
      if (progress <= 0) return;
      const partial = progress < 1 ? position(line, progress) : null;
      context.save();
      if (overview && leg.id === "resort-home") context.translate(4, 0);
      context.beginPath();
      path(line.points, 0, partial?.index);
      if (partial) context.lineTo(...screen(partial.point));
      context.lineCap = "round";
      context.lineJoin = "round";
      if (bright) {
        context.strokeStyle = color + "32";
        context.lineWidth = 7;
        context.stroke();
        context.shadowColor = color;
        context.shadowBlur = 10;
      }
      context.setLineDash(preview ? [5, 4] : leg.mode === "foot" ? [2, 3] : []);
      context.strokeStyle = color + (bright ? "ff" : "91");
      context.lineWidth = bright ? 2.8 : 1.7;
      context.stroke();
      context.restore();
    }

    function trail(leg, fraction, direction) {
      if (fraction <= 0 || reduceMotion.matches) return;
      const span = 24 / Math.max(30, leg.line.length * camera.scale / 112000);
      const first = position(leg.line, clamp(fraction - direction * span, 0, 1));
      const last = position(leg.line, fraction);
      const a = screen(first.point);
      const b = screen(last.point);
      if (Math.hypot(a[0] - b[0], a[1] - b[1]) < 1) return;
      const glow = context.createLinearGradient(...a, ...b);
      glow.addColorStop(0, "#85d8ff00");
      glow.addColorStop(1, "#98dfffef");
      context.beginPath();
      context.moveTo(...a);
      if (direction > 0) {
        for (let i = first.index; i < last.index; i++) context.lineTo(...screen(leg.line.points[i]));
      } else {
        for (let i = first.index - 1; i >= last.index; i--) context.lineTo(...screen(leg.line.points[i]));
      }
      context.lineTo(...b);
      context.lineWidth = 3.4;
      context.strokeStyle = glow;
      context.shadowBlur = 11;
      context.shadowColor = "#55bfff";
      context.stroke();
      context.shadowBlur = 0;
    }

    function dot(x, y, radius, fill, stroke, width = 1) {
      context.beginPath();
      context.arc(x, y, radius, 0, 2 * Math.PI);
      if (fill) {
        context.fillStyle = fill;
        context.fill();
      }
      if (stroke) {
        context.strokeStyle = stroke;
        context.lineWidth = width;
        context.stroke();
      }
    }

    function label(name, x, y, offset, selected) {
      context.font = selected ? "700 12px sans-serif" : "650 11px sans-serif";
      const text = context.measureText(name);
      const w = text.width + 16;
      const h = selected ? 25 : 22;
      const inset = offset[0] < 0 ? x + offset[0] - w : x + offset[0];
      const px = clamp(inset, 8, layout.width - w - 8);
      const py = clamp(y + offset[1] - h / 2, 64, layout.height - h - 30);
      context.fillStyle = selected ? "#c8f1ff" : "#14243a";
      context.strokeStyle = selected ? "#a1dcff" : "#465a71";
      context.lineWidth = 1;
      context.beginPath();
      if (context.roundRect) context.roundRect(px, py, w, h, 6);
      else context.rect(px, py, w, h);
      context.fill();
      context.stroke();
      context.textBaseline = "middle";
      context.textAlign = "left";
      context.fillStyle = selected ? "#0e2841" : "#d0dced";
      context.fillText(name, px + 8, py + h / 2 + .3);
    }

    function routes(pulseElapsed) {
      const view = snapshot;
      const segments = overview ? view.allLegs : view.legs;
      for (const leg of segments) strokeLeg(leg, 1, false);
      for (const leg of segments) {
        const fraction = overview || view.complete ? 1 : view.progressByLeg[leg.id];
        if (fraction) strokeLeg(leg, fraction, true);
      }
      if (!overview && view.travel) trail(view.travel, view.travelProgress, view.direction);

      const mapPlaces = overview ? view.allPlaces : view.places;
      const markers = [];
      for (const place of mapPlaces) {
        const [x, y] = screen(place.point);
        if (x < 0 || x > layout.width || y < 64 || y > layout.height - 25) continue;
        const active = !overview && !view.travel && place.id === view.place;
        dot(x, y, active ? 6 : 4.4, "#122c3d", active ? "#9addff" : "#9ac5ce", 1.15);
        markers.push({ id: place.id, x, y, active, place });
      }
      const named = [];
      for (const marker of markers) {
        if (marker.active || markers.some(other => other.active && Math.hypot(other.x - marker.x, other.y - marker.y) < 34)) continue;
        if (named.some(other => Math.hypot(other.x - marker.x, other.y - marker.y) < 32)) continue;
        label(marker.place.short, marker.x, marker.y, marker.place.label, false);
        named.push(marker);
      }
      if (overview || view.complete) return;
      const [x, y] = screen(view.point);
      if (x < -15 || x > layout.width + 15 || y < 64 || y > layout.height - 15) return;
      if (!reduceMotion.matches) {
        const halo = context.createRadialGradient(x, y, 2, x, y, 25);
        halo.addColorStop(0, "#71c8ffee");
        halo.addColorStop(.34, "#3197fa80");
        halo.addColorStop(1, "#3078d000");
        dot(x, y, 25, halo);
      }
      if (pulseElapsed !== null) {
        for (const wave of arrivalWaves) {
          const progress = (pulseElapsed - wave.delay) / waveDuration;
          if (progress < 0 || progress >= 1) continue;
          const remaining = 1 - progress;
          const radius = mix(12, wave.radius, 1 - remaining ** 2);
          dot(x, y, radius, null, `rgba(117, 216, 255, ${wave.opacity * remaining})`, 2);
        }
      }
      dot(x, y, 10, "#70c8ff27", "#78ceff87");
      dot(x, y, 4, "#ebfaff", "#69d2ff", 1.7);
      const active = markers.find(marker => marker.active);
      if (active) label(active.place.short, x, y, active.place.label, true);
    }

    function draw(now) {
      frame = null;
      if (!snapshot || !camera || !layout.width) return;
      const alpha = reduceMotion.matches ? 1 : 1 - Math.exp(-Math.min(50, now - (lastFrame || now - 16)) / 118);
      lastFrame = now;
      let adjusting = false;
      for (const key of ["x", "y", "scale", "lift"]) {
        const epsilon = key === "x" || key === "y" ? .000035 : .08;
        if (Math.abs(camera[key] - target[key]) > epsilon) adjusting = true;
        camera[key] = Math.abs(camera[key] - target[key]) <= epsilon ? target[key] : mix(camera[key], target[key], alpha);
      }
      if (arrivalPulse?.startAt === null && !drag.size) {
        const centerPixels = Math.hypot(camera.x - target.x, camera.y - target.y) * target.scale
          + Math.abs(camera.lift - target.lift);
        const zoomPixels = Math.abs(camera.scale / target.scale - 1) * Math.max(layout.width, layout.height) / 2;
        if (centerPixels + zoomPixels < 1) {
          camera = { ...target };
          adjusting = false;
          arrivalPulse.startAt = now + 80;
        }
      }
      context.setTransform(layout.ratio, 0, 0, layout.ratio, 0, 0);
      terrain();
      const pulseElapsed = arrivalPulse?.startAt == null ? null : now - arrivalPulse.startAt;
      if (pulseElapsed !== null && pulseElapsed >= arrivalPulseDuration) arrivalPulse = null;
      routes(pulseElapsed);
      if (adjusting || arrivalPulse) requestDraw();
    }

    function requestDraw() {
      if (frame === null) frame = requestAnimationFrame(draw);
    }

    function moveTo(next, animate = false) {
      if (arrivalPulse?.startAt != null) arrivalPulse = null;
      manual = true;
      target = { ...target, ...next };
      if (!animate || reduceMotion.matches) camera = { ...camera, ...next };
      requestDraw();
    }

    function pan(dx, dy) {
      if (!camera) return;
      moveTo({ x: camera.x - dx / camera.scale, y: camera.y - dy / camera.scale, scale: camera.scale });
    }

    function zoom(factor, anchor) {
      if (!camera) return;
      const base = anchor ? camera : target;
      const scale = clamp(base.scale * factor, 160, 49000);
      if (!anchor) {
        moveTo({ scale }, true);
        return;
      }
      const [x, y] = world(anchor);
      moveTo({ x: x - (anchor[0] - layout.x) / scale, y: y - (anchor[1] - layout.y + camera.lift) / scale, scale });
    }

    function location(event) {
      const bounds = canvas.getBoundingClientRect();
      return [event.clientX - bounds.left, event.clientY - bounds.top];
    }

    canvas.addEventListener("pointerdown", event => {
      if (event.button !== 0 || !camera || drag.size >= 2) return;
      if (!drag.size) moved = false;
      else moved = true;
      drag.set(event.pointerId, location(event));
      canvas.setPointerCapture(event.pointerId);
      canvas.classList.add("dragging");
    });
    canvas.addEventListener("pointermove", event => {
      const previous = drag.get(event.pointerId);
      if (!previous) return;
      const next = location(event);
      const dx = next[0] - previous[0];
      const dy = next[1] - previous[1];
      if (Math.abs(dx) + Math.abs(dy) < (moved ? .01 : 3)) return;
      moved = true;
      const other = [...drag.entries()].find(([id]) => id !== event.pointerId)?.[1];
      if (other) {
        const oldDistance = Math.hypot(previous[0] - other[0], previous[1] - other[1]);
        const newDistance = Math.hypot(next[0] - other[0], next[1] - other[1]);
        if (oldDistance > 4) zoom(newDistance / oldDistance, [(next[0] + other[0]) / 2, (next[1] + other[1]) / 2]);
        pan(dx / 2, dy / 2);
      } else pan(dx, dy);
      drag.set(event.pointerId, next);
    });
    function endDrag(event) {
      if (!drag.delete(event.pointerId)) return;
      if (drag.size) return;
      canvas.classList.remove("dragging");
      if (moved || event.type !== "pointerup") return;
      const [x] = location(event);
      callbacks.step(x < layout.width / 2 ? -1 : 1);
    }
    canvas.addEventListener("pointerup", endDrag);
    canvas.addEventListener("pointercancel", endDrag);
    canvas.addEventListener("lostpointercapture", endDrag);
    canvas.addEventListener("wheel", event => {
      if (event.ctrlKey || event.metaKey) return;
      event.preventDefault();
      zoom(Math.exp(-clamp(event.deltaY, -90, 90) * .008), location(event));
    }, { passive: false });
    canvas.addEventListener("keydown", event => {
      const actions = {
        ArrowLeft: () => pan(30, 0), ArrowRight: () => pan(-30, 0),
        ArrowUp: () => pan(0, 30), ArrowDown: () => pan(0, -30),
        "[": () => callbacks.step(-1), "]": () => callbacks.step(1),
        "+": () => zoom(1.4), "=": () => zoom(1.4), "-": () => zoom(1 / 1.4)
      };
      if (!actions[event.key]) return;
      event.preventDefault();
      actions[event.key]();
    });
    reduceMotion.addEventListener("change", () => snapshot && update(snapshot, { snap: true }));
    new ResizeObserver(resize).observe(canvas);
    resize();
    return { update };
  }

  window.tripMap = { createMap, measure, position, meters, project, clamp, mix };
})();
