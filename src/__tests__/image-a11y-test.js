import imageA11y from '../image-a11y';

describe('image-a11y', () => {
  afterEach(() => {
    __rewire_reset_all__();
  });
  describe('absUrlExp', () => {
    const absUrlExp = imageA11y.__get__('absUrlExp');
    it('should return true when tested with absolute URLs', () => {
      expect(absUrlExp.test('https://www.test.com/image1.jpg')).toBe(true);
    });
    it('should return false when tested with relative URLs', () => {
      expect(absUrlExp.test('image1.jpg')).toBe(false);
    });
  });

  describe('bootstrap', () => {
    it('should call processImages', () => {
      const fnMock = jest.fn();
      imageA11y.__set__('processImages', fnMock);
      imageA11y.bootstrap();
      expect(fnMock).toHaveBeenCalled();
    });
    it('should call observe on the MutationObserver', ()=>{
      const fnMock = jest.fn();
      imageA11y.__set__('mutationObserver', {observe: fnMock});
      imageA11y.bootstrap();
      expect(fnMock).toHaveBeenCalled();
    });
  });

  describe('getNoAltImages', () => {
    const getNoAltImages = imageA11y.__get__('getNoAltImages');
    document.body.innerHTML =`<div> 
    <img id="appleImg" width="200" src="https://s.alicdn.com/@sc01/kf/HTB1CDyMJpXXXXa3XFXXq6xXFXXXz.jpg"/>
    <img id="appleImg2" width="200" src="https://s.alicdn.com/@sc01/kf/HTB1CDyMJpXXXXa3XFXXq6xXFXXXz.jpg" />
    <img id="appleImg3" width="200" alt="test" src="https://s.alicdn.com/@sc01/kf/HTB1CDyMJpXXXXa3XFXXq6xXFXXXz.jpg" />
  </div>`;
    it('should return an array of images without alt attributes', () => {
      expect(getNoAltImages().length).toEqual(2);
    });
  });

  describe('assessForProcessing', () => {
    document.body.innerHTML =`<div> 
    <img id="appleImg" width="200" src="https://s.alicdn.com/@sc01/kf/HTB1CDyMJpXXXXa3XFXXq6xXFXXXz.jpg"/>
    <img id="appleImg2" width="200" src="https://s.alicdn.com/@sc01/kf/HTB1CDyMJpXXXXa3XFXXq6xXFXXXz.jpg" />
    <img id="appleImg3" width="200" alt="test" src="https://s.alicdn.com/@sc01/kf/HTB1CDyMJpXXXXa3XFXXq6xXFXXXz.jpg" />
  </div>`;
    const imgWithAlt = document.getElementById('appleImg3');
    const imgWithNoAlt = document.getElementById('appleImg');
    describe('IMG with an alt attribute', () => {
      it('should NOT set scheduleProcessImages to true', () => {
        const assessForProcessing = imageA11y.__get__('assessForProcessing');
        assessForProcessing(imgWithAlt);
        const schedProcessImages = imageA11y.__get__('scheduleProcessImages');
        expect(schedProcessImages).toBe(false);
      });
      it('should should NOT add the image node to imagesForProcessing', () => {
        const imagesForProcessing = imageA11y.__get__('imagesForProcessing');
        expect(imagesForProcessing.length).toEqual(0);
      });
    });
    describe('IMG without an alt attribute', () => {
      it('should set scheduleProcessImages to true', () => {
        const assessForProcessing = imageA11y.__get__('assessForProcessing');
        assessForProcessing(imgWithNoAlt);
        const schedProcessImages = imageA11y.__get__('scheduleProcessImages');
        expect(schedProcessImages).toBe(true);
      });
      it('should should add the image node to imagesForProcessing', () => {
        const imagesForProcessing = imageA11y.__get__('imagesForProcessing');
        expect(imagesForProcessing.length).toEqual(1);
      });
    });
  });

  describe('filterDuplicateSrcURLs', () => {
    it('should filter out img nodes with identical src URLS', () => {
      const getNoAltImages = imageA11y.__get__('getNoAltImages');
      const filterDuplicateSrcs = imageA11y.__get__('filterDuplicateSrcURLs');
      document.body.innerHTML =`<div> 
      <img id="aImg" width="200" src="https://s.alicdn.com/@sc01/kf/HTB1CDyMJpXXXXa3XFXXq6xXFXXXz.jpg"/>
      <img id="aImg2" width="200" src="https://s.alicdn.com/@sc01/kf/HTB1CDyMJpXXXXa3XFXXq6xXFXXXz.jpg" />`;
      const imageNodes = getNoAltImages();
      expect(filterDuplicateSrcs(imageNodes).length).toEqual(1);
    });
  });

  // @todo continue writing tests
});
