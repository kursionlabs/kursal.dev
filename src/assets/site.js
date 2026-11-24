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
  const update = () => {
    const dark = root.dataset.theme === 'dark';
    const next = `Switch to ${dark ? 'light' : 'dark'} mode`;
    themeToggle.setAttribute('aria-label', next);
    themeToggle.title = next;
    themeToggle.setAttribute('aria-pressed', String(dark));
    if (themeColor) themeColor.content = dark ? '#0F1424' : '#F3F4F8';
  };
  themeToggle.addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('kursal-theme', root.dataset.theme); } catch {}
    update();
  });
  update();
}

document.querySelectorAll('[data-ledger]').forEach((ledger) => {
  const tabs = [...ledger.querySelectorAll('.ledger-tab')];
  const panels = [...ledger.querySelectorAll('.ledger-panel')];
  const show = (i) => {
    tabs.forEach((t, j) => t.setAttribute('aria-pressed', String(i === j)));
    panels.forEach((p, j) => { p.hidden = i !== j; });
  };
  tabs.forEach((t, i) => t.addEventListener('click', () => show(i)));
  show(0);
});
