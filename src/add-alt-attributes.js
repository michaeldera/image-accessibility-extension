console.log('Adding alt attributes');

const IR_ENDPOINT =
  'https://image-recognition-function.azurewebsites.net/api/AnalyseImage?url=';

// create a regex expression which will be used to test if our URL is absolute or definite.Is TRUE for absolute values
const exp = new RegExp('^(?:[a-z]+:)?//', 'i');

// Query all images on the DOM and store them in an HTMLCollection Object
const images = document.getElementsByTagName('img');

for (let i = 0; i < images.length; i++) {
  const img = images.item(i);
  // Check for all images that do not have alt attributes and set the alt attribute
  // TODO : CHANGE THIS TO !
  if (img.hasAttribute('alt')) {
    const srcAttribute = img.getAttribute('src');
    const src = exp.test(srcAttribute) ?
    srcAttribute :
    `${window.location.origin + window.location.pathname + srcAttribute}`;
    const url = `${IR_ENDPOINT}${src}`;
    chrome.runtime.sendMessage({src: url}, (callbackMessage) => {
      if (callbackMessage.response) {
        const data = callbackMessage.response;
        console.log(data); // this is JSON
        /*
        append your alt image data here.
        Right now your server is return a 401 with the following message:

         " Access denied due to invalid subscription key or wrong API endpoint.
           Make sure to provide a valid key for an active subscription and use
           a correct regional API endpoint.."

        Once that is resolved you will get your json data here.
        */

        // TODO:  replace with alt image data from server
        img.setAttribute('alt', 'ALT_ATTRIBUTE_FROM_IMAGE_RECOGNITION');
      }
      if (callbackMessage.error) {
        const err = callbackMessage.error;
        console.error(err);
        // handle your errors here
      }
    });
  }
}
