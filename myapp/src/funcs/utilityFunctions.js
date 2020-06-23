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

// Used for numTopics
/** This function is copied from stack overflow: http://stackoverflow.com/users/19068/quentin */
/**
 * @todo figure out what this is
 */
export function getQueryString() {
    // This function is anonymous, is executed immediately and
    // the return value is assigned to QueryString!
    var query_string = {};
    var query = window.location.search.substring(1);
    var vars = query.split("&");
    for (var i=0;i<vars.length;i++) {
      var pair = vars[i].split("=");
      // If first entry with this name
      if (typeof query_string[pair[0]] === "undefined") {
        query_string[pair[0]] = pair[1];
      // If second entry with this name
      } else if (typeof query_string[pair[0]] === "string") {
        var arr = [ query_string[pair[0]], pair[1] ];
        query_string[pair[0]] = arr;
      // If third or later entry with this name
      } else {
        query_string[pair[0]].push(pair[1]);
      }
    }
      return query_string;
};

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
 */
export function truncate(s) { 
  return s.length > 300 ? s.substring(0, 299) + "..." : s; 
}