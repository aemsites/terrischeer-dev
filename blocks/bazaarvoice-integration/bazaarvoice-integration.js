import { fetchPlaceholders } from '../../scripts/aem.js';
import {
  createElement,
  generateBvStarMarkup,
} from '../../scripts/blocks-utils.js';

function generateOverviewRatingMarkup(placeholders, reviewLink) {
  const customerRating = placeholders.customerRating || 'Customer Rating';
  const readAll = placeholders.readAll || 'Read all';
  const reviews = placeholders.reviews || 'reviews';

  const bvOverviewRating = createElement('div', 'ts-bv-overview-rating');
  const ratingContent = createElement('div', 'ts-bv-overview-rating-content');
  const ratingPrefix = createElement('strong', '');
  const bvRatingStars = generateBvStarMarkup();
  const ratingReviewLink = createElement('a', 'ts-bv-overview-rating-review-link');
  const ratingReviewNum = createElement('span', 'ts-bv-overview-rating-review-number');
  const ratingComment = createElement('p', 'ts-bv-overview-rating-comment');
  ratingComment.innerHTML = 'Waiting to display customer comments';
  ratingReviewNum.textContent = ' 0 ';
  ratingReviewLink.href = reviewLink || '#';
  ratingReviewLink.append(readAll);
  ratingReviewLink.append(ratingReviewNum);
  ratingReviewLink.append(reviews);

  ratingPrefix.textContent = customerRating;
  ratingContent.append(ratingPrefix);
  ratingContent.append(bvRatingStars);
  ratingContent.append(ratingReviewLink);

  bvOverviewRating.append(ratingContent);
  bvOverviewRating.append(ratingComment);
  return bvOverviewRating;
}

function decorateReviews(block, productId) {
  block.classList.add('bv-reviews');
  block.setAttribute('data-product-id', productId);
  block.innerHTML = `
      <div itemscope itemtype="https://schema.org/Product">
        <div id="BVRRContainer"></div>
      </div>
    `;
}

function decorateSubmissionForm(block) {
  block.classList.add('bv-submission-form');
  const isLiveView = !window.hlx.codeBasePath;
  if (isLiveView) block.innerHTML = '';
  else {
    block.innerHTML = `<div>
        <h3>Bazaarvoice Form Submission Block Configured</h3>
        <p>Verify it on stage or prod URL</p>
      </div>`;
  }
}

export default async function decorate(block) {
  const [bvBlockType, bvProductId, bvReviewLink] = block.querySelectorAll(':scope > div > div');
  block.textContent = '';
  const blockType = bvBlockType?.textContent;
  const productId = bvProductId?.textContent;
  const reviewLink = bvReviewLink?.textContent;
  const placeholders = await fetchPlaceholders();
  if (blockType === 'bv_overview_rating' && productId) {
    block.classList.add('bv-overview-rating');
    block.setAttribute('data-product-id', productId);
    const ratingContent = generateOverviewRatingMarkup(placeholders, reviewLink);
    block.replaceChildren(ratingContent);
  } else if (blockType === 'bv_reviews' && productId) {
    decorateReviews(block, productId);
  } else if (blockType === 'bv_submission_form') {
    decorateSubmissionForm(block);
  }
}
