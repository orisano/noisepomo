((getUserMedia, AudioContext) => {
  function* fnoise() {
    const z = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    const k = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    const N = z.length;
    k[N - 1] = 0.5;
    for (let i = N - 1; i >= 1; i -= 1) {
      k[i - 1] = k[i] * 0.25;
    }

    let out = 0.0;
    while (true) {
      let x = [-1, 1][Math.Floor(Math.random() * 2)];
      for (let i = 0; i < N; i += 1) {
        z[i] = (x * k[i]) + (z[i] * (1.0 - k[i]));
        x = (x + z[i]) * 0.5;
      }
      out = (0.75 * x) + (0.25 * out);
      yield out;
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const KUTE = window.KUTE;
    const gen = fnoise();

    const context = new AudioContext();
    const whiteNoise = context.createScriptProcessor(4096, 1, 1);
    whiteNoise.addEventListener('audioprocess', (ev) => {
      const output = ev.outputBuffer.getChannelData(0);
      for (let i = 0; i < whiteNoise.bufferSize; i += 1) {
        output[i] = gen.next().value * 320;
      }
    });
    const osc = context.createOscillator();
    osc.connect(whiteNoise);

    function work(callback) {
      whiteNoise.connect(context.destination);
      setTimeout(callback, 25 * 60 * 1000);
    }

    function rest() {
      whiteNoise.disconnect();
      setTimeout(() => work(rest), 5 * 60 * 1000);
    }

    const $startButton = document.getElementById('button-start');
    const $stopButton = document.getElementById('button-stop');

    $startButton.addEventListener('click', work);
    $stopButton.addEventListener('click', rest);

    const $action = document.getElementById('action');
    const opt = {
      duration: 2000,
    };
    let flag = true;
    $action.addEventListener('click', () => {
      if (flag) {
        KUTE.fromTo('#left', {
          path: '#play-left',
        }, {
          path: '#pause-left',
        }, opt).start();
        KUTE.fromTo('#right', {
          path: '#play-right',
        }, {
          path: '#pause-right',
        }, opt).start();
      } else {
        KUTE.fromTo('#left', {
          path: '#pause-left',
        }, {
          path: '#play-left',
        }, opt).start();
        KUTE.fromTo('#right', {
          path: '#pause-right',
        }, {
          path: '#play-right',
        }, opt).start();
      }
      flag = !flag;
    });
  });
})(
  window.navigator.getUserMedia
  || window.navigator.webkitGetUserMedia
  || window.navigator.mozGetUserMedia,
  window.AudioContext
  || window.webkitAudioContext
  || window.mozAudioContext,
);
