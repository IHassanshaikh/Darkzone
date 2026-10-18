ReliefOS + DARK ZONE: System Architecture
CODE//CONNECT'26, Problem 01 "Disaster Response: finding who needs help most". Version 1.0, frontend owner: [name]. Source of truth: PROJECT_CONTEXT.md.
1. Purpose and honesty notes
ReliefOS finds who needs help most and matches scarce resources to them before it is critical. It combines two ideas: ReliefOS (operations: volunteers, camps, allocation, delivery) and DARK ZONE (areas with high risk but unexpectedly low reports are flagged for field verification, never auto-rescue). Combined flow: Dark Zones are served first, then camp needs.
• All data is mock and fictional. No real personal data.
• Dark Zone weights are our assumptions, not validated.
• Every automatic result is labeled Suggested; a human confirms.
• Research note: we did not find this combination (expected-vs-actual reporting gap + vulnerability + hazard + connectivity failure) in the ~20 papers we reviewed.
• Mesh is a simulated demo. Encryption is real (Web Crypto); Bluetooth is not.
2. Components
Layer: Frontend
Component: Web app, 9 screens, role switcher (Admin / Volunteer), no real auth
Tech: React, Vite, Tailwind, React Router
Owner: Frontend
3. Architecture diagram
Flow: Areas/Camps/Volunteers/Duties/Reports -> API -> UI -> Offline Queue
4. Main data flow
5. Offline and sync flow
6. Dark Zone engine (src/lib/darkZone.js)
7. Priority and allocation flow
8. Data model (mock, fictional)
9. REST API contract
10. Mesh Simulator (frontend only)
11. Error and degraded modes
12. Limits (Limits & Trade-offs screen)
13. Open questions
