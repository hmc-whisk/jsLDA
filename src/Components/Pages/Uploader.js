import React from 'react';
import defaultDoc from '../../defaultDocs/wikiMoviePlots.csv'
console.log(defaultDoc)

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
    return (
        <div className="upload">
            <div>
            <form onSubmit={(event) => { event.preventDefault(); props.onFileUpload(); }}>
                    <label>Default Documents: </label>
                    <select id="defaultDoc" onChange = {(event) => props.onDefaultDocChange(event)} value = {props.docName}>
                        <option value="Movie Plots">Movie Plots</option>
                        <option value="State Of The Union">State Of The Union</option>
                        <option value="Yelp Reviews">Yelp Reviews</option>
                    </select>
                    <input type="submit" value="Reset" disabled={props.modelIsRunning} />
                </form>
            </div>

            <form onSubmit={(event) => { event.preventDefault(); props.onFileUpload(); }}>
                <div>Or use a custon collection:</div>
                <div>
                    <label htmlFor="docs-file-input">Documents: </label>
                    <input id="docs-file-input" type="file"
                        onChange={(event) => props.onDocumentFileChange(event)} size="10" />
                </div>
                <div>
                    <label htmlFor="stops-file-input" >Stoplist: </label>
                    <input id="stops-file-input" type="file"
                        onChange={(event) => props.onStopwordFileChange(event)} size="10" />
                </div>
                <div>
                    <input type="submit" id="load-inputs" value="Upload" disabled={props.modelIsRunning} />

                </div>
            </form>
        </div>
    )
}

export default Uploader