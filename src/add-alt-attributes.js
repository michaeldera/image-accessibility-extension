const IR_ENDPOINT = 'https://image-recognition-function.azurewebsites.net/api/AnalyseImage?url=';

// create a regex expression which will be used to test if our URL is absolute or definite.Is TRUE for absolute values
const exp = new RegExp('^(?:[a-z]+:)?//', 'i');

// Query all images on the DOM and store them in an HTMLCollection Object
const images = document.getElementsByTagName('img');

for (let i = 0; i < images.length; i++) {
  const img = images.item(i);
  // Check for all images that do not have alt attributes and set the alt attribute
  if (!img.hasAttribute('alt')) {
    const srcAttribute = img.getAttribute('src');
    const src = exp.test(srcAttribute) ?
    srcAttribute :
    `${window.location.origin + window.location.pathname + srcAttribute}`;
    const url = `${IR_ENDPOINT}${src}`;
    chrome.runtime.sendMessage({src: url}, (callbackMessage) => {
      if (callbackMessage.response) {
        const data = callbackMessage.response;
        let caption;
        //Store array of captions returned from function
        let captionsArray = data.description ? data.description.captions: [];
        //check if captions was actually return by checkiing if captions is defined

        if(captionsArray.length > 0){
          const sortedArray = captionsArray.sort((a, b) => {
            return a.confidence - b.confidence;
          });
          // get the first element from the sorted array. i.e the one the image recognition function has greatest confidence about. 
          caption = sortedArray[0].text;
        } else { 
          // assume images with non-standard formats are decorative  are decorative
          caption = ""
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
}
