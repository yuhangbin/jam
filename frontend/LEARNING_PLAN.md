# Frontend Learning Plan

This guide will help you understand and maintain the Jam frontend codebase. You have basic HTML/CSS/JS knowledge, so this plan builds on that foundation.

---

## 📚 Prerequisites You Already Have
- HTML, CSS, JavaScript basics

## 🎯 Learning Roadmap

### Phase 1: Core Technologies (1-2 weeks)

#### 1.1 TypeScript Basics
The project uses TypeScript instead of plain JavaScript.

**What to learn:**
- Type annotations (`string`, `number`, `boolean`, `Array<T>`)
- Interfaces and Types (see `src/types/index.ts`)
- Generic types like `useState<T>`

**Resources:**
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- Practice by reading `src/types/index.ts`

#### 1.2 React Fundamentals
This is a React application, the core UI library.

**Key concepts:**
- **Components** - Reusable UI pieces (`.tsx` files)
- **JSX** - HTML-like syntax in JavaScript
- **Props** - Passing data to components
- **State** - Component internal data using `useState`
- **Effects** - Side effects using `useEffect`

**Files to study:**
- `src/main.tsx` - Entry point
- `src/App.tsx` - Main application component
- `src/components/TrackCard.tsx` - Simple component example

**Resources:**
- [React Official Tutorial](https://react.dev/learn)

---

### Phase 2: Project Architecture (1 week)

#### 2.1 Project Structure

```
frontend/
├── src/
│   ├── main.tsx          # Entry point
│   ├── App.tsx           # Main component (565 lines)
│   ├── App.css           # App-specific styles
│   ├── index.css         # Global styles
│   ├── components/       # Reusable UI components
│   │   ├── AudioRecorder.tsx
│   │   ├── DialogueHistoryModal.tsx
│   │   ├── GeometricControlBar.tsx
│   │   ├── TrackCard.tsx
│   │   ├── WaveformPlayer.tsx
│   │   ├── tracks/       # Track-specific components
│   │   │   ├── AiTrack.tsx
│   │   │   ├── BacktrackTrack.tsx
│   │   │   └── UserTrack.tsx
│   │   └── ui/           # Reusable UI elements
│   │       ├── GeometricIcons.tsx
│   │       └── Icons.tsx
│   ├── hooks/            # Custom React hooks
│   │   ├── useAudioInput.ts
│   │   ├── useMidiPlayer.ts
│   │   └── useTracks.ts
│   ├── types/            # TypeScript type definitions
│   │   └── index.ts
│   ├── utils/            # Utility functions
│   │   └── audioProcessing.ts
│   └── config/           # Configuration
│       └── index.ts
├── package.json          # Dependencies & scripts
├── vite.config.ts        # Build tool config
├── tailwind.config.js    # CSS framework config
└── tsconfig.json         # TypeScript config
```

#### 2.2 Build Tools

| Tool | Purpose | Config File |
|------|---------|-------------|
| **Vite** | Fast dev server & bundler | `vite.config.ts` |
| **TypeScript** | Type checking | `tsconfig.json` |
| **TailwindCSS** | Utility CSS classes | `tailwind.config.js` |
| **ESLint** | Code linting | `eslint.config.js` |

**Commands:**
```bash
npm run dev      # Start development server
npm run build    # Production build
npm run lint     # Check code quality
```

---

### Phase 3: Key Libraries (1-2 weeks)

#### 3.1 Audio Processing Libraries

| Library | Purpose | Usage |
|---------|---------|-------|
| `wavesurfer.js` | Audio waveform visualization | `WaveformPlayer.tsx` |
| `Tone.js` | Audio synthesis & playback | `useMidiPlayer.ts` |
| `pitchfinder` | Pitch detection | `audioProcessing.ts` |
| `music-tempo` | BPM detection | `audioProcessing.ts` |

**Study files:**
- `src/utils/audioProcessing.ts` - Core audio analysis
- `src/components/WaveformPlayer.tsx` - Waveform display

#### 3.2 React Hooks Pattern

Custom hooks encapsulate reusable logic:

| Hook | Purpose |
|------|---------|
| `useAudioInput` | Microphone input handling |
| `useMidiPlayer` | MIDI audio playback |
| `useTracks` | Track state management |

**Study:** `src/hooks/useAudioInput.ts` first (most complex)

---

### Phase 4: Deep Dive into App.tsx (1 week)

The main `App.tsx` is the heart of the application. Key areas:

#### 4.1 WebSocket Communication
- Lines 48-118: WebSocket connection to backend
- `onopen`, `onmessage`, `onclose` handlers

#### 4.2 State Management
- Multiple `useState` hooks for app state
- Audio objects, dialogue history, status

#### 4.3 Audio Handling
- `handleBacktrackUpload` (lines 158-191)
- Recording and playback logic

---

### Phase 5: TailwindCSS (3-5 days)

Used for styling throughout the project.

**Key concepts:**
- Utility classes (`flex`, `p-4`, `bg-blue-500`)
- Responsive design (`md:`, `lg:` prefixes)
- Custom configuration in `tailwind.config.js`

**Resource:** [TailwindCSS Docs](https://tailwindcss.com/docs)

---

## 🛠️ Maintenance Checklist

### Adding a New Component
1. Create file in `src/components/`
2. Define TypeScript interface for props
3. Export and import where needed

### Adding a New Hook
1. Create file in `src/hooks/`
2. Follow naming convention: `use<Name>.ts`
3. Return values/functions needed by components

### Updating Dependencies
```bash
npm outdated           # Check for updates
npm update             # Update within semver range
npm install <pkg>@latest  # Update to latest
```

---

## 📖 Recommended Study Order

1. [ ] TypeScript basics (2-3 days)
2. [ ] React hooks: `useState`, `useEffect` (3-5 days)
3. [ ] Read `src/main.tsx` → `src/App.tsx` flow
4. [ ] Study `src/components/TrackCard.tsx` (simple)
5. [ ] Study `src/hooks/useTracks.ts` (custom hook)
6. [ ] Study `src/utils/audioProcessing.ts` (audio logic)
7. [ ] Study `src/hooks/useAudioInput.ts` (WebAudio API)
8. [ ] Study `src/components/WaveformPlayer.tsx` (wavesurfer.js)
9. [ ] TailwindCSS utilities
10. [ ] Vite build configuration

---

## 🔗 Essential Resources

| Topic | Link |
|-------|------|
| React | https://react.dev/learn |
| TypeScript | https://www.typescriptlang.org/docs/ |
| TailwindCSS | https://tailwindcss.com/docs |
| Vite | https://vite.dev/guide/ |
| Web Audio API | https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API |
| WaveSurfer.js | https://wavesurfer.xyz/ |
| Tone.js | https://tonejs.github.io/ |

---

*Last updated: 2025-12-22*
