import { fetchPlaceholders } from '../../scripts/aem.js';
import {
  createElement,
  generateBvStarMarkup,
  fetchBVOverviewRating,
  fetchBVOverviewRatingComment,
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

async function decorateRating(ratingContent, productId) {
  const ratingResults = await fetchBVOverviewRating(productId);
  if (ratingResults) {
    const overallRating = ratingResults.AverageOverallRating;
    const totalReviewCount = ratingResults.TotalReviewCount;
    const rating = ratingContent.querySelector('.ts-bv-filled-star');
    const starWidth = (overallRating * 100) / 5;
    rating.style.width = `${starWidth}%`;
    const reviews = ratingContent.querySelector('.ts-bv-overview-rating-review-number');
    reviews.textContent = ` ${totalReviewCount} `;
  }
  const commentResults = await fetchBVOverviewRatingComment(productId);
  if (commentResults && commentResults.length > 0) {
    const randomItem = commentResults[Math.floor(Math.random() * commentResults.length)];
    const userComment = randomItem.Title;
    const userName = randomItem.UserNickname;
    const comment = ratingContent.querySelector('.ts-bv-overview-rating-comment');
    comment.textContent = `"${userComment}" ${userName}`;
  }
}

function decorateReviews(block, bvProductId) {
  block.classList.add('bv-reviews');
  block.setAttribute('data-product-id', bvProductId);
  block.innerHTML = `
      <div itemscope itemtype="https://schema.org/Product">
        <div id="BVRRSummaryContainer"></div>
        <div id="BVRRContainer"></div>
      </div>
    `;
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
    const ratingContent = generateOverviewRatingMarkup(placeholders, reviewLink);
    try {
      decorateRating(ratingContent, productId);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log('Error on integrate BV overview rating: ', error);
    }
    block.replaceChildren(ratingContent);
  } else if (blockType === 'bv_reviews' && productId) {
    decorateReviews(block, productId);
  }
}
