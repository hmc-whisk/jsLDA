import React, {SyntheticEvent} from "react";
import './header.css';

interface NavBarProps {
    onClick: (tabID: string) => void
}

interface NavBarState {
    selected: string
}

export class NavBar extends React.Component<NavBarProps, NavBarState> {

    constructor(props:NavBarProps) {
        super(props);

        this.state = {selected: "home-tab"};
    }

    handleClick(e: SyntheticEvent<HTMLLIElement>) {
        let val = (e.target as HTMLLIElement).id;
        this.setState({selected: val})
        this.props.onClick(val);
    }

    checkIdSelected(id: string) {
        return this.state.selected === id ? "selected" : ""
    }

    static tabs = [
        ['home-tab', 'Home Page'],
        ['docs-tab', 'Topic Documents'],
        // ['corr-tab', 'Topic Correlations'],
        ['ts-tab', 'Time Series'],
        ['meta-tab', 'Metadata'],
        ['to-tab', 'Topic Overview'],
        // ['visual-tab', 'Visualization'],
        // ['dl-tab', 'Downloads'],
        ['import-export-tab', 'Import & Export'],
        ['vocab-tab', 'Vocabulary'],
    ]

    render() {
        return (
            <div className="tabs">
                <ul>
                    {
                        NavBar.tabs.map(v =>
                            <li id={v[0]} className={this.checkIdSelected(v[0])} onClick={this.handleClick.bind(this)}
                                key={v[0]}>{v[1]}</li>
                        )
                    }
                </ul>
            </div>
        );
    }
}

export default NavBar;
