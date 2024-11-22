import { loadScript } from './aem.js';
import { getEnvType, addBazaarVoiceReviewsScript, addBazaarVoiceFormSubmissionScript } from './blocks-utils.js';

const BV_SCRIPT = 'https://display.ugc.bazaarvoice.com/bvstaging/static/terrischeer/en_AU/bvapi.js';

async function loadBazaarVoiceScript() {
  const main = document.querySelector('body > main');
  const bvReviewsBlocks = Array.from(main.querySelectorAll('.block.bv-reviews'));
  const bvSubmissionFormBlocks = Array.from(main.querySelectorAll('.bv-submission-form'));
  if (bvReviewsBlocks?.length === 0 && bvSubmissionFormBlocks?.length === 0) {
    return Promise.resolve('BV Script not required on this page.');
  }
  let scriptSrc = BV_SCRIPT;
  const envType = getEnvType();
  if (envType === 'prod' || envType === 'live') scriptSrc = scriptSrc.replace('/bvstaging', '');
  await loadScript(scriptSrc);
  addBazaarVoiceReviewsScript(bvReviewsBlocks);
  // do not show form in authoring, otherwise it skips authoring flow and tries creating form
  if (!window.hlx.codeBasePath) addBazaarVoiceFormSubmissionScript(bvSubmissionFormBlocks);
  return Promise.resolve('BV Scripts loaded!!');
}

loadBazaarVoiceScript();
