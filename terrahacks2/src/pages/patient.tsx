import PatientLayout from "../components/PatientLayout";
import Head from "next/head";

export default function PatientPage() {
  return (
    <>
      <Head>
        <title>Patient Dashboard - Rehabilitation Management</title>
        <meta name="description" content="Track your exercise routines and progress" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main style={{
        margin: 0,
        padding: 0,
        minHeight: '100vh',
        backgroundColor: '#f8fafc'
      }}>
        <PatientLayout />
      </main>
    </>
  );
}
