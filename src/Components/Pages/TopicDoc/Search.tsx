import React from 'react';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import './topicDoc.css';
import type {LDAModel, SortedLDADocument} from "core";

interface SearchProps{
    documents:SortedLDADocument[]
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
    render() {
        return (
            <div>
                <Form>
                    <Form.Control type="text" placeholder="Search" value={this.state.query} onChange={this.handleChange} />
                    <Button variant="outline-primary"
                            onClick={() => this.search()}>Search</Button>
                </Form>
            </div>
        )
    }

    /**
     * @summary Changes the state as the search field is updated
     * @param event 
     */
    handleChange(event) {
        this.setState({query: event.target.value});
    }

    /**
     * @summary Finds documents which include the search query as a substring
     * @returns Array of LDADocuments that fit the search query
     */
    search() {
        var searchResults = [];
        for (let i = 0; i < this.props.documents.length; i++) {
            for (let j = 0; j < this.props.documents[i].id.length - this.state.query.length; j++) {
                if (this.props.documents[i].id[j,j + this.state.query.length] == this.state.query) {
                    searchResults.push(this.props.documents[i]);
                    break;
                }
            }
        }

        return (searchResults);
    }
}

export default Search;
