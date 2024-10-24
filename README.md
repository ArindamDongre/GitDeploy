# Project Title: GitDeploy

## Overview
This is a full-stack application enabling users to deploy GitHub repositories via a user-friendly interface.

## Folder Structure
├── upload-service # Handles cloning and uploading repositories ├── deployment-service # Manages downloading, unzipping, and building projects ├── request-handler # Serves files from S3 based on requests └── frontend # User interface components

## Technologies Used

### Backend
- **Node.js**: Runtime environment for executing JavaScript code.
- **TypeScript**: Typed superset of JavaScript for building robust applications.
- **Express**: Web framework for building APIs.
- **AWS SDK**: Interacts with AWS services (S3).
- **Redis**: Message broker for build queue management.
- **Archiver**: Library for zipping files and folders.
- **Unzipper**: Library for unzipping files.

### Frontend
- **React**: JavaScript library for building user interfaces.
- **Tailwind CSS**: Utility-first CSS framework for styling.

## Setup Instructions

### Prerequisites
- Node.js and npm installed.
- AWS account with S3 access.
- Redis server running.
- Environment variables set in a `.env` file (See [Configuration](#configuration)).

### Install Dependencies for Each Service
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd <repository-folder>
