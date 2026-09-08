# create-card Specification

## Purpose

Provides an administrative command (`.createcard`) that allows authorized Discord administrators to create and register new collectible cards with metadata and images directly into the global game database.

## Requirements

### Requirement: Authorization Check for Card Creation
The system SHALL ensure that only authorized users can execute the `.createcard` command. An authorized user is defined as someone who holds the Discord `Administrator` permission or possesses a role named `admin` (case-insensitive).

#### Scenario: Unauthorized user tries to create a card
- **WHEN** a user without `Administrator` permission and without an `admin` role executes `.createcard`
- **THEN** the system MUST reject the execution and reply with an error message indicating insufficient permissions.

#### Scenario: Authorized user executes the command
- **WHEN** a user with `Administrator` permission or an `admin` role executes `.createcard` with valid parameters
- **THEN** the system MUST allow the execution to proceed to argument parsing and validation.

---

### Requirement: Argument Parsing and Input Validation
The system SHALL parse the command input supporting optional quotes for card names, a validated rarity, a textual description, and image sourcing.

#### Scenario: Multi-word card name in quotes
- **WHEN** the user provides `.createcard "El Pana Miguel" mythic Se le ve bastante fresco, no te voy a mentir.` with an image
- **THEN** the system MUST parse the name as `El Pana Miguel`, the rarity as `mythic`, and the remaining text as description.

#### Scenario: Single-word card name without quotes
- **WHEN** the user provides `.createcard "Gato Pan" legendary Un gatito con una rebanada de pan` with an image
- **THEN** the system MUST parse the name as `Gato Pan`, the rarity as `legendary`, and the remaining text as description.

#### Scenario: Invalid rarity provided
- **WHEN** the user provides a rarity not in `[common, rare, epic, legendary, mythic]`
- **THEN** the system MUST reject the command and reply with an error message listing the valid rarities.

---

### Requirement: Image Source Resolution and Cleansing
The system SHALL source the card image from an attached message file as primary priority or from a trailing URL in the message content as secondary priority.

#### Scenario: Image provided via message attachment
- **WHEN** the user attaches an image file (`image/*`) to the message
- **THEN** the system MUST use the attached file as the image source. If the description text also ended in a URL, that URL MUST be stripped from the card description.

#### Scenario: Image provided via trailing URL
- **WHEN** no file is attached, but the message text ends with an HTTP/HTTPS URL
- **THEN** the system MUST download the image from the URL, verify it is a valid image, and strip the URL from the saved card description.

#### Scenario: Missing image and missing URL
- **WHEN** the user runs the command without an attached image file and without a trailing URL
- **THEN** the system MUST reject the command and reply informing the user to attach an image or append an image URL.

---

### Requirement: Backend Persistence and Discord Feedback
The system SHALL serialize the card data, attach the image binary, send a `multipart/form-data` request to `POST /card`, and display the created card on success.

#### Scenario: Successful creation and embed reply
- **WHEN** the backend confirms the creation with HTTP 201 Created and the new card payload
- **THEN** the system MUST reply to the Discord channel with a rich embed displaying the card name, rarity, description, author, and image preview.

#### Scenario: Backend returns an error
- **WHEN** the backend request fails (e.g. 400, 500 or network failure)
- **THEN** the system MUST reply with an error message indicating that card creation failed.
