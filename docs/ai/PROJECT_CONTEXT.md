# Project Context

## Project name

English: AI Intelligent Triage and Patient Flow Coordination System for Outpatient Department

Vietnamese: Hệ thống AI phân loại thông minh và điều phối luồng bệnh nhân khoa ngoại trú

Abbreviation: TriageFlowOPD

## Repository scope

This repository is for the Patient Mobile App.

The app is built with:

- React Native
- Expo
- TypeScript
- NativeWind

Primary role:

- Patient / Bệnh nhân

Do not implement staff/admin modules in this mobile app unless explicitly requested.

## Overall system context

TriageFlowOPD is an intelligent triage and patient flow coordination system for outpatient departments.

The full system helps hospitals:

- Reduce outpatient overcrowding
- Coordinate patient queues
- Support AI-assisted triage
- Guide patients through hospital service steps
- Prevent ghost queues before payment
- Track the patient journey during an outpatient visit

The mobile app is one client of the larger system.

## Mobile app responsibility

The Patient Mobile App is responsible for:

- Displaying patient-facing UI
- Collecting patient input
- Sending requests to TriageFlow Backend
- Receiving structured data from backend APIs
- Displaying payment, ticket, queue, navigation, and journey information
- Rendering custom hospital map data when the map module is implemented
- Scanning QR codes when required
- Showing notifications and next-step guidance

The mobile app is not responsible for:

- Direct database access
- Direct LLM API calls
- LLM prompt engineering
- AI model training
- Queue priority algorithm
- Payment webhook processing
- Manually marking payment as Paid
- HIS synchronization
- Admin monitoring
- Staff workflow management
- Doctor clinical order creation
- Backend pathfinding algorithm unless explicitly required later

## Backend responsibility

The TriageFlow Backend is responsible for:

- Authentication/session validation
- Patient profile lookup
- Visit creation
- Calling the LLM triage engine
- Returning structured triage results to mobile
- Doctor schedule and availability logic
- Queue creation and queue status management
- Invoice creation
- Payment status verification
- Webhook processing from payment gateway
- Master QR generation
- Journey log persistence
- Notification triggering
- HIS or Mock-HIS synchronization
- Providing map, checkpoint, route, or GeoJSON data to the mobile app

## LLM triage rule

The mobile app must not call the LLM API directly.

Correct flow:

1. Patient selects Body Map regions.
2. Patient enters symptom description.
3. Mobile app sends symptom input to TriageFlow Backend.
4. Backend calls the LLM triage engine.
5. Backend returns a structured triage result to the mobile app.
6. Mobile app displays the result as a suggestion.

The mobile app should not store LLM API keys, prompts, or provider-specific logic.

AI triage must be treated as decision support only, not a final diagnosis.

Do not invent clinical rules, triage weights, red-flag symptoms, priority rules, or diagnosis logic unless provided by backend/API documentation or the user.

## Custom hospital map rule

The hospital map is custom-built by the project team.

The mobile app must not assume Google Maps, Mapbox, Apple Maps, or any third-party map provider unless explicitly confirmed.

Expected future behavior:

- Backend provides hospital map data.
- Map data may be GeoJSON or another agreed format.
- Backend may provide checkpoints, destinations, and route data.
- Mobile app renders the provided map and route data.
- Mobile app may scan QR checkpoints to update the current location.
- Pathfinding details are TBD and should not be implemented until the map data format is confirmed.

When building map-related UI before final map format is available, use placeholders or typed mock data instead of hardcoding a provider-specific implementation.

## Problem context

Outpatient departments often face these problems:

1. Journey gap  
   Patients may not know what to do after each clinical step.

2. Queue confusion  
   Patients may enter incorrect queues or wait before payment is confirmed.

3. Navigation difficulty  
   Large hospitals are difficult to navigate, especially across multiple floors.

4. Digital divide  
   Some patients use the mobile app, while others may need kiosk or receptionist support.

5. Payment inefficiency  
   Centralized cashier queues can slow down the outpatient journey.

## Mobile app goal

The Patient Mobile App helps patients:

- Start or continue an outpatient visit
- Submit symptoms
- Use an interactive Body Map
- Receive AI-assisted specialty suggestion from backend
- Choose a doctor or appointment option
- Pay using dynamic QR payment
- Receive a digital examination ticket
- View Master QR
- Track queue status
- View estimated waiting time
- Navigate inside the hospital
- Scan QR checkpoints
- Follow next-step instructions
- Receive notifications
- View their medical journey log

## Main mobile patient flow

### Flow: New visit through Mobile App

Trigger:

- Patient opens the app while already logged in.

Actors:

- Patient
- Mobile App
- TriageFlow Backend
- Payment Gateway through backend integration

Main steps:

1. App verifies the existing login session through backend.
2. Patient starts a new visit.
3. Patient uses the interactive Body Map.
4. Patient selects pain areas and enters symptom description.
5. App sends Body Map and symptom data to backend.
6. Backend handles LLM triage.
7. App receives structured triage result from backend.
8. App displays suggested specialty and priority level.
9. Patient chooses a doctor, chooses an appointment option, or lets the system assign a doctor.
10. Backend creates invoice and dynamic QR payment.
11. App displays payment QR and payment status.
12. Patient completes payment.
13. Backend confirms payment status as `Paid`.
14. App receives updated payment and queue status.
15. Patient receives a digital examination ticket.
16. Ticket includes queue number and Master QR.
17. Patient follows queue and navigation instructions.

Outcome:

- Visit is created.
- Payment is confirmed when required.
- Patient receives digital ticket.
- Patient enters the correct specialty queue.

## Alternative mobile patient flows

### Existing appointment flow

Use this when the patient already has a valid appointment.

Main behavior:

1. App loads the existing appointment from backend.
2. Patient confirms the appointment.
3. Backend determines whether triage is required.
4. If triage is not required, app skips Body Map.
5. Patient pays if required.
6. App shows ticket, queue status, and next destination.

Rule:

- Do not force Body Map if backend indicates that the appointment can skip triage.

### Health checkup package flow

Use this when the patient selects a predefined health checkup package.

Main behavior:

1. Patient selects a health checkup package.
2. App skips symptom-based Body Map triage.
3. Backend creates package service list.
4. Backend creates a total invoice.
5. App displays payment QR.
6. After payment is confirmed, app shows service route and journey steps.

Rule:

- Health checkup packages do not use symptom-based AI triage by default.

### Direct-to-Lab flow

Use this when the patient selects lab or diagnostic services directly.

Main behavior:

1. Patient selects one or more lab or diagnostic services.
2. Backend determines whether doctor consultation is required.
3. Backend creates invoice.
4. App displays payment QR.
5. After payment is confirmed, app shows lab/diagnostic queue and destination.
6. App receives result notification or next-step instruction later.

Rule:

- Do not assume doctor consultation unless backend requires it.

## Backend-triggered patient updates

These flows are triggered by staff or backend actions. The mobile app only receives and displays updates.

### Doctor clinical order update

Trigger:

- Doctor creates a clinical order from Doctor/Clinical Hub.

Mobile behavior:

1. App receives new order status from backend.
2. App shows payment request if required.
3. After payment is confirmed, app shows updated next destination.
4. App updates the journey log.
5. App shows navigation guidance if route data is available.

Rule:

- Mobile app does not create doctor orders.

### Ancillary service completion update

Trigger:

- Lab, pharmacy, radiology, or other ancillary staff marks a service as completed.

Mobile behavior:

1. App receives completion update from backend.
2. App updates service status.
3. App shows the next destination.
4. If the patient must return to the doctor, app shows return-to-doctor guidance.
5. If the journey is complete, app shows completion status.

### Visit completion update

Trigger:

- Doctor ends the visit, or the final service/pharmacy step is completed.

Mobile behavior:

1. App receives visit completion status.
2. App finalizes the displayed journey log.
3. App may show summary, receipt, prescription, or result status if provided by API.

Rule:

- Mobile app does not sync directly to HIS.
- HIS or Mock-HIS synchronization is handled by backend.

## External non-mobile flows

These flows are part of the full system context but are not implemented in the Patient Mobile App by default.

### Kiosk flow

Kiosk supports patients who do not use the mobile app or prefer self-service on-site.

Kiosk may support:

- CIC/VNeID scanning
- Body Map input
- Dynamic QR payment display
- Physical ticket printing
- Master QR scanning
- Navigation display

### Receptionist-assisted flow

Receptionist supports elderly patients, emergency cases, or patients who are not comfortable with technology.

Receptionist may support:

- Manual patient registration
- CCCD scanning
- Manual symptom entry
- Doctor selection
- Cash/card payment assistance
- Ticket printing
- Master QR recovery

### Doctor / Clinical Hub flow

Doctor or clinical staff may support:

- Prioritized patient list
- Clinical summary viewing
- Clinical order creation
- Consultation completion
- Returned patient prioritization

### Ancillary staff flow

Lab, pharmacy, radiology, or cashier staff may support:

- Payment-verified service queues
- Service completion updates
- Medication/result readiness updates
- Manual payment support where applicable

### Admin flow

Admin may support:

- Hospital density monitoring
- Manual rerouting
- Triage configuration
- Map and checkpoint management
- Audit log tracking

## Important mobile data concepts

The mobile app may use these domain concepts:

- Patient
- Visit
- Appointment
- SymptomInput
- BodyMapRegion
- TriageResult
- Specialty
- Doctor
- Schedule
- Invoice
- PaymentStatus
- QueueTicket
- MasterQR
- QueueStatus
- Destination
- MapCheckpoint
- MapGeoJSON
- NavigationRoute
- JourneyLog
- Notification

Exact TypeScript types should be created after API contracts are known.

## Important status concepts

Exact status values should follow backend API when available.

Possible payment statuses:

- `Pending`
- `Paid`
- `Failed`
- `Cancelled`
- `Refunded`

Possible visit or queue statuses:

- `Draft`
- `WaitingForPayment`
- `Paid`
- `Queued`
- `Waiting`
- `Calling`
- `InProgress`
- `OrderTriggered`
- `Completed`
- `Returned`
- `Done`
- `Cancelled`

Do not hardcode final status values if backend contracts are not confirmed.

## Non-functional requirements for mobile

- Support Vietnamese text and Unicode fonts.
- Use a clear and mobile-friendly UI.
- Use NativeWind consistently.
- Handle loading, empty, and error states.
- Avoid misleading medical language.
- Keep important user actions trackable through backend events.
- Keep frontend logic simple and maintainable.
- Avoid hardcoding backend business rules in the app.

## Development priorities

For this mobile app:

1. Patient flow clarity
2. Correct status display
3. Correct payment-gated queue behavior
4. Clear next-step guidance
5. Clear navigation and map rendering when map data is available
6. Reusable UI components
7. Type-safe data models
8. Clean separation between UI, hooks, services, and types
9. Consistent NativeWind styling

## Do not assume

Do not assume these details unless provided later:

- Exact database schema
- Exact API endpoints
- Exact API response fields
- Exact authentication provider
- Exact payment provider
- Exact notification provider
- Exact GeoJSON/map data format
- Exact map rendering library
- Exact LLM prompt or model
- Exact triage scoring rules
- Exact doctor schedule algorithm
- Exact queue priority algorithm
- Exact HIS synchronization format
- Staff/admin screen requirements inside this mobile app