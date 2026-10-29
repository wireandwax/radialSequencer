<img width="3738" height="1946" alt="RadialSeq-02" src="https://github.com/user-attachments/assets/528ab9c1-72ca-4895-80c5-62991a4206f7" />
# Radial Sequencer

A prototype 3D generative sound sequencer that transforms a radar-style interface into an interactive musical instrument.

Built with JavaScript and Canvas 2D, the sequencer uses a custom 3D projection system to create a spatial environment where targets trigger sounds as a rotating sweep passes them. Distance from the centre determines pitch zones, while vertical positioning influences note volume. Users can create rhythmic patterns, arrange targets in 3D space and manipulate the camera to explore the soundscape.

## Features

- **Radial sequencing** — A rotating sweep triggers targets as it passes their angular positions.
- **Pitch zones** — Concentric rings map distance from the centre to musical zones.
- **Generative patterns** — Create circular arrangements of 4, 8, 16 or 32 targets.
- **3D spatial interaction** — Position targets above or below the ground plane to vary note volume.
- **Interactive camera** — Rotate and zoom around the sequencer.
- **Real-time audio** — Trigger detection sounds and synchronise playback with a metronome.
- **Custom visualisation** — A minimal radar-inspired interface with colour-coded pitch zones.

## Controls

- **Space** — Start or stop the rotating sweep.
- **Z / X / C / V + click** — Create rings of 4, 8, 16 or 32 targets.
- **Shift + left-click and drag** — Adjust a target's vertical position.
- **Right-click and drag** — Rotate the camera.
- **Scroll** — Zoom in and out.
- **Command + click** — Remove an individual target.
- **Command + Option + click** — Clear targets from a radial zone.
- **Enter** — Reset all targets.

## Built With

- JavaScript
- HTML Canvas 2D
- Web Audio API *(via the audio module)*



<img width="1873" height="964" alt="RadialSeq-03" src="https://github.com/user-attachments/assets/cda577cf-45b4-49cb-ba13-e6d75e69054a" />
