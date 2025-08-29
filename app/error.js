// app/_error.js
"use client";

export default function ErrorPage({ error, reset }) {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-4xl font-bold mb-4">Oops! Something went wrong.</h1>
      <p className="text-red-500 mb-4">{error?.message || "Unknown error"}</p>
      <button
        className="px-4 py-2 bg-blue-500 text-white rounded"
        onClick={() => reset && reset()}
      >
        Try Again
      </button>
    </main>
  );
}
