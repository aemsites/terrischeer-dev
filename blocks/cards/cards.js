import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';
import {
  createElement, generateBvStarMarkup, fetchBVProductRating,
} from '../../scripts/blocks-utils.js';

const DEFAULT_COLUMNS_PER_ROW_MOBILE = 1;
const DEFAULT_COLUMNS_PER_ROW_TABLET = 3;
const DEFAULT_COLUMNS_PER_ROW_DESKTOP = 3;

const VARIANT = {
  imageTitleDescription: 'image-title-description',
  logoAndDescription: 'logo-and-description',
  centeredIconTitle: 'centered-icon-title',
  product: 'product',
  benefit: 'benefit',
  titleDescription: 'title-description-card',
};

function updateCardsBlockColumnsProperty(block) {
  // eslint-disable-next-line max-len
  const [mobileColPropertyDiv, tabletColPropertyDiv, desktopColPropertyDiv] = Array.from(
    block.children,
  ).slice(0, 3);
  block.style.setProperty(
    '--columns-mobile',
    mobileColPropertyDiv.textContent?.trim() || DEFAULT_COLUMNS_PER_ROW_MOBILE,
  );
  block.style.setProperty(
    '--columns-tablet',
    tabletColPropertyDiv.textContent?.trim() || DEFAULT_COLUMNS_PER_ROW_TABLET,
  );
  block.style.setProperty(
    '--columns-desktop',
    desktopColPropertyDiv.textContent?.trim() || DEFAULT_COLUMNS_PER_ROW_DESKTOP,
  );
  mobileColPropertyDiv.remove();
  tabletColPropertyDiv.remove();
  desktopColPropertyDiv.remove();
}

function getCardItemClasses(row) {
  const classes = row.firstElementChild.textContent
    .trim()
    .split(',')
    .map((c) => c.trim())
    .filter((c) => c);
  row.firstElementChild.remove();
  return classes;
}

function getIconName(iconSpan) {
  if (!iconSpan) return '';
  return Array.from(iconSpan.classList)
    .find((c) => c.startsWith('icon-'))
    .substring(5);
}

function decorateOtherIcon(iconContainer) {
  if (!iconContainer) return;
  const firstIcon = iconContainer.querySelector('.icon:first-child');
  if (!firstIcon) return;
  const otherIconDiv = firstIcon.parentElement?.nextElementSibling?.querySelector('.icon')
    ? firstIcon.parentElement?.nextElementSibling
    : undefined;
  if (getIconName(firstIcon) === 'other') firstIcon?.parentElement.remove();
  else otherIconDiv?.remove();
}

function decorateCenteredIconTitleVariant(card) {
  decorateOtherIcon(card);
}

function decorateBenefitVariant(benefitCard) {
  if (benefitCard.children.length === 0) return;
  const [header, description] = benefitCard.children;
  header.classList.add('header');
  description?.classList.add('description');

  if (header.children.length > 0) {
    const title = header.children.length > 1
      ? header.querySelector('p:nth-of-type(2)')
      : header.querySelector('p:first-of-type');
    if (title && title.textContent?.trim() !== '') title.classList.add('title');
    decorateOtherIcon(header);
  }
}

function generateRatingMarkup(aHref) {
  const bvRating = createElement('div', 'ts-bv-rating');
  const bvRatingReviews = createElement('div', 'ts-bv-rating-reviews');
  const bvRatingReviewNum = createElement('p', 'ts-bv-rating-reviews-number');
  bvRatingReviewNum.textContent = '(0)';
  if (aHref) {
    const bvReviewLink = createElement('a', '');
    bvReviewLink.href = aHref;
    bvReviewLink.append(bvRatingReviewNum);
    bvRatingReviews.append(bvReviewLink);
  } else {
    bvRatingReviews.append(bvRatingReviewNum);
  }
  const bvRatingStars = generateBvStarMarkup(aHref);
  bvRating.append(bvRatingStars);
  bvRating.append(bvRatingReviews);
  return bvRating;
}

async function decorateRating(starContent, productId) {
  const results = await fetchBVProductRating();
  if (results) {
    results.forEach((result) => {
      if (result.ProductStatistics?.ProductId?.toLowerCase() === productId) {
        const averageOverallRating = result
          ?.ProductStatistics
          ?.ReviewStatistics
          ?.AverageOverallRating;
        const totalReviewCount = result
          ?.ProductStatistics
          ?.ReviewStatistics
          ?.TotalReviewCount;

        const rating = starContent.querySelector('.ts-bv-filled-star');
        const starWidth = (averageOverallRating * 100) / 5;
        rating.style.width = `${starWidth}%`;
        const reviews = starContent.querySelector('.ts-bv-rating-reviews-number');
        reviews.textContent = `(${totalReviewCount})`;
      }
    });
  }
}

function decorateProductVariant(productCard) {
  if (productCard.children.length === 0) return;
  const [header,
    description,
    bazaarvoiceProductId,
    firstButtonContainer,
    secondButtonContainer] = productCard.children;
  header.classList.add('header');

  if (header.children.length > 0) {
    header.querySelectorAll(':scope p').forEach((para) => {
      if (para.textContent?.trim() !== '') {
        para.classList.add('title');
        // since product title is a link, sometimes it is auto-converted to button
        para.classList.remove('button-container');
        para.querySelector(':scope > a')?.classList.remove('button');
      }
    });
    decorateOtherIcon(header);
  }

  if (description) {
    description.classList.add('description');
    const descMainPara = description.querySelector(':scope p:nth-child(1)');
    descMainPara?.classList.add('main');
    if (description.children.length > 1) {
      const costPara = description.querySelector(':scope p:nth-child(2)');
      costPara?.classList.add('cost');
    }
  }

  const productId = bazaarvoiceProductId?.textContent;
  if (bazaarvoiceProductId) bazaarvoiceProductId.remove();
  if (productId && productId !== 'disable') {
    const titleLink = header.querySelector(':scope .title a');
    const linkHref = (titleLink && titleLink.href) ? titleLink.href : null;
    const starContent = generateRatingMarkup(linkHref);
    description?.append(starContent);
    try {
      decorateRating(starContent, productId);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log('Error on integrate BV rating: ', error);
    }
  }

  let buttonGroup = firstButtonContainer;
  if (firstButtonContainer && secondButtonContainer) {
    firstButtonContainer.append(...secondButtonContainer.children);
    secondButtonContainer.remove();
  } else if (secondButtonContainer) {
    buttonGroup = secondButtonContainer;
  }
  if (buttonGroup) {
    description?.append(buttonGroup);
    buttonGroup.classList.add('button-grp');
    buttonGroup
      .querySelectorAll('p em a')
      ?.forEach((button) => button.classList.add('button', 'orange'));
  }
  if (
    productCard.classList.contains('active')
    || !productCard.nextElementSibling
    || productCard.nextElementSibling.classList.contains('active')
  ) {
    productCard.classList.add('no-separator');
  }
}

/**
 * @param {Element} titleDescCard
 */
function decorateTitleDescriptionVariant(titleDescCard) {
  const [content, url] = titleDescCard.children;
  const [title, desc] = content?.children || [];
  const link = url?.querySelector('a')?.href || '';
  if (!title && !desc) return;
  let el;
  if (link !== '') {
    el = document.createElement('a');
    el.href = link;
  } else {
    el = document.createElement('div');
  }
  url?.remove();
  el.append(content);

  el.classList.add(...titleDescCard.classList.values());
  title?.classList?.add('title-d');
  desc?.classList?.add('description');

  moveInstrumentation(titleDescCard, el);
  titleDescCard.replaceWith(el);
}

export default function decorate(block) {
  updateCardsBlockColumnsProperty(block);
  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);
    const classes = getCardItemClasses(row);
    if (classes?.length > 0) li.classList.add(...classes);
    classes.forEach((cls) => {
      if (Object.values(VARIANT).includes(cls)) {
        ul.classList.add(`${cls}-list`);
      }
    });
    const hasDefaultCardItems = li.classList.contains(VARIANT.imageTitleDescription)
      || li.classList.contains(VARIANT.logoAndDescription);
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-card-image';
      else if (!li.classList.contains(VARIANT.product) && div.innerHTML.trim() === '') div.remove();
      else if (hasDefaultCardItems) div.className = 'cards-card-body';
    });
    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => {
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    const optimisedImg = optimizedPic.querySelector('img');
    moveInstrumentation(img, optimisedImg);
    img.closest('picture').replaceWith(optimizedPic);
    optimisedImg.onload = () => {
      optimisedImg.style.minHeight = '0';
    };
  });

  ul.querySelectorAll('li').forEach((li) => {
    if (li.classList.contains(VARIANT.imageTitleDescription)) {
      const title = li.querySelector('.cards-card-body p:first-of-type');
      title?.classList.add('title');
    } else if (li.classList.contains(VARIANT.centeredIconTitle)) {
      decorateCenteredIconTitleVariant(li);
    } else if (li.classList.contains(VARIANT.benefit)) {
      decorateBenefitVariant(li);
    } else if (li.classList.contains(VARIANT.product)) {
      decorateProductVariant(li);
    } else if (li.classList.contains(VARIANT.titleDescription)) {
      decorateTitleDescriptionVariant(li);
    }
  });

  block.textContent = '';
  block.append(ul);
}
