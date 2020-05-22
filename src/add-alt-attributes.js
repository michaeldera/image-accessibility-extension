const IR_ENDPOINT = 'https://image-recognition-function.azurewebsites.net/api/AnalyseImage?url=';

// create a regex expression which will be used to test if our URL is absolute or definite.Is TRUE for absolute values
const exp = new RegExp('^(?:[a-z]+:)?//', 'i');

/**
 * array of nodes that we added alt attributes to, so we monitor
 *
 * @var {Array}
 */
const watchedNodes = [];

/**
 * Array of images that will be processed when processImages is run
 *
 * @var {Array}
 */
const imagesForProcessing = [];

/**
 * When changes in the DOM are detected, this can be checked to see if processImages should be called
 * If the changes in the DOM did not include new "alt-less" images, this will still be false;
 *
 * @var {Boolean}
 */
let scheduleProcessImages = false;

/** Analyze images
* @param {Array<Node>} imageNodes - imgs to analyze.
*/
const processImages = (imageNodes) => {
  filterDuplicates(imageNodes).forEach((img) => {
    // Check for all images that do not have alt attributes and set the alt attribute
    const isWatched = watchedNodes.includes(img);
    // if the img is on watchlist, it must be updated regardless
    if (!img.hasAttribute('alt') || isWatched ) {// @todo switch ! back
      const srcAttribute = img.getAttribute('src');
      const src = exp.test(srcAttribute) ?
    srcAttribute :
    new URL(srcAttribute, document.baseURI).href;
      const url = `${IR_ENDPOINT}${src}`;
      chrome.runtime.sendMessage({src: url}, (callbackMessage) => {
        if (callbackMessage.response) {
          const data = callbackMessage.response;
          let caption;
          // Store array of captions returned from function
          const captionsArray = data.description ? data.description.captions: [];
          // check if captions was actually return by checkiing if captions is defined

          if (captionsArray.length > 0) {
            const sortedArray = captionsArray.sort((a, b) => {
              return a.confidence - b.confidence;
            });
            // get the first element from the sorted array. i.e the one the image recognition function has greatest confidence about.
            caption = sortedArray[0].text;
          } else {
          // assume images with non-standard formats are decorative  are decorative
            caption = '';
          }
          img.setAttribute('alt', caption);
          // if node is not on mutation watchlist, added
          if (!isWatched) {
            watchedNodes.push(img);
          };
        }
        if (callbackMessage.error) {
          const err = callbackMessage.error;
          console.error(err);
        // handle your errors here
        }
      });
    }
  });
  scheduleProcessImages = false; // reset
  imagesForProcessing.splice(0, imagesForProcessing.length);
};

/**
 * @return {Array} - Unique image srcs
 * @param {Array} images - DOM nodes of img elements
 */
const filterDuplicates = (images) => {
  const uniqImages = [];
  const filtered = [...images].filter((img)=>{
    const src = img.getAttribute('src');
    if (!uniqImages.includes(src)) {
      uniqImages.push(src);
      return true;
    }
    return false;
  });
  return filtered;
};

/**
 *  All available img elements
 *  @return {Array}
 */
const htmlImagesCollection = () => {
  const images = document.getElementsByTagName('img');
  return [...images];
};

/**
 * Watches the DOM for new images and changes in src for images that image-a11y added alt
 *
 * @param   {any}  mutations  [mutations description]
 */
const observer = new MutationObserver((mutations)=>{
  for (const mutation of mutations) {
    const assessForProcessing = (node) => {
      if (!node.hasAttribute('alt')) {
        scheduleProcessImages = true;
        imagesForProcessing.push(node);
      }
    };
    // changes in src for existing images
    if (mutation.attributeName == 'src' &&
        mutation.target.tagName.toLowerCase() == 'img' &&
        watchedNodes.includes(mutation.target)) {
      scheduleProcessImages = true;
      imagesForProcessing.push(mutation.target);
    };
    // newly added images
    mutation.addedNodes.forEach((node) => {
      if (node.tagName && node.tagName.toLowerCase() == 'img') {
        assessForProcessing(node);
      }
    });
  }
  // there are new images on DOM without alt attributes
  if (scheduleProcessImages) {
    processImages(imagesForProcessing);
  }
});


// when page loads:

// a) process images on the page
processImages(htmlImagesCollection());
// b) attach an observer for document changes
observer.observe(document.body, {
  attributes: true,
  childList: true,
  subtree: true,
});
