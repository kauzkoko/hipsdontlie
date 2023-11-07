import OBSWebSocket from "obs-websocket-js";

export const useOBS = async () => {
  const obs = ref();
  const switchToScene = ref();
  const disconnect = ref();

  onMounted(async () => {
    obs.value = new OBSWebSocket();

    switchToScene.value = async (sceneName) => {
      await obs.value.call("SetCurrentProgramScene", { sceneName });
    };

    disconnect.value = async () => {
      await obs.value.disconnect();
    };

    try {
      const { obsWebSocketVersion, negotiatedRpcVersion } =
        await obs.value.connect("ws://localhost:4455", "3VxEVGnjQouRMnMG", {
          rpcVersion: 1,
        });
      console.log(
        `OBS: Connected to server ${obsWebSocketVersion} (using RPC ${negotiatedRpcVersion})`
      );
    } catch (error) {
      console.error("Failed to connect", error.code, error.message);
    }
  });

  return { obs, switchToScene, disconnect };
};
