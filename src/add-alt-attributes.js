console.log("Adding alt attributes");

const IR_ENDPOINT = "http://localhost:7071/api/AnalyseImage?url="

//create a regex expression which will be used to test if our URL is absolute or definite.Is TRUE for absolute values
let exp = new RegExp('^(?:[a-z]+:)?//', 'i');

//Query all images on the DOM and store them in an HTMLCollection Object
let images = document.getElementsByTagName("img");

for (let i = 0; i < images.length; i++) {  
  let img = images.item(i);
  //Check for all images that do not have alt attributes and set the alt attribute

  if(img.hasAttribute("alt")){
    let srcAttribute = img.getAttribute("src");

    //Get the path to the image. Check if it is absolute or not using the regex expression
    let src = exp.test(srcAttribute) ? srcAttribute :`${window.location + srcAttribute}`; //TODO.... request strings need to be better here.

    let url = IR_ENDPOINT + src;

    console.log(url);
    fetch(url).then(async (response) => {
      let json =  await response.json(); /// handle Azure Function Errors more gracefully here 
      debugger;
      return json;
    }).then((data) => {
      console.log(data)
    });
    img.setAttribute("alt", "ALT_ATTRIBUTE_FROM_IMAGE_RECOGNITION");
  }
}

