# Simple Properties - AI-Powered Property Management App

Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.

## Working Effectively

### Bootstrap and Build the Repository
- Install dependencies: `npm install` -- takes 1-2 seconds when dependencies exist, 30-40 seconds on fresh install. NEVER CANCEL.
- Install gateway dependencies: `cd gateway && npm install` -- takes ~1 second.
- Check TypeScript compilation: `npx tsc --noEmit` -- takes 4-5 seconds. NEVER CANCEL.
- Test gateway service: `cd gateway && node server.js` -- starts immediately on port 8082.
- Test main application: `npx expo start --web --localhost` -- takes 30-45 seconds to start Metro bundler. NEVER CANCEL. Set timeout to 60+ minutes.

### Development Workflow
- ALWAYS run the bootstrapping steps first before making changes.
- Start gateway service: `cd gateway && node server.js` (runs on port 8082)
- Start development server: `npx expo start --web --localhost` (runs on port 8081)
- Web interface accessible at: http://localhost:8081
- Gateway API endpoints: http://localhost:8082/health, http://localhost:8082/api/ping

### Build and Deployment
- Mobile compilation requires Android SDK or Xcode (not available in CI environments)
- Web build works in development mode with `npx expo start --web`
- Production builds: Use `expo build:android` and `expo build:ios` (requires build tools)
- Gateway deployment: Uses Docker + Kubernetes (see gateway/k8s.yaml)

## Validation

### ALWAYS Test These Scenarios After Changes
1. **Application Startup**: Verify `npx expo start --web --localhost` starts successfully and serves at http://localhost:8081
2. **Gateway Integration**: 
   - Start gateway with `cd gateway && node server.js`
   - Test health endpoint: `curl http://localhost:8082/health`
   - Test ping endpoint: `curl http://localhost:8082/api/ping`
3. **UI Navigation**: Access main app, navigate between Properties, AI Advisor, and Settings tabs
4. **Gateway Configuration**: In Settings tab, set Gateway URL to http://localhost:8082, click Save, verify "Gateway reachable" status
5. **TypeScript Compilation**: Always run `npx tsc --noEmit` to catch type errors

### Critical Timing Requirements
- **NEVER CANCEL** npm install: Can take 30-40 seconds on fresh install
- **NEVER CANCEL** Metro bundler startup: Takes 30-45 seconds, set timeout to 60+ minutes
- **NEVER CANCEL** TypeScript check: Takes 4-5 seconds
- Gateway startup: Immediate (< 1 second)

## Architecture Overview

### Repository Structure
```
├── app/                    # Expo Router pages
│   ├── (tabs)/            # Tab-based navigation screens
│   ├── documents/         # Document generation features
│   └── property/          # Property management screens
├── components/            # Reusable UI components
├── services/              # API and data services
│   ├── gatewayClient.ts   # AI gateway integration
│   └── onDeviceAiService.ts # Local AI processing
├── gateway/               # AI gateway service (Node.js)
│   ├── server.js          # Express server
│   ├── k8s.yaml           # Kubernetes deployment
│   └── package.json       # Gateway dependencies
├── types/                 # TypeScript type definitions
└── utils/                 # Utility functions
```

### Technology Stack
- **Frontend**: React Native 0.79.5 + Expo 53.0.22 + TypeScript
- **UI Library**: React Native Paper
- **Navigation**: Expo Router (file-based routing)
- **State Management**: Zustand + React Context
- **Backend**: Node.js Express gateway service
- **AI Integration**: Ollama (external dependency) + ONNX Runtime

### Key Services
- **Gateway Service**: AI integration, document generation, portfolio analysis (port 8082)
- **Document Service**: Template management and AI-powered document creation
- **Portfolio Analytics**: Financial calculations and market analysis
- **Market Data Service**: North Dakota regional market intelligence

## Development Notes

### Commands That Work
- `npm install` -- Install main app dependencies
- `cd gateway && npm install` -- Install gateway dependencies
- `npx tsc --noEmit` -- TypeScript compilation check
- `npx expo start --web --localhost` -- Start development server
- `cd gateway && node server.js` -- Start gateway service
- `npx expo --version` -- Check Expo CLI version
- `node --version && npm --version` -- Check Node.js versions

### Commands That Do NOT Work
- `bunx rork start` -- Custom CLI tool not available in standard environments
- `npm test` -- No test framework configured
- `npm run lint` -- No linting configuration
- `npm run format` -- No formatting tools configured
- `expo build:android/ios` -- Requires Android SDK/Xcode setup

### Common Gotchas
- Uses legacy peer deps (`legacy-peer-deps=true` in .npmrc)
- Custom `bunx rork` commands in package.json won't work - use standard `expo` commands
- AI features require external Ollama service (returns 502 without it - this is expected)
- Mobile builds need native SDKs - web development works without them
- Images from unsplash.com may be blocked (network requests in console - can be ignored)

### Environment Requirements
- Node.js 18+ (tested with v20.19.4)
- npm 10+ (tested with v10.8.2) 
- No additional build tools required for web development
- Android SDK required only for mobile compilation
- Xcode required only for iOS compilation

## Code Style and Patterns

### File Locations for Common Tasks
- **Add new screens**: `app/(tabs)/` for main navigation, `app/` for modal screens
- **Add UI components**: `components/`
- **Add API services**: `services/`
- **Add type definitions**: `types/`
- **Modify gateway**: `gateway/server.js`
- **Update configuration**: `app.json` for app config, `gateway/k8s.yaml` for gateway deployment

### Testing Strategy
- Manual testing via web browser at http://localhost:8081
- API testing via curl against http://localhost:8082
- TypeScript validation via `npx tsc --noEmit`
- No automated test framework configured

### Integration Points
- Gateway client: `services/gatewayClient.ts`
- AI document generation: `app/documents/generate.tsx`
- Settings configuration: `app/(tabs)/settings.tsx`
- Property data: Mock data in context, stored in AsyncStorage

Always build and test your changes using the validation scenarios above before considering the work complete.