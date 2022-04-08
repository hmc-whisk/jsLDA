import React, {ChangeEvent, Component, CSSProperties} from 'react';

import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

import * as d3 from 'd3';

import {getObjectKeys} from 'funcs/utilityFunctions'
import {LDAModel, LDAModelDataDLer} from 'core'

import {
    TopicDoc,
    Correlation,
    HomePage,
    TopicOverviewPage,
    VocabTable,
    TimeSeries,
    TopicTreemap
} from 'Components/Pages'
import {NavBar, TopBar} from 'Components/Header'
import {SideBar} from 'Components/SideBar';

import stateOfUnionDocs from 'defaultDocs/stateOfUnionDocs.txt';
import moviePlotsDocs from 'defaultDocs/wikiMoviePlots.csv';
import yelpReviews from 'defaultDocs/yelpReviews.csv';
import defaultStops from 'defaultDocs/stoplist.txt';
import corrTooltip from 'Components/Tooltip/corrTooltip.png';
import {ImportExportPage} from "../Pages/importExportPage";
import MetaDataPage from 'Components/Pages/MetaData/MetaDataPage';
import movieReviews from 'defaultDocs/movieReviews.csv'


// This adds the Object.keys() function to some old browsers that don't support it
if (!Object.keys) {
    Object.keys = (getObjectKeys());
}

interface AppProps {
}

interface AppStates {
    ldaModel: LDAModel,
    modelDataDLer: LDAModelDataDLer,
    docName: string,
    documentsURL: string,
    stopwordsURL: string,
    defaultExt: string,
    documentsFileArray: File[][]
    stoplistFileArray: File[][],
    modelFileArray: File[][]
    selectedTab: string,
    sweepParameter: number,
    update: boolean,
    currentDocIsDefault: boolean,
}

class App extends Component<AppProps, AppStates> {
    constructor(props: AppProps) {
        super(props)

        let ldaModel = new LDAModel(this.startingNumTopics);

        this.state = {
            ldaModel: ldaModel,
            modelDataDLer: new LDAModelDataDLer(ldaModel),

            // The file location of default files

            docName: "moviePlotsDocs",
            documentsURL: moviePlotsDocs,
            stopwordsURL: defaultStops,
            defaultExt: "text/csv",

            // Location to store uploaded files
            documentsFileArray: [],
            stoplistFileArray: [],
            modelFileArray: [],

            selectedTab: "home-tab",
            sweepParameter: 100,

            update: true,

            currentDocIsDefault: true,
        };

        window.addEventListener("beforeunload", (e: BeforeUnloadEvent) => {
            if (this.state.ldaModel.scheduler.totalCompletedSweeps > 0) {
                e.preventDefault()
                e.returnValue = ''
            }
        })
        window.addEventListener("message", (e: MessageEvent) => {
            if (e.origin === window.location.origin && e.data.target === 'forceUpdateApp') {
                this.forceUpdate()
            }
        })
    };

    startingNumTopics = 25;

    /**
     * @summary function used by model to force update of webpage
     */
    modelForceUpdate() {
        this.forceUpdate();
        console.log("Forced Update");
    }

    downloadModel() {
        const fileName = "jsLDA_Model";
        const json = JSON.stringify(this.state.ldaModel);
        const blob = new Blob([json], {type: 'application/json'});
        const href = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = href;
        link.download = fileName + ".json";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Default notes for correlation (placed here to avoid rerendering)
    corNotes = ``;

    // Functions for notes in correlation
    changeNotes(notes: string) {
        this.corNotes = notes;
    }

    provideNotes() {
        return this.corNotes;
    }

    // Data and functions for annotations in sidebar (placed here instead of as a state to avoid re-rendering)
    annotations: string[] = [];

    changeAnnotation(text: string, i: number) {
        this.state.ldaModel.setAnnotation(i,text)
        // this.forceUpdate()
    }

    resetNotes() {
        this.state.ldaModel.resetAnnoation()
    }

    /**
     * @summary Gets the annotaion for a topic
     * @param {Number} topic Number of topic to get annotations for
     */
    getAnnotation(topic: number) {
        return this.state.ldaModel.annotations[topic];
    }


    /**
     * @summary Update the page/tab user is looking at, causing rerender of components
     */
    changeTab(tabID: string) {
        this.setState({
            selectedTab: tabID
        });

        console.log("Tab is now: " + tabID)
    }

    /**
     * @summary Change regex tokenizer and update model
     */
    onTokenRegexChange(inputRegex: RegExp) {
        this.state.ldaModel.setTokenRegex(inputRegex);
        this.queueLoad();
    }

    /**
     * @summary Load in new default document
     */
    onDefaultDocChange(event: ChangeEvent<HTMLSelectElement>) {
        event.preventDefault();

        let docName = event.target.value;
        this.setState({
            docName: docName,
            currentDocIsDefault: true,
        });

        if (docName === "State Of The Union") {
            this.setState({
                documentsURL: stateOfUnionDocs,
                defaultExt: "text/txt"
            });
        } else if (docName === "Movie Plots") {
            this.setState({
                documentsURL: moviePlotsDocs,
                defaultExt: "text/csv"
            });
        } else if (docName === "Yelp Reviews") {
            this.setState({
                documentsURL: yelpReviews,
                defaultExt: "text/csv"
            });
        }
    }

    overwriteModel(model:LDAModel){
        this.setState({
            ldaModel:model
        })
    }

    /**
     * @summary Retrieve doc files from upload component and set documentType
     */
    onDocumentFileChange(event: ChangeEvent<HTMLInputElement>) {
        event.preventDefault();

        // Prevent empty file change errors
        if (event.target.files === null || event.target.files.length === 0) {
            alert("No document found")
            return;
        }

        this.setState({
            documentsFileArray: [Array.prototype.slice.call(event.target.files)],
            currentDocIsDefault: false,
        });
        if (event.target.files[0] != null) {
            this.state.ldaModel.setDocumentType(event.target.files[0].name);
        }
    }

    /**
     * @summary Retrieve stop word files from upload component
     */
    onStopwordFileChange(event: ChangeEvent<HTMLInputElement>) {
        event.preventDefault();

        // Prevent empty file change errors
        if (event.target.files === null || event.target.files.length === 0) {
            return;
        }

        this.setState({
            stoplistFileArray: [Array.prototype.slice.call(event.target.files)],
        });

    }

    /**
     * @summary Retrieve model file from upload component
     * @param {Event} event file change event
     */
    onModelFileChange(event: ChangeEvent<HTMLInputElement>) {
        event.preventDefault();

        // Prevent empty file change errors
        if (event.target.files === null) {
            return;
        }

        this.setState({
            modelFileArray: [Array.prototype.slice.call(event.target.files)],
        });
    }

    onModelUpload() {
        new Promise<LDAModel>((resolve, reject) => {
            const fileSelection = this.state.modelFileArray[0].slice();

            // Read file
            let reader = new FileReader();
            reader.onload = () => {
                // Create a new LDAModel to put uploaded info into
                try {
                    resolve(Object.assign(
                        new LDAModel(this.startingNumTopics),
                        JSON.parse(reader.result as string)));

                } catch {
                    reject("Could not interpret model file. Upload canceled.")
                }
            }
            ;
            reader.readAsText(fileSelection[0]);
        }).then((result) => {
            result.modelUploaded()
            this.setState({ldaModel: result});
            document.getElementById("iters")!.innerText = result.scheduler.totalCompletedSweeps.toString();
        }, (reject) => {
            alert(reject)
        })
    }

    /**
     * @summary Returns a promise of the correct stopword text
     * @returns {Promise<String>} stopword text
     *  - first document in documentsFileArray state if it exists
     *  - stopwordsURL resource file otherwise
     */
    getStoplistUpload(): Promise<string> {
        return new Promise((resolve) => {
            if (this.state.stoplistFileArray.length === 0) {
                resolve(d3.text(this.state.stopwordsURL));
            } else {
                const fileSelection = this.state.stoplistFileArray[0].slice();
                let reader = new FileReader();
                reader.onload = function () {
                    resolve(reader.result as string);
                };
                reader.readAsText(fileSelection[0]);
            }
        })
    };

    /**
     * @summary Returns a promise of the correct document text
     * @returns {Promise<String>} document text
     *  - first document in documentsFileArray state if it exists
     *  - documentsURL resource file otherwise
     */
    getDocsUpload(): Promise<string> {
        return new Promise((resolve) => {
            // if (this.state.documentsFileArray.length === 0) {
            if (this.state.currentDocIsDefault) {
                this.state.ldaModel.setDocumentType(this.state.defaultExt);
                resolve(d3.text(this.state.documentsURL));
                this.setState({currentDocIsDefault: false});
            } else {
                const fileSelection = this.state.documentsFileArray[0].slice();
                let reader = new FileReader();
                reader.onload = function () {
                    resolve(reader.result as string);
                };
                reader.readAsText(fileSelection[0]);
                this.setState({currentDocIsDefault: true});
            }
        })
    };


    /**
     * @summary Runs the document processing pipeline
     */
    queueLoad() {
        this.resetNotes()
        this.state.ldaModel.reset();
        Promise.all<string>([this.getStoplistUpload(), this.getDocsUpload()])
            .then(([stops, lines]) => {
                this.state.ldaModel.ready(null, stops, lines)
            })
            .catch(err => {
                console.error("Error during queueLoad")
                console.error(err)
                this.state.ldaModel.ready(err, '', '')
            });
    }

    /**
     * @summary Runs the document processing pipeline for bigrams
     */
    _initializeBigram() {
        Promise.all([this.getDocsUpload()])
            .then(([lines]) => {
                this.state.ldaModel._parseBigram(lines)
            })
    }

    /**
     * @summary changes bigram status in ldamodel
     */
    changeBigramStatus(bigramStatus: boolean) {
        if (!this.state.ldaModel.bigramInitialized) {
            this._initializeBigram();
        } else {
            this.state.ldaModel._changeBigramStatus(bigramStatus);
        }
        this.forceUpdate();
    }

    /**
     * @summary This function is the callback for "change"
     */
    onTopicsChange(val: string) {
        console.log("Changing # of topics: " + val);

        let newNumTopics = Number(val);
        if (!isNaN(newNumTopics) && newNumTopics > 0 && newNumTopics !== this.state.ldaModel.numTopics) {
            this.state.ldaModel.changeNumTopics(Number(val));
        }

        this.resetNotes();
    }

    componentDidMount() {
        // Set upon initialisation, changed to new numTopics in reset
        document.getElementById("num-topics-input")!.setAttribute("value", this.state.ldaModel.numTopics.toString());
        this.queueLoad();
    }

    /**
     * @summary Callback function for pressing the run iterations button
     */
    changeSweepAmount(val: string) {
        this.setState({
            sweepParameter: parseInt(val, 10)
        })
    }

    /**
     * @summary Callback function for pressing the stop button
     */
    stopButtonClick() {
        this.state.ldaModel.stopSweeps();
    }

    runIterationsClick() {
        console.log(this.state.ldaModel, 'clicked')
        this.state.ldaModel.addSweepRequest(this.state.sweepParameter);
    }

    render() {
        let DisplayPage;
        switch (this.state.selectedTab) {
            case "docs-tab":
                DisplayPage = <TopicDoc
                    ldaModel={this.state.ldaModel}
                />;
                break;
            case "corr-tab":
                DisplayPage = <Correlation
                    topicWordCounts={this.state.ldaModel.topicWordCounts}
                    numTopics={this.state.ldaModel.numTopics}
                    documents={this.state.ldaModel.documents}
                    getTopicCorrelations={this.state.ldaModel.getTopicCorrelations.bind(this.state.ldaModel)}
                    changeNotes={this.changeNotes.bind(this)}
                    provideNotes={this.provideNotes.bind(this)}
                    tooltip={corrTooltip}
                    update={this.state.update}/>;
                break;
            case "vocab-tab":
                DisplayPage = <VocabTable
                    sortVocabByTopic={this.state.ldaModel.sortVocabByTopic}
                    sortByTopicChange={this.state.ldaModel.sortByTopicChange.bind(this.state.ldaModel)}
                    vocabularyCounts={this.state.ldaModel.vocabularyCounts}
                    wordTopicCounts={this.state.ldaModel.wordTopicCounts}
                    selectedTopic={this.state.ldaModel.selectedTopic}
                    stopwords={this.state.ldaModel.stopwords}
                    numTopics={this.state.ldaModel.numTopics}
                    byCountDescending={this.state.ldaModel.byCountDescending.bind(this.state.ldaModel)}
                    addStop={this.state.ldaModel.addStop.bind(this.state.ldaModel)}
                    removeStop={this.state.ldaModel.removeStop.bind(this.state.ldaModel)}
                    update={this.state.update}
                    modelIsRunning={this.state.ldaModel.modelIsRunning}
                    modelDataDLer={this.state.modelDataDLer}
                />;

                break;
            case "ts-tab":
                DisplayPage = <TimeSeries
                    ldaModel={this.state.ldaModel}
                    update={this.state.update}
                />;
                break;
            case "home-tab":
                DisplayPage = <HomePage/>
                break;
            case "meta-tab":
                DisplayPage = <MetaDataPage
                ldaModel={this.state.ldaModel}
                metaFields={this.state.ldaModel.metaFields}/>
                break;
            case "to-tab":
                DisplayPage = <TopicOverviewPage
                    ldaModel={this.state.ldaModel}
                    annotations={this.annotations}
                    getTopicCorrelations={this.state.ldaModel.getTopicCorrelations.bind(this.state.ldaModel)}/>
                break;
            case "import-export-tab":
                DisplayPage = <ImportExportPage model={this.state.ldaModel}
                    overwriteModel={this.overwriteModel.bind(this)}
                    modelDataDLer={this.state.modelDataDLer}/>
                break;
            // case "visual-tab":
            //     DisplayPage = <TopicTreemap
            //         ldaModel={this.state.ldaModel}/>
            //     break;
            default:
                DisplayPage = null;
                break;
        }

        return (
            <div id="app">
                <div id="tooltip"></div>

                <div id="main" style={{display: "flex", flexDirection: "column", height: "100%"}}>

                    <TopBar numTopics={this.state.ldaModel.numTopics}
                            onClick={this.runIterationsClick.bind(this)}
                            updateNumTopics={this.onTopicsChange.bind(this)}
                            sweepParameter={this.state.sweepParameter}
                            hyperTune={this.state.ldaModel.hyperTune.bind(this.state.ldaModel)}
                            bigrams={this.changeBigramStatus.bind(this)}
                            onChange={this.changeSweepAmount.bind(this)}
                            stopButtonClick={this.state.ldaModel.stopSweeps.bind(this.state.ldaModel)}
                            modelIsRunning={this.state.ldaModel.modelIsRunning}
                            onDocumentFileChange={this.onDocumentFileChange.bind(this)}
                            onStopwordFileChange={this.onStopwordFileChange.bind(this)}
                            onModelFileChange={this.onModelFileChange.bind(this)}
                            onFileUpload={this.queueLoad.bind(this)}
                            onModelUpload={this.onModelUpload.bind(this)}
                            onDefaultDocChange={this.onDefaultDocChange.bind(this)}
                            docName={this.state.docName}
                            optimizeValue={this.state.ldaModel._changeAlpha}
                        // @ts-ignore TS2551 TODO: Fix this
                            bigramValue={this.state.ldaModel.bigrams}
                            tokenRegex={this.state.ldaModel.tokenRegex}
                            changeTokenRegex={this.onTokenRegexChange.bind(this)}
                    />

                    <div style={{display: "flex", flex: "1", overflow: "hidden"}}>
                        <SideBar selectedTopic={this.state.ldaModel.selectedTopic}
                                 changeAnnotation={this.changeAnnotation.bind(this)}
                                 getAnnotation={this.getAnnotation.bind(this)}
                                 sortVocabByTopic={this.state.ldaModel.sortVocabByTopic}
                                 numTopics={this.state.ldaModel.numTopics}
                                 topicVisibility={this.state.ldaModel.topicVisibility}
                                 setTopicVisibility={this.state.ldaModel.setTopicVisibility.bind(this.state.ldaModel)}
                                 topicWordCounts={this.state.ldaModel.topicWordCounts}
                                 selectedTopicChange={this.state.ldaModel.selectedTopicChange.bind(this.state.ldaModel)}
                        />

                        <div id="tabwrapper">
                            <NavBar onClick={this.changeTab.bind(this)}/>
                            <div id="pages">
                            </div>
                            <div style={{"height":"100%","width":"100%","paddingLeft":"20px","paddingRight":"20px"}}>
                            {!this.state.ldaModel ? null : DisplayPage}
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default App;
