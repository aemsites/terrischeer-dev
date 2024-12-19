const createMetadataBlock = (main, document) => {
  const meta = {};

  // find the <title> element
  const title = document.querySelector('title');
  if (title) {
    meta.Title = title.innerHTML.replace(/[\n\t]/gm, '');
  }

  // find the <meta property="og:description"> element
  const desc = document.querySelector('[property="og:description"]');
  if (desc) {
    meta.Description = desc.content;
  }

  // find the <meta property="og:image"> element
  const img = document.querySelector('[property="og:image"]');
  if (img) {
    // create an <img> element
    const el = document.createElement('img');

    el.src = img.content;
    meta.Image = el;
  }

  // helper to create the metadata block
  const block = WebImporter.Blocks.getMetadataBlock(document, meta);

  // append the block to the main element
  main.append(block);

  // returning the meta object might be usefull to other rules
  return meta;
};

const createSectionMetadata = (style, metadata) => {
  const cells = [
    ['Section Metadata'],
  ];

  if (style && style.length > 0) {
    const styleDiv = document.createElement('div');
    styleDiv.textContent = 'style';
    const valueDiv = document.createElement('div');
    let value = '';
    for (let i = 0; i < style.length; i += 1) {
      value += style[i];
      if (i !== style.length - 1) {
        value += ', ';
      }
    }
    valueDiv.textContent = value;
    const styleRow = [styleDiv, valueDiv];
    cells.push(styleRow);
  }

  if (metadata) {
    Object.keys(metadata).forEach((key) => {
      const keyDiv = document.createElement('div');
      keyDiv.textContent = key;

      const valueDiv = document.createElement('div');
      valueDiv.textContent = metadata[key];

      const row = [keyDiv, valueDiv];
      cells.push(row);
    });
  }

  const block = WebImporter.DOMUtils.createTable(cells, document);
  return block;
};

const createRichText = (document, content, flags) => {
  const alignmentDiv = document.createElement('div');
  const colorDiv = document.createElement('div');

  const fontDiv = document.createElement('div');
  if (flags.font) {
    fontDiv.textContent = flags.font;
  }

  const listStyleDiv = document.createElement('div');
  if (flags.listStyle) {
    listStyleDiv.textContent = flags.listStyle;
  }

  const backgroundColorDiv = document.createElement('div');

  const othersDiv = document.createElement('div');
  if (flags.others) {
    othersDiv.textContent = flags.others;
  }

  const cells = [
    ['Rich Text'],
  ];
  cells.push([content]);
  cells.push([alignmentDiv]);
  cells.push([colorDiv]);
  cells.push([fontDiv]);
  cells.push([listStyleDiv]);
  cells.push([backgroundColorDiv]);
  cells.push([othersDiv]);

  const block = WebImporter.DOMUtils.createTable(cells, document);
  return block;
};

const createVideo = (path) => {
  const cells = [
    ['Video'],
  ];

  const pathDiv = document.createElement('div');
  pathDiv.textContent = path;
  cells.push([pathDiv]);

  const video = WebImporter.DOMUtils.createTable(cells, document);
  return video;
};

const adjustLinks = (element) => {
  const link = element.querySelector('a');
  if (link && link.href.endsWith('/')) {
    link.href = link.href.slice(0, -1);
  }
};

const adjustSup = (element) => {
  const sup = element.querySelector('sup');
  const span = element.querySelector("span[id^='mfn-content']");
  if (sup && span) {
    const link = span.querySelector('a');
    const linkSup = document.createElement('sup');
    linkSup.textContent = link.textContent;
    link.title = link.textContent;
    link.textContent = '';
    link.appendChild(linkSup);
    element.appendChild(link);
    span.remove();
    sup.remove();
  }
};

const createFragment = (path) => {
  const cells = [
    ['Fragment'],
  ];

  const pathDiv = document.createElement('div');
  pathDiv.textContent = path;
  cells.push([pathDiv]);

  const fragment = WebImporter.DOMUtils.createTable(cells, document);
  return fragment;
};

const parseDefaultContent = (main, document) => {
  let div = document.createElement('div');
  let flags = {};
  const article = main.querySelector('.col-sm-8');
  Array.from(article.children).some((element) => {
    if (element.tagName === 'IMG') {
      if (div.children.length > 0) {
        main.appendChild(createRichText(document, div, flags));
        div = document.createElement('div');
        flags = {};
      }
      element.setAttribute('alt', 'article-thumbnail');
      main.appendChild(element);
    } else if (element.classList.contains('su-youtube')) {
      if (div.children.length > 0) {
        main.appendChild(createRichText(document, div, flags));
        div = document.createElement('div');
        flags = {};
      }
      const videoUrl = element.querySelector('iframe').src;
      const parts = videoUrl.split('/');
      const videoId = parts[parts.length - 1];
      const watchUrl = `https://www.youtube.com/watch?v=${videoId.slice(0, -1)}`;
      main.appendChild(createVideo(watchUrl));
    } else if (element.tagName === 'H2'
      || element.tagName === 'H3'
      || element.tagName === 'H4'
      || element.tagName === 'UL') {
      adjustLinks(element);
      if (element.tagName === 'H2') {
        const link = element.querySelector('a');
        if (link) {
          element.textContent = link.textContent;
          link.remove();
        }
      }
      div.appendChild(element);
    } else if (element.tagName === 'P') {
      if (element.textContent === 'Disclaimer:' && div.children.length > 0) {
        flags.others = 'bottom-border';
        main.appendChild(createRichText(document, div, flags));

        const disclaimer = createFragment('/content/terrischeer/fragments/news-article/disclaimer');
        main.appendChild(disclaimer);

        div = document.createElement('div');
        flags = {};
        return true;
      }

      adjustSup(element);
      adjustLinks(element);
      div.appendChild(element);
    }
    return false;
  });
  if (div.children.length > 0) {
    main.appendChild(createRichText(document, div, flags));
  }
};

/* global WebImporter */
export default {
  /**
   * Apply DOM operations to the provided document and return
   * the root element to be then transformed to Markdown.
   * @param {HTMLDocument} document The document
   * @param {string} url The url of the page imported
   * @param {string} html The raw html (the document is cleaned up during preprocessing)
   * @param {object} params Object containing some parameters given by the import process.
   * @returns {HTMLElement} The root element to be transformed
   */
  transformDOM: async ({
    // eslint-disable-next-line no-unused-vars
    document, url, html, params,
  }) => {
    // define the main element: the one that will be transformed to Markdown
    const main = document.body;

    // use helper method to remove header, footer, etc.
    WebImporter.DOMUtils.remove(main, [
      '#logo-bar',
      '#menu-bar',
      '#search-bar',
      'footer',
      'header',
    ]);

    const newsTitle = createFragment('/content/terrischeer/fragments/news-article/global-news-title');
    const sectionBreak = document.createElement('hr');
    main.prepend(sectionBreak);
    main.prepend(newsTitle);

    parseDefaultContent(main, document);
    main.querySelector('#blog').remove();

    const metadata = {
      'add-sidebar': true,
      'sidebar-link': '/content/terrischeer/fragments/news-article/related-article-categories/tenant-property-management',
      'sidebar-mobile-view': true,
      'sidebar-tablet-view': 'sidebar-tablet-view',
    };
    main.appendChild(createSectionMetadata([], metadata));

    createMetadataBlock(main, document);
    return main;
  },

  /**
   * Return a path that describes the document being transformed (file name, nesting...).
   * The path is then used to create the corresponding Word document.
   * @param {HTMLDocument} document The document
   * @param {string} url The url of the page imported
   * @param {string} html The raw html (the document is cleaned up during preprocessing)
   * @param {object} params Object containing some parameters given by the import process.
   * @return {string} The path
   */
  generateDocumentPath: ({
    // eslint-disable-next-line no-unused-vars
    document, url, html, params,
  }) => WebImporter.FileUtils.sanitizePath(new URL(url).pathname.replace(/\.html$/, '').replace(/\/$/, '')),

};
