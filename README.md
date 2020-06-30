jsLDA
=====

An implementation of latent Dirichlet allocation in javascript. This version is an adaptation of David Mimno's [original jsLDA](http://mimno.infosci.cornell.edu/jsLDA/jslda.html). The code has been refactored for maintainability and to make adding features easier. Several features have  been added to streamline serious analysis endevores especially by people without a strong background in computer science. This includes making file formatting more fexible, allowing a custom number of itterations to be specified, and timeseries information to be downloaded. The topic document page has also been revamped, and metadata support is being added.

Instructions:
------------

When you first load the page, it will request a file containing documents and a file containing stopwords. The default example is a corpus of movie plot summaries from wikipedia.

Click the "Run 50 iterations" button to start training. The browser may appear to freeze for a while.
Initially all words have been assigned randomly to topics.
We train a model by cycling through every word token in the documents and sampling a topic for that word.
An "iteration" corresponds to one pass through the documents.

The topics on the left side of the page should now look more interesting. Run more iterations if you would like -- there's probably still a lot of room for improvement after only 50 iterations.

Once you're satisfied with the model, you can go to the "Topic Documents" tab and click on a topic from the list on the right to sort documents in descending order by their use of that topic. Proportions are weighted so that longer documents will come first.

You can also explore correlations between topics by clicking the "Topic Correlations" tab. This view shows a force directed layout with connections between topics that have correlations above a certain threshold.

Topic correlations are actually pointwise mutual information scores. This score measures whether two topics occur
in the same document more often than we would expect by chance. Previous versions of this script calculated correlations
on logratios; PMI is simpler to calculate.

Using your own corpus:
---------------------

To use your own corpus, simply select the desired document and or stoplist files from the file upload section on the home page and click upload. 

Documents can be in csv or tsv format. The uploader assumes documents are in tsv format if the file does not have a .csv type. Document files <b> must </b> have a header with column labels. 

Certain column labels enable different functionality on the website. 
- A column labeled "text" is <b>required</b>. 
- If a column labeled "id" is included, documents will display that id on the webpage. This can make analyzing documents much easier. 
- If a column labeled "date_tag" is included and properly formatted, the "Time Series" page will display a time wise analysis of the generated topics. The date_tags are not parsed for timestamps or epoch times or any other standard time values. Instead, the model assumes that the order the timestamps first appear is the correct order. This means if row 1 has the date_tag "1914", row 2 has "1915", row 3 has "1916", and row 4 has "1914", jsLDA will correctly assume that the order is 1914->1915->1916. If however, row 2 and 3 are switched, jsLDA will instead believe the order is 1914->1916->1915. Note that once a "date_tag" has already been seen, subsequent appearances of that tag do not need to be in order. This ordering can be achieved in any standard spreadsheet editor by sorting the rows by the "date_tag" column.
- All other rows will be interpreted as metadata. Their column name and values will be stored and displayed on the document tab as well as available for analysis on the metadata tab.

The format for stopwords is one word per line. The "Vocabulary" tab may be useful in customizing a stoplist. Unicode is supported, so most languages that have meaningful whitespace (ie not CJK) should work.

The page works best in Chrome. Safari and Firefox work too, but may be considerably slower. It doesn't seem to work in IE.

Download results:
----------------

You can create reports about your topic model. Hit the `Downloads` tab.
Reports are in CSV format. The `sampling state` file contains the same information as a Mallet state file, but in a more compact format. 
