const IR_ENDPOINT = 'https://image-recognition-function.azurewebsites.net/api/AnalyseImage?url=';

// create a regex expression which will be used to test if our URL is absolute or definite.Is TRUE for absolute values
const exp = new RegExp('^(?:[a-z]+:)?//', 'i');

/**
 * odes that we added alt attributes to, so we monitor
 *
 * @type {Array<Node>}
 */
const watchedNodes = [];

/**
 * images that will be processed when processImages is run
 *
 * @type {Array<Node>}
 */
const imagesForProcessing = [];

/**
 * When changes in the DOM are detected, this can be checked to see if processImages should be called
 * If the changes in the DOM did not include new "alt-less" images, this will still be false;
 *
 * @type {Boolean}
 */
let scheduleProcessImages = false;

/** Analyze images
* @param {Array<Node>} imageNodes - imgs to analyze.
*/
const processImages = (imageNodes) => {
  /* get only the unique image URLs. To prevent multiple calls to the API for the same image.
   * Like if the image the same https:/same/path/image.jpg is used twice on the same page.
   */
  const uniqImages = filterDuplicates(imageNodes);

  // analyze each (unique URL) image Node
  uniqImages.forEach((img) => {
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
        // get all other images that have the same URL src, and apply same description
        imageNodes.filter((otherImg) => {
          return otherImg.getAttribute('src') == srcAttribute;
        }).forEach((otherImg) => {
          otherImg.setAttribute('alt', caption);
          const isWatched = watchedNodes.includes(otherImg);
          // if node is not on mutation watchlist, add it
          if (!isWatched) {
            watchedNodes.push(otherImg);
          };
        });
      }
      if (callbackMessage.error) {
        const err = callbackMessage.error;
        console.error(err);
        // handle your errors here
      }
    });
  });

  scheduleProcessImages = false; // reset
  imagesForProcessing.splice(0, imagesForProcessing.length);
};

/**
 * @return {Array<Node>} - Unique image srcs
 * @param {Array<Node>} images - DOM nodes of img elements
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
 *  All available img elements without alt attributes
 *  @return {Array<Node>}
 */
const noAltImagesCollection = () => {
  const images = document.getElementsByTagName('img');
  return [...images].filter((img)=> {
    return !img.hasAttribute('alt');
  });
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
processImages(noAltImagesCollection());
// b) attach an observer for document changes
observer.observe(document.body, {
  attributes: true,
  childList: true,
  subtree: true,
});
