#include <SoftwareSerial.h>
#include <ArduinoBLE.h>

#define rxPin 8
#define txPin 9
SoftwareSerial mySerial(rxPin, txPin);

#define LSS_ID 254 // ID 254 to broadcast to every motor on the bus
int potPin = A0; // Analog pin for the potentiometer

float ratio = 0.8;
int lastVal = 0;
int potValue = 0;

BLEService frequencyService("19B10000-E8F2-537E-4F6C-D104768A1214");
BLEFloatCharacteristic frequencyCharacteristic("19B10001-E8F2-537E-4F6C-D104768A1214", BLENotify | BLERead);

void initBluetooth() {
  delay(100);
  if (!BLE.begin()) {
    Serial.println("starting BLE failed!");
    while (1);
  }
  BLE.setLocalName("miesmuschel");
  BLE.setDeviceName("miesmuschel");
  BLE.setAdvertisedService(frequencyService);
  frequencyService.addCharacteristic(frequencyCharacteristic);
  BLE.addService(frequencyService);
  BLE.advertise();
  Serial.println("Bluetooth device active, waiting for connections...");
}

void setup() {
  mySerial.begin(115200);
  mySerial.print("#0D1500\r");
  Serial.begin(9600);
  initBluetooth();
}

int count = 0;
void loop() {
  BLEDevice central = BLE.central();

  if (central) {
    Serial.print("Connected to central: ");
    Serial.println(central.address());
    while (central.connected()) {
      potValue = analogRead(potPin);
      Serial.print("PotVal:  ");
      Serial.print(potValue);
      Serial.print(" -");
      
      potValue = ratio * lastVal + (1 - ratio) * potValue;
      
      unsigned int motorDegrees = map(potValue, 0, 1023, 0, 56000); 
      Serial.print("Degrees: ");
      Serial.println(motorDegrees);
      
      mySerial.print(String("#") + LSS_ID + String("D") + motorDegrees + String("SD1800") + "\r");
      lastVal = potValue;
      // count++;
      // potValue = count % 1023;
      // potValue = 10500;
      frequencyCharacteristic.writeValue(potValue);
      Serial.println(frequencyCharacteristic.subscribed());
      if (frequencyCharacteristic.subscribed()) {
        frequencyCharacteristic.writeValue(float(potValue));
      }
    }
  }
}