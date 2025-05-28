
# Create Toolpad App

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-toolpad-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Setup

Run `npx auth secret` to generate a secret and replace the value in the .env.local file with it.

Add the CLIENT_ID and CLIENT_SECRET from your OAuth provider to the .env.local file.

## Getting Started

First, run the development server: `npm run dev`

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.


## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

Library System
This is a web application designed to manage a library's book inventory, offering CRUD (Create, Read, Update, Delete) operations for books, a comprehensive inventory view with filtering and sorting, and specialized printing functionalities for library cards. The system integrates with Firebase for data persistence and authentication.

✨ Features
User Authentication: Secure sign-in using Google, Email/Password, or GitHub, with an email whitelisting feature for authorized access.

Dashboard: A central landing page for an overview of the system.

Book Management (CRUD):

Add new book records.

View and edit existing book details.

Delete book entries.

Books Inventory:

Display a comprehensive list of all books in a data grid.

Client-side filtering and sorting capabilities for easy data navigation.

Quick search functionality across all visible columns.

Library Card Printing:

Generate printable library cards (Author Card, Title Card, Subject Card) for individual books.

Customizable card layout mimicking traditional library catalog cards.

Optimized print output to ensure only the card content is printed.

🚀 Technologies Used
Frontend:

React (JavaScript library for building user interfaces)

TypeScript (Superset of JavaScript that adds static typing)

Material-UI (MUI) (React UI framework for beautiful and responsive designs)

@mui/x-data-grid for advanced table functionalities.

React Router (For declarative routing in React applications)

@toolpad/core (For streamlined CRUD operations and application scaffolding)

Backend & Database:

Firebase Firestore (NoSQL cloud database for flexible, scalable data storage)

Firebase Authentication (For user management and secure authentication)

Build Tool:

Vite (Fast frontend build tool)

📦 Getting Started
Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

Prerequisites
Node.js (LTS version recommended)

npm or Yarn

A Firebase Project with Firestore and Authentication enabled.

Installation
Clone the repository:

git clone <repository-url>
cd library-system

Install dependencies:

npm install
# or
yarn install

Firebase Setup
Create a Firebase Project: If you don't have one, go to the Firebase Console and create a new project.

Enable Firestore: In your Firebase project, navigate to "Firestore Database" and create a new database.

Enable Authentication: In your Firebase project, navigate to "Authentication" and enable the desired sign-in methods (e.g., Email/Password, Google, GitHub).

Get Firebase Configuration: Go to "Project settings" (gear icon) -> "General" -> "Your apps" and copy your Firebase configuration object.

Environment Variables: Create a .env file in the root of your project and add your Firebase configuration details. Replace the placeholder values with your actual Firebase project settings.

VITE_FIREBASE_API_KEY="YOUR_API_KEY"
VITE_FIREBASE_AUTH_DOMAIN="YOUR_AUTH_DOMAIN"
VITE_FIREBASE_PROJECT_ID="YOUR_PROJECT_ID"
VITE_FIREBASE_STORAGE_BUCKET="YOUR_STORAGE_BUCKET"
VITE_FIREBASE_MESSAGE_SENDER_ID="YOUR_MESSAGING_SENDER_ID"
VITE_FIREBASE_APP_ID="YOUR_APP_ID"

Firestore Security Rules: For development, you might use permissive rules (as discussed in the conversation). Remember to secure these rules for production.

Example (for testing read access to books collection):

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /books/{bookId} {
      allow read: if true; // WARNING: Insecure for production!
      allow write: if request.auth != null;
    }
  }
}

Authentication Whitelist: In src/firebase/auth.ts, update the ALLOWED_EMAILS array with the email addresses authorized to access the application.

Running the Application
npm run dev
# or
yarn dev

The application will typically open in your browser at http://localhost:5173.

📂 Project Structure (Key Files)
src/App.tsx: Main application component, handles navigation and authentication context.

src/main.tsx: Entry point of the React application, sets up React Router.

src/pages/: Contains individual page components.

src/pages/inventory.tsx: Displays the books inventory using @mui/x-data-grid with filtering and print options.

src/pages/books.tsx: Handles CRUD operations for books using @toolpad/core/Crud.

src/pages/signin.tsx: Authentication page.

src/data/book.ts: Defines the Book interface and the booksDataSource for interacting with Firebase Firestore.

src/firebase/firebaseConfig.ts: Initializes Firebase app and exports firebaseAuth and db (Firestore instance).

src/firebase/auth.ts: Contains Firebase authentication functions (sign-in, sign-out, email whitelisting).

src/components/PrintCardDialog.tsx: A reusable dialog component for displaying and printing library cards.

public/index.html: Main HTML file, includes the #print-portal-root for print functionality.

💡 Usage
Sign In: Use an authorized email address (from ALLOWED_EMAILS) to sign in.

Navigation: Use the sidebar to navigate between "Dashboard", "Add/Edit Books", and "Books Inventory".

Add/Edit Books: Go to "Add/Edit Books" to perform CRUD operations on individual book records.

Books Inventory: Visit "Books Inventory" to view all books. Use the column headers for sorting and filtering, and the toolbar for quick search.

Print Cards: In the "Books Inventory" table, click the print icon next to a book to select a card type (Author, Title, Subject) and generate a printable card.

🤝 Contributing
Feel free to fork the repository, make improvements, and submit pull requests.

📄 License
This project is open source and available under the MIT License.
