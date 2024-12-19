import { loadScript, sampleRUM } from './aem.js';
import {
  getEnvType,
  addBazaarVoiceReviewsScript,
  addBazaarVoiceFormSubmissionScript,
  updateBazaarVoiceRatingBlock,
} from './blocks-utils.js';

// Core Web Vitals RUM collection
sampleRUM('cwv');

const BV_SCRIPT = 'https://display.ugc.bazaarvoice.com/bvstaging/static/terrischeer/en_AU/bvapi.js';
const BOOTSTRAP_STAGE_SCRIPT = 'https://assets1.terrischeer.com.au/suncorp/ts-bw-stage/Bootstrap.js';
const BOOTSTRAP_PROD_SCRIPT = 'https://assets1.terrischeer.com.au/suncorp/ts-bw-prod/Bootstrap.js';

async function loadBazaarVoice() {
  const main = document.querySelector('body > main');
  const bvReviewsBlocks = Array.from(main.querySelectorAll('.block.bv-reviews'));
  const bvSubmissionFormBlocks = Array.from(main.querySelectorAll('.bv-submission-form'));
  updateBazaarVoiceRatingBlock(main);
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

async function loadBootstrap() {
  let scriptSrc = BOOTSTRAP_PROD_SCRIPT;
  const envType = getEnvType();
  scriptSrc = (envType === 'prod' || envType === 'live') ? BOOTSTRAP_PROD_SCRIPT : BOOTSTRAP_STAGE_SCRIPT;
  await loadScript(scriptSrc);
}

loadBootstrap();
loadBazaarVoice();
