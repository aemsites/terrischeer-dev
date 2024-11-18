export default function decorate(block) {
  const pElement = block.querySelector(':scope > div > div > p');
  const childrenArray = Array.from(pElement.children);

  const desktopPattern = [2, 3, 1];
  const tabletPattern = [1, 2];
  const mobilePattern = [1];

  let pattern;
  let patternIndex = 0;
  let startIndex = 0;
  const itemsPerLoad = 12;
  let totalItemsDisplayed = 0;

  function getPattern() {
    if (window.matchMedia('(max-width: 767px)').matches) {
      return mobilePattern;
    }
    if (window.matchMedia('(max-width: 991px)').matches) {
      return tabletPattern;
    }
    return desktopPattern;
  }

  // Set initial pattern
  pattern = getPattern();
  block.innerHTML = '';

  function createRows(start, end) {
    let currentIndex = start;
    while (currentIndex < end && currentIndex < childrenArray.length) {
      const itemsInRow = pattern[patternIndex % pattern.length];
      const flexContainer = document.createElement('div');
      flexContainer.classList.add(`flex-row-${itemsInRow}`);

      for (let i = 0; i < itemsInRow && currentIndex < childrenArray.length; i += 1) {
        flexContainer.appendChild(childrenArray[currentIndex]);
        currentIndex += 1;
      }

      // Handle special layout for single-column items in desktop
      if (pattern.length > 2 && flexContainer.classList.contains('flex-row-1')) {
        const newsListItem = flexContainer.querySelector('.news-list-item');
        const imageWrapper = newsListItem.querySelector('.image-wrapper');
        const contentWrapper = document.createElement('div');
        contentWrapper.classList.add('content-wrapper');

        Array.from(newsListItem.children).forEach((child) => {
          if (child !== imageWrapper) {
            contentWrapper.appendChild(child);
          }
        });
        newsListItem.appendChild(contentWrapper);
      }

      block.appendChild(flexContainer);
      patternIndex += 1;
    }
    return currentIndex;
  }

  // Initially display the first 12 items
  totalItemsDisplayed = createRows(startIndex, itemsPerLoad);

  // Create and append 'Load More Articles' button
  const loadMoreButton = document.createElement('button');
  loadMoreButton.textContent = 'Load More Articles';
  loadMoreButton.classList.add('load-more-btn');
  const buttonWrapper = document.createElement('div');
  buttonWrapper.classList.add('button-wrapper');
  buttonWrapper.appendChild(loadMoreButton);
  block.appendChild(buttonWrapper);

  // Event listener for the Load More button
  loadMoreButton.addEventListener('click', () => {
    startIndex = totalItemsDisplayed;
    totalItemsDisplayed = createRows(startIndex, totalItemsDisplayed + itemsPerLoad);

    // Re-append the Load More button to ensure it's at the bottom
    block.appendChild(buttonWrapper);

    // Hide the Load More button if all items are displayed
    if (totalItemsDisplayed >= childrenArray.length) {
      buttonWrapper.style.display = 'none';
    }
  });

  // Initially hide the Load More button if all items fit in the initial view
  if (totalItemsDisplayed >= childrenArray.length) {
    buttonWrapper.style.display = 'none';
  }

  // Function to handle window resizing and layout adjustment
  function handleResize() {
    const newPattern = getPattern();
    if (newPattern !== pattern) {
      pattern = newPattern;
      patternIndex = 0;
      startIndex = 0;
      block.innerHTML = '';
      totalItemsDisplayed = createRows(0, totalItemsDisplayed);
      block.appendChild(buttonWrapper);
      if (totalItemsDisplayed >= childrenArray.length) {
        buttonWrapper.style.display = 'none';
      }
    }
  }

  // Add a resize listener to adjust layout on screen resize
  window.addEventListener('resize', handleResize);
}
