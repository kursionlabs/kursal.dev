document.querySelectorAll('pre').forEach((pre) => {
  if (pre.closest('.welcome-example, .hero-visual, .example-panel, .overview-code, .overview-compiler, .home')) return;
  const button = document.createElement('button');
  button.className = 'copy-button';
  button.type = 'button';
  button.textContent = 'Copy';
  button.setAttribute('aria-label', 'Copy code');
  button.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(pre.querySelector('code')?.textContent ?? '');
      button.textContent = 'Copied';
      setTimeout(() => { button.textContent = 'Copy'; }, 1800);
    } catch {
      button.textContent = 'Select text';
    }
  });
  pre.append(button);
});

const themeToggle = document.querySelector('[data-theme-toggle]');
if (themeToggle) {
  const root = document.documentElement;
  const themeColor = document.querySelector('meta[name="theme-color"]');
  const updateToggle = () => {
    const light = root.dataset.theme === 'light';
    const nextMode = `Switch to ${light ? 'dark' : 'light'} mode`;
    themeToggle.setAttribute('aria-label', nextMode);
    themeToggle.title = nextMode;
    themeToggle.setAttribute('aria-pressed', String(light));
    if (themeColor) themeColor.content = light ? '#F7FAFC' : '#1B1D2E';
  };
  themeToggle.addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'light' ? 'dark' : 'light';
    try { localStorage.setItem('kursal-theme', root.dataset.theme); } catch {}
    updateToggle();
  });
  updateToggle();
}
