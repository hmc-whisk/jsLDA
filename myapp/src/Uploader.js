import React from "react";

class Uploader extends React.Component {

    render() {
        return (
            <div >
                <div class="upload">
                    <form onSubmit="event.preventDefault(); queueLoad();">
                        <div>Use a different collection:</div>
                        <div>Documents <input id="docs-file-input" type="file" onchange="onDocumentFileChange(this)"
                            size="10" /></div>
                        <div>Stoplist <input id="stops-file-input" type="file" onchange="onStopwordFileChange(this)"
                            size="10" /></div>
                        <div><button id="load-inputs">Upload</button></div>
                    </form>
                </div>

            </div>
        );
    }

}

export default Uploader;
