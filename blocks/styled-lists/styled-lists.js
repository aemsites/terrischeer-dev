import { enableAdaptiveTooltip } from '../../scripts/blocks-utils.js';

const SHOW_MORE_ICON = `${window.hlx.codeBasePath}/icons/arrow-circle-teal.svg`;
const TOOLTIP_ICON = `${window.hlx.codeBasePath}/icons/question-teal.svg`;

function handleShowMoreFunctionality(list, showMoreThreshold) {
  const listItems = list.querySelectorAll('li');
  listItems.forEach((li) => {
    if (Array.prototype.indexOf.call(listItems, li) >= showMoreThreshold) {
      li.classList.add('hidden');
    }
  });

  const showMoreBtn = document.createElement('button');
  showMoreBtn.classList.add('show-more-btn');
  showMoreBtn.textContent = 'Show more';
  list.after(showMoreBtn);

  const showMoreIcon = document.createElement('img');
  showMoreIcon.setAttribute('src', SHOW_MORE_ICON);
  showMoreIcon.setAttribute('alt', 'Down arrow icon');
  showMoreBtn.prepend(showMoreIcon);

  showMoreBtn.addEventListener('click', () => {
    showMoreBtn.classList.add('hidden');
    listItems.forEach((li) => {
      li.classList.remove('hidden');
    });
  });
}

function handleTooltips(list) {
  const tooltips = list.querySelectorAll('sup');
  tooltips.forEach((tooltipText) => {
    const tooltip = document.createElement('button');
    tooltip.classList.add('icon', 'tooltip');
    tooltipText.parentNode.insertBefore(tooltip, tooltipText);

    tooltipText.classList.add('tooltip-content');
    tooltip.append(tooltipText);

    const tooltipIcon = document.createElement('img');
    tooltipIcon.setAttribute('src', TOOLTIP_ICON);
    tooltipIcon.setAttribute('alt', 'Tooltip');
    tooltip.append(tooltipIcon);

    enableAdaptiveTooltip(tooltip);
  });
}

export default function decorate(block) {
  // Custom bullet icon
  const bulletIcon = block.querySelector('.styled-lists > div:first-child span.icon > img');
  const iconSrc = bulletIcon.src;
  const listItems = block.querySelectorAll('ul > li');
  listItems.forEach((listItem) => {
    listItem.style.background = `url(${iconSrc}) left center no-repeat`;
    listItem.style.backgroundSize = '1.25rem';
    listItem.style.paddingInlineStart = '1.8rem';
  });
  block.querySelector('.styled-lists > div:first-child')?.remove();

  // Lists footnote
  const listsFootnote = block.querySelector('.styled-lists > div:first-child > div');
  listsFootnote.classList.add('footnote');
  block.append(listsFootnote);
  block.querySelector('.styled-lists > div:first-child')?.remove();

  // Teal background
  const backgroundBool = block.querySelector('.styled-lists > div:first-child p')?.textContent;
  if (backgroundBool === 'true') {
    block.classList.add('teal-background');
  } else {
    block.classList.remove('teal-background');
  }
  block.querySelector('.styled-lists > div:first-child')?.remove();

  // Style lists columns
  const listCols = document.createElement('div');
  listCols.classList.add('list-columns');
  block.querySelectorAll('.styled-lists > div:not(.footnote').forEach((col) => {
    // Tooltips & show more button
    col.querySelector('div:first-child').classList.add('column-content');
    const showMoreThreshold = col.querySelector(':scope > div:not(.column-content) > p')?.textContent;
    const lists = col.querySelectorAll('ul');
    lists.forEach((list) => {
      handleTooltips(list);
      if (showMoreThreshold && showMoreThreshold > 0 && list.children.length > showMoreThreshold) {
        handleShowMoreFunctionality(list, showMoreThreshold);
      }
    });
    col.querySelector(':scope > div:not(.column-content)')?.remove();
    listCols.append(col);
  });
  block.prepend(listCols);
}
