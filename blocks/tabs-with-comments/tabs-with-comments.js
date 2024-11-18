// Function to create a dropdown
function createDropdown(links, sections) {
  const dropdown = document.createElement('select');
  dropdown.className = 'dropdown-list';
  links.forEach((button, index) => {
    const option = document.createElement('option');
    option.value = index; // Use index to track sections
    option.textContent = button.textContent;
    dropdown.appendChild(option);
  });
  dropdown.addEventListener('change', function handleChange() {
    const selectedIndex = this.value;
    // Hide all content sections
    sections.forEach((section) => {
      section.style.display = 'none';
    });
    // Show the selected content section
    sections[selectedIndex].style.display = 'block';
  });
  return dropdown;
}

// Function to set the active link
function setActiveLink(link) {
  document.querySelectorAll('.custom-side-nav li').forEach((item) => {
    item.classList.remove('active');
  });
  link.parentElement.classList.add('active');
}

// Function to highlight the current link and display its content
function highlightCurrentLink(sideNavList, sections) {
  const activeLinkPath = localStorage.getItem('activeLinkPath');
  const currentPath = window.location.pathname;

  sideNavList.querySelectorAll('a').forEach((link) => {
    if (link.href.endsWith(currentPath) || link.href.endsWith(activeLinkPath)) {
      setActiveLink(link);

      // Display the corresponding section
      sections.forEach((section) => {
        section.style.display = 'none';
      });
      sections[link.dataset.target].style.display = 'block';
    }
  });
}

// Function to create side navigation
function createSideNavigation(links, sections) {
  const sideNav = document.createElement('nav');
  sideNav.className = 'custom-side-nav';
  const sideNavList = document.createElement('ul');
  const exampleLink = links[0];
  const url = new URL(exampleLink.href);
  const basePath = url.pathname.split('/').slice(0, -2).join('/'); // Exclude the last segment

  links.forEach((button, index) => {
    const listItem = document.createElement('li');
    const link = document.createElement('a');
    link.href = `${basePath}/${button.textContent.toLowerCase().replace(/\s+/g, '-')}`;
    link.textContent = button.textContent;
    link.dataset.target = index;
    listItem.appendChild(link);
    sideNavList.appendChild(listItem);
  });

  sideNavList.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      sections.forEach((section) => {
        section.style.display = 'none';
      });
      sections[link.dataset.target].style.display = 'block';

      window.history.pushState(null, '', link.href);
      setActiveLink(link);
      localStorage.setItem('activeLinkPath', link.href);
    });
  });

  sideNav.appendChild(sideNavList);
  highlightCurrentLink(sideNavList, sections);

  return sideNav;
}
// Function to handle testimonials
function handleTestimonials(testimonialBlock) {
  // Select the <ul> element with the class 'testimonial-list'
  const testimonialContainer = testimonialBlock.querySelector('div > div:nth-child(2) > ul');
  if (testimonialContainer) {
    const testimonials = testimonialContainer.querySelectorAll('li');
    // Check if there are any testimonials
    if (testimonials.length === 0) {
      return; // Exit if no testimonials
    }
    let currentTestimonial = 0;
    const showTestimonial = function showTestimonial(index) {
      testimonials.forEach((testimonial, i) => {
        testimonial.style.display = i === index ? 'block' : 'none';
      });
    };
    showTestimonial(currentTestimonial);

    const rotateTestimonials = function rotateTestimonials() {
      currentTestimonial = (currentTestimonial + 1) % testimonials.length;
      showTestimonial(currentTestimonial);
    };

    setInterval(rotateTestimonials, 5000);

    // Move the parent div of the <ul> to the end of testimonialBlock
    testimonialBlock.appendChild(testimonialContainer.parentElement);
  }
}

// Call the function with the correct block
const testimonialBlock = document.querySelector('div');
handleTestimonials(testimonialBlock);

export default function decorate(block) {
  const buttonLinks = block.querySelectorAll('.button-container a');
  const contentSections = Array.from(block.querySelectorAll('.tabs-with-comments > div > div:nth-child(2)'));
  // Hide all content sections initially except for the first one
  contentSections.forEach((section, index) => {
    section.style.display = index === 0 ? 'block' : 'none';
  });
  // Move the existing header to the top of the block
  const header = document.querySelector('.tabs-with-comments > div:nth-child(1) h3');
  if (header) {
    block.insertBefore(header, block.firstChild);
  }
  // Create and populate dropdown for navigation
  const dropdown = createDropdown(buttonLinks, contentSections);
  block.insertBefore(dropdown, header ? header.nextSibling : block.firstChild);
  // Create side navigation for desktop
  const sideNav = createSideNavigation(buttonLinks, contentSections);
  block.insertBefore(sideNav, dropdown);
  // Handle testimonials
  handleTestimonials(block);
  // Add the arrow-down div at the end of the block
  const arrowDown = document.createElement('div');
  arrowDown.className = 'arrow-down';
  block.appendChild(arrowDown);
}
