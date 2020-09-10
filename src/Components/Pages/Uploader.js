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
 * @prop {Function(Event)} onFileUpload
 *      - The function to be called when
 *        the model upload button is pressed
 */
export function Uploader(props) {
    return (
        <div className="upload">
            <div>
            <form onSubmit={(event) => { confirmReset(event, props.onFileUpload); } }>
                    <label>Default Documents: </label>
                    <select id="defaultDoc" onChange = {(event) => props.onDefaultDocChange(event)} value = {props.docName}>
                        <option value="Movie Plots">Movie Plots</option>
                        <option value="State Of The Union">State Of The Union</option>
                        <option value="Yelp Reviews">Yelp Reviews</option>
                    </select>
                    <input type="submit" value="Reset" className="darkButton" disabled={props.modelIsRunning} />
                </form>
            </div>

            <form onSubmit={(event) => { confirmReset(event, props.onFileUpload); }}>
                <div>Or use a custom collection:</div>
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
                    <input type="submit" id="load-inputs" value="Upload" className="darkButton" disabled={props.modelIsRunning} />

                </div>
                <div>Or upload a previously generated model:</div>
            </form>
            <form onSubmit={(event) => { confirmReset(event, props.onModelUpload); }}>
                <div>
                    <label htmlFor="saved-model-input">Model: </label>
                    <input id="saved-model-input" type="file" 
                        onChange={(event) => props.onModelFileChange(event)} size="10" />
                </div>
                <div>
                    <input type="submit" id="load-inputs" value="Upload" className="darkButton" disabled={props.modelIsRunning} />
                </div>
            </form>
        </div>
    )
}

export default Uploader