const root = document.getElementById('root') as HTMLElement;

function formatSeconds(duration: number) {
  // Hours, minutes and seconds
  // eslint-disable-next-line no-bitwise
  const hrs = ~~(duration / 3600);
  // eslint-disable-next-line no-bitwise
  const mins = ~~((duration % 3600) / 60);
  // eslint-disable-next-line no-bitwise
  const secs = ~~duration % 60;

  // Output like "1:01" or "4:03:59" or "123:03:59"
  let ret = '';

  if (hrs > 0) {
    ret += `${hrs}:${mins < 10 ? '0' : ''}`;
  }
  ret += `${mins}:${secs < 10 ? '0' : ''}`;
  ret += `${secs}`;
  return ret;
}

const timingIndicator = document.getElementById(
  'clean-movement-indicator'
) as HTMLElement;
const timingIndicatorContent = timingIndicator.textContent?.slice();

let mouseActivityTimeout: NodeJS.Timeout | undefined;
let timerUntilClose: NodeJS.Timeout | undefined;

let started = false;

function inactive() {
  // reset state
  timingIndicator.style.opacity = '0';
  clearInterval(timerUntilClose);
  started = false;
}

function checkActivity() {
  mouseActivityTimeout = setTimeout(inactive, 500);
}

function setTimingIndicator(timeLeft: number) {
  timingIndicator.textContent = `${timingIndicatorContent} ${timeLeft} seconds`;
}

function detectMouseMovement() {
  clearTimeout(mouseActivityTimeout);

  if (!started) {
    let timeLeft = 2;
    setTimingIndicator(timeLeft);

    timerUntilClose = setInterval(() => {
      timeLeft -= 1;
      setTimingIndicator(timeLeft);

      if (timeLeft <= 0) {
        clearInterval(timerUntilClose);
        started = false;
        window.electron.ipcRenderer.sendMessage('activate', [false]);
      }
    }, 1000);

    started = true;
  }

  timingIndicator.style.opacity = '1';

  checkActivity();
}

const subtitle = document.getElementById('clean-subtitle') as HTMLElement;
const content = subtitle.textContent?.slice();
let countdown: NodeJS.Timeout | undefined;

function setSubtitle(timeLeft: number) {
  subtitle.textContent = `${content} ${formatSeconds(timeLeft)} ${
    timeLeft > 60 ? 'm' : 's'
  }`;
}

function endCountdown() {
  clearInterval(countdown);
  subtitle.textContent = content ?? null; // reset
}

function startCountdown() {
  let timeLeft = 300; // 5 minutes in seconds
  setSubtitle(timeLeft);

  countdown = setInterval(() => {
    timeLeft -= 1;
    setSubtitle(timeLeft);

    if (timeLeft <= 0) {
      window.electron.ipcRenderer.sendMessage('activate', [false]);
    }
  }, 1000);
}

window.electron.ipcRenderer.on('backdrop', (val) => {
  const isActive = (val as unknown as boolean[])[0];

  if (isActive) {
    startCountdown();

    setTimeout(() => {
      root.addEventListener('mousemove', detectMouseMovement, false);
    }, 1000);

    // slide animation
    root.style.animation =
      'show 0.25s cubic-bezier(0.215, 0.610, 0.355, 1.000) forwards';
  } else {
    endCountdown();

    root.removeEventListener('mousemove', detectMouseMovement, false);

    root.style.animation =
      'hide 0.1s cubic-bezier(0.215, 0.610, 0.355, 1.000) forwards';
  }
});
