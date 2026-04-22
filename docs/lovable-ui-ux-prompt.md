# Lovable Prompt: UX/UI Refresh For Dealers Settlements

## Context
This is an internal backoffice web app called `dealers-settlements`. It is already functional and has multiple operational modules for a finance/dealership workflow. The goal is **not** to reinvent the product, and **not** to change business logic. The goal is to improve UX/UI using the existing product structure.

This app currently includes:
- dashboard
- imports
- deals
- dead deals
- expenses
- settlements
- dealers
- partners
- financiers
- settings
- audit

Users include:
- `super_admin`
- `expense_admin`
- `partner_viewer`

## Main Goal
Improve the current UX/UI so the app feels more polished, easier to scan, more consistent, and more operationally clear.

Important constraints:
- Do not redesign the app into a different product.
- Do not change the information architecture drastically.
- Do not remove core modules.
- Do not change business rules or workflows.
- Do not make it look like a generic startup dashboard.
- Preserve the current feeling of a sober, premium internal operations tool.

## Visual Direction
Keep and refine the current visual language:
- warm light background
- neutral premium surfaces
- green accent as the primary action color
- elegant and restrained visual style
- desktop-first backoffice feel

Avoid:
- trendy consumer-app look
- overuse of gradients
- purple palettes
- dark mode redesign
- excessive animation
- overly playful or marketing-style UI

## What Needs Improvement

### 1. Navigation
Improve clarity of the global navigation without changing the main modules.

Needed:
- better sidebar grouping by functional area
- better contextual topbar
- better sense of “where I am”
- lightweight page context or compact page headers

Do not:
- create a radically different navigation model
- hide important modules behind multiple levels

### 2. Dashboard
The dashboard should feel like an operational home, not just a collection of cards and tables.

Needed:
- stronger hierarchy
- clear primary actions
- clearer distinction between KPIs and secondary analytics
- better layout for quick actions
- better role-aware experience, especially for `expense_admin`

### 3. Tables
Tables are central to the product and need better readability.

Needed:
- stronger table hierarchy
- clearer column priority
- improved spacing and scanability
- better alignment for money, percentages, statuses, and metadata
- clearer action areas

Do not:
- remove dense data just to simplify visually
- turn operational tables into overly decorative cards

### 4. Filters
Filters should be more consistent across all modules.

Needed:
- one coherent filter bar pattern
- consistent positioning of Apply/Reset actions
- clearer active filter state
- better spacing and grouping

### 5. Forms
Forms should feel more guided and easier to understand.

Needed:
- clearer grouping of fields
- better helper text for business-sensitive fields
- more explicit create vs edit states
- better inline validation and feedback

Important for:
- imports
- expenses
- settlements
- dead deals
- dealer/partner/financier administration

### 6. Badges And Statuses
Statuses exist but need stronger consistency.

Needed:
- a more explicit visual system for:
  - success
  - warning
  - danger
  - neutral/muted
- clearer distinction between:
  - workflow status
  - validation status
  - payout/payment status
  - archived/inactive states

### 7. Feedback States
Improve:
- success messages
- inline warnings
- errors
- destructive action confirmation
- loading states
- empty states

Needed:
- messages should feel intentional and visible
- empty states should guide the user toward the next action
- loading should not feel abrupt or invisible

### 8. Visual Hierarchy
Currently too many panels feel equally important.

Needed:
- stronger hierarchy between:
  - page context
  - filters
  - primary actions
  - summary cards
  - detail tables
  - secondary content

## Screen-Specific Guidance

### Dashboard
- Add a compact page header or top context area
- Prioritize quick actions and summary KPIs
- Make analytics easier to scan
- Keep it operational, not executive-flashy

### Imports
- Keep the import wizard structure
- Make the upload flow clearer and more reassuring
- Improve the review screen hierarchy because it is information-dense
- Clearly separate filters, bulk actions, row actions, and row editing

### Deals
- Better separation between manual creation and listing
- Better filtering experience
- Improve table readability and detail-page structure

### Expenses
- Better organization between list, filters, creation, recurring templates, and categories
- The expense form should be easier to follow, especially around scope and allocations

### Dead Deals
- Keep the structure but make the page easier to understand quickly
- Clarify the relationship between net gross, commission, and dealer profit

### Settlements
- Make the monthly run action clearly primary and operationally important
- Better highlight current run vs historical runs
- Improve hierarchy in run detail and payout management

### Dealers / Partners / Financiers
- Preserve the current CRUD structure
- Make list + editor layouts cleaner and more consistent
- Improve alerts and edit context

### Settings
- Better distinction between edit, reset password, activate/deactivate
- Make incomplete partner assignment more visible

### Audit
- Keep it sober and technical
- Improve readability and prioritization without removing raw detail

## Low-Risk Improvements Preferred First
Favor improvements like:
- better spacing
- stronger typography hierarchy
- clearer section headers
- improved table styling
- consistent filters
- better notices/alerts
- better empty states
- clearer button hierarchy

Avoid starting with:
- total redesign
- dramatic layout replacement
- new product architecture
- heavy motion system

## Technical/Structural Guardrails
Please propose UI improvements that can be implemented incrementally.

If structural helpers are needed, prefer small reusable UI patterns such as:
- compact page section header
- shared filter bar
- shared alert/notice component
- more consistent table shell
- clearer status/badge system

Do not assume a full design system rewrite is needed.

## Output Requested
Produce a UI refresh proposal for the current app that includes:
- updated visual direction for the existing interface
- improved layout principles
- reusable UI patterns
- recommendations by screen/module
- a pragmatic path to implement improvements incrementally

The proposal should be grounded in the current app and should feel like a refinement of an existing operational product, not a brand-new SaaS concept.
