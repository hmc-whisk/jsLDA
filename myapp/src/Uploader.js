import React from 'react';


/**
 * @summary An upload component
 * @description A function component of a file upload interface
 * with a document and stopword file selector as well
 * as a upload button
 * 
 * @prop { onDocumentFileChange(event) }
 *      - The function to be called when
 *        the document file is changed
 * @prop { onStopwordFileChange(event) }
 *      - The function to be called when
 *        the stopword file is changed
 * @prop { onFileUpload() }
 *      - The function to be called when
 *        the upload button is pressed
 * 
 */
export function Uploader(props) {
    return(
      <div className="upload">
        <form>
            <div>Use a different collection:</div>
            <div>
                <label htmlFor="docs-file-input">Documents</label> 
                <input id="docs-file-input" type="file" 
                onChange={props.onDocumentFileChange(this)} size="10"/>
            </div>
            <div>
                <label htmlFor="stops-file-input" >Stoplist</label>  
                <input id="stops-file-input" type="file" 
                onChange={props.onStopwordFileChange(this)} size="10"/>
            </div>
            <div>
                <button id="load-inputs" onClick={(event) => {event.preventDefault(); props.onFileUpload();} }
                type='button'>
                Upload
                </button>
            </div>
        </form>
      </div>
    )
}

export default Uploader