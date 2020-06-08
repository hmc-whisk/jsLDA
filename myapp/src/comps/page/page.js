import React from "react";
import Nav from "./navButtons"
import TopicPage from "./topicPage"

class Page extends React.Component {

    render() {
        return (
            <div className="tabwrapper">
                <Nav />
                <TopicPage />
            </div>
        );
    }

}

export default Page;
