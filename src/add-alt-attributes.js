console.log("Adding alt attributes");

const IR_ENDPOINT =
  "https://image-recognition-function.azurewebsites.net/api/AnalyseImage?url=";

//create a regex expression which will be used to test if our URL is absolute or definite.Is TRUE for absolute values
let exp = new RegExp("^(?:[a-z]+:)?//", "i");

//Query all images on the DOM and store them in an HTMLCollection Object
let images = document.getElementsByTagName("img");

for (let i = 0; i < images.length; i++) {
  let img = images.item(i);
  //Check for all images that do not have alt attributes and set the alt attribute
  //REMEMBER TO CHANGE THIS TO !
  if (img.hasAttribute("alt")) {
    let srcAttribute = img.getAttribute("src");
    //Get the path to the image. Check if it is absolute or not using the regex expression (origin + pathname to avoid has)
    let src = exp.test(srcAttribute)
      ? srcAttribute
      : `${window.location.origin + window.location.pathname + srcAttribute}`; //TODO.... request strings need to be better here.
    let url = IR_ENDPOINT + src;
    console.log(url);
    let response = fetch(url)
      .then((response) => {
        let reader = response.body.getReader();
        console.log(response);
        debugger;
        let result;
        while (true) {
          reader.read().then(({ done, value }) => {
            if (done){
              console.log(result);
              return;
            }
            result += value;
          });
        }
    });

    img.setAttribute("alt", "ALT_ATTRIBUTE_FROM_IMAGE_RECOGNITION");
  }
}
