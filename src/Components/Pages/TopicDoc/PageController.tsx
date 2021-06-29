import React from 'react';
import Pagination from 'react-bootstrap/Pagination';
import './topicDoc.css';

interface PageControllerProps{
    currentPage:number,
    changePage:(n:number)=>void,
    lastPage:number
}
interface PageControllerState{}

/**
 * @summary a class for changing between pages
 * @requires
 *  @prop {Number} currentPage
 *  @prop {Number} lastPage
 *  @prop {Function(Number)} changePage
 */
export class PageController extends React.Component<PageControllerProps,PageControllerState> {
    render() {
        return (
            <div>
                <Pagination>
                    {this.firstPageButtons}
                    {this.currentPageButtons}
                    {this.lastPageButtons}
                </Pagination>
            </div>
        )
    }

    /**
     * @summary Dynamic buttons letting you return to first page
     */
    get firstPageButtons() {
        if (this.props.currentPage === 1) {
            return ([<Pagination.First />,
                <Pagination.Prev />]);
        }
        else {
            return ([<Pagination.First onClick={() => this.props.changePage(1)} />,
                <Pagination.Prev onClick={() => this.props.changePage(this.props.currentPage - 1)} />]);
        }
    }

    /**
     * @summary Dynamic buttons letting you skip to last page
     */
    get lastPageButtons() {
        if (this.props.currentPage === this.props.lastPage) {
            return ([<Pagination.Next />,
                <Pagination.Last />]);
        }
        else {
            return ([<Pagination.Next onClick={() => this.props.changePage(this.props.currentPage + 1)} />,
                <Pagination.Last onClick={() => this.props.changePage(this.props.lastPage)}/>]);
        }
    }

    /**
     * @summary Dynamic buttons letting you go to next and previous page
     */
    get currentPageButtons() {
        var buttons = [];
        if (this.props.currentPage < 3) {
            for (let i = 1; i < this.props.currentPage; i++) {
                buttons.push(this.pageButton(i));
            }
            buttons.push(<Pagination.Item active key={this.props.currentPage}>
                {this.props.currentPage}
            </Pagination.Item>);
            for (let i = this.props.currentPage + 1; i < 6; i++) {
                if (i <= this.props.lastPage) {
                    buttons.push(this.pageButton(i));
                }
                else {
                    buttons.push(<Pagination.Item disabled>
                        {i}
                    </Pagination.Item>);
                }
            }
            return (buttons);
        }
        else if (this.props.currentPage > this.props.lastPage - 2) {
            for (let i = this.props.lastPage - 4; i < this.props.currentPage; i++) {
                buttons.push(this.pageButton(i));
            }
            buttons.push(<Pagination.Item active key={this.props.currentPage}>
                {this.props.currentPage}
            </Pagination.Item>);
            for (let i = this.props.currentPage + 1; i < this.props.lastPage + 1; i++) {
                if (i <= this.props.lastPage) {
                    buttons.push(this.pageButton(i));
                }
                else {
                    buttons.push(<Pagination.Item disabled>
                        {i}
                    </Pagination.Item>);
                }
            }
            return (buttons);
        }
        else {
            for (let i = this.props.currentPage - 2; i < this.props.currentPage; i++) {
                buttons.push(this.pageButton(i));
            }
            buttons.push(<Pagination.Item active key={this.props.currentPage}>
                {this.props.currentPage}
            </Pagination.Item>);
            for (let i = this.props.currentPage + 1; i < this.props.currentPage + 3; i++) {
                if (i <= this.props.lastPage) {
                    buttons.push(this.pageButton(i));
                }
                else {
                    buttons.push(<Pagination.Item disabled>
                        {i}
                    </Pagination.Item>);
                }
            }
            return (buttons);
        }
    }

    /**
     * @summary returns an interactive Pagination.Item of page n
     */
    pageButton(n:number) {
        return (
            <Pagination.Item key={n}
                             onClick={() => this.props.changePage(n)}>
                {n}
            </Pagination.Item>
        );
    }
}

export default PageController;