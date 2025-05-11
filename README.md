> [See Node Onfleet Package](https://github.com/onfleet/node-onfleet/)

Issues this Fork is attempting to resolve:

-   The Onfleet constructor takes bottleneckOptions, but never sets them on the rate limiter.
-   The bottleneckOptions are never validated.
-   Rate limiter is being passed a parameter "waitUponDepletion" which is not a valid Bottleneck parameter.
-   Errors being made with "new ErrorType" when all "ErrorType" are functions, not classes, which leads to the thrown error actually being about how "ErrorType" is not a constructor rather than the intended error.
-   Rate limiter reservoir never gets refreshed if hitting the rate limit exactly, causing all requests to wait forever until library user's the application is restarted.
    -   Actually hitting Onfleet's rate limit is an error response which causes the method to throw. Given a function that loops, making request calls and only try/catches the entire loop, the throwing of an error will stop the requests from being added to the limiter such that the limiter's reservoir has a high chance of getting depleted when the queue is empty, which does not trigger a reserver reset due to the empty conditional in the depleted event handler.
-   Having the reservoir update after each request doesn't work properly.
    -   If multiple requests are made, the first one to come back will increase the reservoir, allowing more requests while the subsequent requests are still pending.
