<template>
  <div>
    <div>
      <h3>motor</h3>
      <input type="number" v-model="manualPoti" />
      <input type="range" min="0" max="1024" step="1" v-model="manualPoti" />
      <button @click="simulatePoti()">
        apply simulated potentiometer input
      </button>
      <h3>bluetooth arduino / obs</h3>
      <div>
        CONNECT ME FIRST!
        <button @click="requestDevice()">request BLE device</button>
      </div>
      <ul>
        <li>Arduino BLE potentiometer: {{ frequency }}</li>
        <li>Mapped frequency: {{ realFrequency }}</li>
        <li>
          <label for="obsScene">change obs scene reactively </label
          ><input id="obsScene" type="text" v-model="obsScene" />
        </li>
        <li>OBS current scene: {{ obsScene }}</li>
        <li>
          OBS scenes
          <ul>
            <li>
              <div>ads: {{ adsMin }} - {{ adsMax }}</div>
              <input
                type="range"
                min="88"
                max="108"
                step=".1"
                v-model="adsMin"
              />
              <input
                type="range"
                min="88"
                max="108"
                step=".1"
                v-model="adsMax"
              />
            </li>
            <li>
              <div>shakira: {{ shakiraMin }} - {{ shakiraMax }}</div>
              <input
                type="range"
                min="88"
                max="108"
                step=".1"
                v-model="shakiraMin"
              />
              <input
                type="range"
                min="88"
                max="108"
                step=".1"
                v-model="shakiraMax"
              />
            </li>
            <li>
              <div>phone: {{ phoneMin }} - {{ phoneMax }}</div>
              <input
                type="range"
                min="88"
                max="108"
                step=".1"
                v-model="phoneMin"
              />
              <input
                type="range"
                min="88"
                max="108"
                step=".1"
                v-model="phoneMax"
              />
            </li>
          </ul>
        </li>
      </ul>
    </div>
    <div>
      <h3>speech recognition / synthesis</h3>
      <div>
        IF ISLISTENING EQUALS FALSE YOU MAY NEED TO RESTART ME!
        <button @click="start()">start recognition and speaking</button>
      </div>
      <div>speech recognition result: {{ result }}</div>
      <div>speech recognition lastResult {{ lastResult }}</div>
      <div>speech recognition isListening: {{ isListening }}</div>
      <div>speech synthesis status: {{ status }}</div>
      <h3>gpt</h3>
      <div>
        last 3 entries in gpt prompt history:
        <pre v-for="n in 3">{{ prompt[prompt.length - 4 + n] }}</pre>
      </div>
    </div>
    <h3>websocket</h3>
    <div>
      <div>
        <button @click="ws.send('call-start-server')">call-start-server</button>
        <button @click="ws.send('call-stop-server')">call-stop-server</button>
      </div>
      <div>
        <button @click="ws.send('frequency-start-arduino')">
          frequency-start-arduino
        </button>
        <button @click="ws.send('frequency-stop-arduino')">
          frequency-stop-arduino
        </button>
      </div>
      <button @click="ws.send('phone-frequency-server')">
        send start phone
      </button>
      <button @click="ws.send('nophone-frequency-server')">
        send stop phone
      </button>
    </div>
    <div>
      last websocket data received:
      <pre>{{ lastData }}</pre>
    </div>
  </div>
</template>

<script setup>
const lastData = ref();
let ws;
const manualPoti = ref(100);
const simulatePoti = () => {
  frequency.value = manualPoti.value;
};
const {
  isSupported,
  isListening,
  isFinal,
  recognition,
  result,
  start,
  stop,
  toggle,
} = useSpeechRecognition({
  continuous: false,
  lang: "en-US",
});
const { speakText, status, isPlaying, utterance } = useSpeech({
  rate: 1.2,
  pitch: 1.2,
  lang: "en-US",
  volume: 3,
});
const lastResult = ref("");
const prompt = ref([
  {
    role: "system",
    content:
      "You are a schizophrene old radio and tv from the year 1985. You answer like cool kids from the eighties do. Your answers are very short. Maximum 2 sentences long. Maximum 15 words. ",
  },
]);

const obsScene = ref("noise");
const { switchToScene } = await useOBS();

const frequency = ref(0);
const realFrequency = ref(0);
const serviceUuid = "19B10000-E8F2-537E-4F6C-D104768A1214".toLowerCase();
const characteristicUuid = "19B10001-E8F2-537E-4F6C-D104768A1214".toLowerCase();
const { isConnected, device, requestDevice, server } = useBluetooth({
  filters: [{ services: [serviceUuid] }],
});

//speech recognition
let id;
watch(result, (newVal) => {
  if (newVal === "") return;
  clearTimeout(id);
  id = setTimeout(() => {
    sendToGPT();
    stop();
    result.value = "";
  }, 1000);
});

watch(isListening, () => {
  if (!isListening.value && status.value !== "play") {
    start();
  }
});

watch(status, () => {
  if (status.value === "end") {
    start();
  }
});

const sendToGPT = async () => {
  if (result.value.length !== 0 && result.value !== lastResult.value) {
    prompt.value.push({
      role: "user",
      content: result.value,
    });
    const { data } = await useFetch("/api/completion", {
      method: "POST",
      body: {
        messages: prompt.value,
      },
    });
    prompt.value.push({
      role: "assistant",
      content: data.value,
    });
    speakText(data.value);
  }
  lastResult.value = result.value;
};

const connectWebSocket = () => {
  ws = new WebSocket("ws://localhost:8888/ws");
  ws.onopen = () => {
    console.log("connected to phone websocket");
  };
  ws.onmessage = (event) => {
    console.log("data received: ", event.data);
    lastData.value = event.data;
    if (event.data === "start-phone") console.log("phone connected");
    if (event.data === "call-start-phone") console.log("call-start-phone");
    if (event.data === "call-stop-phone") console.log("call-stop-phone");
  };
  ws.addEventListener("close", () => {
    console.log("WebSocket connection closed");
    setTimeout(connectWebSocket, reconnectDelay);
  });
};

let switcher = 1;
const setVolume = () => {
  if (switcher === 1) {
    switcher = 3;
  } else switcher = 1;
};

onMounted(() => {
  connectWebSocket();
});

//frequency changes to obs and websocket
let counter = 0;
let callStartTime = 0;
let lastFrequency = 0;
let tuningError = 0.5;
let minSpeechFrequency = 102.7;
let maxSpeechFrequency = 103.7;
const shakiraMin = ref(97.5);
const shakiraMax = ref(98.3);
const adsMin = ref(89.7);
const adsMax = ref(90.4);
const phoneMin = ref(102.8);
const phoneMax = ref(103.9);

watch(frequency, (newFrequency) => {
  realFrequency.value = map(newFrequency, 0, 1023, 108, 88);

  //rec gpt speech talking channel
  if (
    realFrequency.value > phoneMin.value &&
    realFrequency.value < phoneMax.value
  ) {
    obsScene.value = "shakira";
    ws.send("nophone-frequency-server");
  } else if (
    realFrequency.value > shakiraMin.value &&
    realFrequency.value < shakiraMax.value
  ) {
    console.log("in shakira scene");
    obsScene.value = "phone";
    ws.send("phone-frequency-server");
  } else if (
    realFrequency.value > adsMin.value &&
    realFrequency.value < adsMax.value
  ) {
    obsScene.value = "ads";
    ws.send("nophone-frequency-server");
  } else {
    console.log("in noise scene");
    obsScene.value = "noise";
    ws.send("nophone-frequency-server");
  }
  lastFrequency = realFrequency.value;
});

watch(obsScene, (newScene) => {
  console.log("switching to scene: ", newScene);
  switchToScene.value(newScene);
});

async function getFrequency() {
  const frequencyService = await server.value.getPrimaryService(serviceUuid);
  const frequencyCharacteristic = await frequencyService.getCharacteristic(
    characteristicUuid
  );
  await frequencyCharacteristic.startNotifications();
  frequencyCharacteristic.addEventListener(
    "characteristicvaluechanged",
    (event) => {
      console.log(event.target.value.getFloat32(0, true));
      frequency.value = event.target.value.getFloat32(0, true);
    }
  );
  //init call
  const frequencyRead = await frequencyCharacteristic.readValue();
  frequency.value = await frequencyRead.getFloat32(0, true);
}

//init arduino bluetooth
const { stop: pausableStop } = pausableWatch(isConnected, (newIsConnected) => {
  if (!newIsConnected || !server.value) return;
  getFrequency();
  pausableStop();
});

//helper
const map = (n, start1, stop1, start2, stop2) => {
  return ((n - start1) / (stop1 - start1)) * (stop2 - start2) + start2;
};
</script>

<style>
h3 {
  padding: 0;
  margin: 4px 0;
}

input[type="range"] {
  width: 300px;
}
</style>
