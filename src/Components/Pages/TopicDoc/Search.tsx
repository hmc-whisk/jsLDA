import React, {KeyboardEvent} from 'react';
import FormControl from 'react-bootstrap/FormControl';
import InputGroup from 'react-bootstrap/InputGroup';
import Button from 'react-bootstrap/Button';
import './topicDoc.css';
import type {LDAModel, LDADocument} from "core";

interface SearchProps{
    model:LDAModel
}
interface SearchState{
    query:string
}

/**
 * @summary a class for the search bar
 * @requires
 *  @prop documents
 *  @state query
 */
export class Search extends React.Component<SearchProps,SearchState> {

    constructor(props:SearchProps){
        super(props);

        this.state = {query: ''};
    }

    render() {
        return (
            <div style={{width:'50%', display:'inline-block'}}>

                <InputGroup style={{display:'inline-flex', width:'100%'}}>
                    <FormControl
                        type="search"
                        placeholder="Search for a document ID..."
                        aria-label="Search-Query"
                        aria-describedby="basic-addon2"
                        onChange={e => this.setState({query: e.target.value})}
                        onKeyPress={(e:KeyboardEvent<HTMLInputElement>) => {if (e.key === 'Enter') {
                            // @ts-ignore
                            this.setState({query: e.target.value});
                            this.search();
                        }}}
                    />
                    <Button variant="outline-secondary" id="button-addon2" onClick={this.search.bind(this)}>
                        Search
                    </Button>
                </InputGroup>

            </div>
        )
    }

    /**
     * @summary Finds documents which include the search query as a substring
     * @returns Array of LDADocuments that fit the search query
     */
    search() {
        let searchResults: LDADocument[] = [];
        let docs = this.props.model.documents;

        for (let i = 0; i < docs.length; i++) {
            let currentID = docs[i].id.toString().toLowerCase();
            let lowerQuery = this.state.query.toLowerCase();

            if (currentID.indexOf(lowerQuery) >= 0) {
                searchResults.push(docs[i]);
            }
        }

        // return (searchResults);
        console.log(searchResults);
    }
}

export default Search;
