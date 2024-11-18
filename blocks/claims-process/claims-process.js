const DROPDOWN_ICON = `${window.hlx.codeBasePath}/icons/chevron-down-white.svg`;

function buildClaimProcessOption(processOption, optionIcon, optionName, claimProcessMenu) {
  // Add back button element
  const backButton = document.createElement('button');
  backButton.append(optionIcon);
  backButton.append(optionName);
  processOption.prepend(backButton);
  backButton.addEventListener('click', () => {
    processOption.classList.remove('open');
    claimProcessMenu.classList.remove('hidden');
  });
  processOption.querySelector('.claim-process-option > div:nth-child(2)').remove();
  processOption.querySelector('.claim-process-option > div:nth-child(2)').remove();

  // Add back button chevron and text
  const backText = document.createElement('span');
  backText.classList.add('back-text');

  const chevronIcon = document.createElement('img');
  chevronIcon.setAttribute('src', DROPDOWN_ICON);
  chevronIcon.setAttribute('alt', 'Back chevron icon');

  backText.textContent = 'Back';
  backText.prepend(chevronIcon);
  backButton.prepend(backText);
}

export default function decorate(block) {
  const claimProcessMenu = block.querySelector('.claims-process.block > div:first-child');
  claimProcessMenu.classList.add('claim-process-menu');

  const claimProcessOptions = block.querySelectorAll('.claims-process.block > div:not(:first-child)');
  claimProcessOptions.forEach((processOption) => {
    processOption.classList.add('claim-process-option');

    const optionName = processOption.querySelector('.claim-process-option > div:first-child > p');
    const optionIcon = processOption.querySelector('.claim-process-option > div:nth-child(2) > p > span');

    const optionButtonContainer = document.createElement('div');
    const optionButton = document.createElement('button');
    if (optionIcon) optionButton.append(optionIcon.cloneNode(true));
    if (optionName) {
      const copiedOptionName = document.createElement('p');
      copiedOptionName.textContent = optionName.textContent;
      optionButton.append(copiedOptionName);
    }
    optionButton.addEventListener('click', () => {
      processOption.classList.add('open');
      claimProcessMenu.classList.add('hidden');
    });
    optionButtonContainer.append(optionButton);
    claimProcessMenu.append(optionButtonContainer);

    buildClaimProcessOption(processOption, optionIcon, optionName, claimProcessMenu);
  });

  const buttons = block.querySelectorAll('a.button');
  buttons.forEach((button) => {
    button.classList.add('orange');
  });
}
