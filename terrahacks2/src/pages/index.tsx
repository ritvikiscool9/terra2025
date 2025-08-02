import VideoAnalyzer from "@/components/VideoAnalyzer";
import Head from "next/head";

export default function Home() {
  return (
    <>
      <Head>
        <title>Squat Video Analyzer</title>
        <meta name="description" content="AI-powered squat exercise analysis using Google Gemini" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
        <VideoAnalyzer />
      </div>
    </>
  );
}
