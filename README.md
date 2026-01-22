## themes.equicord.org

This is the repository for the ThemeLibrary website including it's API.

### Want to show where to find your theme?

Use our new badge in your README to show people where to find your theme!
<a href="https://themes.equicord.org">
<img src="https://themes.equicord.org/badge.png" alt="Description" width="125" />
</a>

```html
<a href="https://themes.equicord.org/theme/1">
  <img src="https://themes.equicord.org/badge.png" alt="Description" width="125" />
</a>
```
---

This API is used to retrieve themes used for the [Theme Library](https://github.com/Equicord/ThemeLibrary) and [this website](https://themes.equicord.org).

This website is built with React.

---

# Endpoints

> [!NOTE]
> Not all endpoints are listed here, either they're internal/admin endpoints or something else. You're free to read the source code yourself! :)

## Theme Related

Base: <https://api.themes.equicord.org/>
(you can also request via <https://themes.equicord.org/api>)

Base CDN: <https://cdn.themes.equicord.org/>

---

### `GET` **`/[theme]`**
Wants `theme` as `query`

- Returns information about a specific theme.

#### Example

```js
fetch("https://api.themes.equicord.org/Monocord")
```

#### Returns

- Content-Type: `text/css`
- Returns 200, 404 or 405

```css
/**
* @name Monocord
* @author catpurrchino
* @description Discord Design based on the Monospace font
* @version 1.0.0
* @source https://github.com/faf4a/snippets
*/

@import url("https://raw.githubusercontent.com/Faf4a/snippets/main/Monocord/main.css");
```

### `GET` **`/thumbnail/[theme]`**
Wants `theme` as `query`

- Returns thumbnail from a theme.

> [!NOTE]
> Redirects permanently to a cloudflare worker, you can directly access it via <https://cdn.themes.equicord.org/theme/{name}>

#### Example

```js
fetch("https://api.themes.equicord.org/thumbnail/Cyan")
```

#### Returns

- Content-Type: `image/png`, `image/gif` or `image/webp`
- Returns 200, 404 or 405

![preview](https://cdn.themes.equicord.org/theme/Cyan)

### `GET` **`/download/[themeId]`**
Wants `themeId` as `query`

- Returns theme content and attempts to download, also increases download count.

#### Example

```js
fetch("https://api.themes.equicord.org/thumbnail/Cyan")
```

#### Returns

- Content-Type: `text/css`
- Returns 200, 404 or 405
- 
### `GET` **`/get/[themeId]`**
Wants `themeId` as `query`

- Returns data of a theme.

#### Example

```js
fetch("https://api.themes.equicord.org/thumbnail/Cyan")
```

#### Returns

- Content-Type: `application/json`
- Returns 200, 404 or 405

```json
 {
  "id": Number,
  "name": String,
  "type": "theme" | "snippet",
  "description": String,
  "author": {
   "discord_snowflake": String | null,
   "discord_name": String | null,
   "github_name": String | null,
  },
  "tags": Array,
  "thumbnail_url": String,
  "release_date": Date,
  "last_updated?": Date,
  "guild": {
   "name": String | null,
   "invite_link": String | null,
   "snowflake": String | null,
  },
  "content": String,
  "source": String,
  "likes": Number
 }
 ```

### `GET` **`/themes`**

- Returns all available themes.

#### Example

```js
fetch("https://api.themes.equicord.org/themes")
```

#### Returns

- Content-Type: `application/json`
- Cache-Control: max-age=1200
- Returns 200 or 405

> [!NOTE]
> Content is encoded in Base64

```json
[
 {
  "id": Number,
  "name": String,
  "type": "theme" | "snippet",
  "description": String,
  "author": {
   "discord_snowflake": String | null,
   "discord_name": String | null,
   "github_name": String | null,
  },
  "tags": Array,
  "thumbnail_url": String,
  "release_date": Date,
  "last_updated?": Date,
  "guild": {
   "name": String | null,
   "invite_link": String | null,
   "snowflake": String | null,
  },
  "content": String,
  "source": String,
  "likes": Number
 }, {...}
]
```

### `GET` **`/likes/get`**

- Returns data about all liked themes.

#### Example

```js
fetch("https://api.themes.equicord.org/likes/get")
```

#### Returns

- Content-Type: `application/json`
- Returns 200 or 405
- Wants `Authorization` in `headers`

> [!NOTE]
> `hasLiked` is not included if no Authorization header is provided with valid credentials!

```js
{
  "status": 200,
  "likes": [
    {
      "themeId": Number,
      "likes": Number,
      "hasLiked": Boolean
    },
    {...}
}
```

### `POST` **`/likes/add`**
Wants `Authorization` in `headers` (unique user token, **__DO NOT PASS YOUR DISCORD ACCOUNT TOKEN__**) and `themeId` in `body`.

- Adds likes to a given theme.
- Requires to be authorized.

#### Example

```js
fetch("https://api.themes.equicord.org/likes/add", {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer API_KEY"
    },
    body: JSON.stringify({ themeId: 0 })
})
```

#### Returns

- Content-Type: `application/json`
- Returns 200, 401, 405, 409, or 500.

```js
{
  "status": 200
}
```

### `POST` **`/likes/remove`**
Wants `Authorization` in `headers` (unique user token, **__DO NOT PASS YOUR DISCORD ACCOUNT TOKEN__**) and `themeId` in `body`.

- Removes likes from a given theme.
- Requires to be authorized.

#### Example

```js
fetch("https://api.themes.equicord.org/likes/remove", {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer API_KEY"
    },
    body: JSON.stringify({ themeId: 0 })
})
```

#### Returns

- Content-Type: `application/json`
- 200 or 405

```js
{
  "status": 200
}
```

### `POST` **`/submit/theme`**
Wants `Authorization` in `headers` (unique user token, **__DO NOT PASS YOUR DISCORD ACCOUNT TOKEN__**) and `content` in `body`.

- Removes likes from a given theme.
- Requires to be authorized.
- Content **must** be encoded in Base64, content must include metadata (name, author, description), can include others otherwise the request will be rejected with 405

#### Example

```js
fetch("https://api.themes.equicord.org/submit/theme", {
    method: "POST",
    headers: {
        "Content-Type": "application/json"
        "Authorization": "Bearer API_KEY"
    },
    body: JSON.stringify({ content: "" })
})
```

#### Returns

- Content-Type: `application/json`
- 200, 400 or 405

```js
{
  "status": 200
}
```

## Auth Related

Base: <https://api.themes.equicord.org/user>

### `GET` **`/auth`**
Wants `code` as `query`

- Authenticates a user using their access token, this should be only done once. The token returned will be the "password" to your account.

Don't call the endpoint directly, it will return 401, use discord.

`https://discord.com/oauth2/authorize?client_id=1464006702125940736&response_type=code&redirect_uri=https://api.themes.equicord.org/user/auth&scope=identify`

#### Example

```js
fetch("https://api.themes.equicord.org/user/auth?code=ACCESS_TOKEN")
```

#### Returns

- Content-Type: `application/json`
- 200, 400 or 405

```js
{
  "status": 200,
  "token": "UNIQUE_USER_TOKEN" // hashed token
}
```

### `POST` **`/findUserByToken`**
Wants `Authorization` in `headers` (unique user token, **__DO NOT PASS YOUR DISCORD ACCOUNT TOKEN__**).

- Returns the user data based on the unique user token.

#### Example

```js
fetch("https://api.themes.equicord.org/user/findUserByToken", {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer API_KEY"
    }
})
```

#### Returns

- Content-Type: `application/json`
- 200, 401 or 405

```js
{
  "status": 200,
  "user": {
    "id": User["id"]
    "createdAt": Date
  }
}
```

### `DELETE` **`/revoke`**
Wants `Authorization` in `headers` (unique user token, **__DO NOT PASS YOUR DISCORD ACCOUNT TOKEN__**) and `userId` in `body`.

- Deletes user data associated with the token.

#### Example

```js
fetch("https://api.themes.equicord.org/user/revoke", {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer API_KEY"
    },
    body: JSON.stringify({ userId: "" })
})
```

#### Returns

- Content-Type: `application/json`
- 200, 401 or 405

```js
{
  "status": 200
}
```
