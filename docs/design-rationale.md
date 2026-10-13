# Design Rationale

## Design Read

Reading this as: a minimal text messenger for a person sending and receiving messages through GREEN-API, using the user-requested MAX web client as a structural reference. The authenticated conversation view could not be inspected, so the implementation uses the supplied reference description without reconstructing hidden screens.

**Dials:** ENERGY 1 / RHYTHM 1 / MOTION 1.

## Decisions

- **Layout:** a chat list beside one active conversation mirrors the real task flow; on narrow screens the active conversation replaces the list to preserve readable message width.
- **Palette:** cool, low-chroma surfaces keep messages legible; one blue accent marks primary actions and distinguishes outgoing bubbles. Dark mode reuses the same semantic roles instead of introducing another palette.
- **Typography:** local Manrope Variable is used for clear Cyrillic text at compact chat sizes without a remote font request.
- **Icons:** plus creates a chat, send transmits a message, moon/sun switch the theme, and logout disconnects. Each icon is paired with an accessible action name.
- **Shape:** modest 7–12 px corner radii separate buttons, dialogs, and message bubbles without turning every control into a capsule.
- **Motion:** only short color transitions communicate hover/focus; no decorative movement competes with message reading.
- **Identity:** the MAX wordmark remains text, while the recurring speech-bubble shape directly identifies the messaging task without inventing profile imagery.
- **States:** the UI distinguishes no conversation, empty message history, sending, accepted, failed, polling retry, and disconnected states because each changes what the user can do next.
- **Theme:** the toggle exists because the chat has no product constraint requiring a fixed light or dark theme; both palettes use the same controls and layout.
