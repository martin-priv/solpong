# 🌅 Sol-Pong 🌙

> **En 24-timmars Slow Art-tavelklocka för det svenska solljuset**  
> Inspirerad av Koen van Gilsts *Pong War / Yin-Yang*.

![Sol-Pong Nordic Slate](web/index.html)

---

## 🎨 Koncept & Filosofi

I Sverige varierar dagslängden dramatiskt över året – från vintersolståndets 6 timmar ljus i söder (och polarnatt i norr) till midsommaraftonens 18,5+ timmar ljus (och midnattssol).

**Sol-Pong** visualiserar denna kosmiska balans som ett långsamt, meditativt konstverk på en vägghängd E-Paper / E-Ink-display eller i webbläsaren:
* **Arenan (20x20 = 400 rutor):** Delas mellan Ljus (Dag) och Mörker (Natt) i exakt proportion till dagens soltimmar.
* **Två färgnegativa bollar:**
  * Den mörka bollen rör sig i det ljusa territoriet och erövrar mörka block vid frontlinjen.
  * Den ljusa bollen rör sig i det mörka territoriet och erövrar ljusa block.
* **Slow Art (24h Dygnsrytm):** Bollen gör en hel resa över planen på 24 timmar och erövrar ~1–2 block per dygn i takt med att årstiderna skiftar!
* **Sober skandinavisk typografi:** Inga onödiga mätare eller emojis – endast de rena klockslagen för dagens soluppgång och solnedgång.

---

## 📁 Projektstruktur

```text
solpong/
├── web/                   # Den interaktiva JavaScript- och Canvas-versionen
│   ├── index.html
│   └── solpong.js
├── firmware/              # C++ Firmware för ESP32 / M5Paper / LilyGO T5
│   ├── src/
│   │   ├── main.cpp       # Huvudprogram med E-Paper partial refresh
│   │   ├── solar_math.h   # NOAA astronomiska solberäkningar
│   │   └── web_server.h   # Inbyggd HTTP-webbserver för konfigurering
│   └── platformio.ini     # PlatformIO-konfiguration
└── README.md
```

---

## 🌐 Webbversion (JavaScript / HTML5 Canvas)

Körs direkt i valfri webbläsare utan externa beroenden:
```bash
open web/index.html
```

### Funktioner i webbpanelen:
* **Platser i Sverige:** Stockholm, Göteborg, Malmö, Kiruna.
* **Färgteman:** *Nordic Slate*, *E-Ink Minimal*, *70s Arcade*, *Vintage Amber*.
* **Hastighetslägen:**
  * 🔴 **1x Dygnsrytm:** 1 studs per 24 timmar (~1 ruta erövras per dygn).
  * 🍃 **E-Ink Zen:** Lugn meditativ studs var 10:e sekund.
  * ⚡️ **E-Ink Max:** ~3 fps för test och demonstration.

---

## ⚡️ ESP32 Firmware (E-Paper / E-Ink)

Byggd för att köras på fristående E-Paper-enheter som t.ex. **M5Stack M5Paper** eller **LilyGO T5 4.7"**:
* **Wi-Fi & Webbserver:** Gå till `http://solpong.local` från mobilen för att ändra hastighet, stad eller tema.
* **Strömsnål:** Utnyttjar E-Paper-skärmens 0W statiska strömförbrukning och ESP32 Deep Sleep.
* **Hardware Partial Refresh:** Uppdaterar enbart bollarnas position och erövrade rutor utan helskärmsblink.

---

## 📜 Licens
MIT © Martin
