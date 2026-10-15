/*
 * NILAI — ESP32 sensor streamer
 * Reads MPU6050 gyro (I2C) + one analog EMG channel and prints CSV lines
 *   t_ms,emg,gx,gy,gz
 * over USB serial at 115200 baud, 250 samples/s. Consumed by nilai/acquisition.py
 * (NILAI_SOURCE=serial).
 *
 * Wiring (ESP32 / ESP32-C6 DevKit):
 *   MPU6050 SDA -> GPIO 6 (C6) / GPIO 21 (classic ESP32)
 *   MPU6050 SCL -> GPIO 7 (C6) / GPIO 22 (classic ESP32)
 *   EMG analog out (e.g. NPG Lite / BioAmp EXG Pill) -> EMG_PIN
 *   All sensors share 3V3 and GND.
 *
 * Library: none needed — raw register access via Wire.
 */
#include <Wire.h>

#if defined(CONFIG_IDF_TARGET_ESP32C6)
  #define SDA_PIN 6
  #define SCL_PIN 7
  #define EMG_PIN 2
#else
  #define SDA_PIN 21
  #define SCL_PIN 22
  #define EMG_PIN 34
#endif

static const uint8_t MPU = 0x68;
static const uint32_t SAMPLE_US = 4000;   // 250 Hz
static const float GYRO_LSB = 65.5f;      // ±500 deg/s full scale

static float bx = 0, by = 0, bz = 0;      // gyro bias, estimated at boot

static void writeReg(uint8_t reg, uint8_t val) {
  Wire.beginTransmission(MPU); Wire.write(reg); Wire.write(val); Wire.endTransmission();
}

static void readGyro(float &gx, float &gy, float &gz) {
  Wire.beginTransmission(MPU); Wire.write(0x43); Wire.endTransmission(false);
  Wire.requestFrom(MPU, (uint8_t)6);
  int16_t x = (Wire.read() << 8) | Wire.read();
  int16_t y = (Wire.read() << 8) | Wire.read();
  int16_t z = (Wire.read() << 8) | Wire.read();
  gx = x / GYRO_LSB; gy = y / GYRO_LSB; gz = z / GYRO_LSB;
}

void setup() {
  Serial.begin(115200);
  Wire.begin(SDA_PIN, SCL_PIN, 400000);
  writeReg(0x6B, 0x00);   // wake up
  writeReg(0x1A, 0x03);   // DLPF 44 Hz — keeps 3.5–12 Hz tremor band, removes noise
  writeReg(0x1B, 0x08);   // gyro ±500 deg/s
  analogReadResolution(12);

  // Bias calibration: keep the arm still for ~1 s after power-up
  const int N = 250;
  for (int i = 0; i < N; i++) { float x, y, z; readGyro(x, y, z); bx += x; by += y; bz += z; delay(4); }
  bx /= N; by /= N; bz /= N;
  Serial.println("t,emg,gx,gy,gz");
}

void loop() {
  static uint32_t next = micros();
  if ((int32_t)(micros() - next) < 0) return;
  next += SAMPLE_US;

  float gx, gy, gz;
  readGyro(gx, gy, gz);
  int emg = analogRead(EMG_PIN) - 2048;   // centre the 12-bit ADC reading

  Serial.printf("%lu,%d,%.3f,%.3f,%.3f\n", (unsigned long)millis(), emg, gx - bx, gy - by, gz - bz);
}
