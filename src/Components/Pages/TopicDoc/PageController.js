import React from 'react';
import Pagination from 'react-bootstrap/Pagination';
import './topicDoc.css';

/**
 * @summary a class for changing between pages
 * @requires
 *  @prop {Number} currentPage
 *  @prop {Number} lastPage
 *  @prop {Function(Number)} changePage
 */
class PageController extends React.Component {
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
        if (this.props.currentPage > 3) {
            return (
                [this.pageButton(1),
                    <Pagination.Ellipsis key="firstEllipsis"/>]
            );
        } else if (this.props.currentPage > 2) {
            return (
                this.pageButton(1)
            );
        }
        return null;
    }

    /**
     * @summary Dynamic buttons letting you skip to last page
     */
    get lastPageButtons() {
        if (this.props.currentPage < this.props.lastPage - 2) {
            return (
                [<Pagination.Ellipsis key="lastEllipsis"/>,
                    this.pageButton(this.props.lastPage)]
            );
        } else if (this.props.currentPage < this.props.lastPage - 1) {
            return (
                this.pageButton(this.props.lastPage)
            );
        }
        return null;
    }

    /**
     * @summary Dynamic buttons letting you go to next and previous page
     */
    get currentPageButtons() {
        if (this.props.currentPage === 1) {
            return (
                [<Pagination.Item active key={this.props.currentPage}>
                    {this.props.currentPage}
                </Pagination.Item>,
                    this.pageButton(this.props.currentPage + 1)]
            );
        } else if (this.props.currentPage === this.props.lastPage) {
            return (
                [this.pageButton(this.props.currentPage - 1),
                    <Pagination.Item active key={this.props.currentPage}>
                        {this.props.currentPage}
                    </Pagination.Item>]
            );
        }
        return (
            [this.pageButton(this.props.currentPage - 1),
                <Pagination.Item active key={this.props.currentPage}>
                    {this.props.currentPage}
                </Pagination.Item>,
                this.pageButton(this.props.currentPage + 1)]
        );
    }

    /**
     * @summary returns an interactive Pagination.Item of page n
     */
    pageButton(n) {
        return (
            <Pagination.Item key={n}
                             onClick={() => this.props.changePage(n)}>
                {n}
            </Pagination.Item>
        );
    }
}

export default PageController;
