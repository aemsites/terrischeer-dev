const PDF_ICON = `${window.hlx.codeBasePath}/icons/pdf-file-teal.svg`;

function decorateDocGroup(groupEl, category1Name, category2Name) {
  // Heading
  const docGroupHeading = document.createElement('div');
  docGroupHeading.classList.add('doc-group-heading');
  groupEl.children[0].classList.add('doc-group-type');
  docGroupHeading.append(groupEl.children[0]);
  docGroupHeading.append(groupEl.children[0]);

  // Hide/show description on filter button
  if (groupEl.children[0].textContent === 'true') {
    groupEl.classList.add('show-description');
  }
  groupEl.children[0].remove();

  groupEl.children[0].classList.add('category-1');
  groupEl.children[1].classList.add('category-2');
  // Body
  if (groupEl.children[1].textContent.trim() !== '') {
    // Category 2 field contains content, thus filtering by categorisation is possible
    const category1Title = document.createElement('h3');
    category1Title.textContent = category1Name;
    groupEl.children[0].prepend(category1Title);

    const category2Title = document.createElement('h3');
    category2Title.textContent = category2Name;
    groupEl.children[1].prepend(category2Title);
  } else {
    groupEl.children[0].classList.add('always-show');
  }
  const docGroupBody = document.createElement('div');
  docGroupBody.classList.add('doc-group-body');
  docGroupBody.append(groupEl.children[0]);
  docGroupBody.append(groupEl.children[0]);

  groupEl.classList.add('doc-group');
  groupEl.append(docGroupHeading);
  groupEl.append(docGroupBody);

  groupEl.querySelectorAll('li:has(em) > ul').forEach((previousVersions) => {
    const em = previousVersions.parentNode.querySelector('em');
    em.setAttribute('tabindex', '0');
    em.addEventListener('click', () => {
      previousVersions.classList.toggle('appear');
      em.textContent = previousVersions.classList.contains('appear')
        ? 'Hide previous versions'
        : 'Show previous versions';
    });
    em.addEventListener('keypress', (event) => {
      if (event.key !== 'Enter') return;
      previousVersions.classList.toggle('appear');
      em.textContent = previousVersions.classList.contains('appear')
        ? 'Hide previous versions'
        : 'Show previous versions';
    });
    previousVersions.classList.add('prev-versions');
  });

  groupEl.querySelectorAll('.doc-group-body li').forEach((document) => {
    document.style.background = `url(${PDF_ICON}) no-repeat left 2.5px`;
    document.style.backgroundSize = '20px';
    document.style.paddingInlineStart = '25px';
  });
}

function buildFilterButtonGroup(filtersContainer, filterGroup, filterTypes, filterDescriptions) {
  const filterGroupEl = document.createElement('div');

  const buttons = document.createElement('div');
  buttons.classList.add('filter-button-group');

  filterTypes.forEach((option, i) => {
    const button = document.createElement('button');
    button.textContent = option;
    const buttonSubtext = document.createElement('div');
    buttonSubtext.textContent = filterDescriptions[i];
    button.append(buttonSubtext);
    buttons.append(button);
  });

  const filterTitle = document.createElement('h4');
  filterTitle.textContent = `Filter by ${filterGroup}`;

  const filterClearButton = document.createElement('button');
  filterClearButton.textContent = 'Show all';
  filterClearButton.classList.add('filter-clear-button');

  filterGroupEl.append(filterTitle);
  filterGroupEl.append(buttons);
  filterGroupEl.append(filterClearButton);
  filtersContainer.append(filterGroupEl);
}

function buildFiltersContainer(block) {
  const filtersContainer = document.createElement('div');
  filtersContainer.classList.add('filters-container');
  block.children[0].remove();
  block.children[0].remove();
  block.prepend(filtersContainer);
}

export default async function decorate(block) {
  const category1Name = block.children[0].textContent;
  const category2Name = block.children[1].textContent;
  buildFiltersContainer(block);

  const insuranceTypes = [];
  const insuranceDescriptions = [];
  for (let i = 1; i < block.children.length; i += 1) {
    decorateDocGroup(block.children[i], category1Name, category2Name);
    insuranceTypes[i - 1] = block.children[i].querySelector('.doc-group-type > p')
      ? block.children[i].querySelector('.doc-group-type > p').textContent
      : '';
    insuranceDescriptions[i - 1] = block.children[i].classList.contains('show-description')
      ? block.children[i].querySelector('div:not(.doc-group-type) > p').textContent
      : '';
  }

  // Insurance type filters
  buildFilterButtonGroup(block.children[0], 'Insurance Type', insuranceTypes, insuranceDescriptions);
  const insuranceTypeButtons = block.querySelector('.filters-container > div:first-child > .filter-button-group');
  const insuranceTypeClear = block.querySelector('.filters-container > div:first-child > .filter-clear-button');

  insuranceTypeButtons.addEventListener('click', (event) => {
    if (event.target.tagName === 'BUTTON' || event.target.parentNode.tagName === 'BUTTON') {
      const activeButton = insuranceTypeButtons.querySelector('button.active');
      activeButton?.classList.remove('active');
      const button = event.target.closest('button');
      button.classList.add('active');

      block.querySelectorAll('.doc-group').forEach((docGroup) => {
        docGroup.classList.add('hidden');
      });

      const childNodeNumber = Array.from(button.parentNode.childNodes).indexOf(button) + 1;
      block.children[childNodeNumber].classList.remove('hidden');
    }
  });

  insuranceTypeClear.addEventListener('click', () => {
    insuranceTypeButtons.querySelector('button.active')?.classList.remove('active');
    block.querySelectorAll('.doc-group').forEach((docGroup) => {
      docGroup.classList.remove('hidden');
    });
  });

  // Category filters
  buildFilterButtonGroup(block.children[0], 'Property Management', [category1Name, category2Name], ['', '']);
  const categoryButtons = block.querySelector('.filters-container > div:last-child > .filter-button-group');
  const categoryClear = block.querySelector('.filters-container > div:last-child > .filter-clear-button');

  categoryButtons.addEventListener('click', (event) => {
    if (event.target.tagName === 'BUTTON') {
      const activeButton = categoryButtons.querySelector('.active');
      activeButton?.classList.remove('active');
      event.target.classList.add('active');

      const childNodeNumber = Array.from(event.target.parentNode.childNodes).indexOf(event.target);
      block.classList.remove('category-1-applied', 'category-2-applied');
      block.classList.add(`category-${childNodeNumber + 1}-applied`);
    }
  });

  categoryClear.addEventListener('click', () => {
    categoryButtons.querySelector('button.active')?.classList.remove('active');
    block.classList.remove('category-1-applied', 'category-2-applied');
  });
}
