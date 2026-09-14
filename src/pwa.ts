import { registerSW } from 'virtual:pwa-register';
import { $ } from './ui/dom';

registerSW({ immediate: true });

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let installEvt: BeforeInstallPromptEvent | null = null;
const installBtn = $('installBtn') as HTMLButtonElement;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  installEvt = e as BeforeInstallPromptEvent;
  installBtn.hidden = false;
});
installBtn.addEventListener('click', async () => {
  if (!installEvt) return;
  await installEvt.prompt();
  await installEvt.userChoice;
  installEvt = null;
  installBtn.hidden = true;
});
window.addEventListener('appinstalled', () => {
  installBtn.hidden = true;
});
