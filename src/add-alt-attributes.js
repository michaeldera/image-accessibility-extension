const IR_ENDPOINT = 'https://image-recognition-function.azurewebsites.net/api/AnalyseImage?url=';

// create a regex expression which will be used to test if our URL is absolute or definite.Is TRUE for absolute values
const exp = new RegExp('^(?:[a-z]+:)?//', 'i');

/** Analyze images.
* @param {Array<Node>} imageNodes - imgs to analyze.
*/
const processImages = (imageNodes) => {
  imageNodes.forEach((img) => {
    // Check for all images that do not have alt attributes and set the alt attribute
    // @todo switch ! back
    if (!img.hasAttribute('alt')) {
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
        }
        if (callbackMessage.error) {
          const err = callbackMessage.error;
          console.error(err);
        // handle your errors here
        }
      });
    }
  });
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
    let hasNewImg;
    const imagesForProcessing = [];

    const assessForProcessing = (node) => {
      if (!node.hasAttribute('alt')) {
        hasNewImg = true;
        imagesForProcessing.push(node);
      }
    };

    // changes in src for existing images
    if (mutation.attributeName == 'src' && mutation.target.tagName.toLowerCase() == 'img' ) {
      assessForProcessing(mutation.target);
    };
    // newly added images
    mutation.addedNodes.forEach((node) => {
      if (node.tagName && node.tagName.toLowerCase() == 'img') {
        assessForProcessing(node);
      }
    });

    // there are new images on DOM without alt attributes
    if (hasNewImg) {
      processImages(imagesForProcessing);
    }
  }
});

observer.observe(document.body, observerOptions);

// b) Query all images on the DOM and store them in an HTMLCollection Object
const images = document.getElementsByTagName('img');
processImages([...images]);
