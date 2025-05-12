Trellus's Implementation of Onfleet's Node Package

Motivation

-   Fixing the rate limiter and other issues found, described below
-   Migrating to using typescript and exporting all types to avoid dependence on @types package

Issues in the Original Package:

> [See Node Onfleet Package](https://github.com/onfleet/node-onfleet/)

-   The Onfleet constructor takes bottleneckOptions, but never sets them on the rate limiter.
-   The bottleneckOptions are never validated.
-   Rate limiter is being passed a parameter "waitUponDepletion" which is not a valid Bottleneck parameter.
-   Errors being made with "new ErrorType" when all "ErrorType" are functions, not classes, which leads to the thrown error actually being about how "ErrorType" is not a constructor rather than the intended error.
-   Rate limiter reservoir never gets refreshed if hitting the rate limit exactly, causing all requests to wait forever until library user's the application is restarted.
    -   Actually hitting the rate limit is an error response which causes the method to throw. Given a function that makes request calls and only try/catches the entire loop, the throwing of an error will stop the requests from being added to the limiter, such that the limiter's reservoir has a high chance of getting depleted when the queue is empty. This does not trigger a reserver reset due to the empty conditional in the depleted event handler.
-   Having the reservoir update after each request doesn't work properly.
    -   If multiple requests are made, the first one to come back will increase the reservoir, allowing more requests while the subsequent requests are still pending.

Improvements This Package Makes:

-   Rate limiter now functions as expected
-   Rate limiter options are simplified to maxConcurrent and minTime, and are now validated and properly set
-   Significantly more tests surrounding rate limiting
-   Testing migrated to Vitest from Chai/Mocha
-   Typescript migration
-   Resources properly typed, each exports relevant types
-   Updated existing resources to align with the latest Postman collection and API docs as of May 2025
    -   Adds missing workers.getTasks
    -   Fixes wrong type on workers.setSchedule
    -   Adds missing recipients.findByName and .findByPhone
-   Added Route Plan resource, basic tests included
-   Added Route Optimization resource, basic tests included
-   Fix issue with custom error creation
-   Lots of documentation via JSDoc / comments
