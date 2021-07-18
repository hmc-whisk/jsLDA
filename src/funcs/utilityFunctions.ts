/**
 * @summary Returns a string of the top n words
 * @param {Array} wordCounts ordered list of top words
 * @param {Number} n number of words to return
 * @returns {String} the top n words
 */
import {SyntheticEvent} from "react";
import {displayMessage} from "../core";


export function topNWords(wordCounts: { word: string }[], n: number): string {
    return wordCounts.slice(0, n).map((d) => d.word).join(" ");
}

/**
 * @summary returns an array filled with 0.0
 * @param {Number} n length of array
 */
export function zeros(n: number): number[] {
    let x = new Array(n);
    x.fill(0.0);  // doesn't 0.0 look like an emoticon ^_^
    return x;
}


/**
 * @summary creates the Object.keys function
 * Used to add compatible Object.keys support in older
 * environments that do not natively support it
 * From https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/keys
 */
export function getObjectKeys() {
    let hasOwnProperty = Object.prototype.hasOwnProperty,
        hasDontEnumBug = !({toString: null}).propertyIsEnumerable('toString'),
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

    return function (obj: any) {
        if (typeof obj !== 'function' && (typeof obj !== 'object' || obj === null)) {
            throw new TypeError('Object.keys called on non-object');
        }

        let result: any[] = [], prop, i;

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
}

/**
 * @summary Truncates s to <= 300 characters
 * @param {String} s text to be truncated
 * @param {Number} n length of string to return
 */
export function truncate(s: string, n: number = 300) {
    return s.length > n ? s.substring(0, n - 1) + "..." : s;
}

/**
 * @summary This function wraps event handlers to confirm that the model will be reset.
 */
export function confirmReset(event: SyntheticEvent, callback: () => void) {
    event.preventDefault();
    if (window.confirm('This will cause your model to reset.')) callback();
}

/**
 * @summary Saves a given file to the user's computer.
 * @param {String} fileName Name of file to be saved. Including extension
 * @param {String} fileContents Contents of file to be saved
 * @param {String} fileType Type of file to be saved
 */
export function saveFile(fileName: string, fileContents: string, fileType: string) {
    const blob = new Blob([fileContents], {type: fileType});
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}


// https://stackoverflow.com/questions/2090551/parse-query-string-in-javascript
export function getQueryVariable(variable: string): string | undefined {
    let query = window.location.search.substring(1);
    let vars = query.split('&');
    for (let i = 0; i < vars.length; i++) {
        let pair = vars[i].split('=');
        if (decodeURIComponent(pair[0]) === variable) {
            return decodeURIComponent(pair[1]);
        }
    }
}

export interface LogMessage {
    event: string
}

async function _logToServer<T extends LogMessage>(id: string, data: T) {    
    let res= await fetch(`https://cs.hmc.edu/~xanda/logstudy.cgi?id=${id}&data=${JSON.stringify(data)}&time=${Date()}`, {
      method: 'POST',
      mode: 'no-cors'}
    ) 
    if (res.status!==201 && res.type !== 'opaque'){
        console.error("Server response bad status code")
        console.error(res)
        throw new Error("Bad status")
    }
}

export function logToServer<T extends LogMessage>(data: T) {
    let id = getQueryVariable("id")
    if (id==="test") return; // special testing id to disable logging altogether
    if (id === undefined) {
        displayMessage("Logging failed: missing ID", 1500)
        return
    }
    _logToServer(id, data)
        .then(_=> console.log("server log emitted",data))
        .catch(e => {
            displayMessage("Logging failed. Unexpected error.", 1500);
            console.error(e)
        }
    )
}
