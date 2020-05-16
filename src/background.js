chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
      fetch(request.src)
          .then((response) => {
            if (!response.ok) {
              throw Error(response.statusText);
            }
            return response.json();
          })
          .then((data) => {
            sendResponse({response: data, error: null, src: request.src});
          })
          .catch((error) => {
            sendResponse({response: null, error, src: request.src});
          });
      return true;
    });
