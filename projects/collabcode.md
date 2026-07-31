---
title: "CollabCode"
title_accent: "Code"
kicker: "Project · Developer Tool"
tagline: "A real-time collaborative code editor where a shared room turns into a live pair-programming session for any number of developers - no signup, no merge step, just a link."
description: "How CollabCode syncs a shared code buffer across every connected browser in real time using Socket.IO rooms and CodeMirror, with no database and no operational transform."
role: "Solo builder"
status: "Open source"
type: "Real-time web app"
tags: "Real-time, Full-Stack"
date: "2025-01-11"
image: "/image/optimized/project-collabcode.webp"
repo: "https://github.com/manish-9245/collabcode.io"
links: "Live demo|https://collabcode-9axi.onrender.com/"
tech: "Frontend|React 18, CodeMirror 5, Tailwind CSS, react-router-dom; Backend|Express, Socket.IO, Node.js, uuid"
application_category: "DeveloperApplication"
---
Pairing on code remotely almost always collapses into one of two bad options: screen-share, where only one person's cursor actually moves, or a live-share plugin tied to a specific editor everyone has to install. I wanted the smallest possible version of "a room where everyone types into the same file" - open in any browser, joined with a link, gone the moment everyone leaves.

## Architecture

```mermaid
flowchart TD

subgraph group_client["Browser client"]
  node_public["Browser document &amp; metadata<br/>static assets<br/>[index.html]"]
  node_bootstrap["React bootstrap<br/>client entry<br/>[index.js]"]
  node_app["Application shell &amp; routes<br/>React routing<br/>[App.js]"]
  node_home["Room entry<br/>page<br/>[Home.js]"]
  node_editor_page["Collaborative editor<br/>page orchestrator<br/>[EditorPage.js]"]
  node_editor["CodeMirror editor<br/>editor adapter<br/>[Editor.js]"]
  node_client_list["Participant list<br/>UI component<br/>[Client.js]"]
  node_socket_client{{"Socket client<br/>Socket.IO boundary<br/>[socket.js]"}}
  node_actions["Event contract<br/>shared event names<br/>[Actions.js]"]
end

subgraph group_server["Node service"]
  node_server_entry{{"Express &amp; Socket.IO server<br/>runtime entry<br/>[server.js]"}}
  node_room_relay["Room relay<br/>in-memory session layer<br/>[server.js]"]
  node_production_build["Production client build<br/>static application<br/>[server.js]"]
end

node_dependencies["Runtime dependencies<br/>package manifest<br/>[package.json]"]

node_public -->|"loads"| node_bootstrap
node_bootstrap -->|"mounts"| node_app
node_app -->|"room-entry route"| node_home
node_app -->|"room editor route"| node_editor_page
node_home -->|"navigates with room ID"| node_editor_page
node_editor_page -->|"composes"| node_editor
node_editor_page -->|"renders presence"| node_client_list
node_editor -->|"local code changes"| node_editor_page
node_editor_page -->|"uses"| node_socket_client
node_actions -.->|"event names"| node_editor_page
node_actions -.->|"event names"| node_server_entry
node_socket_client -->|"Socket.IO connection"| node_server_entry
node_server_entry -->|"delegates room events"| node_room_relay
node_room_relay -->|"presence and code broadcasts"| node_socket_client
node_server_entry -->|"serves"| node_production_build
node_dependencies -.->|"provides client runtime"| node_bootstrap
node_dependencies -.->|"provides server runtime"| node_server_entry

click node_public "https://github.com/manish-9245/collabcode.io/blob/main/public/index.html"
click node_bootstrap "https://github.com/manish-9245/collabcode.io/blob/main/src/index.js"
click node_app "https://github.com/manish-9245/collabcode.io/blob/main/src/App.js"
click node_home "https://github.com/manish-9245/collabcode.io/blob/main/src/pages/Home.js"
click node_editor_page "https://github.com/manish-9245/collabcode.io/blob/main/src/pages/EditorPage.js"
click node_editor "https://github.com/manish-9245/collabcode.io/blob/main/src/components/Editor.js"
click node_client_list "https://github.com/manish-9245/collabcode.io/blob/main/src/components/Client.js"
click node_socket_client "https://github.com/manish-9245/collabcode.io/blob/main/src/socket.js"
click node_actions "https://github.com/manish-9245/collabcode.io/blob/main/src/Actions.js"
click node_server_entry "https://github.com/manish-9245/collabcode.io/blob/main/server.js"
click node_room_relay "https://github.com/manish-9245/collabcode.io/blob/main/server.js"
click node_production_build "https://github.com/manish-9245/collabcode.io/blob/main/server.js"
click node_dependencies "https://github.com/manish-9245/collabcode.io/blob/main/package.json"

classDef toneNeutral fill:#f8fafc,stroke:#334155,stroke-width:1.5px,color:#0f172a
classDef toneBlue fill:#dbeafe,stroke:#2563eb,stroke-width:1.5px,color:#172554
classDef toneAmber fill:#fef3c7,stroke:#d97706,stroke-width:1.5px,color:#78350f
classDef toneMint fill:#dcfce7,stroke:#16a34a,stroke-width:1.5px,color:#14532d
classDef toneRose fill:#ffe4e6,stroke:#e11d48,stroke-width:1.5px,color:#881337
classDef toneIndigo fill:#e0e7ff,stroke:#4f46e5,stroke-width:1.5px,color:#312e81
classDef toneTeal fill:#ccfbf1,stroke:#0f766e,stroke-width:1.5px,color:#134e4a
class node_public,node_bootstrap,node_app,node_home,node_editor_page,node_editor,node_client_list,node_socket_client,node_actions toneBlue
class node_server_entry,node_room_relay,node_production_build toneAmber
class node_dependencies toneNeutral
```

Boxes are clickable and jump straight to the real source file on GitHub.

## What it actually is

CollabCode is a single-document editor, not a multi-file IDE. You land on a home screen, create a room (a `uuid.v4()` string) or paste one in, pick a username, and get dropped into `/editor/:roomId`. Every keystroke in that room's CodeMirror instance is broadcast over Socket.IO to everyone else connected - it's closer to a shared Etherpad for code than a real development environment, and that scope is deliberate. There's no file tree, no language server, no persistence. The document lives entirely in memory, split across whichever browser tabs are currently open.

## The room protocol

The server and client share one small module, `src/Actions.js`, that defines the event vocabulary: `JOIN`, `JOINED`, `DISCONNECTED`, `CODE_CHANGE`, `SYNC_CODE`, `LEAVE`. Importing the same constants on both ends means the socket "API" is defined exactly once instead of drifting between two copies of a string.

The interesting part is how a newcomer catches up to a room already in progress. There's no persisted document on the server - only the constant `userSocketMap` mapping `socket.id → username`. So when someone joins:

1. The server does `socket.join(roomId)`, then loops over every existing client in that room and emits `JOINED` to each of them (telling the room "someone new arrived") *and* to the new socket itself (telling it who's already there).
2. The new client's `EditorPage` component, on receiving its own `JOINED` event, immediately emits `SYNC_CODE` back to the server with whatever the *most recent* editor content is on any existing client's `codeRef`.
3. The server just re-broadcasts that as a `CODE_CHANGE` targeted at the one new socket.

In other words, the "document" is reconstructed on demand from whichever peer happens to answer first - there's no canonical copy anywhere, which is a fine trade for a scratch pad but means the room's content really can vanish the instant the last tab closes.

## Avoiding the echo loop

The trickiest bug in an app like this is the feedback loop: client A types, server broadcasts to client B, client B's editor calls `setValue()` to apply it, and if that update naively re-fires the "user typed something" handler, B immediately re-broadcasts A's own change back into the room. CodeMirror actually gives you a clean way out of this - every change event carries an `origin`, and a programmatic `setValue()` call is tagged `"setValue"` while real typing isn't:

```js
// src/components/Editor.js
editorRef.current.on('change', (instance, changes) => {
    const { origin } = changes;
    const code = instance.getValue();
    onCodeChange(code);
    if (origin !== 'setValue') {
        socketRef.current.emit(ACTIONS.CODE_CHANGE, { roomId, code });
    }
});
```

That one `if` is the entire safeguard against an infinite re-broadcast loop, and it's a good example of a library exposing exactly the metadata you need instead of forcing you to diff state yourself.

## What it deliberately doesn't do

There's no conflict resolution. This is last-write-wins over a full-document broadcast, not an operational-transform or CRDT layer - if two people edit the same line in the same instant, whoever's `CODE_CHANGE` event lands last wins, and the other person's keystroke is silently gone. For a quick "let's debug this together" session that's a fair trade against the complexity of a real OT engine; for anything resembling serious multi-author editing it's the first thing I'd replace.

The editor is also still CodeMirror 5, and only the JavaScript mode is loaded - so pasting Python or Go works fine as plain text, but you lose syntax highlighting outside JS. It's a legacy choice at this point (CodeMirror 6 or Monaco would be the modern pick), but it's also proof the simplest tool that solves the actual problem - broadcasting a text buffer - doesn't need to be the newest one.

## Running it

The server (`server.js`) is intentionally boring: one Express + `http` server wrapped in a Socket.IO `Server`, serving the built React app as static files with a catch-all route back to `index.html`. `npm start` runs the CRA build and then starts that same process on port 5000, so in production it's a single Node process doing both jobs - no separate API host, no reverse proxy config to get right before it works.
