export default async function decorate(block) {
  const [headingContainer, descriptionContainer, ...ctas] = block.querySelectorAll(':scope > div');
  headingContainer?.firstElementChild?.classList.add('heading');
  descriptionContainer?.firstElementChild?.classList.add('description');

  let lastCtaWrapper;
  ctas.forEach((cta) => {
    const ctaWrapper = cta.firstElementChild;
    const [btnText, btnLinkWrapper, btnStyle] = [...ctaWrapper.children];
    if (btnLinkWrapper) {
      let btnLink = btnLinkWrapper.querySelector('a');
      if (!btnLink) {
        btnLink = document.createElement('a');
        btnLink.href = btnLinkWrapper.textContent || '#';
        btnLinkWrapper.textContent = '';
        btnLinkWrapper.append(btnLink);
      }
      btnLinkWrapper.classList.add('button-container');
      btnLink.classList.add('button', btnStyle.textContent || '');
      btnLink.title = btnText.textContent;
      btnLink.textContent = btnText.textContent;
    }
    btnText?.remove();
    btnStyle?.remove();
    // move buttons before description
    descriptionContainer.before(cta);
    if (lastCtaWrapper) lastCtaWrapper.append(...ctaWrapper.children);
    else ctaWrapper.classList.add('cta-wrapper');
    lastCtaWrapper = ctaWrapper;
  });

  Array.from(block.querySelectorAll(':scope > div'))
    .forEach((div) => {
      if (div.firstElementChild?.innerHTML.trim() === '') div.remove();
    });
}
