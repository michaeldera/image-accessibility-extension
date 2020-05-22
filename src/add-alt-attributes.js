const IR_ENDPOINT = 'https://image-recognition-function.azurewebsites.net/api/AnalyseImage?url=';

// create a regex expression which will be used to test if our URL is absolute or definite.Is TRUE for absolute values
const exp = new RegExp('^(?:[a-z]+:)?//', 'i');


const watchedNodes = []; //array of nodes that we added alt attributes to, so we monitor

const imagesForProcessing = [];
let scheduleProcessImages;

/** Analyze images.
* @param {Array<Node>} imageNodes - imgs to analyze.
*/
const processImages = (imageNodes, forceAnalyze = false) => {
  imageNodes.forEach((img) => {
    // Check for all images that do not have alt attributes and set the alt attribute
    // @todo switch ! back
    const isWatched = watchedNodes.includes(img);
    // if the img is on watchlist, it must be updated regardless
    if (!img.hasAttribute('alt') || isWatched ) {
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
          if(!isWatched){ 
            watchedNodes.push(img) 
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

  scheduleProcessImages = false // reset
  imagesForProcessing.splice(0,imagesForProcessing.length)
};

// when a page loads:

// a) attach a mutation observer on the body

const observerOptions = {
  attributes: true,
  childList: true,
  subtree: true,
};
const observer = new MutationObserver((mutations)=>{
  for (const mutation of mutations) {
    const assessForProcessing = (node) => {
      if (!node.hasAttribute('alt')) {
        scheduleProcessImages = true;
        imagesForProcessing.push(node);
      }
    };
    // changes in src for existing images
    if (mutation.attributeName == 'src' 
        && mutation.target.tagName.toLowerCase() == 'img' 
        && watchedNodes.includes(mutation.target)) {
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

observer.observe(document.body, observerOptions);

// b) Query all images on the DOM and store them in an HTMLCollection Object
const images = document.getElementsByTagName('img');
processImages([...images]);
