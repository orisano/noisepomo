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
    // eslint-disable-next-line
    while (true) {
      let x = [-1, 1][Math.floor(Math.random() * 2)];
      for (let i = 0; i < N; i += 1) {
        z[i] = (x * k[i]) + (z[i] * (1.0 - k[i]));
        x = (x + z[i]) * 0.5;
      }
      out = (0.75 * x) + (0.25 * out);
      yield out;
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
  window.navigator.getUserMedia
  || window.navigator.webkitGetUserMedia
  || window.navigator.mozGetUserMedia,
  window.AudioContext
  || window.webkitAudioContext
  || window.mozAudioContext,
);
