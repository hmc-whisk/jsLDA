import React from "react";
import Uploader from './Uploader';

class HomePage extends React.Component {
    render() {
        return (
            <div id="home-page" className="page">
                <h2>Welcome to jsLDA 2.0!</h2>
                <Uploader 
                    onDocumentFileChange = {this.props.onDocumentFileChange}
                    onStopwordFileChange = {this.props.onStopwordFileChange}
                    onFileUpload = {this.props.onFileUpload}
                    modelIsRunning = {this.props.modelIsRunning}
                    onDefaultDocChange = {this.props.onDefaultDocChange}
                    docName = {this.props.docName}
                />
                <span>
                    <p>
                        This is a tool designed to train and investigate LDA topic models.
                        You can begin by choosing a default dataset to work with, or by uploading
                        your own dataset. If you are unfamiliar with topic models, reading this (include a 
                        link to a good explination) is a good place to start. For a more technical
                        explination about LDA, you can look here (find another link).
                    </p>

                    <h3>Uploading your own files</h3>
                        <p>
                            If you choose to upload your own dataset, your files must
                            be formatted so that jsLDA 2.0 can interpret them. 
                        </p>
                        <h4>Document File Format</h4>
                            <p>

                            </p>
                        <h4>Stopword File Format</h4>
                            <p>

                            </p>

                    <h3>Training a Model</h3>
                        <h4>Running Iterations</h4>
                            <p>
                                When you first load a dataset, your topics will be
                                more or less useless. You can fix this by having the
                                model run iterations over your documents. Everything
                                you need to do this can be found at the top left of 
                                the page. 100 to 200 iterations is usually enough to
                                get a good idea of what topics are in your documents
                                and is ideal for when you are still deciding how many
                                topics to include. For a final model and more
                                reliable topics, you may want to do thousands
                                of iterations. 
                            </p>
                        <h4>Number of Topics</h4>
                            <p>
                                Choosing the best number of topics to include in your 
                                model can be a tricky decision. Including too many topics
                                can create duplicate topics, or [I feel like there was
                                something else but forgot what it was]. Include too few and 
                                your topics will miss more subtle, but potentially very
                                important, themes. There is no straight forward answer to
                                how many topics any model should have. Instead, trying 
                                a few different numbers and seeing which one works best
                                tends to be a pretty good method. Alternatively, there
                                are tools out there that will choose an optimal number
                                of topics based on a few different metrics, but no such
                                tool is included here.
                            </p>
                        <h4>Stopwords</h4>
                            <p>
                                A stopword is any word you would like to exclude from your model.
                                During training and analysis your model will skip over stopwords, 
                                predenting like they do not exist. By default,
                                some basic words like "the" are already included in your stoplist.
                                Choices about what stopwords to use can be made in the
                                vocabularly tab at the far right of the tab bar. Stopwords
                                should be added sparingly, as adding too many can remove
                                valuable information from your model. One good indicator of
                                how much information you might loose from adding a stopword
                                is that word's topic specificity. Words with a high specificity
                                (closer to 1) are more specific to a small number of topics and 
                                tend to tell you more about the contents of those topics. Words with
                                a low specificy are found more commonly in many topics, and therefore
                                don't tell you as much about any individual topic. Another important
                                consideration is whether or not a word is relevant to what you
                                are trying to analyze with your topic model. For example, if gender
                                is important to your analysis, you'll want to keep pronouns in
                                the model. If you are not looking at gender, you can consider adding
                                pronouns to your list of stopwords.
                            </p>
                    <h3>Analyzing a Model</h3>
                        <p>
                            Training a model is only half of the battle. After that, you'll
                            need to figure out what your model has found. jsLDA 2.0 has a few
                            different tools to help you do this. While analyzing your model,
                            it often best to focus on how your model agrees and disagrees
                            with what you already know about your documents. A good topic model
                            agrees enough with what you already know to let you know it is working
                            and disagrees enough to tell you something you didn't already know.
                        </p>
                        <h4>Topic Bar</h4>
                            <p>
                                This is the most basic of the analysis tools and a good place
                                to start. 
                            </p>
                        <h4>Topic Documents Tab</h4>
                        <h4>Topic Correlations Tab</h4>
                        <h4>Time Series Tab</h4>
                        <h4>Metadata Tab</h4>
                        <h4>Downloads Tab</h4>
                </span>
                
            </div>
        );
    }
}

export default HomePage;