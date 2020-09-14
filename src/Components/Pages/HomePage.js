import React from "react";
import Uploader from './Uploader';
import Tooltip from '../Tooltip'

var backColor = getComputedStyle(document.documentElement).getPropertyValue('--color3');


class HomePage extends React.Component {
    helpTextStyle = {
        backgroundColor: backColor,
        position: "fixed",
        top: "10%",
        left: "10%",
        right:"10%",
        borderRadius: "20px 0px 0px 20px",
        margin: "10px",
        height: "70%",
        overflowY: "scroll"
    }

    get uploadHelp() {
        return (
            <Tooltip
                floatRight={false}
                displayElement={
                    <div style={this.helpTextStyle}>
                        <div style={{margin:"15px"}}>
                        <h4 style={{textAlign:"center"}}>Document File Format</h4>
                        <p>
                            Your documents file must be in csv or tsv format 
                            and must include a header as the first row which 
                            indicates the contents or your columns. There are
                            a few special column names that get processed in 
                            special ways.
                        </p>
                        <ul>
                            <li>
                                A column labeled “text” <b>must</b> be included. This
                                column will be processed as the text of your 
                                documents. 
                            </li>
                            <li>
                                If a column labeled “id” is included, documents will be 
                                labeled by their given ID in the topic document explorer 
                                and downloads which include document information.
                            </li>
                            <li>
                                If a column is labeled “date_tag” it will be processed as 
                                an <a href="https://tc39.es/ecma262/#sec-date-time-string-format"> 
                                ISO date time string</a> and will enable the functionality 
                                of the time series tab.
                            </li>
                            <li>
                                All other rows will be interpreted as metadata. Their column 
                                name and values will be stored and displayed on the document
                                tab as well as available for analysis on the metadata tab.
                            </li>
                        </ul>
                        <h4 style={{textAlign:"center"}}>Stoplist File Format</h4>
                        <p>
                            The format for stopwords is one word per line. Filetype 
                            is not important. The "Vocabulary" tab may be useful 
                            in customizing a stoplist. Unicode is supported, so most
                            languages that have meaningful whitespace (ie not CJK)
                            should work.
                        </p>
                        </div>
                    </div>
                }/>
        )
    }

    get trainingHelp() {
        return (
            <Tooltip
                floatRight={false}
                displayElement={
                    <div style={this.helpTextStyle}>
                        <div style={{margin:"15px"}}>
                        <h4 style={{textAlign:"center"}}>Running Iterations</h4>
                        <p>
                            When you first load a dataset, your topics will be more or less useless. You can fix this by having the model run iterations over your documents. Everything you need to do this can be found at the top left of the page. 100 to 200 iterations is good for initial investigation. For a final model and more reliable topics, you may want to do thousands of iterations.
                        </p>
                        <h4 style={{textAlign:"center"}}>Number of Topics</h4>
                        <p>
                            Choosing the best number of topics to include in your model can be a tricky decision. Including too many topics can create duplicate topics, or create topics which are too specific to be useful. Include too few and your topics will miss more subtle, but potentially very important, themes. There is no straight forward answer to how many topics any model should have. Instead, trying a few different numbers and seeing which one works best tends to be a pretty good method. Alternatively, there are tools out there that will choose an optimal number of topics based on a few different metrics, but no such tool is included here.
                        </p>
                        <h4 style={{textAlign:"center"}}>Stopwords</h4>
                        <p>
                            Stopwords can be edited by uploading a stoplist or using the vocabulary tab. 
                        </p>
                        <p>
                            A stopword is any word you would like to exclude from your model. During training and analysis your model will skip over stopwords, pretending like they do not exist. By default, some basic words like "the" are already included in your stoplist. Stopwords should be added sparingly, as adding too many can remove valuable information from your model. One good indicator of how much information you might lose from adding a stopword is that word's topic specificity. Words with a high specificity (closer to 1) are more specific to a small number of topics and tend to tell you more about the contents of those topics. Words with a low specificity are found more commonly in many topics, and therefore don't tell you as much about any individual topic. Another important consideration is whether or not a word is relevant to what you are trying to analyze with your topic model. For example, if gender is important to your analysis, you'll want to keep pronouns in the model. If you are not looking at gender, you can consider adding pronouns to your list of stopwords.
                        </p>
                        </div>
                    </div>
                }/>
        )
    }

    get analyzingHelp() {
        return (
            <Tooltip
                floatRight={false}
                displayElement={
                    <div style={this.helpTextStyle}>
                        <div style={{margin:"15px"}}>
                        <h4 style={{textAlign:"center"}}>Topic Bar</h4>
                        <p>
                            On the left of the page, the topic bar shows you the top words in every topic.
                        </p>
                        <p>
                            This is the most basic of the analysis tools and a good place to start. On the left of the page you will see a list of all your topics. Both the number associated with that topic and the words most common to that topic can be found here. The most common words can give you an initial idea of the theme that topic is latching on to. If the most common words are unhelpful because they are the same for every topic, you may consider adding those common words to your list of stopwords.
                        </p>
                        <h4 style={{textAlign:"center"}}>Topic Documents Tab</h4>
                        <p>
                            This tab in the tab bar will help you see how topics appear in your documents.
                        </p>
                        <p>
                            The meaning of words in isolation can be hard to discern, so it is necessary to look at them in context before making any conclusions about a topic. The topic document tab is how jsLDA 2.0 enables you to do this. To start, you’ll want to click on the topic you’d like to investigate in the topic bar. Now the documents will be sorted by their topic score. This score mostly indicates how much of the topic appears in this document, but it is also weighted to favor longer documents. Once you’ve done this, you can click on documents to reveal their full text. When the document is extended, you will notice that some words are highlighted. This highlighting is based on a metric called saliency. First theorized by Chuang et al and later adapted for looking at words in the context of topics by Alexander et al, this metric represents both how much of the topic that word accounts for and how distinct the word is to that topic. Words with a high saliency score are relatively common in the given topic and appear more in the selected topic than other topics. The 'Use Saliency' option allows you to sort the documents by their average saliency score.
                        </p>
                        <h4 style={{textAlign:"center"}}>Topic Correlations Tab</h4>
                        <p>This tab will help you see which topics show up together.</p>
                        <p>
                            Here you can investigate how topics relate to each other. Displayed on this page is a large grid of blue and red circles. Each circle represents whether two topics occur in the same documents more or less often than they would at random. This is calculated by two topic’s pointwise mutual information scores. Blue circles mean they occur together more than we would expect, and red means they occur together less than we would expect. The size of the circle indicates the magnitude of their correlation. Hovering over a circle will provide additional information.
                        </p>
                        <h4 style={{textAlign:"center"}}>Time Series Tab</h4>
                        <p>This tab will help you see how prevalent topics are over time.</p>
                        <p>
                            If you have included a working date_tag column in your documents file, this page will display topic trends over time. Each point represents the average proportion of words assigned to that topic at that time. While a topic is selected, only the graph for that topic will appear. Hovering over this plot will give you more information.
                        </p>
                        <h4 style={{textAlign:"center"}}>Metadata Tab</h4>
                        <p>
                            This tab will help you see how topics relate to document metadata.
                        </p>
                        <p>
                            If you have included metadata in your documents file, you can use this tab to explore the relationships between your topics and the metadata. There are several different graphs available for use. For discrete data, you may use each of the bar plots. The normal bar plots are best for getting information about a particular topic, while the topic bar plot is best at getting information about which topics are related to a specific metadata value. For continuous data, the scatter plot is available. If you would prefer to make your own graphs, you have the option of exporting data related to any of these graphs on this page.
                        </p>
                        <h4 style={{textAlign:"center"}}>Downloads Tab</h4>
                        <p>
                            If you would like to continue your analysis with other tools, you have the option of downloading much of the information created by this website via this tab.
                        </p>
                        </div>
                    </div>
                }/>
        )
    }

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
                        This is a tool designed to train and investigate LDA (latent Dirichlet allocation) topic
                        models. You can begin by choosing a default dataset to 
                        work with, or by uploading your own dataset. If you are 
                        unfamiliar with topic models, reading <a href = "http://www.scottbot.net/HIAL/index.html@p=19113.html">this</a> is
                        a good place to start. For a more technical explanation 
                        of LDA, you can look <a href="https://www.pnas.org/content/pnas/101/suppl_1/5228.full.pdf">here</a>.
                    </p>

                    <h3>Uploading your own files</h3>
                        <p>
                            If you choose to upload your own dataset, your files must
                            be formatted so that jsLDA 2.0 can interpret them. 
                        </p>
                        {this.uploadHelp}

                    <h3>Training a Model</h3>
                        <p>
                            Your topics will start out totally random. To get meaningful topics,
			    you can have the model run iterations of inference. 
                            Most of the controls for this can be found at the very top of the page.
                        </p>
                        {this.trainingHelp}
                    <h3>Analyzing a Model</h3>
                        <p>Once you've trained a model, you'll need to figure out what your model has found. jsLDA 2.0 has a few different tools to help you do this.</p>
                        {this.analyzingHelp}
		    <h3>About</h3>
			<p>jsLDA was originated by David Mimno at Cornell University. Further development was conducted at Harvey Mudd College by Alfredo Gomez, Tatsuke Kuze, Theo Bayard de Volo, and Xanda Schofield.</p>
                </span>
                
            </div>
        );
    }
}

export default HomePage;
