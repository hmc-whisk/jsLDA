import React, {ChangeEvent} from 'react';
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


interface UploaderProps {
    onDocumentFileChange: (event: ChangeEvent<HTMLInputElement>) => void,
    onStopwordFileChange: (event: ChangeEvent<HTMLInputElement>) => void,
    onModelFileChange: (event: ChangeEvent<HTMLInputElement>) => void,
    onFileUpload: () => void,
    onModelUpload: () => void,
    onDefaultDocChange: (event: ChangeEvent<HTMLSelectElement>) => void,
    modelIsRunning: boolean
    docName: string
}

export function Uploader(props: UploaderProps) {
    return (
        <div>
            <div className="configMenu">
                <h3>Data Upload</h3>
                <div>
                    <form onSubmit={(event) => {
                        confirmReset(event, props.onFileUpload);
                    }}>
                        <label>Choose your Documents: </label>
                        <select id="defaultDoc" onChange={(event) => props.onDefaultDocChange(event)}
                                value={props.docName}>
                            <option value="Movie Plots">Movie Plots</option>
                            <option value="State Of The Union">State Of The Union</option>
                            <option value="Yelp Reviews">Yelp Reviews</option>
                        </select>
                        {/* <input type="submit" value="Reset" className="darkButton" disabled={props.modelIsRunning}/> */}
                    </form>
                </div>
            </div>
        </div>

    )
}

export default Uploader
