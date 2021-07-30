import {LDAModel} from "./LDAModel";
import {getFromStorage} from "./storage";
import {createZip, readZip} from "./compression";
import {displayMessage} from "./message";

const FileSaver = require("filesaver.js-npm")

const testString = `#doc source pos typeindex type topic
#alpha : 0.15649079156991014 0.06887579016155862 0.1855743979671839 0.19340526269604397 0.1778038889715676 0.039678540800321 0.10123579835908122 0.0518365547569033 0.05323361206105949 0.023974965701155312 0.16834872782407512 0.019771220957474488 0.02174696115013276 0.15026734378684603 0.04351233224529447 0.0378662714627269 0.07334423224446168 0.01399607061091689 0.19496104719957222 0.06727591832075384 0.06208767479480345 0.08024928810497696 0.12966226844579593 0.9097790767004938 0.0544908793950503 0.250176925906939 0.45385526039868174 0.02647894333795857 0.171966914036673 0.04172931073835679 0.49408361570366216 0.030357712455979027 0.013207749213176492 0.02512277961622844 0.036321230986584935 0.017714506415210784 0.03216549415145754 0.14011908244908255 0.05326600654578091 0.02405308688078503 0.8230128443657644 0.06739508632215263 0.2016685370980895 0.14569272937964717 0.027157750590292497 0.29339531106013084 0.28142457541544574 0.280614580816259 0.22566876112358572 0.06135366078575892 
#beta : 0.009489391213368165
0 NA 0 0 dies 47
0 NA 1 1 sein 26
0 NA 2 2 der 47
0 NA 3 3 wort 3
0 NA 4 4 in 28
0 NA 5 2 der 34
0 NA 6 5 brief 25
0 NA 7 6 punct 42
0 NA 8 2 der 42
0 NA 9 2 der 42
0 NA 10 7 prophet 34
0 NA 11 8 jeremia 34
0 NA 12 9 senden 25
0 NA 13 10 von 45
0 NA 14 11 jerusalem 34
0 NA 15 12 an 47
0 NA 16 2 der 28
0 NA 17 13 übrig 34
0 NA 18 14 älteste 45
0 NA 19 6 punct 23
0 NA 20 2 der 23
0 NA 21 15 wegführen 34`

// doc index, throw, index into token, recompute, token, recompute topicwordcount ++

function readMallet(serializedModel: string, model: LDAModel, stoplist: { [key: string]: 1 | undefined }) {
    let alpha: number[] = []
    let beta: number | undefined;

    let lastDocIndex = -1;
    let currentTokenIndex = 0;

    model.wordTopicCounts = {}
    model.topicDocCounts = []
    model.tokensPerTopic = new Array(model.numTopics).fill(0)
    for (let doc of model.documents) {
        doc.topicCounts = new Array(model.numTopics).fill(0)
    }

    serializedModel.split('\n').forEach((line, i) => {
        if (line.startsWith("#alpha")) {
            if (alpha.length > 0) {
                console.warn(`Encountered alpha in model even when already initialized (line ${i + 1})`)
            }
            for (let s of line.slice(line.indexOf(": ") + 1).trim().split(" ")) {
                let n = parseFloat(s)
                // thanks js, we all love that NaN === NaN always returns false
                if (Number.isNaN(n)) throw Error(`Cannot parse alpha (line ${i + 1})`)
                alpha.push(n)
            }
        } else if (line.startsWith("#beta")) {
            if (beta !== undefined) {
                console.warn(`Encountered beta in model even when already initialized (line ${i + 1})`)
            }
            beta = parseFloat(line.slice(line.indexOf(":") + 1))
        } else if (line.trim().startsWith('#') || line.trim() === '') {
            // do nothing
        } else {
            let [sDocIndex, _, sTokenIndex, sTypeIndex, token, sTopic] = line.split(' ')
            for (let v of [sDocIndex, _, sTokenIndex, sTypeIndex, token, sTopic])
                if (v === undefined) throw Error("Cannot parse line " + i + 1)
            let docIndex = parseInt(sDocIndex)
            let tokenIndex = parseInt(sTokenIndex)
            let typeIndex = parseInt(sTypeIndex)
            let topic = parseInt(sTopic)

            for (let v of [docIndex, tokenIndex, typeIndex, topic])
                // this weird comparison includes an NaN check because NaN compared with anything is always false
                // and should be slightly less computation than Number.isNaN(v) || v <0
                if (!(v >= 0)) throw Error("Cannot parse line " + i + 1)

            if (docIndex !== lastDocIndex) {
                currentTokenIndex = 0;
                lastDocIndex = docIndex;
            }

            let tokens = model.documents[docIndex].tokens
            try {
                while (tokens[currentTokenIndex].isStopword) {
                    currentTokenIndex++
                }
            } catch (e) {
                console.error(e)
                throw Error(`State file (line ${i + 1}) does not match document ${docIndex}`)
            }

            tokens[currentTokenIndex].topic=topic

            model.tokensPerTopic[topic]++;
            if (!model.wordTopicCounts[token]) {
                model.wordTopicCounts[token] = {};
            }
            if (!model.wordTopicCounts[token][topic]) {
                model.wordTopicCounts[token][topic] = 0;
            }
            model.wordTopicCounts[token][topic] += 1;
            model.documents[docIndex].topicCounts[topic] += 1;
            currentTokenIndex++
        }
    })
    if (alpha.length !== model.numTopics) throw Error(`Length of alpha vector does not match number of topics in model (${model.numTopics}, inferred from length of annotations)`)
    if (beta === undefined || Number.isNaN(beta)) throw Error("Cannot find beta")
    model._documentTopicSmoothing = alpha
    model._topicWordSmoothing = beta

    model.sortTopicWords()
}

function exportToMallet(model: LDAModel): string {
    let serialized = "#doc source pos typeindex type topic\n#alpha : "
    for (let n of model._documentTopicSmoothing) {
        serialized += `${n} `
    }
    console.log(model._documentTopicSmoothing)
    serialized += `\n#beta : ${model._topicWordSmoothing}\n`
    let typeIndicies: { [key: string]: number } = {}
    let nextType: number = 0;
    for (let documentIndex in model.documents) {
        let doc = model.documents[documentIndex]
        let docPos = 0;
        for (let tokenIndex in doc.tokens) {
            let token = doc.tokens[tokenIndex]
            if (token.isStopword) continue
            if (!typeIndicies.hasOwnProperty(token.word)) {
                typeIndicies[token.word] = nextType++;
            }
            serialized += `${documentIndex} NA ${docPos++} ${typeIndicies[token.word]} ${token.word} ${token.topic}\n`
        }
    }

    return serialized
}

function exportAnnotations(annotations: string[]) {
    return JSON.stringify(annotations, null, 4)
}

export async function serializeModel(model: LDAModel, annotations: string[]) {

    let files: { [key: string]: string } = {}

    await displayMessage("Loading original document", 0, "promise")
    let documents = (await getFromStorage("documents"))!
    let filename: string;
    switch (documents.contentType) {
        case "text/csv":
            filename = "documents.csv"
            break
        case "text/tsv":
            filename = "documents.tsv"
            break
        default:
            throw Error("incorrect content-type encountered during decompression")
    }

    files[filename] = documents.data

    await displayMessage("Generating stoplist", 0, "promise")

    let stops: string = "";
    for (let key in model.stopwords) {
        stops += key + "\n"
    }
    files["stopwords.txt"] = stops

    await displayMessage("Serializing model", 0, "promise")
    files["model.txt"] = exportToMallet(model)

    await displayMessage("Serializing annotations", 0, "promise")
    files["annotations.json"] = exportAnnotations(annotations)

    await displayMessage("Compressing", 0, "promise")

    return await createZip(files)
}

export async function saveModel(model: LDAModel, annotations: string[]) {
    let zip = await serializeModel(model, annotations)
    FileSaver.saveAs(zip, "LDAModel.zip")
}

export async function deserializeModel(serializedModel: Blob): Promise<{
    model: LDAModel
    annotations: string[]
}> {
    await displayMessage("Decompressing model", 0, "promise")
    let files = await readZip(serializedModel)
    let annotations = files["annotations.json"]
    let stopwords = files["stopwords.txt"]
    let model = files["model.txt"]

    if (!annotations) throw Error("Annotations (annotations.json) not found in serialized model")
    if (!stopwords) throw Error("Stopwords (stopwords.txt) not found in serialized model")
    if (!model) throw Error("Model (model.txt) not found in serialized model")
    console.log(files)
    let docTsv: string | undefined = files["documents.tsv"]
    let docCsv: string | undefined = files["documents.csv"]
    let documents: string;
    let documentsType: string;
    if (docTsv) {
        documents = docTsv
        documentsType = "text/tsv"
    } else if (docCsv) {
        documents = docCsv
        documentsType = "text/csv"
    } else {
        throw Error("Documents (documents.tsv or documents.csv) not found in serializedModel")
    }
    await displayMessage("Reading annotations", 0, "promise")
    let deserializedAnnotations = JSON.parse(annotations);

    await displayMessage("Reading stopwords", 0, "promise")
    let deserializedStopwords: { [key: string]: 1 | undefined } = {}
    for (let w of stopwords.split(/\n/)) {
        deserializedStopwords[w] = 1
    }

    await displayMessage("Parsing original documents", 0, "promise")
    let deserializedModel = new LDAModel(deserializedAnnotations.length);
    deserializedModel.documentType = documentsType
    deserializedModel.stopwords = deserializedStopwords
    deserializedModel._parseDoc(documents)

    await displayMessage("Recomputing stopwords", 0, "promise")
    for (let doc of deserializedModel.documents) {
        for (let token of doc.tokens) {
            token.isStopword = Boolean(deserializedStopwords[token.word])
        }
    }

    await displayMessage("Reconstructing model", 0, "promise")
    readMallet(model, deserializedModel, deserializedStopwords)

    await displayMessage("Model deserialized", 0, "promise")
    return {
        model: deserializedModel,
        annotations: deserializedAnnotations
    }
}

