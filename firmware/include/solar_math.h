#pragma once
#include <Arduino.h>
#include <math.h>

struct SolarTimes {
    bool isPolarNight;
    bool isMidnightSun;
    float daylightRatio;
    uint32_t daylightSec;
    uint32_t sunriseSec;
    uint32_t sunsetSec;
};

inline SolarTimes calculateSolarTimes(float lat, float lon, int dayOfYear) {
    const float daysInYear = 365.0f;
    float gamma = (2.0f * M_PI / daysInYear) * (float)(dayOfYear - 1);
    
    float eqtime = 229.18f * (0.000075f + 0.001868f * cosf(gamma) - 0.032077f * sinf(gamma) 
                  - 0.014615f * cosf(2.0f * gamma) - 0.040849f * sinf(2.0f * gamma));
    
    float decl = 0.006918f - 0.399912f * cosf(gamma) + 0.070257f * sinf(gamma)
                 - 0.006758f * cosf(2.0f * gamma) + 0.000907f * sinf(2.0f * gamma);
    
    float latRad = lat * (M_PI / 180.0f);
    float zenith = 90.833f * (M_PI / 180.0f);
    
    float cosHA = (cosf(zenith) / (cosf(latRad) * cosf(decl))) - (tanf(latRad) * tanf(decl));
    
    // Svensk sommartid (ca dag 85 till 300)
    int tzOffset = (dayOfYear >= 85 && dayOfYear <= 300) ? 2 : 1;

    SolarTimes res;
    if (cosHA > 1.0f) {
        res.isPolarNight = true; res.isMidnightSun = false;
        res.daylightRatio = 0.05f; res.daylightSec = 0; res.sunriseSec = 0; res.sunsetSec = 0;
        return res;
    }
    if (cosHA < -1.0f) {
        res.isPolarNight = false; res.isMidnightSun = true;
        res.daylightRatio = 0.95f; res.daylightSec = 86400; res.sunriseSec = 0; res.sunsetSec = 86400;
        return res;
    }

    float haRad = acosf(cosHA);
    float haDeg = haRad * (180.0f / M_PI);
    float solarNoonUTC = (720.0f - 4.0f * lon - eqtime) / 60.0f;
    float noonSec = fmodf((solarNoonUTC + (float)tzOffset), 24.0f) * 3600.0f;
    float halfDayHours = haDeg / 15.0f;
    
    res.isPolarNight = false;
    res.isMidnightSun = false;
    res.sunriseSec = (uint32_t)fmaxf(0.0f, noonSec - (halfDayHours * 3600.0f));
    res.sunsetSec = (uint32_t)fminf(86400.0f, noonSec + (halfDayHours * 3600.0f));
    res.daylightSec = res.sunsetSec - res.sunriseSec;
    res.daylightRatio = (float)res.daylightSec / 86400.0f;
    return res;
}
