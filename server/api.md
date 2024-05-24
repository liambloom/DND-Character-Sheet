# DND Character Sheet Server API

This is the documentation for the server and API of this project, which is available at [dnd.liambloom.dev](https://dnd.liambloom.dev). 

## Static UI

Certain pages are static, under the `ui` router in express

### GET /
Returns [/views/index.html](/views/index.html) with the `200` status code. Described in [/server/ui.mjs](/server/ui.mjs).

### GET /favicon.ico
Returns [/static/img/favicon/favicon.ico](/static/img/favicon/favicon.ico) with the `200` status code. Described in [/server/ui.mjs](/server/ui.mjs).

### GET /static/<...>
Attempts to return the file described by the url pathname. Described in [/server/ui.mjs](/server/ui.mjs).
##### Returns
- `200` - Successfully returns the file.
- `404` - No such file exists.

### GET /my-c/
Redirects using the `303` status code. Described in [/server/characterApi.mjs](/server/characterApi.mjs).
- If the user is logged in, they are redirected to `/<username>/c/`. 
- If they are not logged in, they are redirected to `/login`

### GET /&lt;username>/c/
Attempts to list all characters belonging to the user whose username is in the pathname. Currently only succeeds if you are logged in 
as that user. Described in [/server/characterApi.mjs](/server/characterApi.mjs).
##### Returns
- `200` - If you are logged in as the correct user, returns the page [/views/characterList.html](/views/characterList.html).
- `303` - If you are not logged in, redirects to the login page, specifically `/login?returnTo=<username>`.
- `403` - If you are logged in as a different user, returns with no body content.

### GET /&lt;username>/c/&lt;character>
Returns the character viewing page if you have access to the character and the character exists. Described in [/server/characterApi.mjs](/server/characterApi.mjs).
##### Returns
- `200` - The character exists and you have access to it, returns [/views/character.html](/views/character.html).
- `303` - The character exists but you are not logged in an the character's link sharing is set to `none`, redirects you to `/login?returnTo=<this page>`
- `403` - The character exists and you are logged in, but you do not have access to it. Returns no content.
- `404` - The character does not exist. Returns [/views/404.html](/views/404.html).

### GET /login
Returns the login page, or redirects you if you are already logged in. Described in [/server/userApi.mjs](/server/userApi.mjs).
##### Returns
- `200` - If you are not logged in, returns [/views/login.html](/views/login.html).
- `303` - If you are logged in, redirects you. If the `returnTo` search parameter is defined, you are redirected to its value. If it is not defined, you
are redirected to `<username>/c/`

### GET /signup
Returns the signup page, or redirects you if you are already logged in. Described in [/server/userApi.mjs](/server/userApi.mjs).
##### Returns
- `200` - If you are not logged in, returns [/views/signup.html](/views/signup.html).
- `303` - If you are logged in, redirects you. If the `returnTo` search parameter is defined, you are redirected to its value. If it is not defined, you
are redirected to `<username>/c/`

## User API
Various api calls related to the user. Uses the `userApi` router in express. Described in [/server/userApi.mjs](/server/userApi.mjs).

### POST /new-user
Attempts to create a new user. On a client failure (status codes `400`-`499`), returns a JSON object with optional string properties `username`, `displayName`, `email`, and `password` that
describe, in a human readable format the error that occurred with each property of the user.
##### Request Body
The request body should be a JSON with the following format:
```ts
{
    username: string, // must follow /[A-Za-z0-9_\-.]{1,50}/ and a user may not exist with that name
    displayName: string, // must be between 1 and 80 characters long (inclusive)
    email: string, // must be a valid email containing no more than 50 characters
    password: string // must match /[\x21-\x7e]{1,50}/ (i.e. every character must be an ASCII character that is not a control character)
}
```