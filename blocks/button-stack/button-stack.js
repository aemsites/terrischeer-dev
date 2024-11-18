export default function decorate(block) {
  block.querySelectorAll('.button-stack > div').forEach((button) => {
    if (!button.querySelector('a')) {
      button.remove();
      return;
    }

    const a = button.querySelector('a');
    const icon = button.querySelector('span.icon');
    if (icon) a.prepend(icon);

    const lastEl = button.querySelector('p:last-child');
    if (!lastEl.classList.contains('button-container') && lastEl.textContent === 'true') {
      a.classList.add('orange');
    } else {
      a.classList.remove('orange');
      a.classList.add('dark');
    }
    if (!lastEl.classList.contains('button-container')) lastEl.remove();

    const emptyP = button.querySelector('p:not(:has(.button-container))');
    if (emptyP) emptyP.remove();
  });
}
