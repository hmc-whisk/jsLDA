import React, {Component} from "react";
import {LDAModel} from "core";
import {deserializeModel, saveModel} from "core/serialization";

interface ImportExportPageProps {
    model: LDAModel,
    overwriteModel:(model:LDAModel)=>void
}

interface ImportExportPageState {}

export class ImportExportPage extends Component<ImportExportPageProps, ImportExportPageState> {

    async importModel() {
        let files = (document.getElementById("exported-model-upload-field") as HTMLInputElement).files
        if (files===null) {
            alert("No file selected")
            return
        }
        let file = files.item(0)
        if (file===null) {
            alert("No file selected")
            return
        }
        let model:LDAModel
        try {
            model = await deserializeModel(file)
        } catch (e) {
            alert(e.toString())
            return
        }
        this.props.overwriteModel(model)
    }

    render() {
        return <div style={{"width": "100%", "marginTop": "2em"}}>
            <div>
                <p>
                    Export the model to a zip archive. This will initiate a browser download with
                    a <code>LDAModel.zip</code> file.
                </p>
                <button onClick={_ => saveModel(this.props.model)}
                        className="btn btn-light btn-outline-primary">
                    Export Model
                </button>
            </div>

            <div style={{"marginTop": "5em"}}>
                <p>
                    Upload a new set of documents and start afresh. <strong>This will overwrite ALL data in the current
                    session.
                </strong>
                </p>
                <span style={{"marginRight": "2ch"}}>Upload documents</span><input type="file"
                                                                                   accept="text/tab-separated-values,text/comma-separated-values,text/tsv,text/csv,.tsv,.csv"
                                                                                   id="document-upload-field"/>
                <button className="btn btn-light btn-outline-danger">Upload</button>
            </div>

            <div style={{"marginTop": "5em"}}>
                <p>
                    Import a previously exported model. <strong>This will overwrite ALL data in the current session.
                </strong>
                </p>
                <span style={{"marginRight": "2ch"}}>Import Model</span>
                <input type="file" name="File" accept="application/zip,.zip" id="exported-model-upload-field"/>
                <button className="btn btn-light btn-outline-danger" onClick={this.importModel.bind(this)}>Upload</button>
            </div>

            <div style={{"marginTop": "5em"}}>
                <p>
                    Import a MALLET state file <strong>This will overwrite ALL data in the current session.</strong>
                </p>
                <p>
                    File 1/4: Annotations. A json file describes all annotations. If you don't have one, enter the number of topics used in the model instead
                </p>
                <p>
                    File 2/4: Documents. A compatible comma-separated-value (.csv) or tab-separated-value (.csv) file.
                </p>
                <p>
                    File 3/4: Stoplist. A newline separated list of stopwords used in the model.
                </p>
                <p>
                    File 4/4: Model. The MALLET state file.
                </p>
            </div>

        </div>
    }
}
