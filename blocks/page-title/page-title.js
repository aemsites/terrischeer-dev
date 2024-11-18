import { createElement } from '../../scripts/blocks-utils.js';

const DROPDOWN_ICON_TEAL = `${window.hlx.codeBasePath}/icons/chevron-down-teal.svg`;
const DROPDOWN_ICON_WHITE = `${window.hlx.codeBasePath}/icons/chevron-down-white.svg`;

function createPageTitle(content) {
  const titleDiv = createElement('div', 'left-title');
  titleDiv.appendChild(content?.firstElementChild);
  return titleDiv;
}

function clickEvent(button, ul, chevronIcon) {
  button.addEventListener('click', () => {
    ul.classList.toggle('visible');
    button.classList.toggle('visible');
    chevronIcon.src = `${DROPDOWN_ICON_WHITE}`;
  });
  // close dropdown list when click outside
  window.addEventListener('click', (e) => {
    if (!button.contains(e.target) && !ul.contains(e.target)) {
      ul.classList.remove('visible');
      button.classList.remove('visible');
      chevronIcon.src = `${DROPDOWN_ICON_TEAL}`;
    }
  });
  // change icon by mouseover event
  button.addEventListener('mouseover', () => {
    chevronIcon.src = `${DROPDOWN_ICON_WHITE}`;
  });
  button.addEventListener('mouseleave', () => {
    if (!button.classList.contains('visible')) {
      chevronIcon.src = `${DROPDOWN_ICON_TEAL}`;
    }
  });
}

function createCategoryMenu(dropdownTitle, dropdownList) {
  const categoryDropdown = createElement('div', 'right-dropdown');
  const categoryButton = createElement('button', 'category-button');
  const buttonTitle = createElement('span', 'button-title');
  buttonTitle.textContent = dropdownTitle?.textContent;
  const chevronIcon = createElement('img', 'dropdown-icon');
  chevronIcon.src = `${DROPDOWN_ICON_TEAL}`;
  chevronIcon.alt = 'Dropdown chevron icon';
  categoryButton.appendChild(buttonTitle);
  categoryButton.appendChild(chevronIcon);
  const dropdown = dropdownList.querySelector('ul');
  clickEvent(categoryButton, dropdown, chevronIcon);
  categoryDropdown.appendChild(categoryButton);
  if (dropdown) categoryDropdown.appendChild(dropdown);
  return categoryDropdown;
}

export default async function decorate(block) {
  const [title, flag, dropdownTitle, dropdownList] = block.querySelectorAll(':scope > div > div');
  const pageTitle = createPageTitle(title);
  const container = createElement('div', 'page-title-container');
  container.append(pageTitle);
  if (flag?.innerText === 'true') {
    const categoryMenu = createCategoryMenu(dropdownTitle, dropdownList);
    container.append(categoryMenu);
  }
  block.replaceChildren(container);
}
