(function(getUserMedia, AudioContext) {
  "use strict";

  function* pinkFilter() {
    const z = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    const k = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    const N = z.length;

    k[N - 1] = 0.5;
    for (let i = N - 1; i >= 1; i--) {
      k[i - 1] = k[i] * 0.25;
    }

    let out = 0.0;
    while (true) {
      let x = yield out * 1000;
      for (let i = 0; i < N; i++) {
        z[i] = (x * k[i] + z[i] * (1.0 - k[i])); 
        x = (x + z[i]) * 0.5;
      }
      out = 0.75 * x + 0.25 * out;
    }
  }

  document.addEventListener("DOMContentLoaded", function() {
    const gen = pinkFilter();

    const context = new AudioContext();
    const whiteNoise = context.createScriptProcessor(4096, 1, 1);
    whiteNoise.addEventListener("audioprocess", function(ev) {
      const output = ev.outputBuffer.getChannelData(0);
      for (let i = 0; i < whiteNoise.bufferSize; i++) {
        output[i] = gen.next(((Math.random() * 2 | 0) & 1) ? 1 : -1).value;
      }
    });
    const osc = context.createOscillator();
    osc.connect(whiteNoise);

    function work() {
      whiteNoise.connect(context.destination);
      setTimeout(25 * 60 * 1000, rest);
    }

    function rest() {
      whiteNoise.disconnect();
      setTimeout(5 * 60 * 1000, work);
    }

    const $startButton = document.getElementById("button-start");
    const $stopButton = document.getElementById("button-stop");

    $startButton.addEventListener("click", work);
    $stopButton.addEventListener("click", rest);
  });
})(
  navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia,
  window.AudioContext || window.webkitAudioContext || window.mozAudioContext
);
