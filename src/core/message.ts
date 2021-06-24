/*
a base type for all messages in this app.
 */
export interface Message {
    target: string
}

export interface StatusMessage extends Message {
    target: "status"
    message: string
    ackRequired: boolean,
    timeout: number
}

export interface StatusMessageAck extends Message {
    target: "statusAck"
}

/**
 this function displays a status message at the top of the page. it is safe
 to be called anywhere in the app, although there is no way for the function
 to tell if the message is indeed displayed. please do not display any message
 longer than a few (3-4) words so that the display is not overflowed.

 because this function invokes window.postMessage event and it's handler, the
 execution is not synchronous and it may take a while (1-2 ms) for the message
 to actually appear.

 @param message - the message to display
 @param timeout - optional. if greater than 0, the message will be cleared after timeout ms. default to 0
 @param callback - optional. can be either a function or the string "promise". if set, the callback will be called (or,
 in the case of a promise, resolved) when the message is indeed displayed.
 */
export function displayMessage(message: string): void
export function displayMessage(message: string, timeout: number): void
export function displayMessage<T extends "promise" | (() => void)>(message: string, timeout: number, callback: T): T extends "promise" ? Promise<void> : void
export function displayMessage(message: string, timeout: number = 0, callback?: "promise" | (() => void)): Promise<void> | void {
    let promise: Promise<void> | undefined;
    let time=new Date()
    if (typeof callback === "function") {
        let listener = (e: MessageEvent<Message>) => {
            if (e.origin === window.location.origin && e.data.target === "statusAck") {
                // console.log("Status message update took",new Date().getTime()-time.getTime(),"ms")
                callback()
                window.removeEventListener("message", listener)
            }
        }
        window.addEventListener("message", listener)
    } else if (callback === "promise") {
        promise = new Promise<void>((resolve) => {
            let listener = (e: MessageEvent<Message>) => {
                if (e.origin === window.location.origin && e.data.target === "statusAck") {
                    // console.log("Status message update took",new Date().getTime()-time.getTime(),"ms")
                    resolve()
                    window.removeEventListener("message", listener)
                }
            }
            window.addEventListener("message", listener)
        })
    }
    window.postMessage({
        target: "status",
        ackRequired: callback !== undefined,
        timeout,
        message
    } as StatusMessage, window.location.origin)
    if (callback === "promise") {
        return promise
    }
}

// a convenient wrapper around display message
export function clearMessage() {
    displayMessage("")
}
