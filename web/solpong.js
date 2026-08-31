// Sol-Pong: Allt-i-Ett Tavelklocka för Väggmontage (ESP32 / E-Paper redo)
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
    nordic: {
        name: "Nordic Slate",
        dayColor: "#e5ece9",       // Ljus gräddvit/isgrå
        nightColor: "#22424d",     // Djup nordisk skifferblå
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
    paper_charcoal: {
        name: "Wabi-Sabi",
        dayColor: "#f2ede4",       // Varmt linne/råpapper
        nightColor: "#252422",     // Japanskt kol
        barBg: "#181716",
        textPrimary: "#f2ede4",
        textSecondary: "#8c877d",
        accent: "#eb5e28"
    },
    aurora: {
        name: "Aurora",
        dayColor: "#4ef2bb",       // Neongrönt polarsken
        nightColor: "#091424",     // Djup arktisk natt
        barBg: "#050d17",
        textPrimary: "#4ef2bb",
        textSecondary: "#307a68",
        accent: "#4ef2bb"
    },
    falu: {
        name: "Falu Rödfärg",
        dayColor: "#f4eee1",       // Linoljevit
        nightColor: "#6b201c",     // Genuin Falu slamfärg
        barBg: "#3d110f",
        textPrimary: "#f4eee1",
        textSecondary: "#a8716e",
        accent: "#f4eee1"
    },
    terracotta: {
        name: "Terracotta & Sand",
        dayColor: "#ebe2d5",       // Ljus sandsten
        nightColor: "#8c4632",     // Varm terracotta
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
        dayColor: "#00f0ff",       // Isblå neon
        nightColor: "#220033",     // Djup nattlila
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

let state = {
    location: "stockholm",
    customLat: 59.3293,
    customLon: 18.0686,
    customName: "Egen plats",
    theme: "nordic",
    dayOfYear: getTodayDayOfYear(),
    speedFactor: 0.001, // Default: 🔴 1x Dygnsrytm (24h)
    speedMode: "slow"
};

function saveSettings() {
    try {
        const payload = {
            location: state.location,
            customLat: state.customLat,
            customLon: state.customLon,
            customName: state.customName,
            theme: state.theme,
            speedFactor: state.speedFactor,
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
        if (typeof saved.speedFactor === "number") state.speedFactor = saved.speedFactor;
        if (saved.speedMode) state.speedMode = saved.speedMode;
    } catch (e) {
        console.warn("Could not load from localStorage", e);
    }
}

// --- Astronomiska Solberäkningar (NOAA Standard) ---
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

// --- Starta om simuleringen ---
function initSimulation() {
    const loc = LOCATIONS[state.location] || LOCATIONS.stockholm;
    const solar = calculateSolarTimes(loc.lat, loc.lon, state.dayOfYear);
    const dayCols = Math.round(GRID_SIZE * solar.daylightRatio);

    grid = [];
    for (let y = 0; y < GRID_SIZE; y++) {
        const row = [];
        for (let x = 0; x < GRID_SIZE; x++) {
            row.push(x < dayCols ? 0 : 1);
        }
        grid.push(row);
    }

    // Placera Dark Ball på Ljus sida
    darkBall.x = Math.max(30, (dayCols * TILE_SIZE) / 2);
    darkBall.y = ARENA_SIZE * 0.35;
    darkBall.vx = 4.5;
    darkBall.vy = 3.2;

    // Placera Light Ball på Mörk sida
    const nightW = (GRID_SIZE - dayCols) * TILE_SIZE;
    lightBall.x = Math.min(ARENA_SIZE - 30, (dayCols * TILE_SIZE) + (nightW / 2));
    lightBall.y = ARENA_SIZE * 0.65;
    lightBall.vx = -4.5;
    lightBall.vy = -3.2;

    // ⚡️ Snabb "Pre-roll" i minnet (250 steg):
    // Gör att frontlinjen genast blir levande, naggad och organisk istället för ett sterilt rakt streck!
    for (let i = 0; i < 280; i++) {
        stepPhysics(darkBall, 1.0);
        stepPhysics(lightBall, 1.0);
    }
}

// --- Fysik & Blockövertagande vid Kollision ---
function stepPhysics(ball, speedOverride = null) {
    const speed = speedOverride !== null ? speedOverride : state.speedFactor;
    ball.x += ball.vx * speed;
    ball.y += ball.vy * speed;

    // 1. Studsa mot ytterväggar i arenan (0 till ARENA_SIZE)
    if (ball.x - ball.radius < 0) {
        ball.x = ball.radius;
        ball.vx = Math.abs(ball.vx);
    } else if (ball.x + ball.radius > ARENA_SIZE) {
        ball.x = ARENA_SIZE - ball.radius;
        ball.vx = -Math.abs(ball.vx);
    }

    if (ball.y - ball.radius < 0) {
        ball.y = ball.radius;
        ball.vy = Math.abs(ball.vy);
    } else if (ball.y + ball.radius > ARENA_SIZE) {
        ball.y = ARENA_SIZE - ball.radius;
        ball.vy = -Math.abs(ball.vy);
    }

    // 2. Studsa mot och erövra motståndarblock (med Astronomisk Soljämvikt ⚖️)
    const angles = [0, Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4, Math.PI, (5 * Math.PI) / 4, (3 * Math.PI) / 2, (7 * Math.PI) / 4];
    
    // Räkna aktuell solbalans på brädet
    let currentDayCount = 0;
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            if (grid[y][x] === 0) currentDayCount++;
        }
    }
    const loc = LOCATIONS[state.location];
    const solar = calculateSolarTimes(loc.lat, loc.lon, state.dayOfYear);
    const targetDayCount = Math.round(GRID_SIZE * GRID_SIZE * solar.daylightRatio);
    const diff = currentDayCount - targetDayCount; // >0: för mycket dag, <0: för mycket natt

    // Dynamisk Jämviktskraft (håller frontlinjen bunden till solens faktiska timmar)
    let flipChance = 1.0;
    if (ball.flipTo === 0) {
        // Dark ball vill göra fler dagrutor (0)
        if (diff > 4) {
            flipChance = Math.max(0.25, 1.0 - (diff - 4) * 0.15);
        }
    } else {
        // Light ball vill göra fler nattrutor (1)
        if (diff < -4) {
            flipChance = Math.max(0.25, 1.0 - (-diff - 4) * 0.15);
        }
    }

    for (let angle of angles) {
        const checkX = ball.x + Math.cos(angle) * ball.radius;
        const checkY = ball.y + Math.sin(angle) * ball.radius;

        const gx = Math.floor(checkX / TILE_SIZE);
        const gy = Math.floor(checkY / TILE_SIZE);

        if (gx >= 0 && gx < GRID_SIZE && gy >= 0 && gy < GRID_SIZE) {
            if (grid[gy][gx] === ball.enemyTile) {
                // Erövra rutan med jämviktssannolikhet (garanterar alltid minst 25% så den aldrig fastnar i fickor)
                if (Math.random() <= flipChance) {
                    grid[gy][gx] = ball.flipTo;
                }

                // Studsa!
                if (Math.abs(Math.cos(angle)) > Math.abs(Math.sin(angle))) {
                    ball.vx = -ball.vx;
                } else {
                    ball.vy = -ball.vy;
                }

                // Liten vinkeljitter för naturlig studs
                const jitter = (Math.random() - 0.5) * 0.20;
                ball.vx += jitter;
                ball.vy -= jitter;

                // Normalisera fart
                const currentSpeed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
                const targetSpeed = 5.2;
                ball.vx = (ball.vx / currentSpeed) * targetSpeed;
                ball.vy = (ball.vy / currentSpeed) * targetSpeed;

                break;
            }
        }
    }
}

// --- Rita Allt (Arenan + Integrerad Sol-Typografi i själva Tavlan!) ---
function render() {
    const theme = THEMES[state.theme] || THEMES.nordic;
    const loc = LOCATIONS[state.location] || LOCATIONS.stockholm;
    const solar = calculateSolarTimes(loc.lat, loc.lon, state.dayOfYear);

    // 1. Rita Rutnätet och räkna block
    let dayCount = 0;
    let nightCount = 0;

    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            const isDay = grid[y][x] === 0;
            if (isDay) dayCount++;
            else nightCount++;

            ctx.fillStyle = isDay ? theme.dayColor : theme.nightColor;
            ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE + 0.5, TILE_SIZE + 0.5);
        }
    }

    // 2. Rita Mörka bollen (på ljus botten)
    ctx.beginPath();
    ctx.arc(darkBall.x, darkBall.y, darkBall.radius, 0, Math.PI * 2);
    ctx.fillStyle = theme.nightColor;
    ctx.fill();

    // 3. Rita Ljusa bollen (på mörk botten)
    ctx.beginPath();
    ctx.arc(lightBall.x, lightBall.y, lightBall.radius, 0, Math.PI * 2);
    ctx.fillStyle = theme.dayColor;
    ctx.fill();

    // -------------------------------------------------------------
    // 4. REN MINIMALISM: ENDAST KLOCKSLAG FÖR UPPGÅNG OCH NEDGÅNG
    // -------------------------------------------------------------
    const barY = ARENA_SIZE;
    
    ctx.fillStyle = theme.barBg;
    ctx.fillRect(0, barY, ARENA_SIZE, BAR_HEIGHT);

    // Subtil hårfin delare
    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, barY);
    ctx.lineTo(ARENA_SIZE, barY);
    ctx.stroke();

    const sunriseStr = solar.isMidnightSun ? "00:00" : (solar.isPolarNight ? "--:--" : secToHHMM(solar.sunriseSec));
    const sunsetStr = solar.isMidnightSun ? "24:00" : (solar.isPolarNight ? "--:--" : secToHHMM(solar.sunsetSec));
    const dayPct = Math.round(solar.daylightRatio * 100);
    const balanceStr = solar.isMidnightSun ? "100% dag" : (solar.isPolarNight ? "0% dag" : `${dayPct}% dag`);

    ctx.font = "400 11px 'SF Mono', Monaco, 'Courier New', monospace";
    ctx.textBaseline = "middle";
    ctx.fillStyle = theme.textSecondary;

    // Vänster: Klockslag för soluppgång
    ctx.textAlign = "left";
    ctx.fillText(sunriseStr, 14, barY + (BAR_HEIGHT / 2));

    // Mitten: Balansen mellan natt och dag (t.ex. 59% dag)
    ctx.textAlign = "center";
    ctx.fillText(balanceStr, ARENA_SIZE / 2, barY + (BAR_HEIGHT / 2));

    // Höger: Klockslag för solnedgång
    ctx.textAlign = "right";
    ctx.fillText(sunsetStr, ARENA_SIZE - 14, barY + (BAR_HEIGHT / 2));
}

// --- Kontroller ---
const daySlider = document.getElementById("dayOfYearSlider");
const dateDisplay = document.getElementById("dateDisplay");
const locationSelect = document.getElementById("locationSelect");
const themeSelect = document.getElementById("themeSelect");
const resetBtn = document.getElementById("resetBtn");
const geoBtn = document.getElementById("geoBtn");
const customCoordsRow = document.getElementById("customCoordsRow");
const customLatInput = document.getElementById("customLatInput");
const customLonInput = document.getElementById("customLonInput");

const btnSlow = document.getElementById("btnSlow");
const btnZen = document.getElementById("btnZen");
const btnEinkFast = document.getElementById("btnEinkFast");

function updateSpeedUI() {
    [btnSlow, btnZen, btnEinkFast].forEach(b => b && b.classList.remove("active"));
    if (state.speedMode === "zen" && btnZen) {
        btnZen.classList.add("active");
        state.speedFactor = 0.08;
    } else if (state.speedMode === "einkFast" && btnEinkFast) {
        btnEinkFast.classList.add("active");
        state.speedFactor = 0.40;
    } else if (btnSlow) {
        btnSlow.classList.add("active");
        state.speedFactor = 0.001;
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

if (btnSlow) {
    btnSlow.addEventListener("click", () => {
        state.speedMode = "slow";
        state.speedFactor = 0.001; // 24h Slow Art (1-2 rutor/dygn)
        updateSpeedUI();
        saveSettings();
    });
}

if (btnZen) {
    btnZen.addEventListener("click", () => {
        state.speedMode = "zen";
        state.speedFactor = 0.08; // Zen mode (1 studs var ~10s)
        updateSpeedUI();
        saveSettings();
    });
}

if (btnEinkFast) {
    btnEinkFast.addEventListener("click", () => {
        state.speedMode = "einkFast";
        state.speedFactor = 0.40; // Max E-Ink Partial Refresh (~3 fps)
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
                setTimeout(() => geoBtn.textContent = "📍 Hämta min plats", 2500);
            },
            (err) => {
                geoBtn.textContent = "❌ Nekad/Kunde ej hämta";
                setTimeout(() => geoBtn.textContent = "📍 Hämta min plats", 2500);
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
const devControls = document.getElementById("devControls");

if (toggleSettingsBtn && devControls) {
    toggleSettingsBtn.addEventListener("click", () => {
        devControls.classList.toggle("hidden");
    });
}

// Huvudloop
function loop() {
    stepPhysics(darkBall);
    stepPhysics(lightBall);
    render();
    requestAnimationFrame(loop);
}

// Starta och synka inställningar från localStorage
loadSettings();
if (themeSelect) themeSelect.value = state.theme;
updateSpeedUI();
updateLocationUI();
initSimulation();
if (daySlider) daySlider.value = state.dayOfYear;
if (dateDisplay) dateDisplay.textContent = dayOfYearToDateStr(state.dayOfYear);
loop();
