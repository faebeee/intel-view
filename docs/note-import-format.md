# Note Import Format (`intel-view/notes`, v1)

A small JSON format that any tool (scanners, scripts, LLM agents, other note apps) can emit so its results become Intel View notes. Copy the JSON to the clipboard, open a project's **Canvas**, and press <kbd>Ctrl</kbd>/<kbd>Cmd</kbd>+<kbd>V</kbd>. The notes are created at the mouse position (or the centre of the canvas), linked to each other as described, and laid out as a tree.

- JSON Schema: [`note-import-format.schema.json`](./note-import-format.schema.json)
- Reference parser: [`apps/web/src/features/canvas/note-import.ts`](../apps/web/src/features/canvas/note-import.ts)

## Example

```json
{
  "format": "intel-view/notes",
  "version": 1,
  "source": "nmap 7.95",
  "notes": [
    {
      "ref": "host",
      "type": "ip",
      "title": "web01",
      "content": "10.0.0.5",
      "tags": ["recon"],
      "children": [
        { "type": "ssh", "title": "22/tcp", "version": "OpenSSH 8.9p1" },
        {
          "ref": "web",
          "type": "http",
          "title": "80/tcp",
          "version": "nginx 1.24.0",
          "children": [
            { "type": "url", "content": "http://10.0.0.5/admin" }
          ]
        }
      ]
    },
    {
      "type": "log",
      "title": "Scan log",
      "entries": ["Host up (0.0021s latency)", "998 closed ports"],
      "parents": ["host", 17]
    }
  ]
}
```

This creates five notes: the IP note, two service notes and a URL nested below it, plus a log note that is a child of both the new IP note and the already existing note `#17`.

## Document

| Field     | Type     | Required | Description |
|-----------|----------|----------|-------------|
| `format`  | string   | yes      | Always `"intel-view/notes"`. This is how Intel View recognises a paste as an import; any other clipboard content is pasted normally. |
| `version` | integer  | yes      | Format version. Currently `1`. |
| `source`  | string   | no       | Name of the producing tool. Shown in the import confirmation. |
| `notes`   | Note[]   | yes      | Top-level notes (at least one). |
| `$schema` | string   | no       | Ignored, allowed so editors can validate against the schema. |

## Note

All fields are optional. Unknown fields are rejected so typos surface early.

| Field      | Type                   | Description |
|------------|------------------------|-------------|
| `ref`      | string                 | Local identifier, unique within the document. Needed only when another note references this one in `parents`. Not stored. |
| `type`     | string                 | Note type, default `"standard"`. See [Types](#types). |
| `title`    | string                 | Note title. |
| `content`  | string                 | Markdown body. For `url` / `ip` / `email` it must be exactly one valid value of that kind. |
| `tags`     | string[]               | Free-text tags. |
| `color`    | string                 | Hex color, `#rgb` or `#rrggbb`. |
| `version`  | string                 | Software/service version (max 100 chars). Only on software/service types. |
| `entries`  | string[]               | Log entries, appended in order. Only on `type: "log"`. |
| `parents`  | (string \| integer)[]  | Additional parents. A **string** is the `ref` of a note in this document; an **integer** is the ID of a note that already exists in the target project. |
| `children` | Note[]                 | Nested notes; each becomes a child of this note (in addition to its own `parents`). |

`children` and `parents` can be mixed freely. Nesting is the simplest option for plain trees; `ref` + `parents` covers notes with several parents and links to existing notes. The relations must not form a cycle.

### Types

| Type | Meaning |
|------|---------|
| `standard` | Free markdown note. |
| `log` | Append-only log. Use `entries` for its lines. |
| `url` | `content` is a single `http(s)://` URL. |
| `ip` | `content` is a single IPv4 or IPv6 address. |
| `email` | `content` is a single email address. |
| `command` | Shell command and its output. |
| any other slug | Software/service note, e.g. `ssh`, `http`, `ftp`, `mysql`. Lowercase letters, digits and hyphens, starting with a letter, max 40 chars. May carry `version`. |

`file` notes can't be imported because they need an uploaded file.

## Import behaviour

- The whole document is validated first. If anything is wrong, nothing is created and the first errors are listed in a toast (with JSON paths like `notes[0].children[1].type`).
- Notes are then created one by one, parents before children. If the API rejects a note (e.g. an invalid IP in an `ip` note), the import stops there; notes created up to that point are kept, and the toast says how many.
- At most 500 notes per paste.
- Pasting into a text field or while a dialog is open is not intercepted.

## Guidance for producers

- Always set `format` and `version`; without them the paste is treated as normal text.
- Put the clipboard payload in the `text/plain` flavour.
- Prefer `children` for trees; use `ref`/`parents` only where needed.
- Keep `ref` values stable and readable (`"host-10.0.0.5"`) to ease debugging.
- Validate output against the JSON Schema in your tests.
- Future versions will bump `version`; v1 consumers reject other versions instead of guessing.
