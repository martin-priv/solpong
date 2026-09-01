# 🌅 Sol-Pong 🌙

> **Kampen om ljuset** — *Dygnet runt. Året runt. Ljus mot mörker.*  
> En generativ Pong-duell mellan ljus och mörker där frontlinjen ritas om minut för minut utifrån solens astronomiska jämvikt.

🌐 **Live Demo:** [martin-priv.github.io/solpong](https://martin-priv.github.io/solpong/)

---

## 🎨 Koncept & Filosofi

I Sverige varierar dagslängden dramatiskt över året – från vintersolståndets 6 timmar ljus i söder (och polarnatt i norr) till midsommaraftonens 18,5+ timmar ljus (och midnattssol).

**Sol-Pong** visualiserar denna kosmiska balans som ett långsamt, meditativt konstverk på en vägghängd display, E-Paper/E-Ink eller i webbläsaren:
* **Dynamisk Arena:** Skalar automatiskt till alla bildförhållanden (16:9 widescreen, stående surfplatta, kvadrat eller mobil) med perfekt kvadratiska rutor.
* **Två färgnegativa bollar:**
  * Den mörka bollen rör sig i det ljusa territoriet och erövrar mörka block vid frontlinjen.
  * Den ljusa bollen rör sig i det mörka territoriet och erövrar ljusa block.
* **Universell Dygnsrytm (24h):** Hastigheten anpassas till skärmens diagonal så att bollen gör exakt 2 fulla korsningar (~1–2 studs) per dygn – i perfekt fas med solens faktiska gång.
* **Sober skandinavisk minimalism:** Inga onödiga mätare eller emojis – endast de rena klockslagen för dagens soluppgång och solnedgång, samt ett ambient kiosk-läge som tonar bort alla kontroller vid inaktivitet.

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

### Funktioner:
* **Helskärm & Kiosk-läge:** Tryck `F`, klicka `⛶` eller dubbelklicka på tavlan för att fylla skärmen kant-till-kant. Kontroller tonar bort automatiskt efter 3.5 sekunder.
* **Platser i Sverige:** Stockholm, Göteborg, Malmö, Visby, Karlstad, Sundsvall, Umeå, Kiruna eller egen GPS-koordinat.
* **Färgteman:** *Wabi-Sabi*, *Nordic Slate*, *E-Ink Minimal*, *Falu Rödfärg*, *Aurora*, *Terracotta*, *Vintage Amber*, *70s Arcade*, *Synthwave*.
* **De 4 Hastighetslägena:**
  * 🔴 **24h:** True 24h rörelse (1–2 studs per dygn).
  * 🧘 **Deep-Zen:** ~1 studs var 20–25:e minut.
  * 🍃 **Zen:** ~1 studs var 10:e sekund.
  * ⚡️ **Stress:** Snabbdemo för demonstration (~2–3 sekunder).

---

## ⚡️ ESP32 Firmware (E-Paper / E-Ink)

Byggd för att köras på fristående E-Paper-enheter som t.ex. **M5Stack M5Paper** eller **LilyGO T5 4.7"**:
* **Wi-Fi & Webbserver:** Gå till `http://solpong.local` från mobilen för att ändra hastighet, stad eller tema.
* **Strömsnål:** Utnyttjar E-Paper-skärmens 0W statiska strömförbrukning och ESP32 Deep Sleep.
* **Hardware Partial Refresh:** Uppdaterar enbart bollarnas position och erövrade rutor utan helskärmsblink.

---

## 📜 Licens
MIT © Martin
