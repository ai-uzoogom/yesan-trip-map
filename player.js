(() => {
  const trip = window.tripData;
  const geography = window.tripMapData;
  const { createMap, measure, position, meters, project, clamp, mix } = window.tripMap;
  const byId = id => document.getElementById(id);
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const icons = {
    route: '<circle cx="5" cy="17" r="2.4"/><circle cx="19" cy="6" r="2.4"/><path d="M7.5 17H12a3 3 0 1 0 0-6h-1a2.5 2.5 0 0 1 0-5h5.5"/>',
    calendar: '<rect x="4" y="6" width="16" height="15" rx="2"/><path d="M8 3v6m8-6v6M4 11h16"/>',
    list: '<path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01"/>',
    expand: '<path d="M9 4H4v5m11-5h5v5M4 15v5h5m6 0h5v-5"/>',
    compress: '<path d="M4 9h5V4m6 0v5h5M4 15h5v5m6 0v-5h5"/>',
    north: '<path d="m6 18 6-13 6 13-6-3z"/>',
    plus: '<path d="M5 12h14M12 5v14"/>',
    minus: '<path d="M5 12h14"/>',
    frame: '<path d="M9 4H4v5m11-5h5v5M4 15v5h5m6 0h5v-5"/><circle cx="12" cy="12" r="3"/>',
    layers: '<path d="m3 8 9-5 9 5-9 5-9-5Zm0 4 9 5 9-5M3 16l9 5 9-5"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3 2"/>',
    navigation: '<path d="m3 10 18-7-7 18-3-8z"/>',
    restart: '<path d="M4 10a8 8 0 1 1 1 8M4 5v5h5"/>',
    skipBack: '<path d="M6 5v14m13-13-9 6 9 6z"/>',
    skipNext: '<path d="M18 5v14M5 6l9 6-9 6z"/>',
    play: '<path d="m8 5 11 7-11 7z" fill="currentColor"/>',
    pause: '<path d="M8 6v12m8-12v12" stroke-width="3"/>',
    chevronDown: '<path d="m6 9 6 6 6-6"/>',
    chevronRight: '<path d="m9 6 6 6-6 6"/>',
    chevronLeft: '<path d="m15 6-6 6 6 6"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 5a1 1 0 0 0-1-1H6a2 2 0 0 0-2 2v9a1 1 0 0 0 1 1"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5m0-8h.01"/>',
    close: '<path d="m6 6 12 12M6 18 18 6"/>',
    car: '<path d="m5 10 2-5h10l2 5m-15 7v2m16-2v2M5 12h.01M19 12h.01"/><rect x="3" y="10" width="18" height="7" rx="2"/>',
    museum: '<path d="m3 9 9-5 9 5v2H3zm3 3v6m6-6v6m6-6v6M3 20h18"/>',
    coffee: '<path d="M4 8h12v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4zm12 1h2a2 2 0 1 1 0 4h-2M3 21h16M8 3v2m4-2v2"/>',
    food: '<path d="M5 4v6a3 3 0 0 0 6 0V4M8 4v16m8-9c0-3 2-7 4-7v16m-4-9h4"/>',
    bridge: '<path d="M3 17h18M6 16V6m12 10V6M6 9q6 9 12 0M3 13l3-3m12 0 3 3"/>',
    water: '<path d="M12 3 6.4 10a7 7 0 1 0 11.2 0L12 3Zm-3 11c0 1.8 1.3 3 3 3"/>',
    train: '<rect x="5" y="4" width="14" height="14" rx="4"/><path d="M5 11h14m-7-7v7m-4 4h.01m8 0h.01m-7 3-3 3m9-3 3 3"/>',
    hotel: '<path d="M4 20V5m16 15v-8a2 2 0 0 0-2-2h-7v7M4 17h16"/><circle cx="8" cy="12" r="2"/>',
    walk: '<circle cx="13" cy="5" r="2"/><path d="m6 12 4-3 3 1 2 3 4 1m-8-4-1 6-4 4m4-4 4 2 1 3"/>',
    pin: '<path d="M19 10c0 4.5-7 10-7 10S5 14.5 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2"/>'
  };

  function icon(name) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + icons[name] + '</svg>';
  }

  function element(tag, className, content = "") {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (content) node.textContent = content;
    return node;
  }

  function iconNode(name, className = "") {
    const node = element("span", className);
    node.innerHTML = icon(name);
    return node;
  }

  function setIcon(button, name, label) {
    if (button.dataset.icon !== name || !button.firstElementChild) {
      button.dataset.icon = name;
      button.innerHTML = icon(name);
    }
    button.title = label;
    button.setAttribute("aria-label", label);
  }

  for (const el of document.querySelectorAll("[data-icon]")) el.innerHTML = icon(el.dataset.icon);

  function readLocal(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch { return fallback; }
  }

  function writeLocal(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch { /* Some local-file browsers restrict storage. The current session still works. */ }
  }

  function isCoordinate(value) {
    return Array.isArray(value) && value.length >= 2 && value.slice(0, 2).every(Number.isFinite)
      && Math.abs(value[0]) <= 180 && Math.abs(value[1]) <= 85;
  }

  const originalHome = trip.places.home.point;
  const savedHome = readLocal("yesan.origin.v1", null);
  let localAddress = readLocal("yesan.origin-address.v1", "");
  if (typeof localAddress !== "string") localAddress = "";
  if (isCoordinate(savedHome)) trip.places.home.point = savedHome;
  const cache = readLocal("yesan.routes.v1", {});
  let imported = {};
  let catalog = {};
  let playback = null;
  let map = null;
  let activeDay = 0;
  let currentIndex = -1;
  let time = 0;
  let playing = false;
  let movement = null;
  let overview = false;
  let follow = false;
  let animation = null;
  let previousFrame = null;
  let lastPercent = -1;
  let lastDistance = "";
  let toastTimer = null;
  let galleryScenes = [];
  let galleryIndex = 0;
  let fetchController = null;
  let lastRequestAt = 0;
  let hidingFullscreen = false;

  const placeNodes = {
    title: byId("placeTitle"), copy: byId("placeCopy"), time: byId("placeTime"), kind: byId("placeKind"),
    count: byId("placeCount"), desc: byId("placeDescription"), photos: byId("photos"),
    next: byId("nextTitle"), directions: byId("directions")
  };
  const percent = byId("percent");
  const progress = byId("progress");
  const distanceLabel = byId("distance");
  const routeStatus = byId("routeStatus");
  const today = () => trip.days[activeDay];
  const stopsFor = day => [...new Set(day.events.map(event => event.place))];
  const formatKm = n => (n / 1000).toLocaleString("ko-KR", { maximumFractionDigits: 1 }) + " km";
  const twoDigits = n => String(n).padStart(2, "0");

  function endpoints(id) {
    return id.split("-").map(place => trip.places[place].point);
  }

  function cacheKey(id) {
    return id + ":" + endpoints(id).map(point => point.join(",")).join(";");
  }

  function validatedRoute(raw, id, source, requireLength = false) {
    const coordinates = raw?.coordinates;
    if (!Array.isArray(coordinates) || coordinates.length < 2 || coordinates.length > 50000 || !coordinates.every(isCoordinate)) {
      throw new Error("경로 좌표 형식이 올바르지 않습니다.");
    }
    const [origin, destination] = endpoints(id);
    const startOffset = meters(origin, coordinates[0]);
    const endOffset = meters(destination, coordinates.at(-1));
    const tolerance = trip.legs[id].mode === "foot" ? 90 : 220;
    if (startOffset > tolerance || endOffset > tolerance) throw new Error("경로의 시작점 또는 도착점이 방문지 좌표와 너무 멉니다.");
    const line = measure(coordinates);
    if (line.length <= 1) throw new Error("경로 길이가 너무 짧습니다.");
    if (requireLength && !(Number.isFinite(raw.distance) && raw.distance > 0)) throw new Error("응답에 유효한 경로 거리가 없습니다.");
    const distance = Number.isFinite(raw.distance) && raw.distance > 0 ? raw.distance : line.length;
    const duration = Number.isFinite(raw.duration) && raw.duration > 0 ? raw.duration : null;
    return { source, line, distance, duration, coordinates };
  }

  function makeCatalog() {
    return Object.fromEntries(Object.entries(trip.legs).map(([id, leg]) => {
      const key = cacheKey(id);
      const cached = cache[key];
      const bundled = geography.roads[id];
      const candidates = [
        [imported[key], "GeoJSON"],
        [cached?.expires > Date.now() ? cached : null, "OSRM"],
        [bundled?.endpointKey === key ? bundled : null, "OSRM"]
      ];
      for (const [candidate, source] of candidates) {
        if (!candidate) continue;
        try {
          return [id, { id, ...leg, ...validatedRoute(candidate, id, source), preview: false }];
        } catch {
          continue;
        }
      }
      const [origin, destination] = endpoints(id);
      const candidatesForPreview = geography.preview[id] || [];
      const customHome = trip.places.home.point !== originalHome && id.includes("home");
      const coordinates = [origin, ...(customHome ? [] : candidatesForPreview), destination];
      return [id, { id, ...leg, preview: true, line: measure(coordinates), distance: null }];
    }));
  }

  function legBetween(left, right) {
    if (left.place === right.place) return null;
    return catalog[left.place + "-" + right.place] || null;
  }

  function cameraPoints(ids, legs) {
    const points = ids.map(id => project(trip.places[id].point));
    // Only extrema are needed to frame the route.
    for (const { line } of legs) {
      let left = Infinity, right = -Infinity, top = Infinity, bottom = -Infinity;
      for (const [x, y] of line.points) {
        left = Math.min(left, x);
        right = Math.max(right, x);
        top = Math.min(top, y);
        bottom = Math.max(bottom, y);
      }
      points.push([left, top], [right, bottom]);
    }
    return points;
  }

  function buildPlayback(day) {
    const transitions = day.events.slice(1).map((event, i) => legBetween(day.events[i], event));
    const legs = transitions.filter(Boolean);
    const timeline = [];
    const starts = [];
    let duration = 0;
    day.events.forEach((event, index) => {
      const dwell = legs.length ? index === 0 && transitions[0] ? 850 : 2675 : 3600;
      starts.push(duration);
      timeline.push({ index, start: duration, end: duration + dwell });
      duration += dwell;
      const leg = transitions[index];
      if (!leg) return;
      const travel = 2500;
      timeline.push({ index, leg, start: duration, end: duration + travel });
      duration += travel;
    });
    const stops = stopsFor(day);
    const mapPlaces = ids => ids.map(id => ({ ...trip.places[id], id, point: project(trip.places[id].point) }));
    const allLegs = Object.values(catalog);
    return {
      duration, starts, timeline, legs, fit: cameraPoints(stops, legs), places: mapPlaces(stops),
      allLegs, allPlaces: mapPlaces(Object.keys(trip.places)), allFit: cameraPoints(Object.keys(trip.places), allLegs)
    };
  }

  function playbackView() {
    const complete = time >= playback.duration;
    const segment = playback.timeline.find(item => item.end > time) || playback.timeline.at(-1);
    const index = movement?.cardIndex ?? segment.index;
    const event = today().events[index];
    const fraction = clamp((time - segment.start) / (segment.end - segment.start), 0, 1);
    const travelProgress = reducedMotion.matches
      ? Math.floor(fraction * 12) / 12
      : fraction < .12 ? fraction * fraction / .2112 : fraction > .88 ? 1 - (1 - fraction) ** 2 / .2112 : (fraction - .06) / .88;
    const progressByLeg = {};
    for (const item of playback.timeline) {
      if (!item.leg) continue;
      if (item.end <= time) progressByLeg[item.leg.id] = 1;
      else if (item === segment) progressByLeg[item.leg.id] = travelProgress;
    }
    return {
      ...playback, index, day: activeDay, place: event.place, complete, follow,
      point: segment.leg ? position(segment.leg.line, travelProgress).point : project(trip.places[event.place].point),
      travel: segment.leg, travelProgress, progressByLeg, direction: movement?.direction || 1,
      close: segment.leg
        ? segment.leg.mode === "foot" ? 11800 : 0
        : ["monorail", "bridge"].includes(event.place) ? 5800 : event.place === "home" ? 0 : 2450,
      stayScale: mix(5500, 15300, clamp(time / 9500, 0, 1))
    };
  }

  function render(options) {
    const view = playbackView();
    if (currentIndex !== view.index) setPlace(view.index);
    map?.update(view, options);
    const value = Math.floor(time / playback.duration * 100);
    progress.value = Math.round(time / playback.duration * 1000);
    if (lastPercent !== value) {
      percent.value = value + "%";
      progress.style.setProperty("--progress", value + "%");
      progress.setAttribute("aria-valuetext", value + "%");
      lastPercent = value;
    }
    const text = distanceText(view);
    if (lastDistance !== text) {
      distanceLabel.textContent = text;
      lastDistance = text;
    }
  }

  function distanceText(view) {
    if (!playback.legs.length) return "리조트 내 일정";
    if (playback.legs.some(leg => leg.preview)) return "이동 시뮬레이션";
    const driven = playback.legs.reduce((sum, leg) => sum + (view.progressByLeg[leg.id] || 0) * leg.distance, 0);
    const total = playback.legs.reduce((sum, leg) => sum + leg.distance, 0);
    return formatKm(driven) + " / " + formatKm(total);
  }

  function setPlaying(value) {
    playing = value;
    const play = byId("play");
    setIcon(play, value ? "pause" : "play", value ? "일시정지" : "다음 일정까지 재생");
    if (!value) {
      if (animation !== null) cancelAnimationFrame(animation);
      animation = null;
      previousFrame = null;
      return;
    }
    animation = requestAnimationFrame(tick);
  }

  function tick(now) {
    animation = null;
    if (!movement) return;
    const delta = previousFrame === null ? 0 : now - previousFrame;
    previousFrame = now;
    const proposed = time + delta * Number(byId("speed").value) * movement.direction;
    const arrived = movement.direction > 0 ? proposed >= movement.end : proposed <= movement.end;
    if (arrived) {
      time = playback.starts[movement.destination];
      movement = null;
      setPlaying(false);
      render();
      return;
    }
    time = proposed;
    render();
    animation = requestAnimationFrame(tick);
  }

  function togglePlay() {
    if (playing) setPlaying(false);
    else if (movement) setPlaying(true);
    else if (time >= playback.duration) restart();
    else stepSchedule(1);
  }

  function redirectMovement(direction) {
    if (!movement) return false;
    if (movement.direction !== direction) moveToEvent(movement.cardIndex);
    else if (!playing) setPlaying(true);
    return true;
  }

  function stepSchedule(direction) {
    if (redirectMovement(direction)) return;
    const index = currentIndex + direction;
    if (index >= today().events.length) finishDay();
    else if (index >= 0) moveToEvent(index);
  }

  function stepLocation(direction) {
    if (redirectMovement(direction)) return;
    const events = today().events;
    const place = events[currentIndex].place;
    for (let index = currentIndex + direction; index >= 0 && index < events.length; index += direction) {
      if (events[index].place === place) continue;
      const firstAtPlace = events.findIndex(event => event.place === events[index].place);
      moveToEvent(firstAtPlace);
      return;
    }
    stepSchedule(direction);
  }

  function moveToEvent(index) {
    const destinationTime = playback.starts[index];
    const direction = destinationTime < time ? -1 : 1;
    const low = Math.min(time, destinationTime);
    const high = Math.max(time, destinationTime);
    const leg = playback.timeline.find(segment => segment.leg && segment.start < high && segment.end > low);
    if (!leg) {
      chooseEvent(activeDay, index);
      return;
    }
    setPlaying(false);
    movement = { destination: index, end: direction > 0 ? leg.end : leg.start, direction, cardIndex: currentIndex };
    time = direction > 0 ? Math.max(time, leg.start) : Math.min(time, leg.end);
    overview = false;
    follow = true;
    byId("overview").setAttribute("aria-pressed", "false");
    refreshRouteStatus();
    render({ follow: true });
    setPlaying(true);
  }

  function finishDay() {
    movement = null;
    setPlaying(false);
    time = playback.duration;
    render();
    showSummary();
  }

  function restart() {
    movement = null;
    setPlaying(false);
    time = 0;
    follow = false;
    overview = false;
    byId("overview").setAttribute("aria-pressed", "false");
    refreshRouteStatus();
    render({ resetCamera: true });
  }

  function chooseDay(day, eventIndex = 0) {
    movement = null;
    setPlaying(false);
    const changed = activeDay !== day;
    activeDay = day;
    playback = buildPlayback(today());
    currentIndex = -1;
    overview = false;
    follow = eventIndex > 0;
    byId("overview").setAttribute("aria-pressed", "false");
    time = playback.starts[eventIndex];
    document.body.style.setProperty("--day-accent", today().accent);
    for (const button of byId("days").children) button.setAttribute("aria-pressed", String(Number(button.dataset.day) === day));
    if (changed || eventIndex === 0) expandDay(day);
    refreshRouteStatus();
    render({ resetCamera: true, snap: changed });
  }

  function chooseEvent(day, index) {
    if (activeDay !== day) {
      chooseDay(day, index);
      return;
    }
    movement = null;
    setPlaying(false);
    time = playback.starts[index];
    follow = true;
    overview = false;
    byId("overview").setAttribute("aria-pressed", "false");
    refreshRouteStatus();
    render({ follow: true });
  }

  function setOverview(value, resumeFollow = false) {
    overview = value;
    follow = resumeFollow;
    byId("overview").setAttribute("aria-pressed", String(value));
    refreshRouteStatus();
    render({ overview: value });
  }

  function setPlace(index) {
    currentIndex = index;
    const day = today();
    const event = day.events[index];
    const place = trip.places[event.place];
    placeNodes.title.textContent = event.title;
    placeNodes.time.textContent = event.time;
    placeNodes.kind.textContent = event.kind;
    placeNodes.count.textContent = twoDigits(index + 1) + " / " + twoDigits(day.events.length);
    placeNodes.desc.textContent = event.desc;
    placeNodes.next.textContent = day.events[index + 1]?.title || trip.days[activeDay + 1]?.title || "여행 완료";
    placeNodes.directions.hidden = !!event.noNav;
    const destination = event.place === "home"
      ? localAddress || (place.point === originalHome ? place.address : [place.point[1], place.point[0]].join(","))
      : place.address;
    placeNodes.directions.href = "https://www.google.com/maps/dir/?api=1&travelmode=driving&destination=" + encodeURIComponent(destination);
    placeNodes.directions.setAttribute("aria-label", place.name + " 길찾기 (Google 지도, 새 탭)");
    const scenes = event.scenes || place.scenes;
    placeNodes.photos.replaceChildren(...scenes.map((key, i) => photoButton(key, () => showGallery(scenes, i))));
    for (const node of [placeNodes.copy, placeNodes.photos]) {
      node.classList.remove("reveal");
      requestAnimationFrame(() => node.classList.add("reveal"));
    }
    for (const row of document.querySelectorAll(".event-row")) {
      if (Number(row.dataset.day) === activeDay && Number(row.dataset.index) === index) row.setAttribute("aria-current", "step");
      else row.removeAttribute("aria-current");
    }
    byId("previous").disabled = index === 0;
    const end = index === day.events.length - 1;
    setIcon(byId("next"), end ? "list" : "skipNext", end ? "여행 경로 요약" : "다음 일정");
  }

  function photoButton(key, action) {
    const scene = trip.scenes[key];
    const button = element("button", "photo");
    button.type = "button";
    button.setAttribute("aria-label", scene.title + " 일러스트 크게 보기");
    const photo = element("img", scene.detail ? "detail" : "");
    photo.src = scene.image;
    photo.alt = "";
    photo.decoding = "async";
    photo.style.objectPosition = scene.position || "center";
    photo.addEventListener("error", () => { photo.hidden = true; }, { once: true });
    button.append(photo, element("span", "photo-caption", scene.title), element("span", "photo-art", "일러스트"));
    button.addEventListener("click", action);
    return button;
  }

  function showGallery(scenes, index) {
    galleryScenes = scenes;
    galleryIndex = index;
    updateGallery();
    openDialog("gallery");
  }

  function updateGallery() {
    const scene = trip.scenes[galleryScenes[galleryIndex]];
    byId("galleryTitle").textContent = scene.title;
    const image = byId("galleryImage");
    image.src = scene.image;
    image.alt = scene.title + " 일러스트";
    image.style.objectPosition = scene.position || "center";
    byId("imageIndex").textContent = (galleryIndex + 1) + " / " + galleryScenes.length;
  }

  function galleryShift(change) {
    galleryIndex = (galleryIndex + change + galleryScenes.length) % galleryScenes.length;
    updateGallery();
  }

  function renderTimelines() {
    const tabs = byId("days");
    trip.days.forEach((day, i) => {
      const tab = element("button", "day-tab");
      tab.type = "button";
      tab.dataset.day = i;
      tab.append(element("span", "", "DAY " + (i + 1)), element("small", "", day.date.slice(5).replace(".", "/")));
      tab.setAttribute("aria-label", "DAY " + (i + 1) + " · " + day.date.slice(5) + " " + day.weekday + "요일");
      tab.addEventListener("click", () => chooseDay(i));
      tabs.append(tab);
    });
    for (const container of [byId("timeline"), byId("allTimeline")]) {
      const all = container.id === "allTimeline";
      trip.days.forEach((day, dayIndex) => container.append(daySection(day, dayIndex, all)));
    }
  }

  function daySection(day, dayIndex, all) {
    const section = element("section", "day-section");
    section.style.setProperty("--day-color", day.accent);
    const header = element("button", "day-heading");
    header.type = "button";
    const details = element("span");
    details.append(element("span", "day-name", day.title), element("span", "day-date", day.date + " (" + day.weekday + ")"));
    header.append(element("span", "day-number", "DAY " + (dayIndex + 1)), details, iconNode("chevronDown", "day-chevron"));
    const list = element("ol", "day-events");
    list.id = (all ? "allDay" : "sideDay") + dayIndex;
    list.hidden = !all && dayIndex !== 0;
    header.setAttribute("aria-controls", list.id);
    header.setAttribute("aria-expanded", String(!list.hidden));
    header.addEventListener("click", () => {
      list.hidden = !list.hidden;
      header.setAttribute("aria-expanded", String(!list.hidden));
    });
    day.events.forEach((event, index) => {
      const item = element("li");
      const button = element("button", "event-row");
      button.type = "button";
      button.dataset.day = dayIndex;
      button.dataset.index = index;
      const clock = element("time", "", event.time);
      clock.dateTime = event.time;
      button.append(clock, iconNode(event.icon, "event-icon"), element("strong", "", event.title), iconNode("chevronRight"));
      button.addEventListener("click", () => {
        if (all) byId("scheduleDialog").close();
        chooseEvent(dayIndex, index);
        expandDay(dayIndex);
        if (all) byId("placeTitle").scrollIntoView({ block: "nearest", behavior: "instant" });
      });
      item.append(button);
      list.append(item);
    });
    section.append(header, list);
    return section;
  }

  function expandDay(day) {
    const list = byId("sideDay" + day);
    list.hidden = false;
    list.previousElementSibling.setAttribute("aria-expanded", "true");
  }

  function openDialog(id) {
    setPlaying(false);
    const dialog = byId(id);
    if (!dialog.open) dialog.showModal();
  }

  function announce(message) {
    const toast = byId("toast");
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.hidden = false;
    toastTimer = setTimeout(() => { toast.hidden = true; }, 2700);
  }

  const itineraryText = () => [
    trip.title, trip.dateRange,
    ...trip.days.flatMap((day, i) => ["", "DAY " + (i + 1) + " · " + day.date + " (" + day.weekday + ")", ...day.events.map(event => event.time + "  " + event.title)])
  ].join("\n");

  async function copySchedule() {
    const text = itineraryText();
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        announce("여행 일정을 복사했습니다.");
        return;
      } catch { /* Local files may use the editable fallback. */ }
    }
    openDialog("scheduleDialog");
    const field = byId("copyFallback");
    field.hidden = false;
    field.value = text;
    field.select();
    if (document.execCommand("copy")) {
      field.hidden = true;
      announce("여행 일정을 복사했습니다.");
    }
  }

  function showSummary() {
    const day = today();
    byId("summaryDate").textContent = "DAY " + (activeDay + 1) + " · " + day.date;
    const count = stopsFor(day).length;
    const total = playback.legs.reduce((sum, leg) => sum + (leg.distance || 0), 0);
    const roadText = playback.legs.some(leg => leg.preview) ? "개략 경로 포함"
      : playback.legs.length ? "경로 합계 " + formatKm(total) : "리조트 내 일정";
    byId("summaryInfo").textContent = day.events.length + "개 일정 · " + count + "곳 · " + roadText;
    byId("summaryStops").replaceChildren(...stopsFor(day).map(id => element("li", "", trip.places[id].name)));
    byId("summaryNext").hidden = activeDay >= trip.days.length - 1;
    openDialog("summary");
  }

  function refreshRouteStatus() {
    const legs = overview ? playback.allLegs : playback.legs;
    const verified = legs.filter(leg => !leg.preview).length;
    const usesOSM = legs.some(leg => leg.source === "OSRM");
    byId("routeLabel").textContent = !map ? "지도 사용 불가" : overview ? (verified === legs.length ? "전체 경로 · 도로" : "전체 경로 · 개략 포함")
      : !legs.length ? "리조트 집중 보기" : verified === legs.length ? "도로 경로" : verified ? "도로 + 개략 경로" : "개략 경로";
    const credit = byId("attribution");
    credit.replaceChildren();
    if (usesOSM) {
      const link = element("a", "", "© OpenStreetMap · OSRM");
      link.href = "https://www.openstreetmap.org/copyright";
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      credit.append("Natural Earth · ", link);
    } else credit.textContent = "Natural Earth · 지도 도식";
    const loaded = Object.values(catalog).filter(leg => !leg.preview).length;
    byId("routeExplanation").textContent = loaded
      ? "도로·도보 경로 " + loaded + "/" + Object.keys(catalog).length + "개 구간이 적용되어 있습니다. 점선은 개략 경로 또는 도보 구간을 나타냅니다."
      : "현재는 방문 순서를 보여 주는 개략 경로를 재생합니다. 여행 지도 배경은 도식입니다.";
    routeStatus.title = "경로 설정 및 출처";
    byId("routeLegend").replaceChildren(...Object.values(catalog).map(leg => {
      const [from, to] = leg.id.split("-").map(id => trip.places[id].short);
      const row = element("li");
      const swatch = element("i", leg.preview ? "preview" : "");
      swatch.style.setProperty("--leg-color", leg.color);
      row.append(swatch, document.createTextNode(from + " → " + to));
      return row;
    }));
  }

  function rebuildCatalog() {
    movement = null;
    setPlaying(false);
    const current = Math.max(0, currentIndex);
    catalog = makeCatalog();
    playback = buildPlayback(today());
    time = playback.starts[current];
    refreshRouteStatus();
    render({ overview });
  }

  function openRoutes() {
    const form = byId("pointForm");
    const [lon, lat] = trip.places.home.point;
    form.elements.address.value = localAddress;
    form.elements.lon.value = trip.places.home.point === originalHome ? "" : lon;
    form.elements.lat.value = trip.places.home.point === originalHome ? "" : lat;
    byId("routeFeedback").textContent = "";
    openDialog("routeDialog");
  }

  async function queryRoads() {
    if (fetchController) return;
    const button = byId("fetchRoads");
    const feedback = byId("routeFeedback");
    const pending = Object.keys(trip.legs).filter(id => catalog[id].preview);
    if (!pending.length) {
      feedback.textContent = "모든 구간에 경로가 적용되어 있습니다.";
      return;
    }
    const controller = new AbortController();
    fetchController = controller;
    for (const control of byId("pointForm").elements) control.disabled = true;
    byId("routeImport").disabled = true;
    button.disabled = true;
    let loaded = 0;
    let failed = 0;
    try {
      for (const id of pending) {
        if (controller.signal.aborted) break;
        const key = cacheKey(id);
        feedback.textContent = "조회 중 · " + (loaded + failed + 1) + " / " + pending.length;
        const wait = Math.max(0, lastRequestAt + 1100 - Date.now());
        if (wait) await new Promise(resolve => setTimeout(resolve, wait));
        if (controller.signal.aborted) break;
        const mode = trip.legs[id].mode === "foot" ? "foot" : "car";
        const profile = "driving"; // FOSSGIS selects the profile from the routed-car or routed-foot prefix.
        const coordinates = endpoints(id).map(point => point.join(",")).join(";");
        const url = "https://routing.openstreetmap.de/routed-" + mode + "/route/v1/" + profile + "/" + coordinates
          + "?overview=full&geometries=geojson&steps=false&generate_hints=false";
        const request = new AbortController();
        const cancel = () => request.abort();
        controller.signal.addEventListener("abort", cancel, { once: true });
        const timeout = setTimeout(cancel, 11000);
        try {
          lastRequestAt = Date.now();
          const response = await fetch(url, { signal: request.signal, credentials: "omit" });
          if (!response.ok) throw new Error("HTTP " + response.status);
          const data = await response.json();
          const route = data.code === "Ok" && data.routes?.[0];
          if (!route || route.geometry?.type !== "LineString") throw new Error("No route");
          const matching = validatedRoute({ ...route, coordinates: route.geometry.coordinates }, id, "OSRM", true);
          cache[key] = { coordinates: matching.coordinates, distance: matching.distance, duration: matching.duration, expires: Date.now() + 7 * 86400000 };
          loaded++;
        } catch {
          if (!controller.signal.aborted) failed++;
        } finally {
          clearTimeout(timeout);
          controller.signal.removeEventListener("abort", cancel);
        }
      }
      if (loaded) {
        writeLocal("yesan.routes.v1", cache);
        rebuildCatalog();
      }
      feedback.textContent = controller.signal.aborted ? "조회를 중단했습니다."
        : loaded + "개 경로 적용" + (failed ? " · " + failed + "개 구간 조회 실패. 해당 구간은 개략 경로로 표시합니다." : "");
    } finally {
      fetchController = null;
      button.disabled = false;
      byId("routeImport").disabled = false;
      for (const control of byId("pointForm").elements) control.disabled = false;
    }
  }

  async function importRoads(input) {
    const file = input.files[0];
    if (!file) return;
    const feedback = byId("routeFeedback");
    try {
      if (file.size > 6000000) throw new Error("6 MB 이하 GeoJSON 파일을 선택하세요.");
      input.disabled = true;
      for (const control of byId("pointForm").elements) control.disabled = true;
      byId("fetchRoads").disabled = true;
      const data = JSON.parse(await file.text());
      if (data.type !== "FeatureCollection" || !Array.isArray(data.features) || !data.features.length) {
        throw new Error("GeoJSON FeatureCollection 형식이 필요합니다.");
      }
      const next = {};
      for (const feature of data.features) {
        const id = feature?.properties?.legId;
        if (!Object.hasOwn(trip.legs, id) || feature?.geometry?.type !== "LineString") {
          throw new Error("각 피처에 유효한 legId와 LineString이 필요합니다.");
        }
        const key = cacheKey(id);
        if (Object.hasOwn(next, key)) throw new Error("중복된 구간 ID가 있습니다.");
        const candidate = { coordinates: feature.geometry.coordinates };
        validatedRoute(candidate, id, "GeoJSON");
        next[key] = candidate;
      }
      imported = { ...imported, ...next };
      rebuildCatalog();
      feedback.textContent = data.features.length + "개 구간에 GeoJSON을 적용했습니다.";
    } catch (error) {
      feedback.textContent = "가져오기 실패 · " + error.message;
    } finally {
      input.value = "";
      input.disabled = false;
      byId("fetchRoads").disabled = false;
      for (const control of byId("pointForm").elements) control.disabled = false;
    }
  }

  function setImmersive(value) {
    byId("journey").classList.toggle("immersive", value);
    document.body.classList.toggle("immersed", value);
    setIcon(byId("fullscreen"), value ? "compress" : "expand", value ? "전체 화면 종료" : "지도 전체 화면");
  }

  async function toggleFullscreen() {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }
    if (byId("journey").classList.contains("immersive")) {
      setImmersive(false);
      return;
    }
    setImmersive(true);
    hidingFullscreen = false;
    if (document.documentElement.requestFullscreen) {
      try { await document.documentElement.requestFullscreen(); }
      catch { /* In-app immersive mode remains available if native fullscreen is blocked. */ }
    }
  }

  byId("play").addEventListener("click", togglePlay);
  byId("restart").addEventListener("click", restart);
  byId("previous").addEventListener("click", () => stepSchedule(-1));
  byId("next").addEventListener("click", () => stepSchedule(1));
  progress.addEventListener("input", () => {
    movement = null;
    setPlaying(false);
    time = Number(progress.value) / 1000 * playback.duration;
    follow = true;
    overview = false;
    byId("overview").setAttribute("aria-pressed", "false");
    refreshRouteStatus();
    render({ follow: true, snap: true });
    if (time >= playback.duration && !playing) showSummary();
  });
  byId("zoomIn").addEventListener("click", () => map?.zoom(1.45));
  byId("zoomOut").addEventListener("click", () => map?.zoom(1 / 1.45));
  byId("overview").addEventListener("click", () => setOverview(!overview));
  byId("schedule").addEventListener("click", () => openDialog("scheduleDialog"));
  byId("copy").addEventListener("click", copySchedule);
  byId("copyDialog").addEventListener("click", copySchedule);
  byId("routeStatus").addEventListener("click", openRoutes);
  byId("routeDialog").addEventListener("close", () => fetchController?.abort());
  byId("routeImport").addEventListener("change", event => importRoads(event.target));
  byId("fetchRoads").addEventListener("click", queryRoads);
  byId("pointForm").addEventListener("submit", event => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const lon = data.get("lon");
    const lat = data.get("lat");
    if (Boolean(lon) !== Boolean(lat)) {
      byId("routeFeedback").textContent = "출발점 좌표는 위도와 경도를 함께 입력하세요.";
      return;
    }
    const point = lon && lat ? [Number(lon), Number(lat)] : null;
    if (point && !isCoordinate(point)) return;
    localAddress = data.get("address").trim();
    trip.places.home.point = point || originalHome;
    writeLocal("yesan.origin.v1", point);
    writeLocal("yesan.origin-address.v1", localAddress);
    rebuildCatalog();
    byId("routeFeedback").textContent = "출발점을 변경했습니다.";
  });
  byId("resetPoint").addEventListener("click", () => {
    trip.places.home.point = originalHome;
    writeLocal("yesan.origin.v1", null);
    localAddress = "";
    writeLocal("yesan.origin-address.v1", "");
    byId("pointForm").reset();
    rebuildCatalog();
    byId("routeFeedback").textContent = "용인 대표점으로 복원했습니다.";
  });
  byId("imagePrevious").addEventListener("click", () => galleryShift(-1));
  byId("imageNext").addEventListener("click", () => galleryShift(1));
  byId("gallery").addEventListener("keydown", event => {
    if (event.key === "ArrowLeft") galleryShift(-1);
    if (event.key === "ArrowRight") galleryShift(1);
  });
  byId("summaryMap").addEventListener("click", () => {
    byId("summary").close();
    setOverview(true);
  });
  byId("summaryNext").addEventListener("click", () => {
    byId("summary").close();
    chooseDay(activeDay + 1);
  });
  byId("fullscreen").addEventListener("click", toggleFullscreen);
  document.addEventListener("fullscreenchange", () => {
    if (document.fullscreenElement) hidingFullscreen = true;
    else if (hidingFullscreen) setImmersive(false);
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !document.fullscreenElement && !document.querySelector("dialog[open]")) setImmersive(false);
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) setPlaying(false);
  });
  for (const button of document.querySelectorAll("[data-close]")) {
    button.addEventListener("click", () => button.closest("dialog").close());
  }

  renderTimelines();
  try {
    map = createMap(byId("cartography"), geography, { step: stepLocation });
  } catch {
    const fallback = element("p", "map-unavailable", "이 브라우저에서 지도를 그릴 수 없습니다. 일정과 장소 정보는 계속 볼 수 있습니다.");
    byId("cartography").after(fallback);
    byId("cartography").hidden = true;
    for (const id of ["zoomIn", "zoomOut", "overview"]) byId(id).disabled = true;
  }
  catalog = makeCatalog();
  chooseDay(0);
})();
