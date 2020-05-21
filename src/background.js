chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
      const IR_LOGIN_ENDPOINT = 'https://image-recognition-function.azurewebsites.net/api/AnalyseImage?';

      /** Get client's authentication info.
      * @return {Headers} authorization headers.
      */
      const getAuthHeaders = () => {
        const localToken = localStorage.getItem('img_a11y_token') || false;
        if (localToken) {
          return new Headers({
            'Authorization': `Bearer ${localToken}`,
          });
        }
        return new Headers({});
      };

      /** Save client's authentication info.
      * @param {string} token - the JWT from server
      */
      const saveAuthInfo = (token) => {
        localStorage.setItem('img_a11y_token', token);
      };

      /** Checks if user is logged in
      * @return {Boolean}
      */
      const isSignedIn = () => {
        const localToken = localStorage.getItem('img_a11y_token') || false;
        if (localToken) {
          return true;
        }
        return false;
      };

      /** Signs the user in
      * @return {Promise}
      */
      const signInUser = () => {
        return new Promise((resolve, reject) => {
          console.log('signing in...');
          fetch(IR_LOGIN_ENDPOINT, {
            method: 'POST',
            body: 'googeToken=1234', // @todo set google token from Chrome.client here
          })
              .then((response) => {
                if (!response.ok) {
                  throw Error(response.statusText);
                }
                return response.json();
              })
              .then((data) => {
                // @todo save received authData here
                saveAuthInfo('testing');
                resolve();
              })
              .catch((error) => {
                reject(error);
              });
        });
      };

      /** Analyizes the image
      */
      const analyzeImage = () => {
        fetch(request.src, {
          method: 'GET',
          headers: getAuthHeaders(),
        })
            .then((response) => {
              if (!response.ok) {
                throw Error(response.statusText);
              }
              return response.json();
            })
            .then((data) => {
              sendResponse({
                response: data,
                error: null,
                src: request.src,
              });
            })
            .catch((error) => {
              sendResponse({
                response: null,
                error,
                src: request.src,
              });
            });
      };
      if (isSignedIn()) {
      // If user is logged in, go right ahead to analyzeImage
        if (request.src) { // if there's an src in the request, analyze the src
          analyzeImage();
        }
      } else {
      // Login user first and get an authToken;
        signInUser()
            .then(() => {
              if (request.src) { // if there's an src in the request, analyze the src
                analyzeImage();
              }
            })
            .catch((error) => {
              console.error('Sign in failed', error);
              sendResponse({
                response: null,
                error,
                src: request.src,
              });
            });
      }
      return true;
    });
