import DoctorDashboard from "../components/DoctorDashboard";
import Head from "next/head";

export default function DoctorPage() {
  return (
    <>
      <Head>
        <title>Doctor Dashboard - Rehabilitation Management</title>
        <meta name="description" content="Monitor patient progress and exercise completions" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main style={{
        margin: 0,
        padding: 0,
        minHeight: '100vh',
        backgroundColor: '#f7fafc'
      }}>
        <DoctorDashboard />
      </main>
    </>
  );
}
