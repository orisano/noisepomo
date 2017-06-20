((getUserMedia, AudioContext) => {
  // Takayuki Hosoda's refined method
  // ref. http://www.finetune.co.jp/~lyuka/technote/pinknoise/
  function* genPinkNoiseTH() {
    const z = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    const k = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    const N = z.length;
    k[N - 1] = 0.5;
    for (let i = N - 1; i >= 1; i -= 1) {
      k[i - 1] = k[i] * 0.25;
    }

    let out = 0.0;
    // eslint-disable-next-line
    while (true) {
      let x = [-1, 1][Math.floor(Math.random() * 2)];
      for (let i = 0; i < N; i += 1) {
        z[i] = (k[i] * x) + ((1.0 - k[i]) * z[i]);
        x = (x + z[i]) * 0.5;
      }
      out = (0.75 * x) + (0.25 * out);
      yield out * 320;
    }
  }

  // Paul Kellet's refined method
  // ref. http://www.musicdsp.org/files/pink.txt
  function* genPinkNoisePK() {
    let [b0, b1, b2, b3, b4, b5, b6] = [0, 0, 0, 0, 0, 0, 0];
    // eslint-disable-next-line
    while (true) {
      const x = (Math.random() * 2) - 1;
      b0 = (0.99886 * b0) + (0.0555179 * x);
      b1 = (0.99332 * b1) + (0.0750759 * x);
      b2 = (0.96900 * b2) + (0.1538520 * x);
      b3 = (0.86650 * b3) + (0.3104856 * x);
      b4 = (0.55000 * b4) + (0.5329522 * x);
      b5 = (-0.7616 * b5) + (0.0168980 * x);
      yield (b0 + b1 + b2 + b3 + b4 + b5 + b6 + (x * 0.5362)) * 0.11;
      b6 = 0.115926 * x;
    }
  }

  function* genBrownianNoise() {
    let acc = 0;
    while (true) {
      const x = (Math.random() * 2) - 1;
      acc += x * 0.064;
      yield acc;
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const noise = genPinkNoisePK();
    const gain = 1;

    const context = new AudioContext();
    const BUFFER_SIZE = 4096;
    const scriptProcessor = context.createScriptProcessor(BUFFER_SIZE, 1, 1);
    scriptProcessor.addEventListener('audioprocess', (ev) => {
      const output = ev.outputBuffer.getChannelData(0);
      for (let i = 0; i < BUFFER_SIZE; i += 1) {
        output[i] = noise.next().value * gain;
      }
    });
    const osc = context.createOscillator();
    osc.connect(scriptProcessor);

    class Timer {
      constructor() {
        this.reject = null;
        this.resolve = null;
        this.remain = 0;
        this.handler = -1;
        this.startTime = null;
      }

      start(ms) {
        this.reset();
        this.startTime = Date.now();
        this.remain = ms;
        return new Promise((resolve, reject) => {
          this.resolve = resolve;
          this.reject = reject;
          this.handler = setTimeout(resolve, ms);
        }).then(() => {
          this.resolve = null;
          this.reject = null;
          this.remain = 0;
          this.handler = -1;
        });
      }

      stop() {
        if (this.reject === null) return;
        this.reject();
        this.reject = null;
      }

      reset() {
        if (this.handler === -1) return;
        clearTimeout(this.handler);
        this.handler = -1;
      }

      pause() {
        if (this.handler === -1) return;
        clearTimeout(this.handler);
        this.handler = -1;
        this.remain -= Date.now() - this.startTime;
        this.remain = Math.max(this.remain, 0);
      }

      resume() {
        if (this.handler !== -1) return;
        this.startTime = Date.now();
        this.handler = setTimeout(this.resolve, this.remain);
      }
    }
    function work(callback) {
      scriptProcessor.connect(context.destination);
      setTimeout(callback, 25 * 60 * 1000);
    }

    function rest() {
      scriptProcessor.disconnect();
      setTimeout(() => work(rest), 5 * 60 * 1000);
    }

    const $actionButton = document.getElementById('action-button');
    const $action = document.getElementById('action');
    const nextState = {
      '#play': '#pause',
      '#pause': '#play',
    };

    $action.addEventListener('custom-play', work);
    $action.addEventListener('custom-pause', rest);

    $action.addEventListener('transitionend', () => {
      if ($action.classList.contains('disabled')) {
        $action.href.baseVal = nextState[$action.href.baseVal];
        $action.classList.remove('disabled');
      }
    });
    $actionButton.addEventListener('click', () => {
      if ($action.classList.contains('disabled')) {
        return;
      }

      const action = `custom-${$action.href.baseVal.substr(1)}`;
      const event = new window.CustomEvent(action, {});
      $action.dispatchEvent(event);
      $action.classList.add('disabled');
    });
  });
})(
  window.navigator.getUserMedia ||
    window.navigator.webkitGetUserMedia ||
    window.navigator.mozGetUserMedia,
  window.AudioContext || window.webkitAudioContext || window.mozAudioContext,
);
