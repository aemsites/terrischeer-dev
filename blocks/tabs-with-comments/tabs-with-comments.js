import { buildBlock, decorateBlock, loadBlock } from '../../scripts/aem.js';

const BREAKPOINTS = {
  mobile: '(max-width: 767px)',
  tablet: '(max-width: 991px)',
  desktop: '(min-width: 992px)',
};

function isDesktop() {
  return window.matchMedia(BREAKPOINTS.desktop).matches;
}

function setActiveLink(link, block) {
  block.querySelectorAll('.custom-side-nav li').forEach((item) => {
    item.classList.remove('active');
  });
  link.parentElement.classList.add('active');
}

function handleTabSelection(link, sections, block) {
  sections.forEach((section) => {
    section.style.display = 'none';
  });
  sections[link.dataset.target].style.display = 'block';
  setActiveLink(link, block);
  window.history.pushState(null, '', link.href);
  localStorage.setItem('activeLinkPath', link.href);
}

function highlightCurrentLink(sideNavList, sections, block) {
  const activeLinkPath = localStorage.getItem('activeLinkPath');
  const currentPath = window.location.pathname;
  sections.forEach((section) => {
    section.style.display = 'none';
  });
  const links = Array.from(sideNavList.querySelectorAll('a'));
  let activeLink = links
    .find((link) => link.href.endsWith(currentPath) || link.href.endsWith(activeLinkPath));
  if (activeLink) {
    setActiveLink(activeLink, block);
  } else {
    // eslint-disable-next-line prefer-destructuring
    activeLink = links[0];
  }
  sections[activeLink.dataset.target].style.display = 'block';
  const dropDown = block.querySelector('.dropdown-list');
  if (dropDown) dropDown.value = activeLink.getAttribute('data-target') || 0;
}

function createSideNavigation(links, sections, block) {
  const sideNav = document.createElement('nav');
  sideNav.className = 'custom-side-nav';
  const sideNavList = document.createElement('ul');
  const exampleLink = links[0];
  const url = new URL(exampleLink.href);
  const basePath = url.pathname.split('/').slice(0, -2).join('/'); // Exclude the last segment

  links.forEach((button, index) => {
    const listItem = document.createElement('li');
    const link = document.createElement('a');
    link.href = `${basePath}/${button.textContent
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')}`;
    link.textContent = button.textContent;
    link.dataset.target = index;
    listItem.appendChild(link);

    link.addEventListener('click', (event) => {
      event.preventDefault();
      handleTabSelection(link, sections, block);
    });
    sideNavList.appendChild(listItem);
  });

  sideNav.appendChild(sideNavList);
  highlightCurrentLink(sideNavList, sections, block);

  return sideNav;
}

function handleTestimonials(testimonialContainer) {
  if (!testimonialContainer) return;
  const testimonialList = testimonialContainer.querySelector(':scope ul');
  if (testimonialList) {
    const testimonials = testimonialList.querySelectorAll('li');
    if (testimonials.length === 0) {
      return;
    }
    let currentTestimonial = 0;
    const showTestimonial = function showTestimonial(index) {
      testimonials.forEach((testimonial, i) => {
        testimonial.style.display = i === index ? 'block' : 'none';
      });
    };
    showTestimonial(currentTestimonial);

    const rotateTestimonials = function rotateTestimonials() {
      currentTestimonial = (currentTestimonial + 1) % testimonials.length;
      showTestimonial(currentTestimonial);
    };

    setInterval(rotateTestimonials, 5000);
  }
}

function createDropdown(links, sections, block) {
  const dropdown = document.createElement('select');
  dropdown.className = 'dropdown-list';
  links.forEach((link, index) => {
    const option = document.createElement('option');
    option.value = index; // Use index to track sections
    option.textContent = link.textContent;
    dropdown.appendChild(option);
  });
  dropdown.addEventListener('change', function handleChange() {
    const selectedIndex = this.value;
    handleTabSelection(links[selectedIndex], sections, block);
  });

  const dropdownWrapper = document.createElement('div');
  dropdownWrapper.classList.add('dropdown-wrapper');
  const caret = document.createElement('span');
  caret.classList.add('caret');
  dropdownWrapper.append(dropdown, caret);
  return dropdownWrapper;
}

async function decorateTabsComments(tabsCommentsWrapper) {
  const fragmentLoadPromises = [];
  tabsCommentsWrapper.querySelectorAll(':scope > div ').forEach((tabComment) => {
    if (tabComment.children.length < 5) return;
    const [, useDescription, description, reference, listIcon] = tabComment.children;
    if (useDescription.textContent === 'true') {
      reference.remove();
      useDescription.remove();
    } else {
      description.remove();
      useDescription.remove();
      const URL = reference.querySelector('a');
      const fragmentBlock = buildBlock('fragment', { elems: [URL] });
      const fragmentWrapper = document.createElement('div');
      fragmentWrapper.appendChild(fragmentBlock);
      tabComment.append(fragmentWrapper);
      decorateBlock(fragmentBlock);
      fragmentLoadPromises.push(loadBlock(fragmentBlock));
    }
    const icon = listIcon?.querySelector('span.icon img');
    if (icon) tabComment.classList.add('icon-list', icon.getAttribute('data-icon-name'));
    listIcon?.remove();
  });
  await Promise.all(fragmentLoadPromises);
}

export default async function decorate(block) {
  const [headingContainer, testimonialContainer, ...tabsWithComments] = block.children;
  headingContainer.classList.add('heading-container');
  testimonialContainer.classList.add('testimonial-container');

  const tabsCommentsWrapper = document.createElement('div');
  tabsCommentsWrapper.classList.add('tabs-comments');
  tabsCommentsWrapper.append(...tabsWithComments);
  testimonialContainer.after(tabsCommentsWrapper);
  const buttonLinks = tabsCommentsWrapper.querySelectorAll(':scope > div > div:first-child .button-container a');
  await decorateTabsComments(tabsCommentsWrapper);

  const blockFirstHalf = document.createElement('div');
  blockFirstHalf.classList.add('first-half');

  const header = headingContainer.querySelector('h3');
  if (header) blockFirstHalf.append(headingContainer);
  else headingContainer.remove();

  const sideNav = createSideNavigation(buttonLinks, tabsWithComments, block);
  const updatedLinks = sideNav.querySelectorAll(':scope a');
  const dropdownWrapper = createDropdown(updatedLinks, tabsWithComments, block);
  blockFirstHalf.append(dropdownWrapper, sideNav);

  const testimonialList = testimonialContainer.querySelector('ul');
  if (testimonialList) blockFirstHalf.append(testimonialContainer);
  else testimonialContainer.remove();

  block.prepend(blockFirstHalf);
  handleTestimonials(testimonialContainer);
  highlightCurrentLink(sideNav.querySelector('ul'), tabsWithComments, block);

  const moveTestimonial = () => {
    if (isDesktop()) {
      blockFirstHalf.append(testimonialContainer);
    } else {
      tabsCommentsWrapper.after(testimonialContainer);
    }
  };
  document.addEventListener('load', moveTestimonial, true);
  window.addEventListener('resize', moveTestimonial);
}
