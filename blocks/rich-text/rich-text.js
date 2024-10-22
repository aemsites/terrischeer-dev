const RICHTEXT_PRESET_OPTIONS = [
  'h1-black',
  'h2-black',
  'h3-black',
  'h4-black',
  'thin-font',
  'big-font',
  'small-font',
  'small-h3',
  'bottom-border',
  'line-space',
  'backgroundcolor-teal',
];
export default async function decorate(block) {
  const blockOptions = block.querySelectorAll(':scope > div > div');
  const blockSettings = [];
  let text = '';
  blockOptions.forEach((option, index) => {
    if (index !== 0) {
      const contentSetting = option.children[0]?.textContent;
      if (contentSetting) {
        const contentSettingArray = contentSetting.split(',');
        blockSettings.push(
          ...contentSettingArray.filter((element) => RICHTEXT_PRESET_OPTIONS.includes(element)),
        );
      }
      const icon = option.querySelector('span.icon img');
      if (icon) {
        blockSettings.push(icon.getAttribute('data-icon-name'));
      }
    } else {
      text = option;
    }
  });
  block.classList.add(...blockSettings, 'block');
  block.textContent = '';
  block.replaceChildren(text);
}
