let searchCb = {};
const BV_STARS = '★★★★★';
const STAGE_BV_CARDS_RATING_URL = 'https://stg.api.bazaarvoice.com/data/batch.json?passkey=caVSYi4TkoqEJSJmz3z3a8CV6XZNCoaAF9H4D8DEJ1CzY&apiversion=5.5&displaycode=10370-en_au&resource.q0=products&filter.q0=id%3Aeq%3Acombinedcoverage%2Clandlordinsurance%2Cbuildinginsurance%2Cholidayrental&limit.q0=4&resource.q1=statistics&filter.q1=productid%3Aeq%3Acombinedcoverage%2Clandlordinsurance%2Cbuildinginsurance%2Cholidayrental&filter.q1=contentlocale%3Aeq%3Aen_AU&stats.q1=reviews&filter_reviews.q1=contentlocale%3Aeq%3Aen_AU&filter_reviewcomments.q1=contentlocale%3Aeq%3Aen_AU&limit.q1=4';
const PROD_BV_CARDS_RATING_URL = 'https://api.bazaarvoice.com/data/batch.json?passkey=caex2yzNyLbKnBWEIyAQlQw7dZWLvp8NxAolCBS0jVHBo&apiversion=5.5&displaycode=10370-en_au&resource.q0=products&filter.q0=id%3Aeq%3Acombinedcoverage%2Clandlordinsurance%2Cbuildinginsurance%2Cholidayrental&limit.q0=4&resource.q1=statistics&filter.q1=productid%3Aeq%3Acombinedcoverage%2Clandlordinsurance%2Cbuildinginsurance%2Cholidayrental&filter.q1=contentlocale%3Aeq%3Aen_AU&stats.q1=reviews&filter_reviews.q1=contentlocale%3Aeq%3Aen_AU&filter_reviewcomments.q1=contentlocale%3Aeq%3Aen_AU&limit.q1=4';
const STAGE_BV_OVERVIEW_RATING_URL = 'https://stg.api.bazaarvoice.com/data/statistics.json?apiVersion=5.4&Passkey=caVSYi4TkoqEJSJmz3z3a8CV6XZNCoaAF9H4D8DEJ1CzY&stats=Reviews&filter=productid%3A';
const PROD_BV_OVERVIEW_RATING_URL = 'https://api.bazaarvoice.com/data/statistics.json?apiVersion=5.4&Passkey=caizO0i0FzVCD2ADjvPDtmiFSAcC5UVBJmSr2wIFcDev0&stats=Reviews&filter=productid%3A';
const STAGE_BV_OVERVIEW_RATING_COMMENT_URL = 'https://stg.api.bazaarvoice.com/data/reviews.json?apiVersion=5.4&Passkey=caVSYi4TkoqEJSJmz3z3a8CV6XZNCoaAF9H4D8DEJ1CzY&Limit=40&filter=productid%3A';
const PROD_BV_OVERVIEW_RATING_COMMENT_URL = 'https://api.bazaarvoice.com/data/reviews.json?apiVersion=5.4&Passkey=caizO0i0FzVCD2ADjvPDtmiFSAcC5UVBJmSr2wIFcDev0&Limit=40&filter=productid%3A';

/**
 * Create new DOM element with tag name and class name.
 * @param tagName tag name
 * @param className class name
 * @returns created element
 */
function createElement(tagName, className) {
  const element = document.createElement(tagName);
  if (className) {
    element.classList.add(className);
  }
  return element;
}

/**
 * Open Search Bar
 * @param cb callback function to be called when search bar is closed
 * @returns {Promise<void>}
 */
function openSearchBar(cb, arg) {
  const searchBlock = document.querySelector('.search.block');
  if (searchBlock) {
    const searchSection = searchBlock.closest('.section');
    document.querySelector('main').prepend(searchSection);
    searchBlock.style.display = 'block';
    searchBlock.querySelector('input')?.focus();
    searchCb = { cb, arg };
  }
}

function closeSearchBar() {
  const search = document.querySelector('.search.block');
  search.style.display = 'none';
  searchCb.cb(searchCb.arg);
}

/**
 * Add click listener to open external link in a new window
 * @param link
 */
function addGenericLinkClickListener(link) {
  link.addEventListener('click', (event) => {
    const url = link.href;
    const isExternal = url.startsWith('http') && !url.includes(window.location.hostname);
    if (isExternal) {
      event.preventDefault();
      window.open(`${url}`, '_blank');
    }
  });
}

/**
 * Generate BV review stars markup.
 * @param aHref the link of star
 */
function generateBvStarMarkup(aHref) {
  const bvRatingStars = createElement('div', 'ts-bv-rating-star');
  const emptyStars = createElement('div', 'ts-bv-empty-star');
  const filledStars = createElement('div', 'ts-bv-filled-star');
  if (aHref) {
    const starLink = createElement('a', '');
    starLink.href = aHref;
    starLink.textContent = BV_STARS;
    const starColorLink = starLink.cloneNode(true);
    emptyStars.append(starLink);
    filledStars.append(starColorLink);
  } else {
    emptyStars.textContent = BV_STARS;
    filledStars.textContent = BV_STARS;
  }
  bvRatingStars.append(emptyStars);
  bvRatingStars.append(filledStars);
  return bvRatingStars;
}

/**
 * Utility method to call BV api.
 * @param apiUrl API url
 * @param prefix object name which is used to construct window's data
 */
async function fetchBVData(apiUrl, prefix = 'default') {
  window.tsBVData = window.tsBVData || {};
  if (!window.tsBVData[prefix]) {
    window.tsBVData[prefix] = new Promise((resolve) => {
      fetch(`${apiUrl}`)
        .then((resp) => {
          if (resp.ok) {
            return resp.json();
          }
          return {};
        })
        .then((json) => {
          window.tsBVData[prefix] = json;
          resolve(window.tsBVData[prefix]);
        })
        .catch(() => {
          // eslint-disable-next-line no-console
          console.error('Empty BV API response');
          window.tsBVData[prefix] = {};
          resolve(window.tsBVData[prefix]);
        });
    });
  }
  return window.tsBVData[`${prefix}`];
}

/**
 * Returns the environment type based on the hostname.
 */
function getEnvType(hostname = window.location.hostname) {
  const fqdnToEnvType = {
    'terrischeer.com.au': 'prod',
    'www.terrischeer.com.au': 'prod',
    'main--suncorp--aemsites.aem.page': 'preview',
    'main--suncorp--aemsites.aem.live': 'live',
    'main--suncorp--aemsites.hlx.page': 'preview',
    'main--suncorp--aemsites.hlx.live': 'live',
  };
  return fqdnToEnvType[hostname] || 'dev';
}

/**
 * Returns BV cards rating url
 */
function getBvCardsRatingUrl() {
  return (getEnvType() === 'prod' || getEnvType() === 'live') ? PROD_BV_CARDS_RATING_URL : STAGE_BV_CARDS_RATING_URL;
}

/**
 * Get BV product rating data by product id.
 * @param apiUrl API url
 */
async function fetchBVProductRating() {
  const apiData = await fetchBVData(getBvCardsRatingUrl(), 'productBV');
  return apiData.BatchedResults?.q1?.Results;
}

/**
 * Returns BV overview rating url
 */
function getBvOverviewRatingUrl() {
  return (getEnvType() === 'prod' || getEnvType() === 'live') ? PROD_BV_OVERVIEW_RATING_URL : STAGE_BV_OVERVIEW_RATING_URL;
}

/**
 * Returns BV overview rating comment url
 */
function getBvOverviewRatingCommentUrl() {
  return (getEnvType() === 'prod' || getEnvType() === 'live') ? PROD_BV_OVERVIEW_RATING_COMMENT_URL : STAGE_BV_OVERVIEW_RATING_COMMENT_URL;
}

/**
 * Get BV overview rating data by product id.
 * @param apiUrl API url
 */
async function fetchBVOverviewRating(productId) {
  const apiUrl = getBvOverviewRatingUrl();
  const apiData = await fetchBVData(`${apiUrl}${productId}`, `overrating_${productId}`);
  return apiData.Results[0]?.ProductStatistics?.ReviewStatistics;
}

/**
 * Get BV overview rating comment data by product id.
 * @param apiUrl API url
 */
async function fetchBVOverviewRatingComment(productId) {
  const apiUrl = getBvOverviewRatingCommentUrl();
  const apiData = await fetchBVData(`${apiUrl}${productId}`, `comment_${productId}`);
  return apiData.Results;
}

function addBazaarVoiceReviewsScript() {
  const main = document.querySelector('main');
  const bvReviewsBlocks = Array.from(main.querySelectorAll('.block.bv-reviews'));
  bvReviewsBlocks.forEach((block) => {
    const productId = block.getAttribute('data-product-id');
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.text = `
      $BV.ui('rr', 'show_reviews', {
        productId: '${productId}',
        doShowContent: function() {
          // If the container is hidden (such as behind a tab), put code here to make it visible
        }
      });
    `;
    block.appendChild(script);
  });
}

/**
 * Generate super script for richtext block.
 * @param main main content
 */
function generateSuperScripts(main) {
  let count = 1;
  main.querySelectorAll('.rich-text a:has(sup)').forEach((supLink) => {
    if (supLink) {
      const targetLink = supLink.cloneNode(true);
      targetLink.textContent = supLink.textContent;
      const sup = createElement('sup');
      const wrapper = createElement('div');
      wrapper.classList.add('footnote-wrapper');
      wrapper.style.display = 'none';
      const clickableLink = createElement('div', 'footnote-anchor');
      clickableLink.textContent = count;
      sup.appendChild(clickableLink);
      clickableLink.addEventListener('mouseenter', () => {
        wrapper.style.display = 'block';
      });
      document.addEventListener('click', (event) => {
        if (!clickableLink.contains(event.target)) {
          wrapper.style.display = 'none';
        }
      });
      wrapper.appendChild(targetLink);
      sup.appendChild(wrapper);
      supLink.replaceWith(sup);
      count += 1;
    }
  });
}

export {
  createElement,
  openSearchBar,
  closeSearchBar,
  addGenericLinkClickListener,
  generateBvStarMarkup,
  fetchBVProductRating,
  fetchBVOverviewRating,
  fetchBVOverviewRatingComment,
  getEnvType,
  addBazaarVoiceReviewsScript,
  generateSuperScripts,
};
