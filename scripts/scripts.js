import {
  loadHeader,
  loadFooter,
  decorateButtons,
  decorateIcons,
  decorateSections,
  decorateBlocks,
  decorateTemplateAndTheme,
  waitForFirstImage,
  loadSection,
  loadSections,
  loadCSS,
  sampleRUM,
  buildBlock,
  decorateBlock,
  loadBlock,
  getMetadata,
  createOptimizedPicture,
} from './aem.js';
import { generateSuperScripts } from './blocks-utils.js';

const ARTICLE_BASE = 'landlord-resources';

function createTabButton(tabName, tabSection) {
  const tabButton = document.createElement('button');
  tabButton.className = 'tab-link';
  tabButton.innerHTML = tabName;
  const tabRef = tabSection.getAttribute('data-tab-ref');
  tabButton.setAttribute('data-tab-ref', tabRef);
  tabButton.addEventListener('click', () => {
    tabButton.classList.add('active');
    tabSection.classList.add('show');
    const activeTabEvent = new CustomEvent('parent-tab-active', {
      detail: { message: `active_tab_id=${tabRef}` },
    });
    tabSection.querySelectorAll('.block').forEach((block) => {
      block.dispatchEvent(activeTabEvent);
    });
    const tabGroup = tabSection.closest('.tabs-group');
    const inactiveTabs = tabGroup.querySelectorAll(`.tab-link:not([data-tab-ref="${tabRef}"])`);
    const inactiveSections = tabGroup.querySelectorAll(
      `[data-is-tab="true"]:not([data-tab-ref="${tabRef}"])`,
    );
    inactiveTabs.forEach((tab) => tab.classList.remove('active'));
    inactiveSections.forEach((section) => section.classList.remove('show'));
  });
  return tabButton;
}

function createTabs(tabSections) {
  const tabs = document.createElement('div');
  tabs.classList.add('tabs');
  tabSections.forEach((tabSection, ind) => {
    const tab = document.createElement('div');
    tab.classList.add('tab');
    const tabName = tabSection.getAttribute('data-tab-name')?.trim();
    const tabButton = createTabButton(tabName, tabSection);
    if (ind === 0) {
      tabButton.classList.add('active');
      tabSection.classList.add('show');
    }
    tabs.append(tabButton);
  });
  return tabs;
}

/**
 * Creates tabs for sections where 'data-is-tab'=true
 * @param main
 */
function decorateSectionTabs(main) {
  const sections = main.querySelectorAll('.section');
  let tabSections = [];
  const createTabsGroup = () => {
    const newSection = document.createElement('div');
    newSection.classList.add('section', 'no-padding-top');
    const tabsContainer = document.createElement('div');
    tabsContainer.classList.add('tabs-group');
    tabsContainer.append(createTabs(tabSections));
    tabSections[0].before(newSection);
    tabsContainer.append(...tabSections);
    newSection.append(tabsContainer);

    // Copy sidebar properties of tab section to parent section
    tabSections.forEach((section) => {
      const {
        addSidebar, sidebarLink, sidebarMobileView, sidebarTabletView,
      } = section.dataset;
      if (section.dataset && addSidebar === 'true' && sidebarLink) {
        newSection.dataset.addSidebar = addSidebar;
        newSection.dataset.sidebarLink = sidebarLink;
        newSection.dataset.sidebarMobileView = sidebarMobileView;
        newSection.dataset.sidebarTabletView = sidebarTabletView;
      }
    });
    tabSections = [];
  };
  sections.forEach((section, index) => {
    const isTab = section.getAttribute('data-is-tab');
    if (isTab === 'true') {
      tabSections.push(section);
      section.setAttribute('data-tab-ref', index);
    } else if (tabSections.length > 0) {
      createTabsGroup();
    }
  });

  if (tabSections.length > 0) {
    createTabsGroup();
  }
}

/**
 * Wraps all table (list variant) present in a section under a parent DIV with class 'table-list'
 * @param main
 */
function decorateSectionTableList(main) {
  const sections = main.querySelectorAll('.section.table-container');
  sections.forEach((section) => {
    const tableWrappers = Array.from(section.querySelectorAll('div:has(>.table.list)'))?.filter(
      (tableWrapper) => !tableWrapper.parentElement.classList.contains('table-list'),
    );
    if (tableWrappers.length === 0) return;
    const tableListDiv = document.createElement('div');
    tableListDiv.classList.add('table-list');
    tableWrappers[0].before(tableListDiv);
    tableListDiv.append(...tableWrappers);
  });
}

export async function buildArticleSearchResult(main, pages, categoryMappings) {
  const blockChildren = [];
  pages.forEach((item) => {
    const values = item.path.split('/').filter(Boolean);
    const div = document.createElement('div');
    div.classList.add('news-list-item');
    const imageWrapper = document.createElement('div');
    imageWrapper.classList.add('image-wrapper');
    const a = document.createElement('a');
    a.href = new URL(item.path, window.location.origin).href;
    const pic = createOptimizedPicture(new URL(item.imageThumbnail).pathname);
    a.appendChild(pic);
    imageWrapper.appendChild(a);
    div.append(imageWrapper);

    if (categoryMappings) {
      const categoryLink = document.createElement('a');
      categoryLink.classList.add('category-link');
      categoryLink.href = new URL(values.slice(0, 2).join('/'), window.location.origin).href;
      const categoryItem = categoryMappings.data.find((category) => category['category-id'] === values[1]);
      const categoryTitle = categoryItem['category-title'];
      categoryLink.textContent = categoryTitle.toUpperCase();
      div.append(categoryLink);
    }

    const newsLink = document.createElement('a');
    newsLink.classList.add('news-link');
    newsLink.href = new URL(item.path, window.location.origin).href;
    newsLink.textContent = item.title;
    div.append(newsLink);

    const description = document.createElement('p');
    description.textContent = item.description;
    div.append(description);

    blockChildren.push(div);
  });

  const section = document.createElement('div');
  section.classList.add('section');
  section.style.display = 'none';
  section.style.minHeight = '25rem';
  const blockWrapper = document.createElement('div');
  const block = buildBlock('news-list', { elems: blockChildren });
  blockWrapper.appendChild(block);
  section.appendChild(blockWrapper);
  main.appendChild(section);

  decorateBlock(block);
  await loadBlock(block);
  requestAnimationFrame(() => {
    section.style.display = 'block';
    section.style.minHeight = '0';
  });
}

async function buildNewsListSection(main) {
  try {
    if (window.location.search) {
      return;
    }

    const path = window.location.pathname;
    const values = path.split('/').filter(Boolean);
    if (!((values.length === 1 && values[0] === 'landlord-resources')
      || (values.length === 2 && values[0] === 'landlord-resources'))) {
      return;
    }

    const [response, mappingResponse] = await Promise.all([
      fetch(`${window.hlx.codeBasePath}/query-index.json`),
      fetch(`${window.hlx.codeBasePath}/category-mapping.json`),
    ]);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    if (!mappingResponse.ok) {
      throw new Error(`HTTP error! status: ${mappingResponse.status}`);
    }

    const index = await response.json();
    const categoryMappings = await mappingResponse.json();

    const pages = index.data
      .filter((item) => item.path.startsWith(path) && item.path.split('/').filter(Boolean).length > 2)
      .sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate));

    await buildArticleSearchResult(main, pages, categoryMappings);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching news list', error);
    throw error;
  }
}

function buildSearchBlock() {
  const main = document.querySelector('main');
  const searchParams = new URLSearchParams(window.location.search);
  const searchQuery = searchParams.get('s');

  if (searchQuery) {
    main.classList.add('search-page');
    if (!main.querySelector('.page-title')) {
      const pageTitleSection = document.createElement('div');
      pageTitleSection.classList.add('section', 'full-width');
      const h1 = document.createElement('h1');
      pageTitleSection.append(buildBlock('page-title', { elems: [h1] }));
      main.append(pageTitleSection);
    }
  }
  if (!main.querySelector('.search')) {
    const searchSection = document.createElement('div');
    searchSection.classList.add('section', 'full-width');
    searchSection.innerHTML = '<div class="search"></div>';
    main.append(searchSection);
  }
}

/**
 * load fonts.css and set a session storage flag
 */
async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  try {
    if (!window.location.hostname.includes('localhost')) sessionStorage.setItem('fonts-loaded', 'true');
  } catch (e) {
    // do nothing
  }
}

/**
 *
 * @param {Element} tagsWrapper
 * @param {String} category
 */
function addCategoryTags(tagsWrapper, categories) {
  const tagIcon = document.createElement('img');
  tagsWrapper.append(tagIcon);

  for (let i = 0; i < categories.length; i += 1) {
    const categoryTag = document.createElement('a');
    const categoryID = categories[i]['category-id'];
    const categoryText = categories[i]['category-title'];
    categoryTag.href = `/${ARTICLE_BASE}/${categoryID}`;
    categoryTag.classList.add('news-tag');
    categoryTag.textContent = categoryText;
    tagsWrapper.append(categoryTag);
  }

  tagIcon.src = `${window.hlx.codeBasePath}/icons/tag.svg`;
  tagIcon.alt = 'tag icon';
}

/**
 *
 * @param {Element} tagsWrapper
 * @param {String} href
 */
function loadArticleTags(tagsWrapper, href) {
  const url = `${window.hlx.codeBasePath}/category-mapping.json`;
  fetch(url)
    .then((response) => response.json())
    .then((mapping) => {
      const categories = mapping.data;
      const baseCategory = categories.find((cat) => cat['category-id'] === ARTICLE_BASE);
      if (baseCategory) baseCategory['category-id'] = '';
      const filteredCategories = categories.filter((cat) => href.includes(`${ARTICLE_BASE}/${cat['category-id']}`));

      addCategoryTags(tagsWrapper, filteredCategories);
    });
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
// eslint-disable-next-line no-unused-vars
function buildAutoBlocks(main) {
  try {
    buildSearchBlock();
    generateSuperScripts(main);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

function addCategoryTagToArticle() {
  const regex = new RegExp(`.*/${ARTICLE_BASE}/.*/.*`);

  if (regex.test(window.location.pathname) && !document.querySelector('main .tags-wrapper')) {
    const sections = document.querySelectorAll('main .section');
    const tagsWrapper = document.createElement('div');
    tagsWrapper.classList.add('tags-wrapper');
    sections[1].append(tagsWrapper);
    loadArticleTags(tagsWrapper, window.location.href);
  }
}

function adjustSectionHeight() {
  const sidebar = document.querySelector('.sidebar');
  if (sidebar) {
    const section = sidebar.parentElement;
    section.style.minHeight = `${sidebar.offsetHeight}px`;
  }
}

function buildSidebar(section) {
  if (section.dataset && section.dataset.addSidebar === 'true' && section.dataset.sidebarLink) {
    const href = section.dataset.sidebarLink;
    const a = document.createElement('a');
    a.href = href.replace(/^.*\/\/[^/]+/, '');
    const fragmentBlock = buildBlock('fragment', { elems: [a] });
    const fragmentWrapper = document.createElement('div');
    fragmentWrapper.classList.add('sidebar');

    if (section.dataset.sidebarMobileView === 'true') {
      fragmentWrapper.classList.add('mobile-view');
    }

    if (section.dataset.sidebarTabletView) {
      if (section.dataset.sidebarTabletView === 'sidebar-tablet-full-width') {
        fragmentWrapper.classList.add('tablet-full-width');
      } else if (section.dataset.sidebarTabletView === 'sidebar-tablet-view') {
        fragmentWrapper.classList.add('tablet-view');
      }
    }

    fragmentWrapper.appendChild(fragmentBlock);
    section.append(fragmentWrapper);
    decorateBlock(fragmentBlock);

    window.addEventListener('resize', () => {
      adjustSectionHeight();
    });
  }
}

/**
 * Builds synthetic blocks in that rely on section metadata
 * @param {Element} main The container element
 */
function buildSectionBasedAutoBlocks(main) {
  main.querySelectorAll(':scope > div').forEach((section) => {
    buildSidebar(section);
  });
}

async function loadNotificationBanner(main) {
  const fragment = getMetadata('notificationfragment');
  if (!fragment || fragment === '') return;
  const notificationBanner = buildBlock('fragment', fragment);
  notificationBanner.classList.add('notification-banner-skeleton');
  main.prepend(notificationBanner);
  decorateBlock(notificationBanner);
  await loadBlock(notificationBanner);
  notificationBanner.classList.remove('notification-banner-skeleton');
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main) {
  // hopefully forward compatible button decoration
  decorateButtons(main);
  decorateIcons(main);
  buildAutoBlocks(main);
  decorateSections(main);
  addCategoryTagToArticle(main);
  decorateBlocks(main);
  decorateSectionTabs(main);
  decorateSectionTableList(main);
  buildSectionBasedAutoBlocks(main);
  requestAnimationFrame(adjustSectionHeight);
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  document.documentElement.lang = 'en';

  decorateTemplateAndTheme();
  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);
    document.body.classList.add('appear');
    loadNotificationBanner(doc.querySelector('header'));
    const firstSection = main.querySelector('.section');
    await loadSection(firstSection, waitForFirstImage);
    if (firstSection.classList.contains('fragment-container') && firstSection.classList.contains('page-title-container')) {
      await loadSection(main.querySelector('.section:nth-child(2)'), waitForFirstImage);
    }
    await buildNewsListSection(main);
  }

  sampleRUM.enhance();

  try {
    /* if desktop (proxy for fast connection) or fonts already loaded, load fonts.css */
    if (window.innerWidth >= 900 || sessionStorage.getItem('fonts-loaded')) {
      loadFonts();
    }
  } catch (e) {
    // do nothing
  }
}

function autolinkModals(element) {
  element.addEventListener('click', async (e) => {
    const origin = e.target.closest('a');

    if (origin && origin.href && origin.href.includes('/modals/')) {
      e.preventDefault();
      const { openModal } = await import(`${window.hlx.codeBasePath}/blocks/modal/modal.js`);
      openModal(origin.href);
    }
  });
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
  const main = doc.querySelector('main');
  autolinkModals(main);
  await loadSections(main);

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();
  loadHeader(doc.querySelector('header'));
  loadFooter(doc.querySelector('footer'));
  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  loadFonts();
}

/**
 * Moves all the attributes from a given elmenet to another given element.
 * @param {Element} from the element to copy attributes from
 * @param {Element} to the element to copy attributes to
 */
export function moveAttributes(from, to, attributes) {
  if (!attributes) {
    // eslint-disable-next-line no-param-reassign
    attributes = [...from.attributes].map(({ nodeName }) => nodeName);
  }
  attributes.forEach((attr) => {
    const value = from.getAttribute(attr);
    if (value) {
      to?.setAttribute(attr, value);
      from.removeAttribute(attr);
    }
  });
}

/**
 * Move instrumentation attributes from a given element to another given element.
 * @param {Element} from the element to copy attributes from
 * @param {Element} to the element to copy attributes to
 */
export function moveInstrumentation(from, to) {
  moveAttributes(
    from,
    to,
    [...from.attributes]
      .map(({ nodeName }) => nodeName)
      .filter((attr) => attr.startsWith('data-aue-') || attr.startsWith('data-richtext-')),
  );
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  // eslint-disable-next-line import/no-cycle
  window.setTimeout(() => import('./delayed.js'), 3000);
  // load anything that can be postponed to the latest here
}

async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

/**
 * Helper function that converts an AEM path into an EDS path.
 */
export function getEDSLink(aemPath) {
  return window.hlx.aemRoot
    ? aemPath.replace(window.hlx.aemRoot, '').replace('.html', '').replace('/index', '/')
    : aemPath;
}

/**
 * Helper function that adapts the path to work on EDS and AEM rendering
 */
export function getLink(edsPath) {
  return window.hlx.aemRoot
    && !edsPath.startsWith(window.hlx.aemRoot)
    && edsPath.indexOf('.html') === -1
    ? `${window.hlx.aemRoot}${edsPath}.html`
    : edsPath;
}

window.hlx.aemRoot = '/content/terrischeer';

loadPage();
