import { loadScript } from './aem.js';
import { getEnvType, addBazaarVoiceReviewsScript } from './blocks-utils.js';

const BV_SCRIPT = 'https://display.ugc.bazaarvoice.com/bvstaging/static/terrischeer/en_AU/bvapi.js';

async function loadBazaarVoiceScript() {
  let scriptSrc = BV_SCRIPT;
  const envType = getEnvType();
  if (envType === 'prod' || envType === 'live') scriptSrc = scriptSrc.replace('/bvstaging', '');
  await loadScript(scriptSrc);
  addBazaarVoiceReviewsScript();
}

loadBazaarVoiceScript();
