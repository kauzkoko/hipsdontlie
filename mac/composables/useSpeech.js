export const useSpeech = (options) => {
  const text = ref("");
  const { speak, stop, toggle, status, isPlaying, utterance } =
    useSpeechSynthesis(text, {
      lang: options?.lang ?? "de-GER",
      rate: options?.rate ?? 1.15,
      pitch: options?.pitch ?? 1,
      volume: 3,
    });
  const speakText = (_text) => {
    text.value = _text;
    speak();
  };
  return { speakText, speak, stop, toggle, status, isPlaying };
};
