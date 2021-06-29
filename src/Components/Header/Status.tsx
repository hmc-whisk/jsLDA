import React, {Component, CSSProperties} from "react";
import {Message, StatusMessage, StatusMessageAck} from "core";

interface StatusDisplayProps {
}

interface StatusDisplayState {
    message: string,
}

/*
A class that holds the message displayed on the status bar.
 */
export class StatusDisplay extends Component<StatusDisplayProps, StatusDisplayState> {

    messageHandler: (event: MessageEvent) => void
    ackRequired: boolean
    messageCount: number

    constructor(props: StatusDisplayProps) {
        super(props);
        this.state = {
            message: ""
        }
        this.ackRequired = false
        this.messageCount = 0
        this.messageHandler = this.onMessage.bind(this)
    }

    componentDidUpdate(_: any, prev: any) {
        if (this.ackRequired) {
            this.ackRequired = false
            window.postMessage(
                {target: "statusAck"} as StatusMessageAck,
                window.location.origin
            )
        }
    }

    componentDidMount() {
        window.addEventListener("message", this.messageHandler)
    }

    componentWillUnmount() {
        // we don't want zombie event listeners attached to global so we
        // remove them once the object is removed from dom
        window.removeEventListener("message", this.messageHandler)
    }

    // a hacky TS function for type narrowing. it cannot be inlined even though
    // it is only one line. see https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates
    static checkTarget(e: MessageEvent<Message>): e is MessageEvent<StatusMessage> {
        return e.data.target === "status"
    }

    onMessage(event: MessageEvent<Message>) {
        if (event.origin !== window.location.origin || !StatusDisplay.checkTarget(event)) return;
        let message: StatusMessage = event.data;
        if (this.ackRequired) {
            console.warn("Multiple status messages posted before the status display updated. A race condition happened somewhere.")
            console.warn(`Previous message (not displayed): ${this.state.message}`)
            console.warn(`Newly posted message: ${message.message}`)
        }
        this.ackRequired = message.ackRequired || this.ackRequired
        // in case of a race condition we don't want to lock the listener waiting forever
        // ackRequired has to be set before setState or other components might deadlock
        this.setState({
            message: message.message,
        })
        this.messageCount++;
        if (event.data.timeout) {
            setTimeout(this.onTimeout.bind(this), message.timeout, this.messageCount)
        }
    }

    /*
    a function to clear a message after a timeout. however, if another message
    is already displayed over it, nothing happens.
     */
    onTimeout(count: number) {
        if (this.messageCount === count) {
            this.setState({message: ""})
        }
        this.messageCount++;
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
