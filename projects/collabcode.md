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
Pairing on code remotely almost always collapses into one of two bad options: screen-share, where only one person's cursor actually moves, or a live-share plugin tied to a specific editor everyone has to install. CollabCode is the smallest possible version of "a room where everyone types into the same file" - open in any browser, joined with a link, gone the moment everyone leaves.

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

## What it does

- Create or paste in a room link, pick a username, and land in a shared CodeMirror editor - every keystroke broadcasts live to everyone else in the room.
- Presence: a running list of who's currently in the room, updated the moment someone joins or leaves.
- Nothing to install, nothing to sign up for, and no history to manage - a room is just a live document shared over a link.

## System design

CollabCode is a single shared document, not a multi-file IDE - the scope is deliberate, closer to a live scratch pad for code than a development environment. There's no persisted document on the server at all: when someone joins a room already in progress, the current content is reconstructed on the spot from whichever existing participant answers first, rather than read from a canonical copy. That's a fine trade for a quick pairing session, but it also means a room's content really does vanish the instant the last tab closes.

Client and server share one small module that defines the realtime event vocabulary once, so the two sides can't quietly drift into using different names for the same event. Feedback loops are the classic bug in a broadcast editor like this - client A types, the server relays it to client B, B's editor applies it programmatically - and CollabCode avoids re-broadcasting that applied change back out by distinguishing a real keystroke from a programmatic sync update at the editor level.

Conflict handling is intentionally simple: last-write-wins over the full document, not an operational-transform or CRDT layer. That's the right trade for a room you open for twenty minutes to debug something together with someone - not for serious concurrent multi-author editing, which would be the first thing to replace if this grew into a bigger product.

## Infrastructure

One Node process does both jobs in production: an Express server serves the built React client as static files, and the same process runs the Socket.IO realtime layer - no separate API host, no reverse proxy to configure before it works. Everything lives in memory; there's no database, so the entire infrastructure footprint is "keep one process running."

## What's next

- The editor is still on CodeMirror 5 with only JavaScript syntax highlighting wired up - other languages work as plain text without highlighting.

## Running it

Live demo linked above. `npm start` builds the React client and starts the combined Express + Socket.IO process on port 5000.
