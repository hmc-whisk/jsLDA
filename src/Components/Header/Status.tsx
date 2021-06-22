import {Component, CSSProperties} from "react";
import {Message, StatusMessage} from "core";

interface StatusDisplayProps {
}

interface StatusDisplayState {
    message: string
}

/*
A class that holds the message displayed on the status bar.
 */
export class StatusDisplay extends Component<StatusDisplayProps, StatusDisplayState> {

    messageHandler: (event: MessageEvent) => void

    constructor(props: StatusDisplayProps) {
        super(props);
        this.state = {
            message: ""
        }
        this.messageHandler = this.onMessage.bind(this)
    }

    componentDidMount() {
        window.addEventListener("message", this.messageHandler)
        console.log("listener added")
    }

    componentWillUnmount() {
        // we don't want zombie event listeners attached to global so we
        // remove them once the object is removed from dom
        window.removeEventListener("message", this.messageHandler)
        console.log("listener removed")
    }

    // a hacky TS function for type narrowing. it cannot be inlined even though
    // it is only one line. see https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates
    static checkTarget(e: MessageEvent<Message>): e is MessageEvent<StatusMessage> {
        return e.data.target === "status"
    }

    onMessage(event: MessageEvent<Message>) {
        if (event.origin !== window.location.origin || !StatusDisplay.checkTarget(event)) return;
        this.setState({message: event.data.message})
    }

    render() {
        return <div style={
            {
                "fontFamily": '"Courier New", Courier,monospace',
                "overflowX": "hidden",
                "overflowY": "clip"
            } as CSSProperties}>
            {this.state.message}
        </div>
    }
}
