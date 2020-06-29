import React from "react";
import Uploader from './Uploader';

class HomePage extends React.Component {
    render() {
        return (
            <div id="home-page" className="page">
                <h3>Welcome to jsLDA!</h3>
                <Uploader 
                    onDocumentFileChange = {this.props.onDocumentFileChange}
                    onStopwordFileChange = {this.props.onStopwordFileChange}
                    onFileUpload = {this.props.onFileUpload}
                    modelIsRunning = {this.props.modelIsRunning}
                />
                <p>Info stuff here. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed pharetra rutrum magna, ac egestas lorem convallis at. In hac habitasse platea dictumst. Morbi id eros pulvinar, varius ipsum nec, porta lorem. Aenean eu rhoncus tellus, sed elementum dui. Curabitur maximus ornare vulputate. Vestibulum imperdiet consectetur consequat. Phasellus venenatis, erat vel semper interdum, mauris augue volutpat dui, et consequat urna tortor ultricies nisl. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed pharetra rutrum magna, ac egestas lorem convallis at. In hac habitasse platea dictumst. Morbi id eros pulvinar, varius ipsum nec, porta lorem. Aenean eu rhoncus tellus, sed elementum dui. Curabitur maximus ornare vulputate. Vestibulum imperdiet consectetur consequat. Phasellus venenatis, erat vel semper interdum, mauris augue volutpat dui, et consequat urna tortor ultricies nisl.</p>
                
            </div>
        );
    }
}

export default HomePage;