const $ = (id) => document.getElementById(id);
const splash = $('splash'), login = $('login'), success = $('success'), dialog = $('auth-dialog');
let provider = 'phone', timer, transitionTimer, busy = false;
function showLogin() {
  clearTimeout(timer);
  splash.hidden = true; success.hidden = true; login.hidden = false;
}
$('skip').addEventListener('click', showLogin);
showLogin();
function openAuth(name) {
  provider = name;
  $('auth-form').reset(); $('error').textContent = '';
  $('phone-fields').hidden = name !== 'phone';
  $('dialog-title').textContent = name === 'phone' ? 'Log in with your phone' : `Log in with ${name}`;
  $('dialog-description').textContent = name === 'phone' ? 'Enter your phone number to try the login demo.' : `Try the ${name} login demo. No third-party authorization will open.`;
  $('submit-label').textContent = 'Try demo login'; $('submit').disabled = false;
  dialog.showModal();
}
$('one-click').addEventListener('click', () => openAuth('phone'));
document.querySelectorAll('[data-provider]').forEach(button => button.addEventListener('click', () => openAuth(button.dataset.provider)));
function cancelAuth() { clearTimeout(transitionTimer); busy = false; $('submit').disabled = false; dialog.close(); }
$('close-dialog').addEventListener('click', cancelAuth);
dialog.addEventListener('cancel', () => { clearTimeout(transitionTimer); busy = false; $('submit').disabled = false; });
dialog.addEventListener('click', e => { if (e.target === dialog) { const r = dialog.getBoundingClientRect(); if(e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) cancelAuth(); } });
$('auth-form').addEventListener('submit', e => {
  e.preventDefault(); if (busy) return;
  $('error').textContent = '';
  $('phone').removeAttribute('aria-invalid');
  if (provider === 'phone' && !/^1[3-9]\d{9}$/.test($('phone').value.trim())) {
    $('error').textContent = 'Enter a valid 11-digit mainland China phone number.'; $('phone').setAttribute('aria-invalid', 'true'); $('phone').focus(); return;
  }
  if (!$('consent').checked) { $('error').textContent = 'Please check the box to acknowledge the demo notice.'; $('consent').focus(); return; }
  busy = true; $('submit').disabled = true; $('submit-label').textContent = 'Logging in…';
  transitionTimer = setTimeout(() => {
    $('auth-form').reset(); dialog.close(); busy = false;
    window.location.href = 'map.html';
  }, 900);
});
$('restart').addEventListener('click', () => { showLogin(); $('one-click').focus(); });
$('info').addEventListener('click', () => openAuth('phone'));
