import React from "react";

class NavBar extends React.Component {

	constructor(props) {
		super(props);

		this.state = { docs: "selected" };
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
					<li id="docs-tab" className={this.state.docs} onClick={this.handleClick}>Topic Documents</li>
					<li id="corr-tab" className={this.state.corr} onClick={this.handleClick} >Topic Correlations</li>
					<li id="ts-tab" className={this.state.ts} onClick={this.handleClick} >Time Series</li>

					<li id="dl-tab" className={this.state.dl} onClick={this.handleClick} >Downloads</li>
					<li id="vocab-tab" className={this.state.vocab} onClick={this.handleClick} >Vocabulary</li>
				</ul>
			</div>
		);
	}

}

export default NavBar;
