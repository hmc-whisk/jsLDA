import React from 'react';
import {confirmReset} from '../../funcs/utilityFunctions'

/**
 * @summary An upload component
 * @description A function component of a file upload interface
 * with a document and stopword file selector as well
 * as a upload button
 * 
 * @prop {Function(Event)} onDocumentFileChange
 *      - The function to be called when
 *        the document file is changed
 * @prop {Function(Event)} onStopwordFileChange
 *      - The function to be called when
 *        the stopword file is changed
 * @prop {Function(Event)} onFileUpload
 *      - The function to be called when
 *        the file upload button is pressed
 * @prop {Boolean} modelIsRunning
 *      - The boolean dictating whetherc
 *        certain elements should be disabled
 * @prop {Function(Event)} onModelFileChange
 *      - The function to be called when the
 *        model file has been changed
 * @prop {Function(Event)} onModelUpload
 *      - The function to be called when
 *        the model upload button is pressed
 */

// returns true if the input has a file selected, false otherwise
const isFileAdded = (inputId) => {
    let inp = document.getElementById(inputId);
    return inp && inp.files.length;
}

export function Uploader(props) {
    return (
        <div>
        <div className="configMenu">
            <h3>Data Upload</h3>
            <div>
                <form onSubmit={(event) => { confirmReset(event, props.onFileUpload); }}>
                    <label>Default Documents: </label>
                    <select id="defaultDoc" onChange={(event) => props.onDefaultDocChange(event)} value={props.docName}>
                        <option value="Movie Plots">Movie Plots</option>
                        <option value="State Of The Union">State Of The Union</option>
                        <option value="Yelp Reviews">Yelp Reviews</option>
                    </select>
                    <input type="submit" value="Reset" className="darkButton" disabled={props.modelIsRunning} />
                </form>

                <br />
                <form onSubmit={(event) => { confirmReset(event, props.onFileUpload); }}>
                    <h5> Or use a custom collection: </h5>
                    <div className="fileInput">
                        <label htmlFor="docs-file-input">Documents: </label>
                        <input id="docs-file-input" type="file" 
                            onChange={(event) => props.onDocumentFileChange(event)} size="10" />

                        <label htmlFor="stops-file-input"> Stoplist: </label>
                        <input id="stops-file-input" type="file" 
                            onChange={(event) => props.onStopwordFileChange(event)} size="10" />
                    </div>
                    <input type="submit" id="load-inputs" value="Upload" className="darkButton" disabled={props.modelIsRunning || !isFileAdded("docs-file-input")} />
                </form>
            </div>
        </div>

        <div className="configMenu">
            <h3>Model Upload</h3>
            <div>
                <h5> Upload a previously generated model: </h5>
                <form onSubmit={(event) => { confirmReset(event, props.onModelUpload); }}>
                <div className="fileInput">
                    <label htmlFor="saved-model-input">Model: </label>
                    <input id="saved-model-input" type="file" 
                        onChange={(event) => props.onModelFileChange(event)} size="10" />
                </div>
                <input type="submit" id="load-inputs" value="Upload" className="darkButton" disabled={props.modelIsRunning || !isFileAdded("saved-model-input")} />
                </form>
            </div>
        </div>
        </div>

    )
}

export default Uploader