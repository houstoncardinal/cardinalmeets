# Instant, shareable meetings

## Goal
Make Cardinal Meets feel as simple as opening a link: hosts can start an instant meeting, copy one clear invite link or code, and guests can join from any modern phone, tablet, or computer with camera and microphone controls.

## What I’ll build
- Replace the homepage’s locally generated meeting IDs with real meeting creation, including a clear sign-in handoff for hosts.
- Make the join field accept a meeting code or full invite link, normalize pasted values, and show helpful errors for invalid links.
- Add a focused guest entry flow: invitees opening a valid link choose a display name, preview camera/mic, select devices, and join without navigating through the dashboard.
- Upgrade the in-meeting header with a prominent “Invite people” action that copies the full link and exposes the meeting code.
- Improve the meeting room layout and controls for narrow mobile screens without removing advanced desktop tools.
- Add meeting lookup/join access rules needed for valid invite links while keeping host-only management protected.
- Add clear states for invalid, ended, unavailable, permission-denied, and disconnected meetings.
- Verify the complete flow in the browser: create meeting, copy link, open as a second participant, preview devices, join, and exercise core controls.

## Technical details
- Keep hosts authenticated; use a limited guest session for invite-link participants, scoped to the selected meeting.
- Use database-generated unique meeting codes rather than client-only random links.
- Preserve WebRTC media and realtime signaling, while tightening cleanup, duplicate connection handling, and share-link behavior.
- Keep existing security, waiting-room, recording, whiteboard, chat, and moderation features; guest permissions remain participant-only.

## Completion criteria
- A host can create an instant meeting in one clear action.
- A copied invite link opens a valid pre-join experience on desktop and mobile.
- A guest can enter a name, choose camera/mic settings, and join with no dashboard detour.
- Invalid links fail safely and explain what to do next.
- Core camera, microphone, screen sharing, copy invite, and leave controls work in browser testing.
