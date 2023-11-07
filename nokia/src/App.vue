<template>
  <div class="outer">
    <div class="container">
      <audio ref="ringingSound" src="/ringing.mp3" loop nocontrols></audio>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from "vue";
const ringingSound = ref();
const ws = ref();
onMounted(() => {
  connectWebSocket();
  document.addEventListener("visibilitychange", function () {
    console.log("is hidden: ", document.hidden);
    if (document.hidden) {
      isTalking.value = false;
    } else {
      ringingSound.value.pause();
      ringingSound.value.currentTime = 0;
      isTalking.value = true;
    }
  });
});

const lastData = ref("no data yet");
const isTalking = ref(false);
// let ip = "ws://localhost:8888";
let ip = "ws://10.128.132.126:8888";
function connectWebSocket() {
  ws.value = new WebSocket(ip);
  ws.value.addEventListener("open", () => {
    console.log("WebSocket connection established");
    ws.value.send("start-phone");
  });
  ws.value.addEventListener("message", (event) => {
    console.log("received event.data: ", event.data);
    lastData.value = event.data;
    if (event.data === "phone-frequency-server") {
      if (ringingSound.value.paused && !isTalking.value)
        ringingSound.value.play();
      lastData.value = "call-start-server";
    }
    if (event.data === "nophone-frequency-server") {
      if (!ringingSound.value.paused && isTalking.value)
        ringingSound.value.pause();
    }
  });
  ws.value.addEventListener("close", () => {
    console.log("WebSocket connection closed");
    setTimeout(connectWebSocket, reconnectDelay);
  });
}

document.addEventListener("keydown", function (event) {
  // event.preventDefault();
  console.log(event.key, event.code, event.keyCode);
  if (
    event.key !== "Call" &&
    event.key !== "MicrophoneToggle" &&
    event.key !== "EndCall" &&
    event.code !== "Power"
  ) {
    console.log("should not be");
    event.preventDefault();
  }
  if (event.key === "MicrophoneToggle" || event.key === "Enter") {
    event.preventDefault();
    console.log("interactive");
  }
});

onUnmounted(() => {
  ws.value.send("stop-phone");
  ws.value.close();
});
</script>

<style scoped>
html {
  font-family: sans-serif;
  background-color: white;
  color: white;
}

.debug {
  color: red;
}

.container {
  overflow: hidden;
  width: 240px;
  height: 320px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  background-color: black;
  color: white;
}

button {
  border: solid yellow 1px;
}

.callerInfo {
  font-size: calc(320px / 15);
  color: white;
}

.makeInteractive {
  position: fixed;
  left: 0;
  top: 0;
  background-color: green;
  border: solid red 1px;
}
</style>
