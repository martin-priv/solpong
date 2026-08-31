/**
 * Sol-Pong Firmware for ESP32 / M5Paper / LilyGO T5
 * 24-Hour Slow Art Wall Clock with Wi-Fi Web Dashboard
 */
#include <Arduino.h>
#include <WiFi.h>
#include <ESPAsyncWebServer.h>
#include <ESPmDNS.h>
#include <Preferences.h>
#include <time.h>
#include "solar_math.h"

// Wi-Fi konfiguration (kan även styras via WiFiManager)
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

AsyncWebServer server(80);
Preferences prefs;

// Rutnät 20x20
#define GRID_SIZE 20
uint8_t grid[GRID_SIZE][GRID_SIZE];

struct Ball {
    float x, y;
    float vx, vy;
    float radius;
    uint8_t enemyTile;
    uint8_t flipTo;
};

Ball darkBall;
Ball lightBall;

String currentCity = "Stockholm";
float currentLat = 59.3293f;
float currentLon = 18.0686f;
String currentSpeedMode = "realtime"; // "realtime", "zen", "fast"

void initGame(int dayOfYear) {
    SolarTimes solar = calculateSolarTimes(currentLat, currentLon, dayOfYear);
    int dayCols = round(GRID_SIZE * solar.daylightRatio);

    for (int y = 0; y < GRID_SIZE; y++) {
        for (int x = 0; x < GRID_SIZE; x++) {
            grid[y][x] = (x < dayCols) ? 0 : 1;
        }
    }

    darkBall = { 80.0f, 160.0f, 4.5f, 3.2f, 9.0f, 1, 0 };
    lightBall = { 380.0f, 300.0f, -4.5f, -3.2f, 9.0f, 0, 1 };
}

void setupWebServer() {
    server.on("/", HTTP_GET, [](AsyncWebServerRequest *request) {
        request->send(200, "text/html", "<h1>Sol-Pong ESP32 Controller</h1><p><a href=\"/speed?mode=realtime\">1x Dygnsrytm</a> | <a href=\"/speed?mode=zen\">Zen (10s)</a> | <a href=\"/speed?mode=fast\">Max (3 fps)</a></p>");
    });

    server.on("/speed", HTTP_GET, [](AsyncWebServerRequest *request) {
        if (request->hasParam("mode")) {
            currentSpeedMode = request->getParam("mode")->value();
            prefs.putString("speed", currentSpeedMode);
        }
        request->redirect("/");
    });

    server.begin();
}

void setup() {
    Serial.begin(115200);
    prefs.begin("solpong", false);
    currentSpeedMode = prefs.getString("speed", "realtime");

    WiFi.begin(ssid, password);
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }
    Serial.println("\nWiFi connected! IP: " + WiFi.localIP().toString());

    if (MDNS.begin("solpong")) {
        Serial.println("MDNS responder started: http://solpong.local");
    }

    configTime(3600, 3600, "pool.ntp.org"); // Svensk tidszon
    setupWebServer();
    initGame(243);
}

void loop() {
    // E-Paper uppdateringsloop med partial refresh
    delay(currentSpeedMode == "realtime" ? 30000 : (currentSpeedMode == "zen" ? 1000 : 330));
}
