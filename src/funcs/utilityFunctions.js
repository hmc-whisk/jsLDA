/**
 * @summary Returns a string of the top n words
 * @param {Array} wordCounts ordered list of top words
 * @param {Int} n number of words to return
 * @returns {String} the top n words 
 */
export function topNWords(wordCounts, n) { 
    return wordCounts.slice(0,n).map((d) => d.word).join(" "); 
}

/**
 * @summary returns an array filled with 0.0
 * @param {Number} n length of array 
 */
export function zeros (n) {
    var x = new Array(n);
    for (var i = 0; i < n; i++) { x[i] = 0.0; }
    return x;
}


/**
 * @summary creates the Object.keys function
 * Used to add compatible Object.keys support in older 
 * environments that do not natively support it
 * From https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/keys
 */
export function getObjectKeys() {
    var hasOwnProperty = Object.prototype.hasOwnProperty,
        hasDontEnumBug = !({ toString: null }).propertyIsEnumerable('toString'),
        dontEnums = [
          'toString',
          'toLocaleString',
          'valueOf',
          'hasOwnProperty',
          'isPrototypeOf',
          'propertyIsEnumerable',
          'constructor'
        ],
        dontEnumsLength = dontEnums.length;

    return function(obj) {
      if (typeof obj !== 'function' && (typeof obj !== 'object' || obj === null)) {
        throw new TypeError('Object.keys called on non-object');
      }

      var result = [], prop, i;

      for (prop in obj) {
        if (hasOwnProperty.call(obj, prop)) {
          result.push(prop);
        }
      }

      if (hasDontEnumBug) {
        for (i = 0; i < dontEnumsLength; i++) {
          if (hasOwnProperty.call(obj, dontEnums[i])) {
            result.push(dontEnums[i]);
          }
        }
      }
      return result;
    };
};

/**
 * @summary Truncates s to <= 300 characters
 * @param {String} s text to be truncated
 * @param {Number} n length of string to return
 */
export function truncate(s, n=300) { 
  return s.length > n ? s.substring(0, n-1) + "..." : s; 
}

/**
 * @summary This function wraps event handlers to confirm that the model will be reset.
 */
export function confirmReset(event, callback){
  if (window.confirm('This will cause your model to reset.')) {
      event.preventDefault(); 
      callback();
  }
  else 
      event.preventDefault();
}