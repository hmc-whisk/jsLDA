import React, {KeyboardEvent} from 'react';
import FormControl from 'react-bootstrap/FormControl';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import Button from 'react-bootstrap/Button';
import Grid from '@material-ui/core/Grid';
import InputLabel from '@material-ui/core/InputLabel';
import './topicDoc.css';
import type {LDAModel} from "core";
import { Typography } from '@material-ui/core';

interface SearchProps{
    model:LDAModel,
    search: (query: string, searchKey: string) => void,
    metadataKeys: string[],
    changePage: (n:number)=>void,
}
interface SearchState{
    query:string
    searchKey: string
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
            searchKey: 'id',
        };
    }

    render() {
        return (
            <Grid
            container
            direction="row"
            alignItems="center"
            spacing={1}
            >
                <Grid item xs={5}>
                    <FormControl
                        type="search"
                        value={this.state.query}
                        placeholder="Search for a document ID..."
                        aria-label="Search-Query"
                        aria-describedby="basic-addon2"
                        onChange={e => this.setState({query: e.target.value})}
                        onKeyPress={(e:KeyboardEvent<HTMLInputElement>) => {if (e.key === 'Enter') {
                            this.props.changePage(1);
                            // @ts-ignore
                            this.setState({query: e.target.value});
                            this.props.search(this.state.query, this.state.searchKey);
                        }}}
                    />
                </Grid>

                <Grid item xs={3}>
                    <InputLabel id="select-label">Search by</InputLabel>
                    <Select
                    labelId="select-label"
                    label="Search by"
                    fullWidth
                    displayEmpty
                    value={this.state.searchKey}
                    onChange={e => this.setState({searchKey: String(e.target.value)})}
                    variant="outlined"
                    >
                        <MenuItem key={'id'} value={'id'}>{'id'}</MenuItem>
                        {this.props.metadataKeys.map((key: string) => (
                            <MenuItem key={key} value={key}>{key}</MenuItem>
                        ))}
                        <MenuItem key={'date'} value={'date'}>{'date'}</MenuItem>
                        <MenuItem key={'text'} value={'text'}>{'text'}</MenuItem>
                    </Select>
                </Grid>

                <Grid item xs={2}>
                    <Button
                        variant="outline-secondary"
                        id="button-addon2"
                        style={{width:'100%'}}
                        onClick={() => {
                            this.props.changePage(1);
                            this.props.search(this.state.query, this.state.searchKey);}}>
                        Search
                    </Button>
                </Grid>
                            
                <Grid item xs={2}>
                    <Button
                        variant="outline-secondary"
                        id="reset-button-search"
                        style={{width:'100%'}}
                        onClick={() => {
                            this.props.changePage(1);
                            this.props.search('', 'id');
                            this.setState({query: ''});
                            this.setState({searchKey: 'id'});
                        }}>
                        Clear
                    </Button>
                </Grid>
            </Grid>
        )
    }
}

export default SearchBox;