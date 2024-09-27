import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  const rows = block.querySelectorAll(':scope > div > div');
  const content = rows[0];
  const h1 = content.querySelector('h1');
  const h2 = content.querySelector('h2');
  const h3 = content.querySelector('h3');
  const allPTags = content.querySelectorAll('p');
  const pTagsWithPicture = Array.from(allPTags).filter((p) => p.querySelector('.icon'));
  // eslint-disable-next-line arrow-body-style
  const pTagsWithoutIconOrPicture = Array.from(allPTags).filter((p) => {
    return !p.querySelector('.icon') && !p.querySelector('picture');
  });

  if (block.classList.contains('background-gradient')) {
    const backgroundImageContainer = content.querySelector('p:has(picture)');
    const gradientOverlay = document.createElement('div');
    gradientOverlay.classList.add('gradient-overlay');
    backgroundImageContainer.appendChild(gradientOverlay);
  }

  if (block.classList.contains('coverage')) {
    // Decorate heading
    if (h1 && pTagsWithPicture[0] && pTagsWithPicture[1]) {
      const icon1 = pTagsWithPicture[0].querySelector('.icon');
      moveInstrumentation(pTagsWithPicture[0], icon1);
      const icon2 = pTagsWithPicture[1].querySelector('.icon');
      moveInstrumentation(pTagsWithPicture[1], icon2);
      h1.prepend(icon2);
      h1.prepend('+');
      h1.prepend(icon1);
      pTagsWithPicture[0].remove();
      pTagsWithPicture[1].remove();
    }

    // Decorate paragraph
    if (pTagsWithoutIconOrPicture[1] && pTagsWithPicture[2]) {
      const icon = pTagsWithPicture[2].querySelector('.icon');
      moveInstrumentation(pTagsWithPicture[2], icon);
      pTagsWithoutIconOrPicture[1].prepend(icon);
      pTagsWithPicture[2].remove();
    }

    const pTagsWithIcon = Array.from(allPTags).filter((p) => p.querySelector('.icon'));
    pTagsWithIcon.forEach((p) => {
      const textSpan = document.createElement('span');
      textSpan.classList.add('icon-text');
      Array.from(p.childNodes).forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE && node.classList.contains('icon')) {
          // Skip the icon span
          return;
        }
        textSpan.appendChild(node);
      });
      p.appendChild(textSpan);
      moveInstrumentation(p, textSpan);
    });
  }

  const activeTab = 3;
  const ul = document.createElement('ul');
  for (let i = 1; i < rows.length; i += 1) {
    if (rows[i].childNodes.length > 0) {
      const li = document.createElement('li');
      const buttonContainer = rows[i].querySelector('.button-container');
      const link = buttonContainer.querySelector('a');
      const pWithIcon = rows[i].querySelector('p:has(.icon)');
      if (pWithIcon) {
        const iconSpan = pWithIcon.querySelector('span.icon');
        moveInstrumentation(pWithIcon, iconSpan);
        link.prepend(iconSpan);
      }
      link.classList.add('button');

      if (block.classList.contains('buttons-stack')) {
        if (i === 1) {
          link.classList.add('orange');
        } else {
          link.classList.add('dark');
        }
      }

      if (block.classList.contains('tabs') && i === activeTab) {
        li.classList.add('active');
      }

      li.append(buttonContainer);
      ul.appendChild(li);
    }
    rows[i].parentNode.remove();
  }

  if (block.classList.contains('tabs')) {
    const searchBar = document.createElement('li');
    searchBar.innerHTML = `
    <img src="${window.hlx.codeBasePath}/images/icon-search-grey.png" alt="Search" />
    <input type="text" id="search" placeholder="Search Articles" >
    `;
    ul.appendChild(searchBar);
  }

  const heroMenu = document.createElement('div');
  heroMenu.classList.add('hero-menu');
  const heroContent = document.createElement('div');
  heroContent.classList.add('hero-content');

  if (h1) {
    heroContent.appendChild(h1);
  }
  if (h2) {
    heroContent.appendChild(h2);
  }
  if (h3) {
    heroContent.appendChild(h3);
  }

  for (let i = 0; i < pTagsWithoutIconOrPicture.length; i += 1) {
    heroContent.appendChild(pTagsWithoutIconOrPicture[i]);
  }

  heroMenu.appendChild(heroContent);
  heroMenu.appendChild(ul);
  content.appendChild(heroMenu);
}
