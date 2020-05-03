console.log("Adding alt attributes");

//Query all images on the DOM and store them in an HTMLCollection Object
let images = document.getElementsByTagName("img");

for (let i = 0; i < allImages.length; i++) {
  //Check for all images that do not have alt attributes and set the alt attribute
  if(!images.item(i).hasAttribute("alt")){
    images.item(i).setAttribute("alt", "ALT_ATTRIBUTE_FROM_IMAGE_RECOGNITION");
  }
}

