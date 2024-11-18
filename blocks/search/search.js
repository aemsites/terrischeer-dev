import { decorateIcons, fetchPlaceholders } from '../../scripts/aem.js';
import { closeSearchBar } from '../../scripts/blocks-utils.js';
import { buildArticleSearchResult } from '../../scripts/scripts.js';

const PAGE_SIZE = 10;
const DEFAULT_LOCAL_STORAGE_TTL = 60 * 1000;
const MAX_CACHED_SEARCH_QUERIES = 5;
const SEARCH_QUERY_PREFIX = 'search_query_';
const SEARCH_ICON = 'icon-menu-search-teal';
const CLOSE_ICON = 'icon-remove-light';
const ALLOWED_CHARACTERS_LIMIT = 50;
const ALLOWED_CHARACTERS_REGEX = /^[a-zA-Z0-9*]+$/;
const ERROR_EXCEEDS_MAX_CHARACTERS = `Query is too long. Exceeds limit of ${ALLOWED_CHARACTERS_LIMIT} characters`;
const ERROR_INVALID_CHARACTERS = 'Invalid characters used. Allowed characters [a-zA-Z0-9*]';
const ERROR_INVALID_QUERY_STAR_ALONE = 'Invalid Query. * alone cannot be used';
const searchParams = new URLSearchParams(window.location.search);
const METADATA_NOINDEX = 'noindex';

function searchUrlWithParam(key, value) {
  const url = window.hlx.codeBasePath
    ? new URL(window.location.href)
    : new URL(`${window.location.protocol}//${window.location.host}`);
  if (searchParams) {
    searchParams.forEach((v, k) => url.searchParams.set(k, v));
  }
  url.searchParams.set(key, value);
  return url.toString();
}

function getCachedDataFromStore(key) {
  const itemStr = localStorage.getItem(key);
  if (!itemStr) return null;

  const item = JSON.parse(itemStr);
  const now = new Date();

  if (now.getTime() > item.expiry) {
    localStorage.removeItem(key); // Remove expired item
    return null;
  }

  return item.value;
}

function evictOldestSearchQueryInStore() {
  const keys = Object.keys(localStorage).filter((key) => key.startsWith(SEARCH_QUERY_PREFIX));

  if (keys.length > MAX_CACHED_SEARCH_QUERIES) {
    // Sort keys by the time they were stored (oldest first)
    const sortedKeys = keys.sort((a, b) => {
      const itemA = JSON.parse(localStorage.getItem(a));
      const itemB = JSON.parse(localStorage.getItem(b));
      return itemA.expiry - itemB.expiry;
    });

    // Remove the oldest query
    localStorage.removeItem(sortedKeys[0]);
  }
}

function cacheDataInStore(key, value, ttl) {
  const now = new Date();
  const item = {
    value,
    expiry: now.getTime() + ttl || now.getTime() + DEFAULT_LOCAL_STORAGE_TTL,
  };
  localStorage.setItem(key, JSON.stringify(item));
  if (key.startsWith(SEARCH_QUERY_PREFIX)) evictOldestSearchQueryInStore();
}

function createRegExp(query) {
  const containsStar = query.includes('*');
  const escapedQuery = query.replace(/([.+?^${}()|[\]\\])/g, '\\$1');
  let pattern = escapedQuery.replace(/\*/g, '.*?'); // Replace * with .*
  if (containsStar) pattern = `\\b${pattern}\\b`;
  return new RegExp(`${pattern}`, 'gi');
}

function highlightTextElements(terms, elements) {
  elements.forEach((element) => {
    if (!element || !element.textContent) return;

    const matches = [];
    const { textContent } = element;
    terms.forEach((term) => {
      const termRegex = createRegExp(term);
      let match;
      // eslint-disable-next-line no-cond-assign
      while ((match = termRegex.exec(textContent)) !== null) {
        const offset = match.index;
        matches.push({ offset, term: match[0] });
      }
    });

    if (!matches.length) {
      return;
    }

    matches.sort((a, b) => a.offset - b.offset);
    let currentIndex = 0;
    const fragment = matches.reduce((acc, { offset, term }) => {
      if (offset < currentIndex) return acc;
      const textBefore = textContent.substring(currentIndex, offset);
      if (textBefore) {
        acc.appendChild(document.createTextNode(textBefore));
      }
      const markedTerm = document.createElement('strong');
      markedTerm.textContent = term;
      acc.appendChild(markedTerm);
      currentIndex = offset + term.length;
      return acc;
    }, document.createDocumentFragment());
    const textAfter = textContent.substring(currentIndex);
    if (textAfter) {
      fragment.appendChild(document.createTextNode(textAfter));
    }
    element.innerHTML = '';
    element.appendChild(fragment);
  });
}

export async function fetchData(source, fetchArticles = false) {
  const storedData = getCachedDataFromStore('search_index_data');
  if (storedData) return Promise.resolve(storedData);
  const response = await fetch(window.hlx.codeBasePath + source);
  if (!response.ok) {
    // eslint-disable-next-line no-console
    console.error('error loading API response', response);
    return null;
  }

  const json = await response.json();
  if (!json) {
    // eslint-disable-next-line no-console
    console.error('empty API response', source);
    return null;
  }
  cacheDataInStore('search_index_data', json.data);

  return json.data.filter(
    (result) => !fetchArticles || result?.path?.includes('/landlord-resources'),
  );
}

function renderResult(result, searchTerms, titleTag) {
  const li = document.createElement('li');
  if (result.title) {
    const title = document.createElement(titleTag);
    title.className = 'search-result-title';
    const link = document.createElement('a');
    link.href = result.path;
    link.textContent = result.title;
    highlightTextElements(searchTerms, [link]);
    title.append(link);
    li.append(title);
  }
  if (result.description) {
    const description = document.createElement('p');
    description.textContent = result.description;
    highlightTextElements(searchTerms, [description]);
    li.append(description);
  }
  return li;
}

function clearSearchResults(resultsContainer) {
  const searchResults = resultsContainer.querySelector('.search-results');
  searchResults.innerHTML = '';
}

function clearSearch() {
  if (window.history.replaceState) {
    const url = new URL(window.location.href);
    url.search = '';
    searchParams.delete('s');
    window.history.replaceState({}, '', url.toString());
  }
}

function hideSearchError(block) {
  const searchErrorSpan = block.querySelector('.search-error');
  searchErrorSpan.style.display = 'none';
}

async function renderResults(
  resultsContainer,
  config,
  filteredData,
  searchTerms,
  page,
  isArticle = false,
) {
  clearSearchResults(resultsContainer);
  const resultsList = resultsContainer.querySelector('.search-results');
  const headingTag = resultsList.dataset.h;
  const pageData = filteredData.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  if (pageData.length) {
    resultsList.classList.remove('no-results');
    if (!isArticle) {
      pageData.forEach((result) => {
        const li = renderResult(result, searchTerms, headingTag);
        resultsList.append(li);
      });
    }
  } else {
    const noResultsMessage = document.createElement('li');
    resultsList.classList.add('no-results');
    noResultsMessage.innerHTML = `<p>${
      config.placeholders.searchTryAgain || 'No results found'
    }</p>`;
    resultsList.append(noResultsMessage);
    const noResultSearch = resultsContainer.querySelector('input');
    noResultSearch.focus();
    noResultSearch.value = searchParams.get('s');
  }
  requestAnimationFrame(() => {
    resultsContainer.style.display = 'block';
    resultsContainer.style.minHeight = '0';
  });
}

function compareFound(hit1, hit2) {
  return hit2.publishDate - hit1.publishDate;
}

function filterData(searchTerms, data) {
  const foundInHeader = [];
  const foundInMeta = [];

  data.forEach((result) => {
    if (result.robots === `${METADATA_NOINDEX}`) return;
    let found = searchTerms.some((term) => {
      const regex = createRegExp(term);
      const header = (result.header || result.title).toLowerCase();
      return regex.test(header);
    });

    if (found) {
      foundInHeader.push(result);
      return;
    }

    const metaContents = `${result.title} ${result.description} ${result.path
      .split('/')
      .pop()}`.toLowerCase();
    found = searchTerms.some((term) => {
      const regex = createRegExp(term);
      return regex.test(metaContents);
    });

    if (found) {
      foundInMeta.push(result);
    }
  });

  return [...foundInHeader.sort(compareFound), ...foundInMeta.sort(compareFound)];
}

function isValidQuery(input, config) {
  if (input.length > ALLOWED_CHARACTERS_LIMIT) {
    return config.placeholders.searchErrorExceedsMaxCharacters || ERROR_EXCEEDS_MAX_CHARACTERS;
  }
  const terms = input.trim().split(/\s+/);
  // Check if all terms match the pattern
  const isValid = terms.every((term) => ALLOWED_CHARACTERS_REGEX.test(term));
  if (!terms.every((term) => term !== '*')) {
    return config.placeholders.searchErrorInvalidQueryStarAlone || ERROR_INVALID_QUERY_STAR_ALONE;
  }
  return isValid
    ? ''
    : config.placeholders.searchErrorInvalidCharacters || ERROR_INVALID_CHARACTERS;
}

function handleSearch(container, searchValue, config) {
  const errorMsg = isValidQuery(searchValue, config);
  if (errorMsg) {
    const errorSpan = container.querySelector('.search-error');
    errorSpan.innerText = errorMsg;
    errorSpan.style.display = 'block';
    return;
  }
  window.location.href = searchUrlWithParam('s', searchValue);
}

function searchResultsList() {
  const results = document.createElement('ul');
  results.className = 'search-results';
  results.dataset.h = 'H3';
  return results;
}

function searchInput(block, config) {
  const input = document.createElement('input');
  input.setAttribute('type', 'search');
  input.className = 'search-input';

  const searchPlaceholder = config.placeholders.search || 'Search...';
  input.placeholder = searchPlaceholder;
  input.setAttribute('aria-label', searchPlaceholder);

  input.addEventListener('keydown', () => hideSearchError(block));
  input.addEventListener('keyup', (e) => {
    if (e.code === 'Escape') clearSearch();
    if (e.code === 'Enter') handleSearch(block, e.target.value, config);
  });

  return input;
}

function createSearchError() {
  const div = document.createElement('div');
  div.classList.add('search-error');
  return div;
}

function noResultSearchBox(container, config) {
  const divNoResultSearchBox = document.createElement('div');
  divNoResultSearchBox.classList.add('no-result-search');
  const input = document.createElement('input');
  input.setAttribute('type', 'search');
  input.className = 'search-input';
  input.addEventListener('keydown', () => hideSearchError(container));
  input.addEventListener('keyup', (e) => {
    if (e.code === 'Enter') handleSearch(container, input.value, config);
  });

  const searchButton = document.createElement('button');
  searchButton.classList.add('orange');
  searchButton.innerText = 'Search';
  searchButton.addEventListener('click', () => handleSearch(container, input.value, config));
  divNoResultSearchBox.append(input, searchButton);
  return divNoResultSearchBox;
}

function searchIcon() {
  const icon = document.createElement('span');
  icon.classList.add('icon', 'search', SEARCH_ICON);
  return icon;
}

function closeIcon() {
  const span = document.createElement('span');
  span.classList.add('icon', CLOSE_ICON);
  span.addEventListener('click', () => closeSearchBar());
  return span;
}

function searchBox(block, config) {
  const box = document.createElement('div');
  box.classList.add('search-box');
  const srchIcon = searchIcon();
  box.append(srchIcon, searchInput(block, config), closeIcon());

  const input = box.querySelector('input');
  srchIcon.addEventListener('click', () => {
    input?.dispatchEvent(new KeyboardEvent('keyup', { code: 'Enter' }));
  });
  return box;
}

function createButton(href, classList, innerText) {
  const a = document.createElement('a');
  a.href = href;
  a.innerText = innerText;
  a.classList.add(...classList);
  return a;
}

function decoratePaginationControls(resultsContainer, resultCount, currentPage) {
  const totalPages = Math.ceil(resultCount / PAGE_SIZE);
  if (totalPages < 2) return;
  const paginationDiv = document.createElement('div');
  paginationDiv.classList.add('pagination-ctrl');
  const previousPage = Math.max(1, currentPage - 1);
  const buttons = [];
  const prevButton = createButton(
    searchUrlWithParam('page', previousPage),
    ['page-prev'],
    'Previous',
  );
  buttons.push(prevButton);
  for (let pageNum = 1; pageNum <= totalPages; pageNum += 1) {
    const distance = pageNum - currentPage;
    if ((distance > 2 && pageNum !== totalPages) || (distance < -2 && pageNum !== 1)) {
      if (distance === -3 || distance === 3) {
        buttons.push(createButton('', ['page-num'], '...'));
      }
    } else {
      const a = createButton(searchUrlWithParam('page', pageNum), ['page-num'], `${pageNum}`);
      if (pageNum === currentPage) a.classList.add('current');
      buttons.push(a);
    }
  }
  const nextPage = Math.min(totalPages, currentPage + 1);
  const nextButton = createButton(searchUrlWithParam('page', nextPage), ['page-next'], 'Next');
  buttons.push(nextButton);
  paginationDiv.append(...buttons);
  if (currentPage === 1) prevButton.style.display = 'none';
  if (currentPage === totalPages) nextButton.style.display = 'none';
  resultsContainer.append(paginationDiv);
}

function decorateSearchPageTitle(block, placeholders, dataExists, searchQuery) {
  const main = block.closest('main');
  const pageTitle = main.querySelector('h1');
  const searchResultTitle = placeholders.searchResults || 'Search results for';
  const noSearchResultTitle = placeholders.noSearchResults || 'No search results found for';
  if (dataExists) {
    pageTitle.innerHTML = `${searchResultTitle} <span class="search-query">${searchQuery}</span>`;
  } else {
    pageTitle.innerHTML = `${noSearchResultTitle} <span class="search-query">${searchQuery}</span>`;
  }
}

export default async function decorate(block) {
  const placeholders = await fetchPlaceholders();
  const section = block.closest('.section');
  const searchQuery = searchParams.get('s');
  const isArticleSearch = window.location.pathname.includes('/landlord-resources');
  let nextSection = section.nextElementSibling;
  const source = '/query-index.json';
  const config = { source, placeholders };
  block.innerHTML = '';

  block.append(searchBox(block, config), createSearchError());
  // If search page
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    const page = parseInt(searchParams.get('page'), 10) || 1;
    if (!nextSection?.classList.contains('search-results-container')) {
      nextSection = document.createElement('div');
      nextSection.classList.add('section', 'search-results-container');
      // eslint-disable-next-line max-len
      nextSection.append(
        searchResultsList(block),
        noResultSearchBox(nextSection, config),
        createSearchError(),
      );
      section.after(nextSection);
    }
    const searchTerms = query.split(/\s+/).filter((term) => !!term);
    let filteredData = getCachedDataFromStore(`${SEARCH_QUERY_PREFIX}${query}`);
    if (!filteredData) {
      const data = await fetchData(source, isArticleSearch);
      filteredData = filterData(searchTerms, data);
      cacheDataInStore(`${SEARCH_QUERY_PREFIX}${query}`, filteredData);
    }
    if (isArticleSearch) {
      await buildArticleSearchResult(document.querySelector('main'), filteredData);
      await renderResults(
        nextSection,
        { source, placeholders },
        filteredData,
        searchTerms,
        page,
        true,
      );
      nextSection = document.querySelector('main .section');
    } else {
      await renderResults(nextSection, { source, placeholders }, filteredData, searchTerms, page);
    }
    decorateSearchPageTitle(block, placeholders, filteredData.length > 0, searchQuery);
    if (!isArticleSearch) {
      decoratePaginationControls(nextSection, filteredData.length, page, searchQuery);
    } else {
      // trick to show all articles
      const loadMore = document.querySelector('main .section .load-more-btn');
      while (loadMore.parentElement.style.display !== 'none') {
        loadMore.click();
      }
    }
  }
  decorateIcons(block);
}
