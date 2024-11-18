import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';
import { openSearchBar } from '../../scripts/blocks-utils.js';

const DROPDOWN_ICON = `${window.hlx.codeBasePath}/icons/chevron-down-black.svg`;
const HAMBURGER_ICON = `${window.hlx.codeBasePath}/icons/hamburger-white.svg`;

/**
 * Handles menu dropdown menu keyboard interaction
 * @param {Element} e The keydown event
 */
function openOnKeydown(e) {
  const focused = document.activeElement;
  const isNavDrop = focused.className === 'nav-drop';
  if (isNavDrop && (e.code === 'Enter' || e.code === 'Space')) {
    const dropExpanded = focused.getAttribute('aria-expanded') === 'true';
    focused.setAttribute('aria-expanded', dropExpanded ? 'false' : 'true');
  }
}

/**
 * Toggles the mobile menu
 * @param {Element} hamburgerButton The mobile hamburger button element
 * @param {Element} navMobileMenu The nav mobile menu section within the container element
 */
function toggleMenu(hamburgerButton, navMobileMenu) {
  const expanded = navMobileMenu.getAttribute('aria-expanded') === 'true';
  navMobileMenu.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  if (navMobileMenu.getAttribute('aria-expanded') === 'true') {
    const numMenuItems = navMobileMenu.querySelector('ul').childElementCount;
    navMobileMenu.style.visibility = 'visible';
    navMobileMenu.style.height = `${3.15 * numMenuItems}rem`;
    setTimeout(() => { navMobileMenu.style.height = 'auto'; }, 300);
  } else {
    const numMenuItems = navMobileMenu.querySelector('ul').childElementCount;
    navMobileMenu.style.visibility = 'hidden';
    navMobileMenu.style.height = `${50 * numMenuItems}px`;
    setTimeout(() => { navMobileMenu.style.height = '0'; }, 1);
  }
  hamburgerButton.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
  navMobileMenu.querySelectorAll('.nav-drop').forEach((menuItem) => {
    menuItem.setAttribute('aria-expanded', 'false');
  });
}

/**
 * Enable expanding for menu items
 * @param {Element} menu The menu element
 * @param {*} closeOthers Boolean determining whether only one menu should be expanded at a time
 */
function enableMenuExpanding(menu) {
  menu.querySelectorAll(':scope .default-content-wrapper > ul > li').forEach((menuItem) => {
    if (menuItem.querySelector('ul')) {
      menuItem.classList.add('nav-drop');
      const chevronIcon = document.createElement('img');
      chevronIcon.setAttribute('src', DROPDOWN_ICON);
      chevronIcon.setAttribute('alt', 'Dropdown chevron icon');
      if (menu.classList.contains('nav-mobile-menu')) {
        menuItem.prepend(chevronIcon);
      } else {
        menuItem.insertBefore(chevronIcon, menuItem.querySelector('ul'));
      }
    }
    const navDrops = menu.querySelectorAll('.nav-drop');
    navDrops.forEach((drop) => {
      if (!drop.hasAttribute('tabindex')) {
        drop.setAttribute('tabindex', 0);
        drop.addEventListener('focus', document.activeElement.addEventListener('keydown', openOnKeydown));
      }
    });
  });
}

/**
 * Toggles the search button visibility
 */
function toggleSearchButton(searchButton) {
  const expanded = searchButton.getAttribute('aria-expanded') || 'false';
  if (expanded === 'true') {
    searchButton.style.visibility = 'visible';
    searchButton.setAttribute('aria-expanded', 'false');
  } else {
    searchButton.style.visibility = 'hidden';
    searchButton.setAttribute('aria-expanded', 'true');
  }
}

/**
 * Decorates a dropdown item on desktop
 * @param {Element} ddItem The dropdown item element
 */
function buildDropdownItem(ddItem) {
  const ddLink = ddItem.querySelector('a').getAttribute('href');
  const ddTitleText = ddItem.querySelector('a').textContent;
  ddItem.querySelector('a').remove();
  const decoratedDD = document.createElement('a');
  decoratedDD.setAttribute('href', ddLink);

  const ddTitleRow = document.createElement('div');
  decoratedDD.append(ddTitleRow);
  ddTitleRow.append(ddItem.querySelector('span'));

  const ddTitle = document.createElement('h3');
  ddTitle.textContent = ddTitleText;
  ddTitleRow.append(ddTitle);

  /* Add button if it exists within ddItem */
  if (ddItem.querySelector('a')) decoratedDD.append(ddItem.querySelector('a'));

  const ddText = document.createElement('p');
  ddText.textContent = ddItem.textContent;
  decoratedDD.insertBefore(ddText, decoratedDD.querySelector('a'));

  ddItem.textContent = '';
  ddItem.append(decoratedDD);
}

/**
 * Decorates the dropdown menu on desktop
 * @param {Element} dropdownMenu The dropdown list parent item
 */
function buildDropdownMenu(dropdownMenu) {
  const ddItemsFlex = document.createElement('div');
  ddItemsFlex.classList.add('dropdown-flex');

  dropdownMenu.querySelectorAll('li:not(:last-child)').forEach((ddItem) => {
    buildDropdownItem(ddItem);
    ddItemsFlex.append(ddItem);
  });
  dropdownMenu.querySelector('ul').prepend(ddItemsFlex);

  const compareDesktop = dropdownMenu.querySelector('ul > li:last-child');
  buildDropdownItem(compareDesktop);

  const compareTablet = dropdownMenu.querySelector('ul > li:last-child').cloneNode(true);
  compareDesktop.classList.add('compare-desktop');
  compareTablet.classList.add('compare-tablet');
  const tabletIcon = compareTablet.querySelector('span');
  compareTablet.querySelector('a').prepend(tabletIcon);
  compareTablet.querySelector('div').append(compareTablet.querySelector('p'));
  dropdownMenu.querySelector('ul').append(compareTablet);
}

/**
 * Build the mobile header buttons
 * @param {Element} mobileActions The mobile action buttons container element
 * @param {Element} searchIcon The search icon element
 * @param {Element} contactIcon The contact icon element
 * @param {string} contactLink The contact href value
 */
function buildMobileActionButtons(mobileActions, searchIcon, contactIcon, contactLink) {
  // Search
  const search = document.createElement('div');
  search.classList.add('nav-mobile-action-search');
  const searchBtn = document.createElement('button');
  searchBtn.setAttribute('aria-label', 'Search');
  searchBtn.append(searchIcon.cloneNode(true));
  search.append(searchBtn);
  mobileActions.appendChild(search);

  // Contact
  const contact = document.createElement('div');
  contact.classList.add('nav-mobile-action-contact');
  contact.innerHTML = `<a aria-label="Contact" href="${contactLink}"></a>`;
  contact.querySelector('a').appendChild(contactIcon.cloneNode(true));
  mobileActions.appendChild(contact);

  // Hamburger
  const hamburger = document.createElement('div');
  hamburger.classList.add('nav-mobile-action-hamburger');
  hamburger.innerHTML = `
    <button type="button" aria-controls="nav" aria-label="Open navigation">
      <img src="${HAMBURGER_ICON}" alt="Mobile menu"/>
    </button>`;
  mobileActions.appendChild(hamburger);
}

function handleSearchButtonClick(button) {
  toggleSearchButton(button);
  openSearchBar(toggleSearchButton, button);
}

/**
 * Loads and decorates the header
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  // Load nav as fragment
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const fragment = await loadFragment(navPath);

  // Decorate nav DOM
  block.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';
  nav.classList.add('header-section');
  while (fragment.firstElementChild) nav.append(fragment.firstElementChild);

  /* Brand section */
  const navBrand = nav.querySelector('.nav-brand');
  const navLink = navBrand.querySelector('a');
  const navHref = navLink.getAttribute('href');
  navBrand.querySelector('.button-container').textContent = navLink.textContent;
  navBrand.querySelector('.button-container').classList.add('brand-subtext');
  navBrand.querySelector('.brand-subtext').classList.remove('button-container');
  const brandLink = document.createElement('a');
  brandLink.setAttribute('href', navHref);
  brandLink.setAttribute('aria-label', 'Go to homepage');
  brandLink.append(navBrand.querySelector('.default-content-wrapper'));
  navBrand.append(brandLink);

  /* Contact section */
  const navContact = nav.querySelector('.nav-contact');
  const contactIcon = navContact.querySelector('span');
  const contactLink = navContact.querySelector('a').getAttribute('href');
  const contactIconLink = document.createElement('a');
  contactIconLink.setAttribute('href', contactLink);
  contactIconLink.setAttribute('title', 'Contact us');
  contactIconLink.append(contactIcon);
  navContact.prepend(contactIconLink);

  /* Search section */
  const searchSection = nav.querySelector('.nav-search');
  const searchIcon = searchSection.querySelector('span');
  searchSection.remove();

  /* Desktop menu section */
  const navDesktopMenu = nav.querySelector('.nav-desktop-menu');
  navDesktopMenu.querySelector('.default-content-wrapper').classList.add('header-section');
  const searchButton = document.createElement('button');
  searchButton.setAttribute('aria-label', 'Open search field');
  searchButton.append(searchIcon.cloneNode(true));
  if (navDesktopMenu) {
    enableMenuExpanding(navDesktopMenu);
    navDesktopMenu.querySelector('.default-content-wrapper').append(searchButton);
    navDesktopMenu.querySelectorAll(':scope .default-content-wrapper > ul > li.nav-drop').forEach((menuItem) => {
      buildDropdownMenu(menuItem);
      menuItem.addEventListener('mouseover', () => menuItem.setAttribute('aria-expanded', 'true'));
      menuItem.addEventListener('mouseout', () => menuItem.setAttribute('aria-expanded', 'false'));
    });
  }

  searchButton.addEventListener('click', () => handleSearchButtonClick(searchButton));

  /* Mobile menu section */
  const navMobileMenu = nav.querySelector('.nav-mobile-menu');
  navMobileMenu.classList.add('header-section');
  if (navMobileMenu) {
    enableMenuExpanding(navMobileMenu, 'click');
    navMobileMenu.querySelectorAll(':scope .default-content-wrapper > ul > li').forEach((menuItem) => {
      menuItem.addEventListener('click', () => {
        const expanded = menuItem.getAttribute('aria-expanded') === 'true';
        menuItem.setAttribute('aria-expanded', expanded ? 'false' : 'true');
      });
    });
  }

  /* Mobile action buttons */
  const mobileActions = document.createElement('div');
  mobileActions.classList.add('nav-mobile-action-group');
  buildMobileActionButtons(mobileActions, searchIcon, contactIcon, contactLink);
  const hamburger = mobileActions.querySelector('.nav-mobile-action-hamburger');
  hamburger.addEventListener('click', () => toggleMenu(hamburger, navMobileMenu));
  const search = mobileActions.querySelector('.nav-mobile-action-search');
  const mobileSearchButton = search.querySelector('button');
  mobileSearchButton.addEventListener('click', () => handleSearchButtonClick(mobileSearchButton));
  nav.append(mobileActions);

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);
  block.append(navDesktopMenu);
  block.append(navMobileMenu);
}
