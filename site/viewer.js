const screen = document.querySelector('.device-screen');
const frame = document.getElementById('app-frame');
function fitApp() {
  const scale = screen.clientWidth / 393;
  frame.style.setProperty('--app-scale', scale);
  frame.style.height = `${screen.clientHeight / scale}px`;
}
new ResizeObserver(fitApp).observe(screen);
fitApp();
