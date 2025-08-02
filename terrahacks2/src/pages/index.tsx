import PatientLayout from "@/components/PatientLayout";
import Head from "next/head";

export default function Home() {
  return (
    <>
      <Head>
        <title>RehabTrack - Patient Portal</title>
        <meta name="description" content="Medical rehabilitation and exercise tracking platform for patients" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <PatientLayout />
    </>
  );
}
