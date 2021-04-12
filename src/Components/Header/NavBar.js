import React from "react";
import './header.css';

class NavBar extends React.Component {

	constructor(props) {
		super(props);

		this.state = { home: "selected" };
		this.handleClick = this.handleClick.bind(this)
	}

	updateClasses(id) {
		if (id === "docs-tab") {
			this.setState({ docs: "selected" });
		} else {
			this.setState({ docs: "" });
		}

		if (id === "corr-tab") {
			this.setState({ corr: "selected" });
		} else {
			this.setState({ corr: "" });
		}

		if (id === "ts-tab") {
			this.setState({ ts: "selected" });
		} else {
			this.setState({ ts: "" });
		}

		if (id === "dl-tab") {
			this.setState({ dl: "selected" });
		} else {
			this.setState({ dl: "" });
		}

		if (id === "vocab-tab") {
			this.setState({ vocab: "selected" });
		} else {
			this.setState({ vocab: "" });
		}
		
		if (id === "home-tab") {
			this.setState({ home: "selected" });
		} else {
			this.setState({ home: "" });
		}

		if (id === "meta-tab") {
			this.setState({ meta: "selected" });
		} else {
			this.setState({ meta: "" });
		}
	}



	handleClick(e) {
		var val = e.target.id;
		this.updateClasses(val)
		this.props.onClick(val);
	}



	render() {
		return (
			<div className="tabs">
				<ul>
					<li id="home-tab" className={this.state.home} onClick={this.handleClick} >Home Page</li>
					<li id="docs-tab" className={this.state.docs} onClick={this.handleClick}>Topic Documents</li>
					<li id="corr-tab" className={this.state.corr} onClick={this.handleClick} >Topic Correlations</li>
					<li id="ts-tab" className={this.state.ts} onClick={this.handleClick} >Time Series</li>
					<li id="meta-tab" className={this.state.meta} onClick={this.handleClick} >Metadata</li>

					<li id="dl-tab" className={this.state.dl} onClick={this.handleClick} >Downloads</li>
					<li id="vocab-tab" className={this.state.vocab} onClick={this.handleClick} >Vocabulary</li>
				</ul>
			</div>
		);
	}

}

export default NavBar;
