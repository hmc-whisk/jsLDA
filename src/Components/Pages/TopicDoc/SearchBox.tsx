import React, {KeyboardEvent} from 'react';
import FormControl from 'react-bootstrap/FormControl';
import InputGroup from 'react-bootstrap/InputGroup';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import Button from 'react-bootstrap/Button';
import './topicDoc.css';
import type {LDAModel} from "core";

interface SearchProps{
    model:LDAModel,
    search: (query: string) => void,
    metadataKeys: string[],
    changePage: (n:number)=>void,
}
interface SearchState{
    query:string
    metadataKey: string
}

/**
 * @summary a class for the search bar
 * @requires
 *  @prop documents
 *  @state query
 */
export class SearchBox extends React.Component<SearchProps,SearchState> {

    constructor(props:SearchProps){
        super(props);

        this.state = {
            query: '',
            metadataKey: 'ID',
        };
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
                            this.props.changePage(1);
                            // @ts-ignore
                            this.setState({query: e.target.value});
                            this.props.search(this.state.query);
                        }}}
                    />
                    <Button variant="outline-secondary" id="button-addon2"
                        style={{
                            borderBottomLeftRadius:'0',
                            borderTopLeftRadius:'0'}}
                        onClick={() => {
                            this.props.changePage(1);
                            this.props.search(this.state.query);}}>
                        Search
                    </Button>
                    <Button variant="outline-secondary" id="reset-button-search" style={{marginLeft:'5px'}}
                        onClick={() => {
                            this.props.changePage(1);
                            this.props.search('');}}>
                        Reset
                    </Button>
                    <Select
                        fullWidth
                        displayEmpty
                        value={this.state.metadataKey}
                        onChange={e => this.setState({metadataKey: e.target.value})}
                        variant="outlined"
                        >
                        <MenuItem value={'ID'}>{'ID'}</MenuItem>
                        {this.props.metadataKeys.map((key: string) => (
                            <MenuItem value={key}>{key}</MenuItem>
                        ))}
                    </Select>
                </InputGroup>

            </div>
        )
    }
}

export default SearchBox;