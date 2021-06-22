/*
a skeleton type for all messages in this app. while the only possible target
right now is status, it is reserved for possible future extensions
 */
export interface Message {
    target: string
}

export interface StatusMessage extends Message {
    target: "status"
    message: string
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
 @param timeout - if greater than 0, the message will be cleared after timeout ms. default to 0
 */
export function displayMessage(message: string, timeout: number = 0) {
    window.postMessage({
        target: "status",
        message
    }, window.location.origin)
    if (timeout > 0) {
        setTimeout(clearMessage, timeout)
    }
}

// a convenient wrapper around display message
export function clearMessage() {
    displayMessage("")
}
