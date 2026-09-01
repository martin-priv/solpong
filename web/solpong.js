// Sol-Pong: Allt-i-Ett Tavelklocka för Väggmontage (ESP32 / E-Paper / Fullskärm redo)
const canvas = document.getElementById("pongCanvas");
const ctx = canvas.getContext("2d");

const LOCATIONS = {
    stockholm: { name: "Stockholm", lat: 59.3293, lon: 18.0686 },
    goteborg:  { name: "Göteborg",  lat: 57.7089, lon: 11.9746 },
    malmo:     { name: "Malmö",     lat: 55.6050, lon: 13.0038 },
    visby:     { name: "Visby",     lat: 57.6348, lon: 18.2948 },
    karlstad:  { name: "Karlstad",  lat: 59.3793, lon: 13.5036 },
    sundsvall: { name: "Sundsvall", lat: 62.3908, lon: 17.3069 },
    umea:      { name: "Umeå",      lat: 63.8258, lon: 20.2630 },
    kiruna:    { name: "Kiruna",    lat: 67.8558, lon: 20.2253 },
    custom:    { name: "Egen plats", lat: 59.3293, lon: 18.0686 }
};

const THEMES = {
    paper_charcoal: {
        name: "Wabi-Sabi",
        dayColor: "#f2ede4",
        nightColor: "#252422",
        barBg: "#181716",
        textPrimary: "#f2ede4",
        textSecondary: "#8c877d",
        accent: "#eb5e28"
    },
    nordic: {
        name: "Nordic Slate",
        dayColor: "#e5ece9",
        nightColor: "#22424d",
        barBg: "#16282e",
        textPrimary: "#ffffff",
        textSecondary: "#8da9b0",
        accent: "#f4a261"
    },
    eink: {
        name: "E-Ink Minimal",
        dayColor: "#f7f7f5",
        nightColor: "#111111",
        barBg: "#000000",
        textPrimary: "#ffffff",
        textSecondary: "#999999",
        accent: "#ffffff"
    },
    aurora: {
        name: "Aurora",
        dayColor: "#4ef2bb",
        nightColor: "#091424",
        barBg: "#050d17",
        textPrimary: "#4ef2bb",
        textSecondary: "#307a68",
        accent: "#4ef2bb"
    },
    falu: {
        name: "Falu Rödfärg",
        dayColor: "#f4eee1",
        nightColor: "#6b201c",
        barBg: "#3d110f",
        textPrimary: "#f4eee1",
        textSecondary: "#a8716e",
        accent: "#f4eee1"
    },
    terracotta: {
        name: "Terracotta & Sand",
        dayColor: "#ebe2d5",
        nightColor: "#8c4632",
        barBg: "#4a241b",
        textPrimary: "#ebe2d5",
        textSecondary: "#b89084",
        accent: "#ebe2d5"
    },
    amber: {
        name: "Vintage Amber",
        dayColor: "#ffc857",
        nightColor: "#1e1e24",
        barBg: "#111114",
        textPrimary: "#ffc857",
        textSecondary: "#8f7030",
        accent: "#ffc857"
    },
    arcade: {
        name: "70s Arcade",
        dayColor: "#33ff33",
        nightColor: "#051605",
        barBg: "#020a02",
        textPrimary: "#33ff33",
        textSecondary: "#146614",
        accent: "#33ff33"
    },
    cyberpunk: {
        name: "Synthwave",
        dayColor: "#00f0ff",
        nightColor: "#220033",
        barBg: "#12001c",
        textPrimary: "#00f0ff",
        textSecondary: "#8f3099",
        accent: "#ff007f"
    }
};

const STORAGE_KEY = "solpong_preferences_v1";

function getTodayDayOfYear() {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = (now - start) + ((start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000);
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
}

// -------------------------------------------------------------
// UNIVERSELLA HASTIGHETSLÄGEN (Skalar med skärmens diagonal!)
// -------------------------------------------------------------
const SPEED_MODES = {
    "24h": {
        name: "24h",
        label: "24h",
        multiplier: 1.0,     // 1x: Exakt 2 fulla korsningar av diagonalen per 24h
        desc: "True 24h rörelse (1-2 studs per dygn)"
    },
    "deep-zen": {
        name: "deep-zen",
        label: "Deep-Zen",
        multiplier: 25.0,    // 25x: ~1 studs var 20-25 minuter
        desc: "Deep-Zen (~1 studs var 20-25 min)"
    },
    "zen": {
        name: "zen",
        label: "Zen",
        multiplier: 2000.0,  // ~1 studs var 10-15s
        desc: "Zen (~1 studs var 10s)"
    },
    "stress": {
        name: "stress",
        label: "Stress",
        multiplier: 10000.0, // Snabbdemo (~2-3 sekunder)
        desc: "Stress (Snabbdemo)"
    }
};

let state = {
    location: "stockholm",
    customLat: 59.3293,
    customLon: 18.0686,
    customName: "Egen plats",
    theme: "paper_charcoal",
    dayOfYear: getTodayDayOfYear(),
    speedMode: "24h"
};

function saveSettings() {
    try {
        const payload = {
            location: state.location,
            customLat: state.customLat,
            customLon: state.customLon,
            customName: state.customName,
            theme: state.theme,
            speedMode: state.speedMode
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
        console.warn("Could not save to localStorage", e);
    }
}

function loadSettings() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const saved = JSON.parse(raw);
        if (saved.theme && THEMES[saved.theme]) state.theme = saved.theme;
        if (saved.location) state.location = saved.location;
        if (saved.customLat) {
            state.customLat = saved.customLat;
            LOCATIONS.custom.lat = saved.customLat;
        }
        if (saved.customLon) {
            state.customLon = saved.customLon;
            LOCATIONS.custom.lon = saved.customLon;
        }
        if (saved.customName) {
            state.customName = saved.customName;
            LOCATIONS.custom.name = saved.customName;
        }
        if (saved.speedMode === "slow") saved.speedMode = "deep-zen";
        if (saved.speedMode === "einkFast") saved.speedMode = "stress";
        if (saved.speedMode === "realtime") saved.speedMode = "24h";

        if (saved.speedMode && SPEED_MODES[saved.speedMode]) {
            state.speedMode = saved.speedMode;
        } else {
            state.speedMode = "24h";
        }
    } catch (e) {
        console.warn("Could not load from localStorage", e);
    }
}

// -------------------------------------------------------------
// DYNAMISKA DIMENSIONER & RUTNÄT (Passar alla skärmar och e-ink!)
// -------------------------------------------------------------
let arenaWidth = 460;
let arenaHeight = 460;
let barHeight = 32;
let gridCols = 20;
let gridRows = 20;
let tileWidth = 23;
let tileHeight = 23;
let grid = [];

let darkBall = {
    x: 0,
    y: 0,
    vx: 0.8,
    vy: 0.6,
    radius: 9,
    enemyTile: 1,
    flipTo: 0
};

let lightBall = {
    x: 0,
    y: 0,
    vx: -0.8,
    vy: -0.6,
    radius: 9,
    enemyTile: 0,
    flipTo: 1
};

function updateDimensions() {
    const isFullscreen = !!document.fullscreenElement || document.body.classList.contains("is-fullscreen");
    let displayW, displayH;

    if (isFullscreen) {
        displayW = window.innerWidth;
        displayH = window.innerHeight;
    } else {
        const maxW = Math.min(window.innerWidth - 32, 480);
        displayW = Math.max(280, maxW);
        displayH = displayW + 32;
    }

    barHeight = Math.max(26, Math.min(46, Math.round(displayH * 0.065)));
    arenaWidth = displayW;
    arenaHeight = displayH - barHeight;

    const targetSize = Math.max(18, Math.min(30, Math.min(arenaWidth, arenaHeight) / 20));
    gridCols = Math.max(10, Math.round(arenaWidth / targetSize));
    gridRows = Math.max(10, Math.round(arenaHeight / targetSize));

    tileWidth = arenaWidth / gridCols;
    tileHeight = arenaHeight / gridRows;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(displayW * dpr);
    canvas.height = Math.round(displayH * dpr);
    canvas.style.width = displayW + "px";
    canvas.style.height = displayH + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const ballR = Math.max(5, Math.round(Math.min(tileWidth, tileHeight) * 0.40));
    darkBall.radius = ballR;
    lightBall.radius = ballR;
}

function getFrameSpeed() {
    const diagonal = Math.hypot(arenaWidth, arenaHeight);
    const baseSpeedPxPerSec = (2 * diagonal) / 86400;
    const mode = SPEED_MODES[state.speedMode] || SPEED_MODES["24h"];
    return (baseSpeedPxPerSec * mode.multiplier) / 60;
}

function calculateSolarTimes(lat, lon, dayOfYear) {
    const daysInYear = 365;
    const gamma = (2 * Math.PI / daysInYear) * (dayOfYear - 1);
    const eqtime = 229.18 * (0.000075 + 0.001868 * Math.cos(gamma) - 0.032077 * Math.sin(gamma) 
                  - 0.014615 * Math.cos(2 * gamma) - 0.040849 * Math.sin(2 * gamma));
    
    const decl = 0.006918 - 0.399912 * Math.cos(gamma) + 0.070257 * Math.sin(gamma)
                 - 0.006758 * Math.cos(2 * gamma) + 0.000907 * Math.sin(2 * gamma);
    
    const latRad = lat * (Math.PI / 180);
    const zenith = 90.833 * (Math.PI / 180);
    
    const cosHA = (Math.cos(zenith) / (Math.cos(latRad) * Math.cos(decl))) - (Math.tan(latRad) * Math.tan(decl));
    const isDST = dayOfYear >= 85 && dayOfYear <= 300;
    const tzOffset = isDST ? 2 : 1;

    if (cosHA > 1.0) {
        return { isPolarNight: true, isMidnightSun: false, daylightRatio: 0.05, daylightSec: 0, sunriseSec: 0, sunsetSec: 0 };
    }
    if (cosHA < -1.0) {
        return { isPolarNight: false, isMidnightSun: true, daylightRatio: 0.95, daylightSec: 86400, sunriseSec: 0, sunsetSec: 86400 };
    }

    const haRad = Math.acos(cosHA);
    const haDeg = haRad * (180 / Math.PI);
    const solarNoonUTC = (720 - 4 * lon - eqtime) / 60;
    const noonSec = ((solarNoonUTC + tzOffset) % 24) * 3600;
    const halfDayHours = haDeg / 15;
    const sunriseSec = Math.max(0, noonSec - (halfDayHours * 3600));
    const sunsetSec = Math.min(86400, noonSec + (halfDayHours * 3600));
    const daylightSec = sunsetSec - sunriseSec;
    const daylightRatio = daylightSec / 86400;

    return {
        isPolarNight: false,
        isMidnightSun: false,
        daylightRatio: daylightRatio,
        daylightSec: daylightSec,
        sunriseSec: sunriseSec,
        sunsetSec: sunsetSec
    };
}

function secToHHMM(sec) {
    if (sec < 0) sec += 86400;
    sec = sec % 86400;
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function dayOfYearToDateStr(day) {
    const d = new Date(2026, 0, Math.floor(day));
    const months = ["Jan", "Feb", "Mar", "Apr", "Maj", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dec"];
    let note = "";
    const intDay = Math.floor(day);
    if (intDay === 172) note = " (Midsommar)";
    if (intDay === 355) note = " (Vinter)";
    if (intDay === 79) note = " (Vårdagjämning)";
    if (intDay === 265) note = " (Höstdagjämning)";
    return `${d.getDate()} ${months[d.getMonth()]}${note}`;
}

function initSimulation() {
    const loc = LOCATIONS[state.location] || LOCATIONS.stockholm;
    const solar = calculateSolarTimes(loc.lat, loc.lon, state.dayOfYear);
    const dayCols = Math.round(gridCols * solar.daylightRatio);

    grid = [];
    for (let y = 0; y < gridRows; y++) {
        const row = [];
        for (let x = 0; x < gridCols; x++) {
            row.push(x < dayCols ? 0 : 1);
        }
        grid.push(row);
    }

    darkBall.x = Math.max(25, (dayCols * tileWidth) / 2);
    darkBall.y = arenaHeight * 0.35;
    const mag1 = Math.hypot(4.5, 3.2);
    darkBall.vx = 4.5 / mag1;
    darkBall.vy = 3.2 / mag1;

    const nightW = (gridCols - dayCols) * tileWidth;
    lightBall.x = Math.min(arenaWidth - 25, (dayCols * tileWidth) + (nightW / 2));
    lightBall.y = arenaHeight * 0.65;
    const mag2 = Math.hypot(-4.5, -3.2);
    lightBall.vx = -4.5 / mag2;
    lightBall.vy = -3.2 / mag2;

    const preRollSpeed = Math.min(tileWidth, tileHeight) * 0.35;
    for (let i = 0; i < 280; i++) {
        stepPhysics(darkBall, preRollSpeed, 1.0);
        stepPhysics(lightBall, preRollSpeed, 1.0);
    }
}

function stepPhysics(ball, speedOverride = null, dt = 1.0) {
    const speed = (speedOverride !== null ? speedOverride : getFrameSpeed()) * dt;
    ball.x += ball.vx * speed;
    ball.y += ball.vy * speed;

    if (ball.x - ball.radius < 0) {
        ball.x = ball.radius;
        ball.vx = Math.abs(ball.vx);
    } else if (ball.x + ball.radius > arenaWidth) {
        ball.x = arenaWidth - ball.radius;
        ball.vx = -Math.abs(ball.vx);
    }

    if (ball.y - ball.radius < 0) {
        ball.y = ball.radius;
        ball.vy = Math.abs(ball.vy);
    } else if (ball.y + ball.radius > arenaHeight) {
        ball.y = arenaHeight - ball.radius;
        ball.vy = -Math.abs(ball.vy);
    }

    const angles = [0, Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4, Math.PI, (5 * Math.PI) / 4, (3 * Math.PI) / 2, (7 * Math.PI) / 4];
    
    let currentDayCount = 0;
    for (let y = 0; y < gridRows; y++) {
        for (let x = 0; x < gridCols; x++) {
            if (grid[y][x] === 0) currentDayCount++;
        }
    }
    const totalTiles = gridCols * gridRows;
    const loc = LOCATIONS[state.location] || LOCATIONS.stockholm;
    const solar = calculateSolarTimes(loc.lat, loc.lon, state.dayOfYear);
    const targetDayCount = Math.round(totalTiles * solar.daylightRatio);
    const diff = currentDayCount - targetDayCount;
    const normalizedDiff = diff / totalTiles;

    let flipChance = 1.0;
    if (ball.flipTo === 0) {
        if (normalizedDiff > 0.01) {
            flipChance = Math.max(0.20, 1.0 - (normalizedDiff * 15));
        }
    } else {
        if (normalizedDiff < -0.01) {
            flipChance = Math.max(0.20, 1.0 - (-normalizedDiff * 15));
        }
    }

    for (let angle of angles) {
        const checkX = ball.x + Math.cos(angle) * ball.radius;
        const checkY = ball.y + Math.sin(angle) * ball.radius;

        const gx = Math.floor(checkX / tileWidth);
        const gy = Math.floor(checkY / tileHeight);

        if (gx >= 0 && gx < gridCols && gy >= 0 && gy < gridRows) {
            if (grid[gy][gx] === ball.enemyTile) {
                if (Math.random() <= flipChance) {
                    grid[gy][gx] = ball.flipTo;
                }

                if (Math.abs(Math.cos(angle)) > Math.abs(Math.sin(angle))) {
                    ball.vx = -ball.vx;
                } else {
                    ball.vy = -ball.vy;
                }

                const jitter = (Math.random() - 0.5) * 0.15;
                ball.vx += jitter;
                ball.vy -= jitter;

                const mag = Math.hypot(ball.vx, ball.vy) || 1.0;
                ball.vx /= mag;
                ball.vy /= mag;

                break;
            }
        }
    }
}

function render() {
    const theme = THEMES[state.theme] || THEMES.nordic;
    const loc = LOCATIONS[state.location] || LOCATIONS.stockholm;
    const solar = calculateSolarTimes(loc.lat, loc.lon, state.dayOfYear);

    for (let y = 0; y < gridRows; y++) {
        for (let x = 0; x < gridCols; x++) {
            const isDay = grid[y][x] === 0;
            ctx.fillStyle = isDay ? theme.dayColor : theme.nightColor;
            ctx.fillRect(
                Math.floor(x * tileWidth),
                Math.floor(y * tileHeight),
                Math.ceil(tileWidth) + 0.5,
                Math.ceil(tileHeight) + 0.5
            );
        }
    }

    ctx.beginPath();
    ctx.arc(darkBall.x, darkBall.y, darkBall.radius, 0, Math.PI * 2);
    ctx.fillStyle = theme.nightColor;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(lightBall.x, lightBall.y, lightBall.radius, 0, Math.PI * 2);
    ctx.fillStyle = theme.dayColor;
    ctx.fill();

    const barY = arenaHeight;
    ctx.fillStyle = theme.barBg;
    ctx.fillRect(0, barY, arenaWidth, barHeight);

    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, barY);
    ctx.lineTo(arenaWidth, barY);
    ctx.stroke();

    const sunriseStr = solar.isMidnightSun ? "00:00" : (solar.isPolarNight ? "--:--" : secToHHMM(solar.sunriseSec));
    const sunsetStr = solar.isMidnightSun ? "24:00" : (solar.isPolarNight ? "--:--" : secToHHMM(solar.sunsetSec));
    const dayPct = Math.round(solar.daylightRatio * 100);
    const balanceStr = solar.isMidnightSun ? "100% dag" : (solar.isPolarNight ? "0% dag" : `${dayPct}% dag`);

    const fontSize = Math.max(10, Math.min(13, Math.round(barHeight * 0.35)));
    ctx.font = `400 ${fontSize}px 'SF Mono', Monaco, 'Courier New', monospace`;
    ctx.textBaseline = "middle";
    ctx.fillStyle = theme.textSecondary;

    const pad = Math.max(14, Math.round(arenaWidth * 0.035));
    const centerY = barY + (barHeight / 2);

    ctx.textAlign = "left";
    ctx.fillText(sunriseStr, pad, centerY);

    ctx.textAlign = "center";
    ctx.fillText(balanceStr, arenaWidth / 2, centerY);

    ctx.textAlign = "right";
    ctx.fillText(sunsetStr, arenaWidth - pad, centerY);
}

const daySlider = document.getElementById("dayOfYearSlider");
const dateDisplay = document.getElementById("dateDisplay");
const locationSelect = document.getElementById("locationSelect");
const themeSelect = document.getElementById("themeSelect");
const resetBtn = document.getElementById("resetBtn");
const geoBtn = document.getElementById("geoBtn");
const customCoordsRow = document.getElementById("customCoordsRow");
const customLatInput = document.getElementById("customLatInput");
const customLonInput = document.getElementById("customLonInput");

const btn24h = document.getElementById("btn24h");
const btnDeepZen = document.getElementById("btnDeepZen");
const btnZen = document.getElementById("btnZen");
const btnStress = document.getElementById("btnStress");

function updateSpeedUI() {
    [btn24h, btnDeepZen, btnZen, btnStress].forEach(b => b && b.classList.remove("active"));
    const mode = SPEED_MODES[state.speedMode] ? state.speedMode : "24h";
    state.speedMode = mode;

    if (mode === "deep-zen" && btnDeepZen) {
        btnDeepZen.classList.add("active");
    } else if (mode === "zen" && btnZen) {
        btnZen.classList.add("active");
    } else if (mode === "stress" && btnStress) {
        btnStress.classList.add("active");
    } else if (btn24h) {
        btn24h.classList.add("active");
    }
}

function updateLocationUI() {
    if (locationSelect) {
        locationSelect.value = state.location;
    }
    if (customCoordsRow) {
        customCoordsRow.style.display = state.location === "custom" ? "flex" : "none";
    }
    if (customLatInput) customLatInput.value = state.customLat;
    if (customLonInput) customLonInput.value = state.customLon;
}

if (btn24h) {
    btn24h.addEventListener("click", () => {
        state.speedMode = "24h";
        updateSpeedUI();
        saveSettings();
    });
}

if (btnDeepZen) {
    btnDeepZen.addEventListener("click", () => {
        state.speedMode = "deep-zen";
        updateSpeedUI();
        saveSettings();
    });
}

if (btnZen) {
    btnZen.addEventListener("click", () => {
        state.speedMode = "zen";
        updateSpeedUI();
        saveSettings();
    });
}

if (btnStress) {
    btnStress.addEventListener("click", () => {
        state.speedMode = "stress";
        updateSpeedUI();
        saveSettings();
    });
}

if (daySlider) {
    daySlider.addEventListener("input", () => {
        state.dayOfYear = parseInt(daySlider.value);
        if (dateDisplay) dateDisplay.textContent = dayOfYearToDateStr(state.dayOfYear);
        initSimulation();
    });
}

if (locationSelect) {
    locationSelect.addEventListener("change", () => {
        state.location = locationSelect.value;
        updateLocationUI();
        saveSettings();
        initSimulation();
    });
}

if (customLatInput && customLonInput) {
    const handleCoordChange = () => {
        state.customLat = parseFloat(customLatInput.value) || 59.33;
        state.customLon = parseFloat(customLonInput.value) || 18.07;
        LOCATIONS.custom.lat = state.customLat;
        LOCATIONS.custom.lon = state.customLon;
        saveSettings();
        initSimulation();
    };
    customLatInput.addEventListener("change", handleCoordChange);
    customLonInput.addEventListener("change", handleCoordChange);
}

if (geoBtn) {
    geoBtn.addEventListener("click", () => {
        if (!navigator.geolocation) {
            alert("Geolokalisering stöds inte i din webbläsare.");
            return;
        }
        geoBtn.textContent = "⏳ Söker...";
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const lat = parseFloat(pos.coords.latitude.toFixed(4));
                const lon = parseFloat(pos.coords.longitude.toFixed(4));
                state.location = "custom";
                state.customLat = lat;
                state.customLon = lon;
                LOCATIONS.custom.lat = lat;
                LOCATIONS.custom.lon = lon;
                
                updateLocationUI();
                saveSettings();
                initSimulation();
                geoBtn.textContent = "📍 Hämtad!";
                setTimeout(() => geoBtn.textContent = "📍 GPS", 2500);
            },
            (err) => {
                geoBtn.textContent = "❌ Kunde ej hämta";
                setTimeout(() => geoBtn.textContent = "📍 GPS", 2500);
            },
            { enableHighAccuracy: true, timeout: 8000 }
        );
    });
}

if (themeSelect) {
    themeSelect.addEventListener("change", () => {
        state.theme = themeSelect.value;
        saveSettings();
    });
}

if (resetBtn) {
    resetBtn.addEventListener("click", () => {
        initSimulation();
    });
}

const toggleSettingsBtn = document.getElementById("toggleSettingsBtn");
const closeSettingsBtn = document.getElementById("closeSettingsBtn");
const devControls = document.getElementById("devControls");

if (toggleSettingsBtn && devControls) {
    toggleSettingsBtn.addEventListener("click", () => {
        devControls.classList.toggle("hidden");
    });
}

if (closeSettingsBtn && devControls) {
    closeSettingsBtn.addEventListener("click", () => {
        devControls.classList.add("hidden");
    });
}

// -------------------------------------------------------------
// FULLSKÄRM & AMBIENT KIOSK HANTERING
// -------------------------------------------------------------
function toggleFullscreen() {
    // Stäng alltid inställningar automatiskt när vi går till fullskärm
    if (devControls) {
        devControls.classList.add("hidden");
    }

    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        const el = document.documentElement;
        const rfs = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
        if (rfs) {
            rfs.call(el).catch(() => {
                document.body.classList.toggle("is-fullscreen");
                handleResize();
            });
        } else {
            document.body.classList.toggle("is-fullscreen");
            handleResize();
        }
    } else {
        const efs = document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen;
        if (efs) efs.call(document);
        document.body.classList.remove("is-fullscreen");
        handleResize();
    }
}

const fullscreenBtn = document.getElementById("fullscreenBtn");
if (fullscreenBtn) {
    fullscreenBtn.addEventListener("click", toggleFullscreen);
}

const artFrame = document.getElementById("artFrame");
if (artFrame) {
    artFrame.addEventListener("dblclick", toggleFullscreen);
}

if (canvas && devControls) {
    canvas.addEventListener("click", () => {
        // Klick på tavlan stänger inställningar om de är öppna
        if (!devControls.classList.contains("hidden")) {
            devControls.classList.add("hidden");
        }
    });
}

window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        if (devControls && !devControls.classList.contains("hidden")) {
            devControls.classList.add("hidden");
        }
    } else if (e.key === "f" || e.key === "F") {
        if (e.target.tagName !== "INPUT") {
            e.preventDefault();
            toggleFullscreen();
        }
    }
});

function handleResize() {
    updateDimensions();
    initSimulation();
}

window.addEventListener("resize", handleResize);
document.addEventListener("fullscreenchange", () => {
    if (document.fullscreenElement) {
        document.body.classList.add("is-fullscreen");
        if (devControls) devControls.classList.add("hidden");
    } else {
        document.body.classList.remove("is-fullscreen");
    }
    handleResize();
});

let idleTimer = null;
function onUserActivity() {
    document.body.classList.remove("mouse-idle");
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
        const isDevOpen = devControls && !devControls.classList.contains("hidden");
        if (!isDevOpen) {
            document.body.classList.add("mouse-idle");
        }
    }, 3500);
}
window.addEventListener("mousemove", onUserActivity);
window.addEventListener("touchstart", onUserActivity);
window.addEventListener("keydown", onUserActivity);
onUserActivity();

// -------------------------------------------------------------
// HUVUDLOOP MED DELTA-TIME
// -------------------------------------------------------------
let lastLoopTime = performance.now();

function loop(now = performance.now()) {
    const elapsed = now - lastLoopTime;
    const dt = Math.min(2.0, elapsed / (1000 / 60));
    lastLoopTime = now;

    stepPhysics(darkBall, null, dt);
    stepPhysics(lightBall, null, dt);
    render();
    requestAnimationFrame(loop);
}

loadSettings();
if (themeSelect) themeSelect.value = state.theme;
updateSpeedUI();
updateLocationUI();
updateDimensions();
initSimulation();
if (daySlider) daySlider.value = state.dayOfYear;
if (dateDisplay) dateDisplay.textContent = dayOfYearToDateStr(state.dayOfYear);
loop();
