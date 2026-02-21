let beep: HTMLAudioElement | null = null;

export function initBeep(src: string, volume = 0.4) {
  if (!beep) {
    beep = new Audio(src);
    beep.volume = volume;
  }
}

export function playBeep() {
  if (!beep) return;
  beep.currentTime = 0;
  beep.play().catch(() => {});
}

export function stopBeep() {
  if (!beep) return;
  beep.pause();
  beep.currentTime = 0;
}
