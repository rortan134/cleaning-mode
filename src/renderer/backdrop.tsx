// Prevent Alt+F4
window.addEventListener('keydown', (e) => {
  const { key, altKey } = e;
  if (key === 'F4' && altKey) {
    e.preventDefault();
  }
});

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
let secondTimer: NodeJS.Timeout | undefined;

let started = false;

function inactive() {
  // reset state
  timingIndicator.style.opacity = '0';
  clearInterval(timerUntilClose);
  clearTimeout(secondTimer);
  started = false;
}

function checkActivity() {
  mouseActivityTimeout = setTimeout(inactive, 500);
}

function detectMouseMovement() {
  clearTimeout(mouseActivityTimeout);

  if (!started) {
    let timeLeft = 2;
    timingIndicator.textContent = `${timingIndicatorContent} ${timeLeft} seconds`;

    secondTimer = setInterval(() => {
      timeLeft -= 1;
      timingIndicator.textContent = `${timingIndicatorContent} ${timeLeft} seconds`;

      if (timeLeft <= 0) {
        clearInterval(secondTimer);
        timingIndicator.textContent = `${timingIndicatorContent} ${timeLeft} seconds`;
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

window.electron.ipcRenderer.on('backdrop', (val) => {
  const isActive = (val as unknown as boolean[])[0];

  // 5 minutes in seconds
  let countdown: number | null = 300;

  const timer = setInterval(() => {
    if (!countdown) return;

    if (countdown <= 0) {
      window.clearInterval(timer);
      countdown = null;
      return;
    }

    countdown -= 1;
    subtitle.textContent = `${content} ${formatSeconds(countdown)}m`;
  }, 1000);

  if (isActive) {
    setTimeout(() => {
      root.addEventListener('mousemove', detectMouseMovement, false);
    }, 1000);

    subtitle.textContent = `${content} ${formatSeconds(countdown)}m`;

    root.style.animation =
      'show 0.25s cubic-bezier(0.215, 0.610, 0.355, 1.000) forwards';
  } else {
    root.removeEventListener('mousemove', detectMouseMovement, false);

    root.style.animation =
      'hide 0.1s cubic-bezier(0.215, 0.610, 0.355, 1.000) forwards';

    window.clearInterval(timer);
    subtitle.textContent = content ?? null;
    // reset counter
    countdown = 300;
  }
});
