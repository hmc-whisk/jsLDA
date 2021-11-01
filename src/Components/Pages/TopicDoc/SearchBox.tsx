import React, {KeyboardEvent} from 'react';
import FormControl from 'react-bootstrap/FormControl';
import InputGroup from 'react-bootstrap/InputGroup';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import Button from 'react-bootstrap/Button';
import Grid from '@material-ui/core/Grid';
import './topicDoc.css';
import type {LDAModel} from "core";

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
            <div style={{width:'50%', display:'inline-block'}}>

                <Grid
                container
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                >
                    <Grid item>
                        <Select
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

                    <Grid item>
                        {/* <InputGroup style={{display:'inline-flex', width:'100%'}}> */}
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
                            <Grid item>
                                <Button variant="outline-secondary" id="button-addon2"
                                    style={{
                                        borderBottomLeftRadius:'0',
                                        borderTopLeftRadius:'0'}}
                                    onClick={() => {
                                        this.props.changePage(1);
                                        this.props.search(this.state.query, this.state.searchKey);}}>
                                    Search
                                </Button>
                            </Grid>
                            
                            <Grid item>
                            <Button variant="outline-secondary" id="reset-button-search" style={{marginLeft:'5px'}}
                                onClick={() => {
                                    this.props.changePage(1);
                                    this.props.search('', 'id');
                                    this.setState({query: ''});
                                    this.setState({searchKey: 'id'});
                                }}>
                                Reset
                            </Button>
                            </Grid>
                        {/* </InputGroup> */}
                </Grid>

            </div>
        )
    }
}

export default SearchBox;