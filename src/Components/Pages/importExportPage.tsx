import React, {Component} from "react";
import {displayMessage, LDAModel} from "core";
import {deserializeMalletUpload, deserializeModel, readDocumentsUpload, saveModel} from "core/serialization";
import {Tab, Row, Col, Nav} from "react-bootstrap"
import {saveToStorage} from "../../core/storage";

interface ImportExportPageProps {
    model: LDAModel,
    overwriteModel: (model: LDAModel) => void
}

interface ImportExportPageState {
    error: string
}

export class ImportExportPage extends Component<ImportExportPageProps, ImportExportPageState> {

    constructor(props: ImportExportPageProps) {
        super(props);
        this.state = {
            error: ""
        }
    }

    clearError() {
        this.setState({
            error: ""
        })
    }

    setError(message: string) {
        this.setState({
            error: message
        })
    }

    getUploadedFile(id: string): File | undefined {
        let files = (document.getElementById(id) as HTMLInputElement).files
        if (files === null || files.item(0) === null) {
            this.setError("No file selected")
            return
        }
        return files.item(0) as File
    }

    async importModel() {
        let file = this.getUploadedFile("exported-model-upload-field")
        if (file === undefined) return
        let model: LDAModel
        try {
            model = await deserializeModel(file)
        } catch (e:any) {
            this.setError(e.toString())
            console.error(e)
            return
        }
        this.props.overwriteModel(model)
        this.clearError()
    }

    async importDocuments() {
        let file = this.getUploadedFile("documents-upload-field")
        if (file === undefined) return
        let contentType: string
        let lowercaseName = file.name.toLowerCase();
        if (lowercaseName.endsWith(".tsv")) contentType = "text/tsv"
        else if (lowercaseName.endsWith(".csv")) contentType = "text/csv"
        else {
            this.setError("Unsupported document type. Only .tsv and .csv are supported.")
            // this probably shouldn't happen because the upload has accept field which
            // should prevent files with wrong extensions to be uploaded, but just to be sure
            return
        }
        await displayMessage("Reading upload", 0, "promise")
        let docs = await file.text()
        await displayMessage("Initializing model", 0, "promise")
        let model = await readDocumentsUpload(this.props.model.numTopics, docs, contentType)
        await displayMessage("Saving documents", 0, "promise")
        await saveToStorage("documents", docs, contentType)
        await displayMessage("Loading model", 0, "promise")
        this.props.overwriteModel(model)
        this.clearError()
        await displayMessage("Model has been loaded", 1500, "promise")

    }

    async importMallet() {
        let annotations: string[];
        let annotationFiles = (document.getElementById("mallet-annotations-upload-field") as HTMLInputElement).files
        if (annotationFiles === null || annotationFiles.item(0) === null) {
            let n = (document.getElementById("mallet-annotations-number") as HTMLInputElement).value
            let nTopics = parseInt(n)
            if (Number.isNaN(nTopics)) {
                this.setError("No annotation file uploaded and number of topics unset")
                return
            }
            annotations = new Array(nTopics).fill("")
        } else {
            annotations = JSON.parse(await annotationFiles.item(0)!.text()) as string[]
        }
        let documentsFile = this.getUploadedFile("mallet-documents-upload-field")
        if (documentsFile === undefined) {
            this.setError("No file selected for documents")
            return
        }
        let contentType: string = ""
        let lowercaseName = documentsFile.name.toLowerCase();
        if (lowercaseName.endsWith(".tsv")) contentType = "text/tsv"
        else if (lowercaseName.endsWith(".csv")) contentType = "text/csv"
        else {
            this.setError("Unsupported document type. Only .tsv and .csv are supported.")
            // this probably shouldn't happen because the upload has accept field which
            // should prevent files with wrong extensions to be uploaded, but just to be sure
            return
        }
        let stoplistFile = this.getUploadedFile("mallet-stoplist-upload-field")
        if (stoplistFile === undefined) {
            this.setError("No file selected for stoplist")
            return
        }
        let stateFile = this.getUploadedFile("mallet-state-upload-field")
        if (stateFile === undefined) {
            this.setError("No file selected for MALLET state file")
            return
        }

        let documents = await documentsFile.text()
        let stoplist = await stoplistFile.text()
        let state = await stateFile.text()
        let model: LDAModel
        try {
            model = await deserializeMalletUpload(annotations, documents, contentType, stoplist, state)
        } catch (e:any) {
            console.error(e)
            this.setError(e.toString())
            return
        }
        this.props.overwriteModel(model)
        this.clearError()
        await displayMessage("Model has been loaded", 1500, "promise")
    }

    render() {
        return <div style={{"width": "100%", "marginTop": "2em"}}>


            <Tab.Container id="left-tabs-example" defaultActiveKey="export-model">
                <Row>
                    <Col sm={3}>
                        <Nav variant="tabs" className="flex-column">
                            <Nav.Item>
                                <Nav.Link eventKey="export-model">Export current model</Nav.Link>
                            </Nav.Item>
                            <Nav.Item>
                                <Nav.Link eventKey="import-model">Import a previously exported model</Nav.Link>
                            </Nav.Item>
                            <Nav.Item>
                                <Nav.Link eventKey="import-docs">Import a new set of documents</Nav.Link>
                            </Nav.Item>
                            <Nav.Item>
                                <Nav.Link eventKey="import-mallet">Import a MALLET state file</Nav.Link>
                            </Nav.Item>
                            <Nav.Item>
                                <Nav.Link eventKey="import-stoplist">Import a stoplist (a list of stopwords)</Nav.Link>
                            </Nav.Item>
                        </Nav>
                    </Col>
                    <Col sm={9}>
                        <Tab.Content style={{"width": "100%", "marginTop": "2em"}}>
                            <Tab.Pane eventKey="export-model">
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
                            </Tab.Pane>
                            <Tab.Pane eventKey="import-model">
                                <div>
                                    <p>
                                        Import a previously exported model.
                                        <strong>
                                            This will overwrite ALL data in the
                                            current session.
                                        </strong>
                                    </p>
                                    <input type="file" name="File" accept="application/zip,.zip"
                                           id="exported-model-upload-field"/>

                                    <button className="btn btn-light btn-outline-danger"
                                            onClick={this.importModel.bind(this)}
                                            style={{marginTop: "1em", display: "block"}}
                                    >Upload
                                    </button>
                                </div>
                            </Tab.Pane>

                            <Tab.Pane eventKey="import-docs">
                                <div>
                                    <p>
                                        Upload a new set of documents and start afresh.
                                        <strong>
                                            This will overwrite ALL
                                            data in the current
                                            session.
                                        </strong>
                                    </p>
                                    <input type="file"
                                           accept="text/tab-separated-values,text/comma-separated-values,text/tsv,text/csv,.tsv,.csv"
                                           id="documents-upload-field"/>
                                    <button className="btn btn-light btn-outline-danger"
                                            onClick={this.importDocuments.bind(this)}
                                            style={{marginTop: "1em", display: "block"}}
                                    >Upload
                                    </button>
                                </div>
                            </Tab.Pane>

                            <Tab.Pane eventKey="import-mallet">

                                <div>
                                    <p>
                                        Import a MALLET state file <strong>This will overwrite ALL data in the current
                                        session.</strong>
                                    </p>
                                    <div>
                                        File 1/4: Annotations. A json file describes all annotations. If you don't have
                                        one, enter the number of topics used in the model instead.
                                    </div>
                                    <input type="file" accept="application/json,.json" style={{marginBottom: "2em"}}
                                           id="mallet-annotations-upload-field"
                                    /> or enter number of topics &nbsp;<input type="number" min="1" width="2"
                                                                              style={{width: "7ch"}}
                                                                              id="mallet-annotations-number"/>
                                    <div>
                                        File 2/4: Documents. A compatible comma-separated-value (.csv) or
                                        tab-separated-value (.csv) file.
                                    </div>
                                    <input type="file"
                                           accept="text/tab-separated-values,text/comma-separated-values,text/tsv,text/csv,.tsv,.csv"
                                           id="mallet-documents-upload-field" style={{marginBottom: "2em"}}/>
                                    <div>
                                        File 3/4: Stoplist. A newline separated list of stopwords used in the model.
                                    </div>
                                    <input type="file" accept="text/plain,.txt" style={{marginBottom: "2em"}}
                                           id="mallet-stoplist-upload-field"
                                    />
                                    <div>
                                        File 4/4: Model. The MALLET state file.
                                    </div>
                                    <input type="file" accept="text/plain,.txt" style={{marginBottom: "2em"}}
                                           id="mallet-state-upload-field"
                                    />
                                </div>

                                <button className="btn btn-light btn-outline-danger"
                                        onClick={this.importMallet.bind(this)}
                                        style={{marginTop: "1em", display: "block"}}
                                >Upload
                                </button>
                            </Tab.Pane>

                            <Tab.Pane eventKey="import-stoplist">
                                Not Yet Implemented. Please use stopwords tab instead. {/*
                                Unsure how this should be implemented. We can definitely take the lazy approach and
                                just reset the entire model and overwrite the stopwords, which would be trivial to
                                implement, but it is inconsistent with our constant bragging about how we don't need
                                to retrain the model after changing the stopwords. But we can't simply overwrite the
                                stoplist stored in the model because we actually need to recompute all the matrices.

                                One possible implementation is to diff the stoplist in the model and the user uploaded
                                one and call LDAModel.addStops() and LDAModel.removeStops() but it seems to be quite
                                slow if the difference is large. Regardless, this is my last day so I'll leave this
                                to whoever comes after me to decide :) -- Mia
                                */}

                            </Tab.Pane>
                        </Tab.Content>
                    </Col>
                </Row>
            </Tab.Container>
            {
                this.state.error === "" ? <React.Fragment/> : <div className="text-danger" style={{
                    width: "50%",
                    margin: "auto",
                    minHeight: "4em",
                    marginTop: "2em",
                    border: "1px solid",
                    borderRadius: "5px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-around"
                }}>
                    <span style={{paddingLeft: "1em", paddingRight: "1em"}}>
                                     {this.state.error}
                    </span>
                </div>
            }

        </div>
    }
}
