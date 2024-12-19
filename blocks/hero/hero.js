import { moveInstrumentation } from '../../scripts/scripts.js';

function decorateCoverageVariant(block) {
  const backgroundImageContainer = block.querySelector('div:has(div picture)');
  const heroContentChildren = [];
  const headerContainer = backgroundImageContainer?.nextElementSibling || block.firstChild;
  const descriptionContainer = headerContainer?.nextElementSibling;
  const discountContainer = descriptionContainer.nextElementSibling;

  if (headerContainer) {
    const headerTitle = headerContainer.querySelector('h1') || document.createElement('h1');
    const headerSubTitle = headerContainer.querySelector('h2')
      || headerContainer.querySelector('h3')
      || headerContainer.querySelector('h4')
      || headerContainer.querySelector('h5');
    const titleWrapper = document.createElement('div');
    titleWrapper.classList.add('title-wrapper');
    titleWrapper.append(headerTitle);
    if (headerSubTitle) titleWrapper.append(headerSubTitle);
    const header = headerContainer.firstElementChild;
    header.classList.add('header');
    const icons = Array.from(headerContainer.querySelectorAll('.icon'));
    const headerIcon1 = icons[0];
    const headerIcon2 = icons.length > 1 ? icons[1] : undefined;
    const iconH1 = document.createElement('h1');
    if (headerIcon1) iconH1.append(headerIcon1);
    if (headerIcon2) iconH1.append('+', headerIcon2);
    if (iconH1.innerHTML !== '') {
      iconH1.classList.add('header-icons');
      if (iconH1.childNodes.length === 1) iconH1.classList.add('single');
      header.append(iconH1);
    }
    header.append(titleWrapper);
    heroContentChildren.push(headerContainer);
  }

  if (descriptionContainer) {
    descriptionContainer.firstElementChild?.classList.add('description');
    heroContentChildren.push(descriptionContainer);
  }

  if (discountContainer) {
    const discountDiv = discountContainer.firstElementChild;
    discountDiv.classList.add('discount-wrapper');
    let group = document.createElement('div');
    group.classList.add('group');

    let currentPara = discountDiv.querySelector('p:first-of-type');
    let next = currentPara.nextElementSibling;
    group.append(currentPara);
    while (next) {
      if (next.querySelector('.icon')) {
        discountDiv.prepend(group);
        group = document.createElement('div');
        group.classList.add('group');
      }
      if (currentPara.textContent !== '') currentPara.classList.add('description');
      currentPara = next;
      next = next.nextElementSibling;
      group.append(currentPara);
    }
    if (currentPara.textContent !== '') currentPara.classList.add('description');
    discountDiv.append(group);
    const descriptions = discountContainer.querySelectorAll('.description');
    if (descriptions.length === 1) group.classList.add('single');
    heroContentChildren.push(discountContainer);
  }
  return heroContentChildren;
}

function decorateButtons(block, activeTab) {
  const isTabVariant = block.classList.contains('tabs');
  const rows = Array.from(block.querySelectorAll(':scope > div > div'))
    .filter((row) => {
      const paragraphs = row.querySelectorAll('p');
      if (isTabVariant && paragraphs.length === 1) {
        return paragraphs[0].classList.contains('button-container');
      }
      if (paragraphs.length === 2) {
        return paragraphs[0].querySelector('.icon') !== null
          && paragraphs[1].classList.contains('button-container');
      }
      return false;
    });
  const ul = document.createElement('ul');
  for (let i = 0; i < rows.length; i += 1) {
    if (rows[i].childNodes.length > 0) {
      const li = document.createElement('li');
      const buttonContainer = rows[i].querySelector('.button-container');
      // eslint-disable-next-line no-continue
      if (!buttonContainer) continue;
      const link = buttonContainer.querySelector('a');
      const pWithIcon = rows[i].querySelector('p:has(.icon)');

      if (pWithIcon) {
        const iconSpan = pWithIcon.querySelector('span.icon');
        moveInstrumentation(pWithIcon, iconSpan);
        link.prepend(iconSpan);
      }

      link.classList.add('button');
      if (block.classList.contains('buttons-stack')) {
        if (i === 0) {
          link.classList.add('orange');
        } else {
          link.classList.add('dark');
        }
      }

      if (isTabVariant && i + 1 === activeTab) {
        li.classList.add('active');
      }

      li.append(buttonContainer);
      ul.appendChild(li);
    }
  }
  return ul;
}

function decorateBackgroundImage(block) {
  const backgroundImageContainer = block.querySelector(':scope > div > div:has(picture)')
    || block.querySelector(':scope > div > div'); // using first row as a fallback container
  const backgroundPictures = backgroundImageContainer?.querySelectorAll('picture');
  backgroundPictures?.forEach((picture, index) => {
    let pictureParent = picture.parentNode;
    if (pictureParent?.nodeName !== 'P') {
      pictureParent = document.createElement('p');
      pictureParent.classList.add('background-desktop');
      pictureParent.append(picture);
      backgroundImageContainer.append(pictureParent);
    }
    if (index === 0) pictureParent.classList.add('background-mobile');
    else pictureParent.classList.add('background-desktop');
  });
  return backgroundImageContainer;
}

export default function decorate(block) {
  const isCoverageBlockVariant = block.classList.contains('coverage');
  const isTabsBlockVariant = block.classList.contains('tabs');
  const h1 = block.querySelector('h1');
  const h2 = block.querySelector('h2');
  const h3 = block.querySelector('h3');
  const content = decorateBackgroundImage(block);
  let heroContentChildren = [];

  // find active tab for tabs variant
  let activeTab = 1;
  if (isTabsBlockVariant) {
    const firstPropertyDiv = block.querySelector(':scope > div > div');
    if (firstPropertyDiv && firstPropertyDiv.childNodes.length === 1 && firstPropertyDiv.firstElementChild.nodeName === 'P') {
      const activeTabText = firstPropertyDiv.querySelector('p').textContent;
      if (activeTabText) activeTab = Math.max(activeTab, Number(activeTabText));
    }
    firstPropertyDiv?.parentNode?.remove();
  }

  if (isCoverageBlockVariant) {
    heroContentChildren = decorateCoverageVariant(block);
  }

  if (block.classList.contains('background-gradient')) {
    const gradientOverlay = document.createElement('div');
    gradientOverlay.classList.add('gradient-overlay');
    content.appendChild(gradientOverlay);
  }

  const ul = decorateButtons(block, activeTab);
  if (isTabsBlockVariant) {
    const listItem = document.createElement('li');
    const container = document.createElement('div');
    container.classList.add('search-container');
    container.innerHTML = `
      <img src="${window.hlx.codeBasePath}/images/icon-search-grey.png" alt="Search" />
      <input type="text" id="search" placeholder="Search Articles" >
    `;

    container.querySelector('input').addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        window.location.href = `/landlord-resources?s=${event.target.value}`;
      }
    });
    listItem.appendChild(container);
    ul.appendChild(listItem);
  }

  const heroMenu = document.createElement('div');
  heroMenu.classList.add('hero-menu');
  const heroContent = document.createElement('div');
  heroContent.classList.add('hero-content');

  if (!isCoverageBlockVariant) {
    if (h1) heroContentChildren.push(h1);
    if (h2) heroContentChildren.push(h2);
    if (h3) heroContentChildren.push(h3);

    const headingContainer = block.querySelector('div:has(div > h1)')
      || block.querySelector('div:has(div > h2)')
      || block.querySelector('div:has(div > h3)');

    const description = headingContainer?.nextElementSibling?.querySelector('p');
    if (description) heroContentChildren.push(description);
  }
  heroContent.append(...heroContentChildren);

  if (isTabsBlockVariant) {
    const boxContainer = document.createElement('div');
    boxContainer.classList.add('box-container');
    boxContainer.appendChild(heroContent);
    heroMenu.appendChild(boxContainer);
  } else {
    heroMenu.appendChild(heroContent);
  }

  if (ul.hasChildNodes()) {
    heroMenu.appendChild(ul);
  }
  content.append(heroMenu);
  Array.from(block.querySelectorAll(':scope > div > div')).forEach((div) => {
    const parent = div.parentElement;

    // Check if the div is completely empty (no meaningful content)
    const hasMeaningfulContent = Array.from(div.childNodes).some((node) => {
      // Check for non-whitespace text nodes
      if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
        return true;
      }
      // Check for non-empty elements
      if (node.nodeType === Node.ELEMENT_NODE) {
        if (node.tagName === 'P') {
          return node.textContent.trim() || node.children.length > 0; // Non-empty <p>
        }
        return true; // Other elements are meaningful
      }
      return false;
    });

    if (!hasMeaningfulContent) {
      // If no meaningful content, delete parent of div
      parent.remove();
    } else {
      // Case 3: Remove empty <p> tags inside the div if it has other valid content
      div.querySelectorAll('p').forEach((p) => {
        if (!p.textContent.trim() && p.children.length === 0) {
          p.remove();
        }
      });
    }
  });
}
